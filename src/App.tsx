import { useState, type ReactElement } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import { signOut } from './lib/auth';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        </div>
        <h2 className="text-lg font-bold text-slate-50">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">Coming soon.</p>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'home' as const },
  { to: '/scripts', label: 'Scripts', icon: 'code' as const },
  { to: '/keys', label: 'Keys', icon: 'key' as const, badge: 'Soon' },
  { to: '/obfuscator', label: 'Obfuscator', icon: 'shield' as const, badge: 'Soon' },
  { to: '/settings', label: 'Settings', icon: 'settings' as const },
];

const ICONS: Record<string, ReactElement> = {
  home: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  key: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
};

export default function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="font-mono text-xs uppercase tracking-widest">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const displayName = user.profile?.display_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-bg-card transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-mono text-xs font-bold text-white">VSS</div>
              <div className="leading-none">
                <h1 className="text-sm font-bold text-slate-50">VSS Platform</h1>
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Script Management</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-200 lg:hidden" aria-label="Close menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <a href={item.to === '/' ? '#' : item.to} onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', import.meta.env.BASE_URL + (item.to === '/' ? '' : item.to)); setSidebarOpen(false); window.dispatchEvent(new PopStateEvent('popstate')); }}
                    className="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200" data-nav={item.to}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[item.icon]}</svg>
                    {item.label}
                    {item.badge && <span className="ml-auto chip text-[9px]">{item.badge}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-white/5 p-3">
            <div className="flex items-center gap-2 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 font-mono text-[10px] font-bold text-accent-light">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">{displayName}</p>
                <p className="truncate text-[10px] text-slate-500">{user.email}</p>
              </div>
              <button onClick={() => signOut()} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-danger/10 hover:text-danger" aria-label="Log out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="safe-pt sticky top-0 z-30 border-b border-white/5 bg-bg/80 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300" aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent font-mono text-[8px] font-bold text-white">VSS</div>
            <span className="text-sm font-bold text-slate-50">VSS Platform</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scripts" element={<ComingSoon title="Scripts" />} />
          <Route path="/keys" element={<ComingSoon title="Key System" />} />
          <Route path="/obfuscator" element={<ComingSoon title="Obfuscator" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" />} />
        </Routes>
      </main>
    </div>
  );
}
