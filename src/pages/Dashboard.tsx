import { useAuth } from '../hooks/useAuth';
import { type ReactElement } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'Developer';

  const icons: Record<string, ReactElement> = {
    code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    key: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Welcome back, {displayName}</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your scripts, keys, and services.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[{ label: 'Scripts', value: 0, icon: 'code' }, { label: 'Total Views', value: 0, icon: 'eye' }, { label: 'Active Keys', value: 0, icon: 'key' }, { label: 'Storage Used', value: '0 KB', icon: 'database' }].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[s.icon]}</svg>
              </div>
              <div><p className="text-2xl font-bold text-slate-50">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[{ title: 'Upload Script', desc: 'Add a new Lua script via paste, file, or GitHub', icon: 'upload' }, { title: 'View Scripts', desc: 'Browse and manage your stored scripts', icon: 'list' }, { title: 'API Keys', desc: 'Manage API keys for programmatic access', icon: 'key' }].map((a) => (
            <div key={a.title} className="card group cursor-pointer p-4 transition-all hover:border-accent/30 hover:bg-bg-hover">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-transform group-hover:scale-110">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[a.icon]}</svg>
                </div>
                <div><h3 className="text-sm font-semibold text-slate-50">{a.title}</h3><p className="mt-0.5 text-xs text-slate-400">{a.desc}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-300">Coming Soon</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Key System', 'Obfuscator', 'Service Manager', 'Script Scanner', 'Webhooks', 'Analytics'].map((f) => <span key={f} className="chip">{f}</span>)}
        </div>
      </div>
    </div>
  );
}
