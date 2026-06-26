import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyScripts, deleteScript, type Script } from '../lib/scripts';

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setScripts(await fetchMyScripts());
    setLoading(false);
  }

  const filtered = scripts.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes all versions permanently.`)) return;
    try { await deleteScript(id); setScripts(scripts.filter(s => s.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : 'Delete failed'); }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">My Scripts</h1>
          <p className="mt-1 text-sm text-slate-400">{scripts.length} script{scripts.length !== 1 ? 's' : ''} stored</p>
        </div>
        <Link to="/upload" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Script
        </Link>
      </div>

      {scripts.length > 0 && <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search scripts…" className="input" />}

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>
          </div>
          {scripts.length === 0 ? (
            <>
              <h2 className="text-lg font-bold text-slate-50">No scripts yet</h2>
              <p className="mt-1 text-sm text-slate-400">Upload your first Lua script to get started.</p>
              <Link to="/upload" className="btn-primary mt-4">Upload Script</Link>
            </>
          ) : <p className="text-sm text-slate-400">No scripts match "{search}"</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((script, i) => (
            <div key={script.id} className="card group p-4 transition-all hover:border-accent/30" style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}>
              <Link to={`/script/${script.id}`} className="block">
                <h3 className="truncate font-semibold text-slate-50 group-hover:text-accent-light">{script.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">v{script.latest_version}</p>
                <p className="mt-2 text-[10px] text-slate-600">Updated {new Date(script.updated_at).toLocaleDateString()}</p>
              </Link>
              <button onClick={() => handleDelete(script.id, script.name)} className="mt-2 flex items-center gap-1 text-[10px] text-slate-600 transition-colors hover:text-danger" aria-label="Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
