import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme, useStyles, THEMES } from '../theme';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);
import { getSettings } from '../data/store';
import HelpChat from './HelpChat';
import CommandPalette from './CommandPalette';
import NotificationBell from './NotificationBell';

const BOTTOM_TAB_ITEMS = [
  { path: '/admin', label: 'Today', icon: 'grid' },
  { path: '/admin/members', label: 'Clients', icon: 'users' },
  { path: '/admin/schedule', label: 'Schedule', icon: 'calendar' },
  { path: '/admin/inbox', label: 'Messages', icon: 'message' },
];

const NAV_ITEMS = [
  { section: 'Overview', items: [
    { path: '/admin', label: 'Dashboard', icon: 'grid' },
    { path: '/admin/virtual', label: 'Virtual Sessions', icon: 'calendar' },
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
    { path: '/admin/memberships', label: 'Memberships', icon: 'users' },
    { path: '/admin/referrals', label: 'Referrals', icon: 'share' },
  ]},
  { section: 'Client Success', items: [
    { path: '/admin/retention', label: 'Retention', icon: 'heart' },
    { path: '/admin/reviews', label: 'Reviews', icon: 'heart' },
    { path: '/admin/challenges', label: 'Challenges', icon: 'bar-chart' },
    { path: '/admin/community', label: 'Community', icon: 'users' },
  ]},
  { section: 'Marketing', items: [
    { path: '/admin/inbox', label: 'Messages', icon: 'message' },
    { path: '/admin/automations', label: 'Automations', icon: 'settings' },
  ]},
  { section: 'System', items: [
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ]},
];

const ICONS = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clipboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  package: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4A2 2 0 012 16.76V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0z"/><polyline points="2.32 6.16 12 11 21.68 6.16"/><line x1="12" y1="22.76" x2="12" y2="11"/></svg>,
  heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>,
  message: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  'bar-chart': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  dumbbell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 6.5h11M6.5 17.5h11"/><rect x="2" y="6.5" width="4.5" height="11" rx="1"/><rect x="17.5" y="6.5" width="4.5" height="11" rx="1"/><line x1="12" y1="6.5" x2="12" y2="17.5"/></svg>,
  leaf: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 17 3.5 17 3.5s1.5 2.5-.5 8.5c-1 3-3 5.5-5.5 8z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  more: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  palette: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="14" r="1.5" fill="currentColor"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/></svg>,
};

function ThemePicker({ show, onClose }) {
  const { theme, setTheme } = useTheme();
  const s = useStyles();
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', bottom: 60, left: 16, width: 260,
        background: s.surface, border: `1px solid ${s.border}`, borderRadius: 16,
        boxShadow: s.shadowLg, padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ font: "600 13px 'Figtree', sans-serif", color: s.text, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Brand Theme
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3 }}>{ICONS.x}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.values(THEMES).map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
              background: theme.id === t.id ? s.accentLight : 'transparent',
              border: theme.id === t.id ? `2px solid ${s.accent}` : `1.5px solid ${s.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: t.dark ? '#1A1A1E' : '#FAF8F5',
                border: `2px solid ${t.dark ? '#2A2A2E' : '#E8E3DD'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ font: `600 13px 'Figtree', sans-serif`, color: s.text }}>{t.name}</div>
                <div style={{ font: `400 11px 'Figtree', sans-serif`, color: s.text3 }}>{t.dark ? 'Dark, intense, bold' : 'Warm, soft, premium'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 860);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const isEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('embed');
  const s = useStyles();
  const location = useLocation();
  const settings = getSettings();

  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  // Set body background based on dark mode
  useEffect(() => {
    document.body.style.background = s.bg;
    document.documentElement.style.background = s.bg;
  }, [theme.dark, s.bg]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sidebarWidth = collapsed ? 68 : 240;

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '10px 0' : '10px 16px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s',
    font: `${isActive ? '500' : '400'} 13px 'Inter', sans-serif`,
    color: isActive ? theme.accent : '#666',
    background: isActive ? theme.accentLight : 'transparent',
  });

  // Dark sidebar — always dark with accent as highlight color
  const sidebarBg = '#111111';
  const sidebarText = '#FFFFFF';
  const sidebarMuted = '#888888';
  const sidebarBorder = '#222222';
  const sidebarHover = '#1A1A1A';
  // Detect if accent is too dark for the dark sidebar
  const r = parseInt(theme.accent.slice(1, 3), 16) || 0;
  const g = parseInt(theme.accent.slice(3, 5), 16) || 0;
  const b = parseInt(theme.accent.slice(5, 7), 16) || 0;
  const isDarkAccent = (r * 0.299 + g * 0.587 + b * 0.114) < 80;
  const sidebarAccent = isDarkAccent ? '#FFFFFF' : theme.accent;
  const sidebarActive = isDarkAccent ? 'rgba(255,255,255,0.12)' : theme.accent + '30';

  const linkStyleNew = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '10px 0' : '10px 16px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s',
    font: `${isActive ? '500' : '400'} 13px 'Inter', sans-serif`,
    color: isActive ? sidebarAccent : '#AAAAAA',
    background: isActive ? sidebarActive : 'transparent',
  });

  const Sidebar = ({ mobile }) => (
    <div style={{
      width: mobile ? 260 : sidebarWidth,
      height: '100vh', position: 'fixed', left: 0, top: 0,
      background: sidebarBg,
      display: 'flex', flexDirection: 'column',
      transition: 'all 0.3s ease',
      zIndex: mobile ? 200 : 100,
      ...(mobile ? { boxShadow: '4px 0 24px rgba(0,0,0,0.2)' } : {}),
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 10px' : '20px 20px', borderBottom: `1px solid ${sidebarBorder}`,
        display: 'flex', alignItems: 'center', gap: 12, minHeight: 68,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: sidebarAccent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: theme.accentText, font: "700 14px 'Inter', sans-serif", flexShrink: 0,
        }}>
          {(settings.businessName || 'M')[0]}
        </div>
        {!collapsed && (
          <div>
            <div style={{ font: "600 14px 'Inter', sans-serif", color: '#FFFFFF', lineHeight: 1.2 }}>
              {settings.businessName || 'FORGE'}
            </div>
            <div style={{ font: "400 11px 'Inter', sans-serif", color: sidebarMuted }}>
              {settings.tagline || 'Personal Training'}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
        {NAV_ITEMS.map(section => (
          <div key={section.section} style={{ marginBottom: 16 }}>
            {!collapsed && (
              <div style={{
                font: "500 10px 'JetBrains Mono', monospace", textTransform: 'uppercase',
                letterSpacing: 1.2, color: sidebarMuted, padding: '0 16px 6px',
              }}>
                {section.section}
              </div>
            )}
            {section.items.map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === '/admin'}
                onClick={() => mobile && setMobileOpen(false)}
                style={({ isActive }) => linkStyleNew(isActive)}
              >
                <span style={{ flexShrink: 0, display: 'flex' }}>{ICONS[item.icon]}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Theme picker + dark mode buttons */}
      <div style={{ padding: '12px', borderTop: `1px solid ${sidebarBorder}` }}>
        <button onClick={toggleTheme} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: collapsed ? '10px 0' : '10px 16px', justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
          font: "400 13px 'Inter', sans-serif", color: sidebarMuted, transition: 'all 0.15s',
        }}>
          <span style={{ display: 'flex', flexShrink: 0 }}>{theme.dark ? <SunIcon /> : <MoonIcon />}</span>
          {!collapsed && (theme.dark ? 'Light Mode' : 'Dark Mode')}
        </button>
        <button onClick={() => setShowTheme(true)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: collapsed ? '10px 0' : '10px 16px', justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
          font: "400 13px 'Inter', sans-serif", color: sidebarMuted, transition: 'all 0.15s',
        }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: sidebarAccent, flexShrink: 0 }} />
          {!collapsed && 'Brand Color'}
        </button>
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
            padding: '8px', background: 'transparent', border: 'none', borderRadius: 8,
            cursor: 'pointer', color: sidebarMuted, marginTop: 4,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  // Bottom Tab Bar icons at 20px
  const TAB_ICONS = {
    grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    message: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  };

  // (More drawer removed — all nav goes through 4 bottom tabs + settings gear in topbar)

  return (
    <div style={{ minHeight: '100vh', background: s.bg, position: 'relative' }}>

      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ display: 'block' }}>
        <Sidebar />
      </div>

      {/* Mobile overlay (old hamburger - hidden now, replaced by bottom tabs) */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 199 }}
          onClick={() => setMobileOpen(false)} />
      )}
      {mobileOpen && <Sidebar mobile />}

      {/* Main content */}
      <div className="layout-main" style={{ marginLeft: sidebarWidth, minHeight: '100vh', transition: 'margin-left 0.25s cubic-bezier(0.16,1,0.3,1)', position: 'relative', zIndex: 1 }}>
        {/* Desktop Topbar — glassmorphism */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: theme.dark ? 'rgba(13,13,15,0.85)' : 'rgba(245,243,240,0.6)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${s.borderLight}`,
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }} className="layout-topbar desktop-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} style={{
            display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#666',
          }}>
            {ICONS.menu}
          </button>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search / Cmd+K trigger */}
            <button onClick={() => setCmdOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px 6px 10px', borderRadius: 100,
              border: `1px solid ${s.borderLight}`,
              background: theme.dark ? '#252529' : 'rgba(255,255,255,0.5)',
              font: "400 12px 'Inter', sans-serif", color: s.text3,
              cursor: 'pointer', backdropFilter: theme.dark ? 'none' : 'blur(8px)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = theme.dark ? '#2A2A2E' : 'rgba(255,255,255,0.8)'; e.currentTarget.style.color = s.text2; }}
            onMouseLeave={e => { e.currentTarget.style.background = theme.dark ? '#252529' : 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = s.text3; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="cmd-k-label" style={{ font: "400 11px 'JetBrains Mono', monospace", color: s.text3 }}>
                {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl K'}
              </span>
            </button>
            <div className="topbar-divider" style={{ width: 1, height: 20, background: s.borderLight }} />
            <span className="topbar-date" style={{ font: "400 12px 'JetBrains Mono', monospace", color: s.text3, letterSpacing: 0.5 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="topbar-divider" style={{ width: 1, height: 20, background: s.borderLight }} />
            {!isEmbed && <NotificationBell />}
            {!isEmbed && <div className="topbar-divider" style={{ width: 1, height: 20, background: s.borderLight }} />}
            {!isEmbed && <button onClick={() => window.location.href = '/'} style={{
              padding: '6px 14px', borderRadius: 100, border: `1px solid ${s.borderLight}`,
              background: theme.dark ? '#252529' : 'rgba(255,255,255,0.5)', font: "400 11px 'Inter', sans-serif", color: s.text3,
              cursor: 'pointer', backdropFilter: theme.dark ? 'none' : 'blur(8px)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = s.text2; }}
            onMouseLeave={e => { e.currentTarget.style.color = s.text3; }}
            >← Home</button>}
          </div>
        </div>

        {/* Mobile Topbar — dark native app feel */}
        <div className="mobile-topbar" style={{
          display: 'none', position: 'sticky', top: 0, zIndex: 50,
          background: s.bg,
          borderBottom: `1px solid ${s.borderLight}`,
          padding: '0 16px', height: 52,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: s.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.accentText, font: "700 12px 'Inter', sans-serif", flexShrink: 0,
            }}>
              {(settings.businessName || 'F')[0]}
            </div>
            <span style={{ font: "700 15px 'Inter', sans-serif", color: s.text, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {settings.businessName || 'FORGE'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavLink to="/admin/settings" style={{
              width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', color: s.text3, textDecoration: 'none',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </NavLink>
            <button onClick={toggleTheme} style={{
              width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', color: s.text3,
            }}>
              {theme.dark ? <SunIcon /> : <MoonIcon />}
            </button>
            {!isEmbed && <NotificationBell />}
          </div>
        </div>

        {/* Page content */}
        <div className="layout-content" style={{ padding: '32px 36px', maxWidth: 1400, animation: 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          {children}
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM TAB BAR — dark fitness app style ═══ */}
      <div className="mobile-bottom-tabs" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150,
        height: 48, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: theme.dark ? 'rgba(13,13,15,0.92)' : 'rgba(245,243,240,0.92)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${s.borderLight}`,
        alignItems: 'center', justifyContent: 'space-around',
      }}>
        {BOTTOM_TAB_ITEMS.map(tab => (
          <NavLink key={tab.path} to={tab.path} end={tab.path === '/admin'}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, textDecoration: 'none', padding: '4px 0',
              color: isActive ? s.accent : s.text3,
              transition: 'color 0.15s ease',
            })}
          >
            <span style={{ display: 'flex' }}>{TAB_ICONS[tab.icon]}</span>
            <span style={{ font: "500 10px 'Inter', sans-serif", letterSpacing: '0.3px' }}>{tab.label}</span>
          </NavLink>
        ))}
      </div>

      {/* More drawer removed — 4-tab nav only */}

      {!isEmbed && <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />}
      <ThemePicker show={showTheme} onClose={() => setShowTheme(false)} />
      {!isEmbed && !isMobile && <HelpChat />}

      <style>{`
        @keyframes moreOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes moreDrawerSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (max-width: 860px) {
          .sidebar-desktop { display: none !important; }
          .mobile-menu-btn { display: none !important; }
          .layout-main { margin-left: 0 !important; }
          .desktop-topbar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottom-tabs { display: flex !important; }
          .layout-content {
            padding: 20px 16px 68px 16px !important;
            max-width: 100% !important;
            animation-duration: 0.2s !important;
          }
          h1 { font-size: 24px !important; }
          h2 { font-size: 20px !important; }
        }
      `}</style>
    </div>
  );
}
