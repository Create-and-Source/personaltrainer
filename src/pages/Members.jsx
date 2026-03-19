import { useState, useEffect, useMemo } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, addPatient, updatePatient, deletePatient, getAppointments, getServices, getClassPackages, subscribe } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const ANIM_ID = 'members-anims-v2';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes memFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes memSlideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
    @keyframes memSlideInMobile { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
  `;
  document.head.appendChild(sheet);
}

const TIER_CONFIG = {
  'Drop-in': { label: 'Drop-in', bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
  '10-Session Pack': { label: '10-Pack', bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' },
  'Unlimited Monthly': { label: 'Unlimited', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
  'Premium Monthly': { label: 'Premium', bg: '#FDF2F8', color: '#9D174D', border: '#F9A8D4' },
};

const FILTER_PILLS = ['All', 'Drop-in', '10-Session Pack', 'Unlimited Monthly', 'Premium Monthly'];
const SORT_OPTIONS = [
  { value: 'lastSession', label: 'Last Session' },
  { value: 'name', label: 'Name' },
  { value: 'topSpenders', label: 'Top Spenders' },
];

function getInitials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function statusDot(lastVisit) {
  const days = daysSince(lastVisit);
  if (days < 7) return '#22C55E';
  if (days < 30) return '#EAB308';
  return '#EF4444';
}

export default function Members() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('lastSession');
  const [viewMode, setViewMode] = useState('card');
  const [selectedId, setSelectedId] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const patients = getPatients();
  const appointments = getAppointments();
  const services = getServices();
  const programs = getClassPackages();

  const filtered = useMemo(() => {
    let list = [...patients];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q) || (p.phone || '').includes(q));
    }
    if (filter !== 'All') {
      list = list.filter(p => p.membershipTier === filter);
    }
    if (sort === 'lastSession') list.sort((a, b) => new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0));
    else if (sort === 'name') list.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    else if (sort === 'topSpenders') list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    return list;
  }, [patients, search, filter, sort]);

  const selectedClient = patients.find(p => p.id === selectedId);

  const clientAppts = useMemo(() => {
    if (!selectedId) return [];
    return appointments.filter(a => a.patientId === selectedId).sort((a, b) => {
      const dateA = `${a.date}T${a.time}`;
      const dateB = `${b.date}T${b.time}`;
      return dateB.localeCompare(dateA);
    });
  }, [selectedId, appointments]);

  const clientPrograms = useMemo(() => {
    if (!selectedId) return [];
    return programs.filter(p => p.patientId === selectedId);
  }, [selectedId, programs]);

  const clientProgress = useMemo(() => {
    if (!selectedId) return [];
    try {
      return JSON.parse(localStorage.getItem(`ms_progress_${selectedId}`)) || [];
    } catch { return []; }
  }, [selectedId]);

  const clientPRs = useMemo(() => {
    if (!selectedId) return [];
    try {
      const all = JSON.parse(localStorage.getItem('ms_prs')) || [];
      return all.filter(pr => pr.clientId === selectedId);
    } catch { return []; }
  }, [selectedId]);

  const clientMeasurements = useMemo(() => {
    if (!selectedId) return [];
    try {
      return JSON.parse(localStorage.getItem(`ms_measurements_${selectedId}`)) || [];
    } catch { return []; }
  }, [selectedId]);

  const openClient = (id) => {
    setSelectedId(id);
    setDetailTab('overview');
  };

  // ── Avatar component ──
  const Avatar = ({ first, last, size = 44 }) => (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: getAvatarGradient(`${first} ${last}`),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: `600 ${Math.round(size * 0.36)}px ${s.HEADING}`,
      color: '#FFFFFF', flexShrink: 0, letterSpacing: 0.5,
    }}>
      {getInitials(first, last)}
    </div>
  );

  // ── Tier Badge ──
  const TierBadge = ({ tier, small }) => {
    const cfg = TIER_CONFIG[tier];
    if (!cfg) return null;
    return (
      <span style={{
        display: 'inline-block', padding: small ? '2px 8px' : '4px 12px',
        borderRadius: 100, font: `600 ${small ? 10 : 11}px ${s.FONT}`,
        background: s.dark ? `${cfg.color}18` : cfg.bg,
        color: s.dark ? cfg.border : cfg.color,
        border: `1px solid ${s.dark ? `${cfg.color}30` : cfg.border}40`,
        letterSpacing: 0.3,
      }}>
        {cfg.label}
      </span>
    );
  };

  // ── Client Card ──
  const ClientCard = ({ client, idx }) => {
    const clientSessions = appointments.filter(a => a.patientId === client.id);
    const completedSessions = clientSessions.filter(a => a.status === 'completed').length;
    const favSvc = client.favoriteClass || 'N/A';
    const days = daysSince(client.lastVisit);

    return (
      <div
        onClick={() => openClient(client.id)}
        style={{
          ...s.cardStyle, padding: 20, cursor: 'pointer',
          animation: `memFadeUp 0.4s ease ${idx * 30}ms both`,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = s.shadowMd; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = s.shadow; }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <Avatar first={client.firstName} last={client.lastName} size={48} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 12, height: 12, borderRadius: 6,
              background: statusDot(client.lastVisit),
              border: `2px solid ${s.surface}`,
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `600 16px ${s.FONT}`, color: s.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.firstName} {client.lastName}
            </div>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 6 }}>
              {client.goals || 'No goal set'}
            </div>
            <TierBadge tier={client.membershipTier} small />
          </div>
        </div>

        {/* Last session */}
        <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 14 }}>
          Last session: {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Sessions', value: client.visitCount || completedSessions },
            { label: 'Spent', value: fmt(client.totalSpent || 0) },
            { label: 'Favorite', value: favSvc.length > 12 ? favSvc.slice(0, 11) + '...' : favSvc },
          ].map(stat => (
            <div key={stat.label} style={{
              background: s.dark ? s.surfaceAlt : s.surfaceAlt,
              borderRadius: 10, padding: '8px 10px', textAlign: 'center',
            }}>
              <div style={{ font: `600 13px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{stat.value}</div>
              <div style={{ font: `400 10px ${s.FONT}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Table Row ──
  const ClientRow = ({ client }) => {
    const days = daysSince(client.lastVisit);
    return (
      <tr
        onClick={() => openClient(client.id)}
        style={{ borderBottom: `1px solid ${s.borderLight}`, cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = s.surfaceHover}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Avatar first={client.firstName} last={client.lastName} size={36} />
              <div style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 10, height: 10, borderRadius: 5,
                background: statusDot(client.lastVisit),
                border: `2px solid ${s.surface}`,
              }} />
            </div>
            <div>
              <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{client.firstName} {client.lastName}</div>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{client.email}</div>
            </div>
          </div>
        </td>
        <td style={{ padding: '14px 16px' }}><TierBadge tier={client.membershipTier} small /></td>
        <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{client.goals || '—'}</td>
        <td className="members-hide-mobile" style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>
          {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}
        </td>
        <td className="members-hide-mobile" style={{ padding: '14px 16px', font: `500 13px ${s.FONT}`, color: s.text }}>{client.visitCount || 0}</td>
        <td className="members-hide-mobile" style={{ padding: '14px 16px', font: `500 13px ${s.FONT}`, color: s.text }}>{fmt(client.totalSpent || 0)}</td>
      </tr>
    );
  };

  // ── Client Detail Panel ──
  const ClientDetail = () => {
    if (!selectedClient) return null;
    const c = selectedClient;
    const days = daysSince(c.lastVisit);
    const clientSince = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
    const completedSessions = clientAppts.filter(a => a.status === 'completed');
    const upcomingSessions = clientAppts.filter(a => a.status === 'confirmed' || a.status === 'pending');
    const totalSpent = c.totalSpent || 0;
    const monthsActive = c.createdAt ? Math.max(1, Math.ceil((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 1;
    const avgPerMonth = Math.round(totalSpent / monthsActive);

    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'sessions', label: 'Sessions' },
      { id: 'progress', label: 'Progress' },
      { id: 'programs', label: 'Programs' },
      { id: 'messages', label: 'Messages' },
    ];

    const panelStyle = isMobile ? {
      position: 'fixed', inset: 0, zIndex: 200,
      background: s.bg, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      animation: 'memSlideInMobile 0.35s cubic-bezier(0.16,1,0.3,1)',
    } : {
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '60%', maxWidth: 800, minWidth: 500,
      zIndex: 200, background: s.bg, overflowY: 'auto',
      boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
      animation: 'memSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
    };

    return (
      <>
        {/* Backdrop on desktop */}
        {!isMobile && (
          <div
            onClick={() => setSelectedId(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.25)' }}
          />
        )}
        <div style={panelStyle}>
          {/* Back / Close */}
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${s.border}`, background: s.surface }}>
            <button
              onClick={() => setSelectedId(null)}
              style={{ ...s.pillGhost, padding: '6px 14px', fontSize: 13 }}
            >
              {isMobile ? '< Back' : 'Close'}
            </button>
            <div style={{ flex: 1 }} />
            <button style={{ ...s.pillCta, padding: '8px 18px', fontSize: 13 }}>Book Session</button>
            <button style={{ ...s.pillOutline, padding: '8px 18px', fontSize: 13 }}>Send Message</button>
          </div>

          {/* Header */}
          <div style={{ padding: '28px 24px 20px', background: s.surface, borderBottom: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative' }}>
                <Avatar first={c.firstName} last={c.lastName} size={72} />
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 16, height: 16, borderRadius: 8,
                  background: statusDot(c.lastVisit),
                  border: `3px solid ${s.surface}`,
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: `600 24px ${s.HEADING}`, color: s.text, marginBottom: 4 }}>
                  {c.firstName} {c.lastName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <TierBadge tier={c.membershipTier} />
                  <span style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>Client since {clientSince}</span>
                </div>
                {c.goals && (
                  <div style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginTop: 8 }}>
                    Goal: {c.goals}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 0, borderBottom: `1px solid ${s.border}`,
            background: s.surface, overflowX: 'auto', padding: '0 24px',
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                style={{
                  padding: '14px 20px', border: 'none', cursor: 'pointer',
                  font: `500 13px ${s.FONT}`, background: 'transparent',
                  color: detailTab === tab.id ? s.accent : s.text3,
                  borderBottom: detailTab === tab.id ? `2px solid ${s.accent}` : '2px solid transparent',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: 24 }}>
            {/* OVERVIEW */}
            {detailTab === 'overview' && (
              <div>
                {/* Contact Info */}
                <div style={{ ...s.cardStyle, padding: 20, marginBottom: 20 }}>
                  <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Contact Information</div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    {[
                      { label: 'Email', value: c.email || 'Not provided' },
                      { label: 'Phone', value: c.phone || 'Not provided' },
                      { label: 'Date of Birth', value: c.dob ? new Date(c.dob + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not provided' },
                      { label: 'Membership', value: c.membershipTier || 'None' },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={s.label}>{item.label}</div>
                        <div style={{ font: `400 14px ${s.FONT}`, color: s.text }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Sessions', value: c.visitCount || completedSessions.length, color: s.accent },
                    { label: 'Total Spent', value: fmt(totalSpent), color: s.success },
                    { label: 'Avg / Month', value: fmt(avgPerMonth), color: s.text },
                    { label: 'Last Visit', value: days === 0 ? 'Today' : `${days}d ago`, color: statusDot(c.lastVisit) },
                  ].map(stat => (
                    <div key={stat.label} style={{ ...s.cardStyle, padding: 18, textAlign: 'center' }}>
                      <div style={{ font: `700 22px ${s.HEADING}`, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div style={{ ...s.cardStyle, padding: 20 }}>
                  <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Recent Activity</div>
                  {clientAppts.slice(0, 8).map((a, i) => {
                    const svc = services.find(sv => sv.id === a.serviceId);
                    const isPast = new Date(`${a.date}T${a.time}`) < new Date();
                    return (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                        borderBottom: i < Math.min(clientAppts.length, 8) - 1 ? `1px solid ${s.borderLight}` : 'none',
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                          background: a.status === 'completed' ? s.success : a.status === 'confirmed' ? s.accent : a.status === 'cancelled' ? s.danger : s.warning,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{svc?.name || 'Session'}</div>
                          <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                            {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {a.time}
                          </div>
                        </div>
                        <span style={{
                          font: `500 11px ${s.FONT}`, textTransform: 'capitalize',
                          padding: '3px 10px', borderRadius: 100,
                          background: a.status === 'completed' ? s.successBg : a.status === 'confirmed' ? s.accentLight : a.status === 'cancelled' ? s.dangerBg : s.warningBg,
                          color: a.status === 'completed' ? s.success : a.status === 'confirmed' ? s.accent : a.status === 'cancelled' ? s.danger : s.warning,
                        }}>
                          {a.status}
                        </span>
                      </div>
                    );
                  })}
                  {clientAppts.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No session history yet</div>
                  )}
                </div>
              </div>
            )}

            {/* SESSIONS */}
            {detailTab === 'sessions' && (
              <div>
                {/* Upcoming */}
                {upcomingSessions.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 12 }}>Upcoming Sessions</div>
                    {upcomingSessions.map(a => {
                      const svc = services.find(sv => sv.id === a.serviceId);
                      return (
                        <div key={a.id} style={{
                          ...s.cardStyle, padding: 16, marginBottom: 10,
                          borderLeft: `3px solid ${s.accent}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{svc?.name || 'Session'}</div>
                              <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginTop: 4 }}>
                                {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {a.time} — {a.duration || svc?.duration || 60}min
                              </div>
                              {a.notes && <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 6 }}>{a.notes}</div>}
                            </div>
                            <span style={{
                              font: `500 11px ${s.FONT}`, textTransform: 'capitalize',
                              padding: '3px 10px', borderRadius: 100,
                              background: a.status === 'confirmed' ? s.accentLight : s.warningBg,
                              color: a.status === 'confirmed' ? s.accent : s.warning,
                            }}>
                              {a.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Full History */}
                <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 12 }}>Session History</div>
                <div style={s.tableWrap}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                        {['Date', 'Session', 'Duration', 'Status', 'Notes'].map(h => (
                          <th key={h} className={h === 'Notes' ? 'members-hide-mobile' : ''} style={{ padding: '10px 14px', font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clientAppts.map((a, i) => {
                        const svc = services.find(sv => sv.id === a.serviceId);
                        return (
                          <tr key={a.id} style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                            <td style={{ padding: '12px 14px', font: `400 13px ${s.FONT}`, color: s.text }}>
                              {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{a.time}</div>
                            </td>
                            <td style={{ padding: '12px 14px', font: `500 13px ${s.FONT}`, color: s.text }}>{svc?.name || '—'}</td>
                            <td style={{ padding: '12px 14px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{a.duration || svc?.duration || 60}min</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                font: `500 11px ${s.FONT}`, textTransform: 'capitalize',
                                padding: '3px 10px', borderRadius: 100,
                                background: a.status === 'completed' ? s.successBg : a.status === 'confirmed' ? s.accentLight : a.status === 'cancelled' ? s.dangerBg : s.warningBg,
                                color: a.status === 'completed' ? s.success : a.status === 'confirmed' ? s.accent : a.status === 'cancelled' ? s.danger : s.warning,
                              }}>
                                {a.status}
                              </span>
                            </td>
                            <td className="members-hide-mobile" style={{ padding: '12px 14px', font: `400 12px ${s.FONT}`, color: s.text3, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                      {clientAppts.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No sessions found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 12, textAlign: 'right' }}>
                  {clientAppts.length} total session{clientAppts.length !== 1 ? 's' : ''} — {completedSessions.length} completed
                </div>
              </div>
            )}

            {/* PROGRESS */}
            {detailTab === 'progress' && (
              <div>
                {/* Weight Chart */}
                <div style={{ ...s.cardStyle, padding: 20, marginBottom: 20 }}>
                  <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Weight Tracking</div>
                  {clientProgress.length > 0 ? (
                    <div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 16px' }}>
                          <div style={s.label}>Current</div>
                          <div style={{ font: `600 18px ${s.HEADING}`, color: s.text }}>{clientProgress[clientProgress.length - 1]?.weight || '—'} lbs</div>
                        </div>
                        <div style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 16px' }}>
                          <div style={s.label}>Starting</div>
                          <div style={{ font: `600 18px ${s.HEADING}`, color: s.text }}>{clientProgress[0]?.weight || '—'} lbs</div>
                        </div>
                        {clientProgress.length >= 2 && (
                          <div style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 16px' }}>
                            <div style={s.label}>Change</div>
                            <div style={{ font: `600 18px ${s.HEADING}`, color: (clientProgress[clientProgress.length - 1]?.weight - clientProgress[0]?.weight) <= 0 ? s.success : s.danger }}>
                              {((clientProgress[clientProgress.length - 1]?.weight || 0) - (clientProgress[0]?.weight || 0)).toFixed(1)} lbs
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Simple bar chart visualization */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, padding: '0 4px' }}>
                        {clientProgress.slice(-20).map((entry, i) => {
                          const weights = clientProgress.slice(-20).map(e => e.weight);
                          const min = Math.min(...weights) - 5;
                          const max = Math.max(...weights) + 5;
                          const height = Math.max(8, ((entry.weight - min) / (max - min)) * 90);
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <div style={{
                                width: '100%', maxWidth: 24, height, borderRadius: 4,
                                background: s.accent, opacity: 0.4 + (i / 20) * 0.6,
                              }} />
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{clientProgress.slice(-20)[0]?.date || ''}</span>
                        <span style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{clientProgress[clientProgress.length - 1]?.date || ''}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>
                      No weight data recorded yet. Track progress from the Progress page.
                    </div>
                  )}
                </div>

                {/* Personal Records */}
                <div style={{ ...s.cardStyle, padding: 20, marginBottom: 20 }}>
                  <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Personal Records</div>
                  {clientPRs.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                      {clientPRs.map((pr, i) => (
                        <div key={i} style={{ background: s.surfaceAlt, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{pr.exercise}</div>
                            <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{pr.date}</div>
                          </div>
                          <div style={{ font: `700 16px ${s.HEADING}`, color: s.accent }}>{pr.value} {pr.unit || 'lbs'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>
                      No personal records logged yet.
                    </div>
                  )}
                </div>

                {/* Body Measurements */}
                <div style={{ ...s.cardStyle, padding: 20 }}>
                  <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Body Measurements</div>
                  {clientMeasurements.length > 0 ? (
                    <div>
                      {(() => {
                        const latest = clientMeasurements[clientMeasurements.length - 1];
                        const fields = ['chest', 'waist', 'hips', 'arms', 'thighs'];
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 10 }}>
                            {fields.filter(f => latest[f]).map(f => (
                              <div key={f} style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                                <div style={{ font: `600 18px ${s.HEADING}`, color: s.text }}>{latest[f]}"</div>
                                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, textTransform: 'capitalize' }}>{f}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 10, textAlign: 'right' }}>
                        Last measured: {clientMeasurements[clientMeasurements.length - 1]?.date || 'Unknown'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>
                      No measurements recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROGRAMS */}
            {detailTab === 'programs' && (
              <div>
                <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Training Programs</div>
                {clientPrograms.length > 0 ? clientPrograms.map(prog => {
                  const completed = (prog.sessions || []).filter(s => s.status === 'completed').length;
                  const total = (prog.sessions || []).length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div key={prog.id} style={{ ...s.cardStyle, padding: 20, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                          <div style={{ font: `600 16px ${s.HEADING}`, color: s.text }}>{prog.name}</div>
                          <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                            Started {new Date(prog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <span style={{
                          font: `600 13px ${s.FONT}`, padding: '4px 12px', borderRadius: 100,
                          background: pct === 100 ? s.successBg : s.accentLight,
                          color: pct === 100 ? s.success : s.accent,
                        }}>
                          {pct}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ background: s.surfaceAlt, borderRadius: 100, height: 6, marginBottom: 16, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: s.accent, borderRadius: 100, transition: 'width 0.3s' }} />
                      </div>
                      {/* Sessions list */}
                      {(prog.sessions || []).map((sess, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                          borderBottom: i < (prog.sessions || []).length - 1 ? `1px solid ${s.borderLight}` : 'none',
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                            background: sess.status === 'completed' ? s.success : sess.status === 'in-progress' ? s.accent : s.text3,
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{sess.name}</div>
                            {sess.notes && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{sess.notes}</div>}
                          </div>
                          <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                            {sess.date ? new Date(sess.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </div>
                          <span style={{
                            font: `500 10px ${s.FONT}`, textTransform: 'capitalize',
                            padding: '2px 8px', borderRadius: 100,
                            background: sess.status === 'completed' ? s.successBg : sess.status === 'in-progress' ? s.accentLight : s.dark ? '#333' : '#F1F5F9',
                            color: sess.status === 'completed' ? s.success : sess.status === 'in-progress' ? s.accent : s.text3,
                          }}>
                            {sess.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }) : (
                  <div style={{ ...s.cardStyle, padding: 40, textAlign: 'center' }}>
                    <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, marginBottom: 12 }}>No training programs assigned</div>
                    <button style={s.pillAccent}>Assign Program</button>
                  </div>
                )}
              </div>
            )}

            {/* MESSAGES */}
            {detailTab === 'messages' && (
              <div>
                <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Messages</div>
                <div style={{ ...s.cardStyle, padding: 40, textAlign: 'center' }}>
                  <div style={{ font: `400 40px`, marginBottom: 12 }}>💬</div>
                  <div style={{ font: `500 15px ${s.FONT}`, color: s.text, marginBottom: 6 }}>Message thread with {c.firstName}</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text3, marginBottom: 20 }}>Send session reminders, check-ins, and encouragement directly to this client.</div>
                  <button style={s.pillCta}>Start Conversation</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.HEADING}`, color: s.text, margin: 0 }}>Clients</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '4px 0 0' }}>
            {patients.length} total — {patients.filter(p => daysSince(p.lastVisit) < 7).length} active this week
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search clients by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...s.input, maxWidth: isMobile ? '100%' : 480 }}
        />
      </div>

      {/* Filter pills + Sort + View toggle */}
      <div className="members-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_PILLS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                font: `500 12px ${s.FONT}`, transition: 'all 0.2s',
                background: filter === f ? s.accent : s.dark ? s.surfaceAlt : s.surfaceAlt,
                color: filter === f ? s.accentText : s.text2,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ ...s.input, width: 'auto', padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 0, background: s.dark ? s.surfaceAlt : s.surfaceAlt, borderRadius: 8, overflow: 'hidden' }}>
              {['card', 'table'].map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  style={{
                    padding: '7px 14px', background: viewMode === v ? s.surface : 'transparent',
                    border: 'none', font: `500 11px ${s.FONT}`, color: viewMode === v ? s.text : s.text3,
                    cursor: 'pointer', borderRadius: viewMode === v ? 8 : 0,
                    boxShadow: viewMode === v ? s.shadow : 'none', textTransform: 'capitalize',
                  }}
                >
                  {v === 'card' ? 'Cards' : 'Table'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      {search && (
        <div style={{ font: `400 13px ${s.FONT}`, color: s.text3, marginBottom: 12 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {filtered.map((client, idx) => (
            <ClientCard key={client.id} client={client} idx={idx} />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div style={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                {['Client', 'Membership', 'Goal', 'Last Session', 'Sessions', 'Spent'].map((h, i) => (
                  <th
                    key={h}
                    className={i >= 3 ? 'members-hide-mobile' : ''}
                    style={{ padding: '12px 16px', font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => <ClientRow key={client.id} client={client} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{search || filter !== 'All' ? '\uD83D\uDD0D' : '\uD83D\uDC4B'}</div>
          <div style={{ font: `500 15px ${s.FONT}`, color: s.text, marginBottom: 4 }}>
            {search || filter !== 'All' ? 'No clients match your filters' : 'No clients yet'}
          </div>
          {(search || filter !== 'All') ? (
            <button onClick={() => { setSearch(''); setFilter('All'); }} style={{ ...s.pillGhost, fontSize: 12, marginTop: 8 }}>Clear Filters</button>
          ) : (
            <button onClick={() => {}} style={{ ...s.pillAccent, marginTop: 12 }}>Add Your First Client</button>
          )}
        </div>
      )}

      {/* Client Detail Panel */}
      {selectedId && <ClientDetail />}

      <style>{`
        @media (max-width: 768px) {
          .members-controls { flex-direction: column !important; align-items: stretch !important; }
          .members-hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
