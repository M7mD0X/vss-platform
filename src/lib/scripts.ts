import { supabase } from './supabase';

export interface Script {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  game: string | null;
  category: string | null;
  tags: string[];
  visibility: 'private' | 'unlisted' | 'public';
  latest_version: number;
  created_at: string;
  updated_at: string;
}

export interface ScriptVersion {
  id: string;
  script_id: string;
  version_num: number;
  source_code: string;
  changelog: string | null;
  file_size: number;
  created_at: string;
}

export interface ScriptWithVersions extends Script {
  versions?: ScriptVersion[];
}

/** Fetch all scripts owned by the current user. */
export async function fetchMyScripts(): Promise<Script[]> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[VSS] fetchMyScripts failed:', error.message);
    return [];
  }
  return (data ?? []) as Script[];
}

/** Fetch a single script by ID (must be owned by current user). */
export async function fetchScript(id: string): Promise<Script | null> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('[VSS] fetchScript failed:', error.message);
    return null;
  }
  return (data as Script) ?? null;
}

/** Fetch all versions for a script (must be owned by current user). */
export async function fetchVersions(scriptId: string): Promise<ScriptVersion[]> {
  const { data, error } = await supabase
    .from('script_versions')
    .select('*')
    .eq('script_id', scriptId)
    .order('version_num', { ascending: false });
  if (error) {
    console.error('[VSS] fetchVersions failed:', error.message);
    return [];
  }
  return (data ?? []) as ScriptVersion[];
}

/** Fetch a specific version of a script. */
export async function fetchVersion(scriptId: string, versionNum: number): Promise<ScriptVersion | null> {
  const { data, error } = await supabase
    .from('script_versions')
    .select('*')
    .eq('script_id', scriptId)
    .eq('version_num', versionNum)
    .maybeSingle();
  if (error) {
    console.error('[VSS] fetchVersion failed:', error.message);
    return null;
  }
  return (data as ScriptVersion) ?? null;
}

/** Create a new script + its first version. Returns the created script. */
export async function createScript(params: {
  name: string;
  description?: string;
  game?: string;
  category?: string;
  tags?: string[];
  visibility?: 'private' | 'unlisted' | 'public';
  sourceCode: string;
  changelog?: string;
}): Promise<Script | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Insert script
  const { data: script, error: scriptError } = await supabase
    .from('scripts')
    .insert({
      owner_id: user.id,
      name: params.name,
      description: params.description || null,
      game: params.game || null,
      category: params.category || null,
      tags: params.tags || [],
      visibility: params.visibility || 'private',
      latest_version: 1,
    })
    .select()
    .single();

  if (scriptError) throw new Error(`Failed to create script: ${scriptError.message}`);

  // Insert first version
  const { error: versionError } = await supabase
    .from('script_versions')
    .insert({
      script_id: script.id,
      version_num: 1,
      source_code: params.sourceCode,
      changelog: params.changelog || 'Initial version',
      file_size: new Blob([params.sourceCode]).size,
    });

  if (versionError) {
    // Rollback: delete the script
    await supabase.from('scripts').delete().eq('id', script.id);
    throw new Error(`Failed to create version: ${versionError.message}`);
  }

  return script as Script;
}

/** Add a new version to an existing script. */
export async function addVersion(scriptId: string, params: {
  sourceCode: string;
  changelog?: string;
}): Promise<ScriptVersion | null> {
  // Get current latest version
  const { data: script } = await supabase
    .from('scripts')
    .select('latest_version')
    .eq('id', scriptId)
    .single();

  const nextVersion = (script?.latest_version ?? 0) + 1;

  const { data, error } = await supabase
    .from('script_versions')
    .insert({
      script_id: scriptId,
      version_num: nextVersion,
      source_code: params.sourceCode,
      changelog: params.changelog || `Version ${nextVersion}`,
      file_size: new Blob([params.sourceCode]).size,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add version: ${error.message}`);
  return data as ScriptVersion;
}

/** Update script metadata (not the source code). */
export async function updateScript(id: string, updates: Partial<Pick<Script, 'name' | 'description' | 'game' | 'category' | 'tags' | 'visibility'>>): Promise<void> {
  const { error } = await supabase.from('scripts').update(updates).eq('id', id);
  if (error) throw new Error(`Failed to update script: ${error.message}`);
}

/** Delete a script and all its versions. */
export async function deleteScript(id: string): Promise<void> {
  const { error } = await supabase.from('scripts').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete script: ${error.message}`);
}

/** Fetch source code from a GitHub raw URL (for GitHub sync). */
export async function fetchFromGitHub(url: string): Promise<string> {
  // Normalize blob URLs to raw URLs
  const blobMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  const rawUrl = blobMatch
    ? `https://raw.githubusercontent.com/${blobMatch[1]}/${blobMatch[2]}/${blobMatch[3]}`
    : url;

  const res = await fetch(rawUrl);
  if (!res.ok) throw new Error(`GitHub fetch failed: HTTP ${res.status}`);
  const text = await res.text();
  if (text.length < 10) throw new Error('Response too small — likely an error page');
  return text;
}
