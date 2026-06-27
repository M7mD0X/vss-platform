import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchScript, fetchVersions, addVersion, deleteVersion, restoreVersion, computeSemver, type Script, type ScriptVersion, type VersionType } from '../lib/scripts';
import CodeBlock from '../components/CodeBlock';
import DiffViewer from '../components/DiffViewer';

type ViewMode = 'source' | 'diff';

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [script, setScript] = useState<Script | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('source');
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newChangelog, setNewChangelog] = useState('');
  const [versionType, setVersionType] = useState<VersionType>('patch');
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

  // versions are sorted descending (latest first). Find the previous version
  // relative to the selected one — no manual selection needed.
  const selectedIndex = versions.findIndex(v => v.version_num === selectedVersion);
  const currentVersion = versions[selectedIndex];
  const previousVersion = selectedIndex >= 0 && selectedIndex < versions.length - 1
    ? versions[selectedIndex + 1]
    : null;
  const currentSemver = useMemo(() => computeSemver(versions, selectedVersion ?? 0), [versions, selectedVersion]);
  const isLatest = selectedVersion === versions[0]?.version_num;
  const canDiff = currentVersion && previousVersion;

  const loadstringUrl = script ? `${window.location.origin}${window.location.pathname}#api/script/${script.id}` : '';

  async function handleCopyLoadstring() {
    if (!loadstringUrl) return;
    try { await navigator.clipboard.writeText(`loadstring(game:HttpGet('${loadstringUrl}'))()`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }

  async function handleAddVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newCode) return;
    setUploading(true);
    try {
      await addVersion(id, { sourceCode: newCode, changelog: newChangelog || undefined, versionType });
      setNewCode(''); setNewChangelog(''); setShowAddVersion(false); setVersionType('patch');
      await load(id);
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUploading(false); }
  }

  async function handleRestore() {
    if (!id || !selectedVersion || !confirm(`Restore v${selectedVersion} as a new version?`)) return;
    setUploading(true);
    try { await restoreVersion(id, selectedVersion); await load(id); }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUploading(false); }
  }

  async function handleDeleteVersion() {
    if (!id || !selectedVersion || !confirm(`Delete v${selectedVersion}? This cannot be undone.`)) return;
    setUploading(true);
    try { await deleteVersion(id, selectedVersion); await load(id); }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUploading(false); }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" /></div>;
  if (!script) return <div className="card p-8 text-center"><p className="text-slate-400">Script not found.</p><Link to="/scripts" className="mt-3 inline-block text-sm font-semibold text-accent-light">← Back</Link></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link to="/scripts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light">← Back to Scripts</Link>
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-slate-50">{script.name}</h1>
          <p className="mt-1 text-xs text-slate-500">Updated {new Date(script.updated_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Loadstring URL */}
      <div className="card p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Loadstring URL</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-[#14141a] px-3 py-2 font-mono text-xs text-slate-400">{loadstringUrl}</code>
          <button onClick={handleCopyLoadstring} className={`btn-primary shrink-0 ${copied ? 'bg-success' : ''}`}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
      </div>

      {/* Versions section */}
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Versions ({versions.length})</h2>
          {/* Version dropdown */}
          <select value={selectedVersion ?? ''} onChange={(e) => setSelectedVersion(Number(e.target.value))} className="rounded-lg border border-white/10 bg-[#14141a] px-3 py-1.5 text-xs font-semibold text-slate-300">
            {versions.map(v => (
              <option key={v.version_num} value={v.version_num}>
                {v.version_num === versions[0]?.version_num ? `Latest (v${v.version_num})` : `v${v.version_num}`}
                {v.version_type ? ` — ${v.version_type}` : ''}
              </option>
            ))}
          </select>
          {/* Actions */}
          <button onClick={() => setShowAddVersion(!showAddVersion)} disabled={uploading} className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-[10px] font-semibold text-accent-light transition-colors hover:bg-accent/20" title="Publish a new version">Update</button>
          {!isLatest && <button onClick={handleRestore} disabled={uploading} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition-colors hover:text-warning hover:border-warning/30" title="Restore as new version">Restore</button>}
          {versions.length > 1 && <button onClick={handleDeleteVersion} disabled={uploading} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition-colors hover:text-danger hover:border-danger/30" title="Delete this version">Delete</button>}
        </div>

        {/* View mode toggle */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-[#14141a] p-1">
            <button onClick={() => setViewMode('source')} className={`rounded px-3 py-1 text-xs font-semibold transition-all ${viewMode === 'source' ? 'bg-accent/15 text-accent-light' : 'text-slate-500'}`}>Source</button>
            <button onClick={() => setViewMode('diff')} disabled={!canDiff} className={`rounded px-3 py-1 text-xs font-semibold transition-all ${viewMode === 'diff' ? 'bg-accent/15 text-accent-light' : 'text-slate-500'} disabled:opacity-30`} title={!canDiff ? 'No previous version to compare' : ''}>Diff</button>
          </div>
          {viewMode === 'diff' && canDiff && (
            <span className="text-xs text-slate-600">Comparing v{previousVersion.version_num} → v{currentVersion.version_num}</span>
          )}
        </div>

        {/* Add version form (opened by "Update" button) */}
        {showAddVersion && (
          <form onSubmit={handleAddVersion} className="space-y-3 border-t border-white/5 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-light">New Version</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className="label">Changelog</label><input type="text" value={newChangelog} onChange={(e) => setNewChangelog(e.target.value)} className="input" placeholder="What changed?" /></div>
              <div><label className="label">Version Type</label><select value={versionType} onChange={(e) => setVersionType(e.target.value as VersionType)} className="input"><option value="patch">Patch (bug fix)</option><option value="minor">Minor (new feature)</option><option value="major">Major (breaking change)</option></select></div>
            </div>
            <div><label className="label">New Source Code</label><CodeBlock code={newCode} editable onChange={setNewCode} maxHeight="400px" /></div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddVersion(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={uploading || !newCode} className="btn-primary flex-1">{uploading ? 'Publishing…' : `Publish ${versionType} version`}</button>
            </div>
          </form>
        )}
      </div>

      {/* Source code or diff viewer */}
      {currentVersion && viewMode === 'source' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Source — v{currentVersion.version_num} {currentSemver !== '0.0.0' && <span className="ml-1 text-slate-600">({currentSemver})</span>}</h2>
            <span className="text-[10px] text-slate-600">{currentVersion.file_size.toLocaleString()} bytes</span>
          </div>
          {currentVersion.changelog && <p className="mb-2 text-xs text-slate-400">📝 {currentVersion.changelog}</p>}
          <CodeBlock code={currentVersion.source_code} maxHeight="600px" />
        </div>
      )}

      {viewMode === 'diff' && canDiff && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Changes in v{currentVersion.version_num}</h2>
          <DiffViewer oldCode={previousVersion.source_code} newCode={currentVersion.source_code} maxHeight="600px" />
        </div>
      )}

      {viewMode === 'diff' && !canDiff && (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">No previous version to compare. This is the first version.</p>
        </div>
      )}
    </div>
  );
}
