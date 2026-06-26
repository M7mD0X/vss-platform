import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createScript, fetchFromGitHub } from '../lib/scripts';

type UploadMethod = 'paste' | 'file' | 'github';

export default function UploadPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<UploadMethod>('paste');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  const [sourceCode, setSourceCode] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSourceCode(text);
      if (!name) setName(file.name.replace(/\.(lua|luau)$/i, ''));
    };
    reader.readAsText(file);
  }, [name]);

  const handleGitHubFetch = useCallback(async () => {
    if (!githubUrl) return;
    setLoading(true);
    setError(null);
    try {
      const code = await fetchFromGitHub(githubUrl);
      setSourceCode(code);
      if (!name) {
        const urlParts = githubUrl.split('/');
        const filename = urlParts[urlParts.length - 1].replace(/\.(lua|luau)$/i, '');
        setName(filename);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch from GitHub');
    } finally {
      setLoading(false);
    }
  }, [githubUrl, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCode) { setError('Source code is required'); return; }
    if (!name) { setError('Script name is required'); return; }

    setLoading(true);
    setError(null);
    try {
      const script = await createScript({
        name,
        description: description || undefined,
        game: game || undefined,
        category: category || undefined,
        tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
        visibility,
        sourceCode,
        changelog: 'Initial version',
      });
      navigate(`/script/${script.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Upload Script</h1>
        <p className="mt-1 text-sm text-slate-400">Add a new Lua script to your private storage.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Upload method tabs */}
        <div className="flex gap-1 rounded-lg border border-white/10 bg-bg-card p-1">
          {(['paste', 'file', 'github'] as UploadMethod[]).map(m => (
            <button key={m} type="button" onClick={() => setMethod(m)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold capitalize transition-all ${method === m ? 'bg-accent/15 text-accent-light' : 'text-slate-400 hover:text-slate-200'}`}>
              {m === 'github' ? 'GitHub Sync' : m}
            </button>
          ))}
        </div>

        {/* Source code input */}
        {method === 'paste' && (
          <div>
            <label className="label">Lua Source Code</label>
            <textarea value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} className="input font-mono text-xs" rows={12} placeholder="-- Paste your Lua code here" required />
          </div>
        )}

        {method === 'file' && (
          <div>
            <label className="label">Upload .lua / .luau file</label>
            <div className="rounded-lg border border-dashed border-white/15 bg-bg-input p-6 text-center transition-colors hover:border-accent/40">
              <input type="file" accept=".lua,.luau,text/plain" onChange={handleFileUpload} className="hidden" id="file-input" />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>
                <p className="text-sm text-slate-300">{sourceCode ? 'File loaded ✓' : 'Click to select a .lua file'}</p>
                <p className="mt-1 text-xs text-slate-500">{sourceCode ? `${sourceCode.length.toLocaleString()} chars` : 'or drag and drop'}</p>
              </label>
            </div>
          </div>
        )}

        {method === 'github' && (
          <div className="space-y-2">
            <label className="label">GitHub Raw URL or Blob URL</label>
            <div className="flex gap-2">
              <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="input" placeholder="https://github.com/user/repo/blob/main/script.lua" />
              <button type="button" onClick={handleGitHubFetch} disabled={loading || !githubUrl} className="btn-secondary shrink-0">Fetch</button>
            </div>
            <p className="text-xs text-slate-500">Blob URLs are auto-converted to raw.githubusercontent.com</p>
            {sourceCode && <textarea value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} className="input font-mono text-xs" rows={8} placeholder="Fetched code will appear here" />}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Script Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="My Awesome Script" required />
          </div>
          <div>
            <label className="label">Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="Admin, ESP, Auto-Farm…" />
          </div>
          <div>
            <label className="label">Game (optional)</label>
            <input type="text" value={game} onChange={(e) => setGame(e.target.value)} className="input" placeholder="e.g. Arsenal, Blade Ball" />
          </div>
          <div>
            <label className="label">Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as 'private' | 'unlisted' | 'public')} className="input">
              <option value="private">Private (only you)</option>
              <option value="unlisted">Unlisted (link only)</option>
              <option value="public">Public (anyone can find)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={2} placeholder="What does this script do?" />
        </div>

        <div>
          <label className="label">Tags (comma-separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="input" placeholder="admin, universal, fly" />
        </div>

        {error && <p className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/scripts')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading || !sourceCode || !name} className="btn-primary flex-1">
            {loading ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Uploading…</>) : 'Upload Script'}
          </button>
        </div>
      </form>
    </div>
  );
}
