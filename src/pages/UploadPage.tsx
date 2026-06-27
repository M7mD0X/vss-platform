import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createScript, fetchFromGitHub } from '../lib/scripts';

type UploadMethod = 'paste' | 'file' | 'github';

export default function UploadPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<UploadMethod>('paste');
  const [name, setName] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSourceCode(ev.target?.result as string);
      if (!name) setName(file.name.replace(/\.(lua|luau)$/i, ''));
    };
    reader.readAsText(file);
  }, [name]);

  const handleGitHubFetch = useCallback(async () => {
    if (!githubUrl) return;
    setLoading(true); setError(null);
    try {
      const code = await fetchFromGitHub(githubUrl);
      setSourceCode(code);
      if (!name) {
        const parts = githubUrl.split('/');
        setName(parts[parts.length - 1].replace(/\.(lua|luau)$/i, ''));
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Fetch failed'); }
    finally { setLoading(false); }
  }, [githubUrl, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCode) { setError('Source code is required'); return; }
    if (!name) { setError('Script name is required'); return; }
    setLoading(true); setError(null);
    try {
      const script = await createScript({ name, sourceCode, changelog: 'Initial version' });
      if (script) navigate(`/script/${script.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Upload Script</h1>
        <p className="mt-1 text-sm text-slate-400">Add a new Lua script to your storage.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-bg-card p-1">
          {(['paste', 'file', 'github'] as UploadMethod[]).map(m => (
            <button key={m} type="button" onClick={() => setMethod(m)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold capitalize transition-all ${method === m ? 'bg-accent/15 text-accent-light' : 'text-slate-400 hover:text-slate-200'}`}>
              {m === 'github' ? 'GitHub Sync' : m}
            </button>
          ))}
        </div>

        {/* Paste method */}
        {method === 'paste' && (
          <div>
            <label className="label">Lua Source Code</label>
            <textarea value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} className="input font-mono text-xs" rows={12} placeholder="-- Paste your Lua code here" required />
          </div>
        )}

        {/* File upload method — now shows editable content after upload */}
        {method === 'file' && (
          <div className="space-y-3">
            <label className="label">Upload .lua / .luau file</label>
            <div className="rounded-lg border border-dashed border-white/15 bg-bg-input p-6 text-center transition-colors hover:border-accent/40">
              <input type="file" accept=".lua,.luau,text/plain" onChange={handleFileUpload} className="hidden" id="file-input" />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>
                <p className="text-sm text-slate-300">{sourceCode ? 'File loaded ✓ — click to replace' : 'Click to select a .lua file'}</p>
                <p className="mt-1 text-xs text-slate-500">{sourceCode ? `${sourceCode.length.toLocaleString()} chars` : 'or drag and drop'}</p>
              </label>
            </div>
            {/* Show editable content after file upload */}
            {sourceCode && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label mb-0">Source Code (editable)</label>
                  <span className="text-[10px] text-slate-600">{sourceCode.length.toLocaleString()} chars</span>
                </div>
                <textarea value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} className="input font-mono text-xs" rows={12} />
              </div>
            )}
          </div>
        )}

        {/* GitHub sync method — shows editable content after fetch */}
        {method === 'github' && (
          <div className="space-y-3">
            <label className="label">GitHub Raw URL or Blob URL</label>
            <div className="flex gap-2">
              <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="input" placeholder="https://github.com/user/repo/blob/main/script.lua" />
              <button type="button" onClick={handleGitHubFetch} disabled={loading || !githubUrl} className="btn-secondary shrink-0">Fetch</button>
            </div>
            <p className="text-xs text-slate-500">Blob URLs auto-convert to raw.githubusercontent.com</p>
            {sourceCode && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label mb-0">Source Code (editable)</label>
                  <span className="text-[10px] text-slate-600">{sourceCode.length.toLocaleString()} chars</span>
                </div>
                <textarea value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} className="input font-mono text-xs" rows={10} />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="label">Script Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="My Awesome Script" required />
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
