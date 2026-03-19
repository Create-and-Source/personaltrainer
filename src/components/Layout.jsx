import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme, useStyles, THEMES } from '../theme';
import { getSettings } from '../data/store';
import { useAuth } from '../services/AuthContext';
import NotificationBell from './NotificationBell';

/* ── Nav Structure ── */
const NAV_ITEMS = [
  { section: 'Overview', items: [
    { path: '/admin', label: 'Dashboard', icon: 'grid' },
    { path: '/admin/virtual', label: 'Virtual Sessions', icon: 'video' },
  ]},
  { section: 'Clients', items: [
    { path: '/admin/members', label: 'Clients', icon: 'users' },
    { path: '/admin/schedule', label: 'Schedule', icon: 'calendar' },
    { path: '/admin/classes', label: 'Training Programs', icon: 'clipboard' },
    { path: '/admin/workouts', label: 'Workout Builder', icon: 'dumbbell' },
    { path: '/admin/progress', label: 'Progress Tracking', icon: 'bar-chart' },
    { path: '/admin/nutrition', label: 'Nutrition', icon: 'leaf' },
    { path: '/admin/habits', label: 'Habits', icon: 'heart' },
  ]},
  { section: 'Billing', items: [
    { path: '/admin/memberships', label: 'Memberships', icon: 'credit' },
    { path: '/admin/referrals', label: 'Referrals', icon: 'share' },
  ]},
  { section: 'Client Success', items: [
    { path: '/admin/retention', label: 'Retention', icon: 'target' },
    { path: '/admin/reviews', label: 'Reviews', icon: 'star' },
    { path: '/admin/challenges', label: 'Challenges', icon: 'trophy' },
    { path: '/admin/community', label: 'Community', icon: 'users' },
  ]},
  { section: 'Marketing', items: [
    { path: '/admin/inbox', label: 'Messages', icon: 'message' },
    { path: '/admin/automations', label: 'Automations', icon: 'zap' },
  ]},
  { section: 'System', items: [
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ]},
];

const BOTTOM_TABS = [
  { path: '/admin', label: 'Today', icon: 'grid' },
  { path: '/admin/members', label: 'Clients', icon: 'users' },
  { path: '/admin/schedule', label: 'Schedule', icon: 'calendar' },
  { path: '/admin/inbox', label: 'Messages', icon: 'message' },
];

/* ── Icons ── */
const ICONS = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  dumbbell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6.5 6.5h11M6.5 17.5h11"/><rect x="2" y="6.5" width="4.5" height="11" rx="1"/>
      <rect x="17.5" y="6.5" width="4.5" height="11" rx="1"/><line x1="12" y1="6.5" x2="12" y2="17.5"/>
    </svg>
  ),
  'bar-chart': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  leaf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 17 3.5 17 3.5s1.5 2.5-.5 8.5c-1 3-3 5.5-5.5 8z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  message: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  share: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  video: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ),
  credit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  target: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  trophy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
      <path d="M4 22h16"/><path d="M10 22V14.5a2 2 0 01.4-1.2L12 11l1.6 2.3a2 2 0 01.4 1.2V22"/>
      <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
    </svg>
  ),
  zap: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
};

/* ── Sidebar constants ── */
const SIDEBAR_BG = '#1A1714';
const SIDEBAR_BORDER = '#2A2520';
const SIDEBAR_MUTED = '#8A8078';
const SIDEBAR_TEXT = '#E8E0D8';
const SIDEBAR_WIDTH = 240;

export default function Layout({ children }) {
  const { theme, setTheme } = useTheme();
  const s = useStyles();
  const location = useLocation();
  const settings = getSettings();
  const { user, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 860);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  // Sync body background
  useEffect(() => {
    document.body.style.background = s.bg;
    document.documentElement.style.background = s.bg;
  }, [s.bg]);

  const businessName = settings.businessName || 'FORGE';

  // Determine sidebar accent visibility against dark bg
  const sidebarAccent = theme.accent;
  const sidebarActiveBg = theme.id === 'warm' ? 'rgba(98,85,74,0.08)' : 'rgba(14,122,130,0.08)';

  /* ═══════════════════════════════════════════
     DESKTOP LAYOUT
  ═══════════════════════════════════════════ */
  if (!isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: s.bg }}>
        {/* ── Sidebar ── */}
        <aside style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          width: SIDEBAR_WIDTH, background: SIDEBAR_BG,
          display: 'flex', flexDirection: 'column',
          zIndex: 100, borderRight: `1px solid ${SIDEBAR_BORDER}`,
        }}>
          {/* Logo area */}
          <div style={{
            padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 14,
            borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: sidebarAccent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontFamily: s.HEADING, fontWeight: 700, fontSize: 15,
              flexShrink: 0,
            }}>
              {businessName[0]}
            </div>
            <div>
              <div style={{ fontFamily: s.HEADING, fontWeight: 600, fontSize: 14, color: SIDEBAR_TEXT, lineHeight: 1.2 }}>
                {businessName}
              </div>
              <div style={{ fontFamily: s.FONT, fontWeight: 400, fontSize: 11, color: SIDEBAR_MUTED, marginTop: 2 }}>
                {settings.tagline || 'Personal Training'}
              </div>
            </div>
          </div>

          {/* Nav sections */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(section => (
              <div key={section.section} style={{ marginBottom: 12 }}>
                <div style={{
                  fontFamily: s.MONO, fontSize: 10, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: SIDEBAR_MUTED, opacity: 0.4, padding: '0 16px 8px',
                }}>
                  {section.section}
                </div>
                {section.items.map(item => (
                  <NavLink key={item.path} to={item.path} end={item.path === '/admin'}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 16px', borderRadius: 10,
                      textDecoration: 'none', transition: 'all 0.15s ease',
                      fontFamily: s.FONT, fontSize: 13, fontWeight: isActive ? 500 : 400,
                      color: isActive ? '#FFFFFF' : SIDEBAR_MUTED,
                      background: isActive ? sidebarActiveBg : 'transparent',
                    })}
                  >
                    <span style={{ display: 'flex', flexShrink: 0, opacity: 0.85 }}>{ICONS[item.icon]}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Theme toggle at bottom */}
          <div style={{ padding: '16px 14px', borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
            <div style={{
              fontFamily: s.MONO, fontSize: 10, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: SIDEBAR_MUTED, padding: '0 4px 10px',
            }}>
              Theme
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.values(THEMES).map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: s.FONT, fontSize: 12, fontWeight: 500,
                  transition: 'all 0.2s ease',
                  background: theme.id === t.id ? sidebarActiveBg : 'transparent',
                  border: theme.id === t.id ? `1.5px solid ${sidebarAccent}40` : `1px solid ${SIDEBAR_BORDER}`,
                  color: theme.id === t.id ? '#FFFFFF' : SIDEBAR_MUTED,
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 4,
                    background: t.dark ? '#1A1A1E' : '#F7F3F0',
                    border: `2px solid ${t.accent}`,
                    flexShrink: 0,
                  }} />
                  {t.name}
                </button>
              ))}
            </div>

            {/* Sign Out */}
            {user && (
              <button onClick={signOut} style={{
                width: '100%', marginTop: 12, padding: '9px 12px', borderRadius: 8,
                cursor: 'pointer', fontFamily: s.FONT, fontSize: 12, fontWeight: 500,
                transition: 'all 0.2s ease',
                background: 'transparent', border: `1px solid ${SIDEBAR_BORDER}`,
                color: SIDEBAR_MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#E53935'; e.currentTarget.style.background = 'rgba(229,57,53,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = SIDEBAR_MUTED; e.currentTarget.style.borderColor = SIDEBAR_BORDER; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            )}
          </div>
        </aside>

        {/* ── Main Area ── */}
        <div style={{ marginLeft: SIDEBAR_WIDTH, minHeight: '100vh' }}>
          {/* Topbar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: s.bg, borderBottom: `1px solid ${s.border}`,
            padding: '0 36px', height: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                fontFamily: s.MONO, fontSize: 12, fontWeight: 400,
                color: s.text3, letterSpacing: '0.02em',
              }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <div style={{ width: 1, height: 20, background: s.border }} />
              <NotificationBell />
            </div>
          </div>

          {/* Content */}
          <div style={{
            padding: '32px 36px', maxWidth: 1400,
            animation: 'layoutFadeIn 0.35s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {children}
          </div>
        </div>

        <style>{`
          @keyframes layoutFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     MOBILE LAYOUT
  ═══════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: s.bg }}>
      {/* Mobile Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: s.bg, borderBottom: `1px solid ${s.border}`,
        padding: '0 16px', height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: sidebarAccent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontFamily: s.HEADING, fontWeight: 700, fontSize: 12,
          }}>
            {businessName[0]}
          </div>
          <span style={{
            fontFamily: s.HEADING, fontWeight: 600, fontSize: 15, color: s.text,
            letterSpacing: '0.02em',
          }}>
            {businessName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NotificationBell />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 68px' }}>
        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150,
        height: 48, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: `${s.surface}E6`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${s.border}`,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {BOTTOM_TABS.map(tab => (
          <NavLink key={tab.path} to={tab.path} end={tab.path === '/admin'}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2,
              textDecoration: 'none', padding: '4px 0',
              color: isActive ? s.accent : s.text3,
              transition: 'color 0.15s ease',
            })}
          >
            <span style={{ display: 'flex' }}>{ICONS[tab.icon]}</span>
            <span style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>
              {tab.label}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
