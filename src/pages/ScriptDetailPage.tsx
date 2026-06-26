import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchScript, fetchVersions, addVersion, type Script, type ScriptVersion } from '../lib/scripts';

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [script, setScript] = useState<Script | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newChangelog, setNewChangelog] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(scriptId: string) {
    setLoading(true);
    const [s, v] = await Promise.all([fetchScript(scriptId), fetchVersions(scriptId)]);
    setScript(s); setVersions(v);
    if (v.length > 0) setSelectedVersion(v[0].version_num);
    setLoading(false);
  }

  const currentVersion = versions.find(v => v.version_num === selectedVersion);
  const loadstringUrl = script ? `${window.location.origin}${window.location.pathname}#api/script/${script.id}` : '';

  async function handleCopyLoadstring() {
    if (!loadstringUrl) return;
    try { await navigator.clipboard.writeText(`loadstring(game:HttpGet('${loadstringUrl}'))()`); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* */ }
  }

  async function handleAddVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newCode) return;
    setUploading(true);
    try {
      await addVersion(id, { sourceCode: newCode, changelog: newChangelog || undefined });
      setNewCode(''); setNewChangelog(''); setShowAddVersion(false);
      await load(id);
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUploading(false); }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" /></div>;

  if (!script) return <div className="card p-8 text-center"><p className="text-slate-400">Script not found.</p><Link to="/scripts" className="mt-3 inline-block text-sm font-semibold text-accent-light">← Back to Scripts</Link></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link to="/scripts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light">← Back to Scripts</Link>
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-slate-50">{script.name}</h1>
          <p className="mt-1 text-xs text-slate-500">Updated {new Date(script.updated_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Loadstring URL</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-bg-input px-3 py-2 font-mono text-xs text-slate-400">{loadstringUrl}</code>
          <button onClick={handleCopyLoadstring} className={`btn-primary shrink-0 ${copied ? 'bg-success' : ''}`}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Protected delivery — raw source is never exposed publicly.</p>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Versions ({versions.length})</h2>
          <button onClick={() => setShowAddVersion(!showAddVersion)} className="text-xs font-semibold text-accent-light hover:underline">{showAddVersion ? 'Cancel' : '+ New Version'}</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {versions.map(v => (
            <button key={v.version_num} onClick={() => setSelectedVersion(v.version_num)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${selectedVersion === v.version_num ? 'border-accent bg-accent/10 text-accent-light' : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'}`}>
              v{v.version_num}<span className="ml-1.5 text-[9px] text-slate-600">{new Date(v.created_at).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
        {showAddVersion && (
          <form onSubmit={handleAddVersion} className="mt-4 space-y-3 border-t border-white/5 pt-4">
            <div><label className="label">Changelog</label><input type="text" value={newChangelog} onChange={(e) => setNewChangelog(e.target.value)} className="input" placeholder="What changed?" /></div>
            <div><label className="label">New Source Code</label><textarea value={newCode} onChange={(e) => setNewCode(e.target.value)} className="input font-mono text-xs" rows={10} placeholder="-- Paste updated Lua code" required /></div>
            <button type="submit" disabled={uploading || !newCode} className="btn-primary w-full">{uploading ? 'Uploading…' : 'Publish New Version'}</button>
          </form>
        )}
      </div>

      {currentVersion && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Source — v{currentVersion.version_num}</h2>
            <span className="text-[10px] text-slate-600">{currentVersion.file_size.toLocaleString()} bytes</span>
          </div>
          {currentVersion.changelog && <p className="border-b border-white/5 px-4 py-2 text-xs text-slate-400">📝 {currentVersion.changelog}</p>}
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-300" style={{ maxHeight: '500px' }}><code>{currentVersion.source_code}</code></pre>
        </div>
      )}
    </div>
  );
}
