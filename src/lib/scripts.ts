import { supabase } from './supabase';

export type VersionType = 'patch' | 'minor' | 'major';

export interface Script {
  id: string;
  owner_id: string;
  name: string;
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
  version_type: VersionType | null;
  file_size: number;
  created_at: string;
}

/** Fetch all scripts owned by the current user. */
export async function fetchMyScripts(): Promise<Script[]> {
  const { data, error } = await supabase.from('scripts').select('*').order('updated_at', { ascending: false });
  if (error) { console.error('[VSS] fetchMyScripts:', error.message); return []; }
  return (data ?? []) as Script[];
}

export async function fetchScript(id: string): Promise<Script | null> {
  const { data, error } = await supabase.from('scripts').select('*').eq('id', id).maybeSingle();
  if (error) { console.error('[VSS] fetchScript:', error.message); return null; }
  return (data as Script) ?? null;
}

export async function fetchVersions(scriptId: string): Promise<ScriptVersion[]> {
  const { data, error } = await supabase.from('script_versions').select('*').eq('script_id', scriptId).order('version_num', { ascending: false });
  if (error) { console.error('[VSS] fetchVersions:', error.message); return []; }
  return (data ?? []) as ScriptVersion[];
}

export async function createScript(params: { name: string; sourceCode: string; changelog?: string }): Promise<Script | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: script, error: scriptError } = await supabase
    .from('scripts').insert({ owner_id: user.id, name: params.name, latest_version: 1 }).select().single();
  if (scriptError) throw new Error(`Failed to create script: ${scriptError.message}`);

  const { error: versionError } = await supabase.from('script_versions').insert({
    script_id: script.id, version_num: 1, source_code: params.sourceCode,
    changelog: params.changelog || 'Initial version', version_type: 'major', file_size: new Blob([params.sourceCode]).size,
  });
  if (versionError) { await supabase.from('scripts').delete().eq('id', script.id); throw new Error(`Failed: ${versionError.message}`); }

  return script as Script;
}

export async function addVersion(scriptId: string, params: { sourceCode: string; changelog?: string; versionType: VersionType }): Promise<ScriptVersion | null> {
  const { data: script } = await supabase.from('scripts').select('latest_version').eq('id', scriptId).single();
  const nextVersion = (script?.latest_version ?? 0) + 1;
  const { data, error } = await supabase.from('script_versions').insert({
    script_id: scriptId, version_num: nextVersion, source_code: params.sourceCode,
    changelog: params.changelog || `Version ${nextVersion}`, version_type: params.versionType,
    file_size: new Blob([params.sourceCode]).size,
  }).select().single();
  if (error) throw new Error(`Failed: ${error.message}`);
  return data as ScriptVersion;
}

export async function updateScript(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('scripts').update({ name }).eq('id', id);
  if (error) throw new Error(`Failed: ${error.message}`);
}

export async function deleteScript(id: string): Promise<void> {
  const { error } = await supabase.from('scripts').delete().eq('id', id);
  if (error) throw new Error(`Failed: ${error.message}`);
}

export async function fetchFromGitHub(url: string): Promise<string> {
  const blobMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  const rawUrl = blobMatch ? `https://raw.githubusercontent.com/${blobMatch[1]}/${blobMatch[2]}/${blobMatch[3]}` : url;
  const res = await fetch(rawUrl);
  if (!res.ok) throw new Error(`GitHub fetch failed: HTTP ${res.status}`);
  const text = await res.text();
  if (text.length < 10) throw new Error('Response too small');
  return text;
}

/** Compute a semver string (e.g. 1.2.3) from a version number + type history. */
export function computeSemver(versions: { version_type: VersionType | null }[], upToVersion: number): string {
  let major = 0, minor = 0, patch = 0;
  const sorted = [...versions].filter(v => v.version_type).reverse().reverse();
  for (let i = 0; i < Math.min(upToVersion, sorted.length); i++) {
    const v = sorted[i];
    if (!v.version_type) continue;
    if (v.version_type === 'major') { major++; minor = 0; patch = 0; }
    else if (v.version_type === 'minor') { minor++; patch = 0; }
    else { patch++; }
  }
  return `${major}.${minor}.${patch}`;
}

/** Delete a specific version (not the whole script). */
export async function deleteVersion(scriptId: string, versionNum: number): Promise<void> {
  const { error } = await supabase.from('script_versions').delete().eq('script_id', scriptId).eq('version_num', versionNum);
  if (error) throw new Error(`Failed to delete version: ${error.message}`);
}

/** Update a version's source code + changelog. */
export async function updateVersion(scriptId: string, versionNum: number, params: { sourceCode?: string; changelog?: string }): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (params.sourceCode !== undefined) { updates.source_code = params.sourceCode; updates.file_size = new Blob([params.sourceCode]).size; }
  if (params.changelog !== undefined) updates.changelog = params.changelog;
  const { error } = await supabase.from('script_versions').update(updates).eq('script_id', scriptId).eq('version_num', versionNum);
  if (error) throw new Error(`Failed to update version: ${error.message}`);
}

/** Restore a version — creates a new latest version with this version's code. */
export async function restoreVersion(scriptId: string, versionNum: number): Promise<ScriptVersion | null> {
  const version = await fetchVersion(scriptId, versionNum);
  if (!version) throw new Error('Version not found');
  return addVersion(scriptId, { sourceCode: version.source_code, changelog: `Restored from v${versionNum}`, versionType: 'patch' });
}
