import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchScript, fetchVersions, addVersion, deleteVersion, updateVersion, restoreVersion, computeSemver, type Script, type ScriptVersion, type VersionType } from '../lib/scripts';
import CodeBlock from '../components/CodeBlock';
import DiffViewer from '../components/DiffViewer';

type ViewMode = 'source' | 'diff';

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [script, setScript] = useState<Script | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('source');
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [showEditVersion, setShowEditVersion] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newChangelog, setNewChangelog] = useState('');
  const [versionType, setVersionType] = useState<VersionType>('patch');
  const [editCode, setEditCode] = useState('');
  const [editChangelog, setEditChangelog] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (id) load(id); }, [id]);

  async function load(scriptId: string) {
    setLoading(true);
    const [s, v] = await Promise.all([fetchScript(scriptId), fetchVersions(scriptId)]);
    setScript(s); setVersions(v);
    if (v.length > 0) {
      setSelectedVersion(v[0].version_num);
      if (v.length > 1) setCompareVersion(v[1].version_num);
    }
    setLoading(false);
  }

  const currentVersion = versions.find(v => v.version_num === selectedVersion);
  const previousVersion = versions.find(v => v.version_num === compareVersion);
  const currentSemver = useMemo(() => computeSemver(versions, selectedVersion ?? 0), [versions, selectedVersion]);
  const isLatest = selectedVersion === versions[0]?.version_num;

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
    try {
      await deleteVersion(id, selectedVersion);
      await load(id);
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUploading(false); }
  }

  async function handleUpdateVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !selectedVersion) return;
    setUploading(true);
    try {
      await updateVersion(id, selectedVersion, { sourceCode: editCode, changelog: editChangelog || undefined });
      setShowEditVersion(false); setEditCode(''); setEditChangelog('');
      await load(id);
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setUploading(false); }
  }

  function openEditVersion() {
    if (!currentVersion) return;
    setEditCode(currentVersion.source_code);
    setEditChangelog(currentVersion.changelog || '');
    setShowEditVersion(true);
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

      {/* Versions section with dropdown + actions */}
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Versions ({versions.length})</h2>
          <div className="flex items-center gap-2">
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
            <button onClick={openEditVersion} disabled={uploading} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition-colors hover:text-accent-light hover:border-accent/30" title="Edit this version">Update</button>
            {!isLatest && <button onClick={handleRestore} disabled={uploading} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition-colors hover:text-warning hover:border-warning/30" title="Restore as new version">Restore</button>}
            {versions.length > 1 && <button onClick={handleDeleteVersion} disabled={uploading} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 transition-colors hover:text-danger hover:border-danger/30" title="Delete this version">Delete</button>}
          </div>
        </div>

        {/* View mode toggle */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-[#14141a] p-1">
            <button onClick={() => setViewMode('source')} className={`rounded px-3 py-1 text-xs font-semibold transition-all ${viewMode === 'source' ? 'bg-accent/15 text-accent-light' : 'text-slate-500'}`}>Source</button>
            <button onClick={() => setViewMode('diff')} disabled={versions.length < 2} className={`rounded px-3 py-1 text-xs font-semibold transition-all ${viewMode === 'diff' ? 'bg-accent/15 text-accent-light' : 'text-slate-500'} disabled:opacity-30`}>Diff</button>
          </div>
          {viewMode === 'diff' && versions.length >= 2 && (
            <div className="flex items-center gap-2">
              <select value={compareVersion ?? ''} onChange={(e) => setCompareVersion(Number(e.target.value))} className="rounded-lg border border-white/10 bg-[#14141a] px-2 py-1 text-xs text-slate-300">
                {versions.filter(v => v.version_num !== selectedVersion).map(v => (
                  <option key={v.version_num} value={v.version_num}>v{v.version_num}</option>
                ))}
              </select>
              <span className="text-xs text-slate-600">→ v{selectedVersion}</span>
            </div>
          )}
          <button onClick={() => setShowAddVersion(!showAddVersion)} className="ml-auto text-xs font-semibold text-accent-light hover:underline">{showAddVersion ? 'Cancel' : '+ New Version'}</button>
        </div>

        {/* Add version form */}
        {showAddVersion && (
          <form onSubmit={handleAddVersion} className="mb-4 space-y-3 border-b border-white/5 pb-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className="label">Changelog</label><input type="text" value={newChangelog} onChange={(e) => setNewChangelog(e.target.value)} className="input" placeholder="What changed?" /></div>
              <div><label className="label">Version Type</label><select value={versionType} onChange={(e) => setVersionType(e.target.value as VersionType)} className="input"><option value="patch">Patch (bug fix)</option><option value="minor">Minor (new feature)</option><option value="major">Major (breaking change)</option></select></div>
            </div>
            <div><label className="label">New Source Code</label><CodeBlock code={newCode} editable onChange={setNewCode} maxHeight="400px" /></div>
            <button type="submit" disabled={uploading || !newCode} className="btn-primary w-full">{uploading ? 'Publishing…' : `Publish ${versionType} version`}</button>
          </form>
        )}

        {/* Edit version form */}
        {showEditVersion && currentVersion && (
          <form onSubmit={handleUpdateVersion} className="mb-4 space-y-3 border-b border-white/5 pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-light">Editing v{currentVersion.version_num}</h3>
            <div><label className="label">Changelog</label><input type="text" value={editChangelog} onChange={(e) => setEditChangelog(e.target.value)} className="input" placeholder="What changed?" /></div>
            <div><label className="label">Source Code</label><CodeBlock code={editCode} editable onChange={setEditCode} maxHeight="400px" /></div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowEditVersion(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={uploading} className="btn-primary flex-1">{uploading ? 'Saving…' : 'Save Changes'}</button>
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

      {viewMode === 'diff' && currentVersion && previousVersion && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Diff: v{previousVersion.version_num} → v{currentVersion.version_num}</h2>
          <DiffViewer oldCode={previousVersion.source_code} newCode={currentVersion.source_code} maxHeight="600px" />
        </div>
      )}
    </div>
  );
}
