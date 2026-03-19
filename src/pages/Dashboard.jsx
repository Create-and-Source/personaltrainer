import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, getAppointments, getRetentionAlerts, getServices, getProviders, getSettings, subscribe } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

/* ── Icon helpers ── */
function CalendarIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function DollarIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  );
}
function UsersIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function AlertIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/* ── Mini Sparkline ── */
function MiniSparkline({ accent, data }) {
  const points = data || [42, 58, 35, 72, 65, 88, 76];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 200, h = 56, padY = 8;
  const coords = points.map((v, i) => ({
    x: (i / (points.length - 1)) * w,
    y: padY + ((max - v) / range) * (h - padY * 2),
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  const gradId = `sparkGrad_${accent.replace('#', '')}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', width: '100%', maxWidth: w }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`}/>
      <path d={pathD} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3.5 : 0}
          fill={accent} stroke="none"/>
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   MOBILE: "Today" View
═══════════════════════════════════════════ */
function MobileTodayView({ s, nav, settings, patients, appointments, services }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments
    .filter(a => a.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyStr = thirtyDaysAgo.toISOString().slice(0, 10);
  const needsAttention = patients.filter(p => !p.lastVisit || p.lastVisit < thirtyStr);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const formatTime = (time) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const statusColors = {
    confirmed: { color: s.success, bg: s.successBg },
    pending: { color: s.warning, bg: s.warningBg },
    completed: { color: s.text3, bg: s.surfaceAlt },
  };

  return (
    <div style={{ paddingTop: 4 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text,
          margin: '0 0 4px', letterSpacing: '-0.5px',
        }}>
          Hey {settings.founder?.split(' ')[0] || 'Marcus'} {'\u{1F44B}'}
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 400, color: s.text2, margin: 0 }}>
          {dateStr}
        </p>
      </div>

      {/* Today's Sessions */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: s.MONO, fontSize: 11, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: s.text3, marginBottom: 12,
        }}>
          Today's Sessions &middot; {todayAppts.length}
        </div>

        {todayAppts.length === 0 ? (
          <div style={{
            ...s.cardStyle, padding: '40px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{'\u2600\uFE0F'}</div>
            <div style={{ fontFamily: s.FONT, fontSize: 16, fontWeight: 500, color: s.text, marginBottom: 4 }}>
              No sessions today
            </div>
            <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 400, color: s.text3 }}>
              Enjoy the rest!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayAppts.map(a => {
              const svc = services.find(sv => sv.id === a.serviceId);
              const st = statusColors[a.status] || statusColors.completed;
              return (
                <div key={a.id} onClick={() => nav('/admin/schedule')} style={{
                  ...s.cardStyle, padding: '18px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  {/* Time block */}
                  <div style={{
                    width: 54, height: 54, borderRadius: 14, background: s.accentLight,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ fontFamily: s.MONO, fontSize: 15, fontWeight: 700, color: s.accent, lineHeight: 1.1 }}>
                      {formatTime(a.time).split(' ')[0]}
                    </div>
                    <div style={{ fontFamily: s.MONO, fontSize: 9, fontWeight: 500, color: s.accent, opacity: 0.7 }}>
                      {formatTime(a.time).split(' ')[1]}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 15, fontWeight: 600, color: s.text, marginBottom: 2 }}>
                      {a.patientName}
                    </div>
                    <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 400, color: s.text2 }}>
                      {svc?.name || 'Session'}
                    </div>
                  </div>
                  {/* Status badge */}
                  <span style={{
                    padding: '4px 10px', borderRadius: 112,
                    fontFamily: s.FONT, fontSize: 10, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    background: st.bg, color: st.color, flexShrink: 0,
                  }}>
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access Grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: s.MONO, fontSize: 11, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: s.text3, marginBottom: 12,
        }}>
          Quick Access
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Workouts', path: '/admin/workouts', emoji: '\u{1F4AA}' },
            { label: 'Programs', path: '/admin/classes', emoji: '\u{1F4CB}' },
            { label: 'Progress', path: '/admin/progress', emoji: '\u{1F4C8}' },
            { label: 'Nutrition', path: '/admin/nutrition', emoji: '\u{1F957}' },
            { label: 'Habits', path: '/admin/habits', emoji: '\u{1F525}' },
            { label: 'Challenges', path: '/admin/challenges', emoji: '\u{1F3C6}' },
            { label: 'Billing', path: '/admin/memberships', emoji: '\u{1F4B3}' },
            { label: 'Settings', path: '/admin/settings', emoji: '\u2699\uFE0F' },
          ].map(item => (
            <button key={item.path} onClick={() => nav(item.path)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '14px 4px', borderRadius: 14,
              border: `1px solid ${s.border}`,
              background: s.surface, cursor: 'pointer',
              boxShadow: s.shadow, transition: 'all 0.15s ease',
            }}>
              <span style={{ fontSize: 22 }}>{item.emoji}</span>
              <span style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 500, color: s.text2 }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: s.MONO, fontSize: 11, fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: s.text3, marginBottom: 12,
          }}>
            Needs Attention &middot; {needsAttention.length}
          </div>
          <div style={{
            display: 'flex', gap: 14, overflowX: 'auto',
            WebkitOverflowScrolling: 'touch', paddingBottom: 8,
          }}>
            {needsAttention.slice(0, 10).map(p => (
              <div key={p.id} onClick={() => nav(`/admin/members?client=${p.id}`)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: 'pointer', flexShrink: 0, minWidth: 60,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: getAvatarGradient(`${p.firstName} ${p.lastName}`),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: '#FFFFFF',
                  border: `2px solid ${s.danger}30`,
                }}>
                  {p.firstName?.[0]}{p.lastName?.[0]}
                </div>
                <span style={{ fontFamily: s.FONT, fontSize: 11, fontWeight: 500, color: s.text2, textAlign: 'center' }}>
                  {p.firstName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DESKTOP: KPI Dashboard
═══════════════════════════════════════════ */
export default function Dashboard() {
  const s = useStyles();
  const nav = useNavigate();
  const [, setTick] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 860);

  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const patients = getPatients();
  const appointments = getAppointments();
  const alerts = getRetentionAlerts();
  const services = getServices();
  const providers = getProviders();
  const settings = getSettings();

  if (isMobile) {
    return <MobileTodayView s={s} nav={nav} settings={settings} patients={patients} appointments={appointments} services={services} />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.date === today);
  const confirmedToday = todayAppts.filter(a => a.status === 'confirmed').length;
  const pendingToday = todayAppts.filter(a => a.status === 'pending').length;

  const thisMonth = today.slice(0, 7);
  const monthAppts = appointments.filter(a => a.date?.startsWith(thisMonth) && a.status === 'completed');
  const monthRevenue = monthAppts.reduce((sum, a) => {
    const svc = services.find(sv => sv.id === a.serviceId);
    return sum + (svc?.price || 0);
  }, 0);

  const newPatientsMonth = patients.filter(p => p.createdAt?.startsWith(thisMonth)).length;
  const pendingAlerts = alerts.filter(a => a.status === 'pending');

  const upcoming = appointments
    .filter(a => a.date >= today && a.status !== 'completed')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 8);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const formatTime = (time) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const kpiIcons = [
    <CalendarIcon color={s.accent} />,
    <DollarIcon color={s.accent} />,
    <UsersIcon color={s.accent} />,
    <AlertIcon color={s.accent} />,
  ];

  const kpis = [
    {
      label: "Today's Sessions",
      value: todayAppts.length,
      sub: `${confirmedToday} confirmed, ${pendingToday} pending`,
    },
    {
      label: 'Monthly Revenue',
      value: fmt(monthRevenue),
      sub: `${monthAppts.length} completed sessions`,
    },
    {
      label: 'Active Clients',
      value: patients.length,
      sub: `${newPatientsMonth} new this month`,
    },
    {
      label: 'Retention Alerts',
      value: pendingAlerts.length,
      sub: pendingAlerts.length > 0 ? `${pendingAlerts.filter(a => a.priority === 'high').length} high priority` : 'All caught up',
    },
  ];

  const statusColors = {
    confirmed: { color: s.success, bg: s.successBg },
    pending: { color: s.warning, bg: s.warningBg },
    completed: { color: s.text3, bg: s.surfaceAlt },
  };

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: s.HEADING, fontSize: 28, fontWeight: 600, color: s.text,
          margin: '0 0 4px', letterSpacing: '-0.3px',
        }}>
          Hey {settings.founder?.split(' ')[0] || 'Marcus'}
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 400, color: s.text2, margin: 0 }}>
          {dateStr}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28,
      }}>
        {kpis.map((k, idx) => (
          <div key={k.label} style={{
            ...s.cardStyle, padding: '22px 20px', cursor: 'default',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: s.accentLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              {kpiIcons[idx]}
            </div>
            <div style={{
              fontFamily: s.FONT, fontSize: 11, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: s.text3, marginBottom: 6,
            }}>
              {k.label}
            </div>
            <div style={{
              fontFamily: s.HEADING, fontSize: 28, fontWeight: 600, color: s.text,
              marginBottom: 4, letterSpacing: '-0.3px',
            }}>
              {k.value}
            </div>
            <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 400, color: s.text2 }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Sessions + Right column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 20 }}>

        {/* Upcoming Sessions */}
        <div style={{ ...s.cardStyle, overflow: 'hidden' }}>
          <div style={{
            padding: '18px 22px', borderBottom: `1px solid ${s.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: s.FONT, fontSize: 15, fontWeight: 600, color: s.text }}>
              Upcoming Sessions
            </span>
            <button onClick={() => nav('/admin/schedule')} style={{
              ...s.pillGhost, padding: '5px 14px', fontSize: 11,
            }}>
              View All
            </button>
          </div>

          <div style={{ padding: '6px 10px' }}>
            {upcoming.length === 0 ? (
              <div style={{
                padding: 48, textAlign: 'center',
                fontFamily: s.FONT, fontSize: 13, fontWeight: 400, color: s.text3,
              }}>
                No upcoming sessions
              </div>
            ) : upcoming.map(a => {
              const svc = services.find(sv => sv.id === a.serviceId);
              const prov = providers.find(p => p.id === a.providerId);
              const isToday = a.date === today;
              const st = statusColors[a.status] || statusColors.completed;

              return (
                <div key={a.id} onClick={() => nav('/admin/schedule')} style={{
                  padding: '14px 14px', borderRadius: 12, margin: '4px 0',
                  background: isToday ? s.accentLight : 'transparent',
                  border: `1px solid ${isToday ? s.accent + '20' : s.borderLight}`,
                  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}>
                  {/* Date tile */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: isToday ? s.accent : s.surfaceAlt,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isToday ? `0 4px 12px ${s.accent}25` : 'none',
                  }}>
                    <div style={{
                      fontFamily: s.HEADING, fontSize: 14, fontWeight: 600,
                      color: isToday ? s.accentText : s.text, lineHeight: 1,
                    }}>
                      {new Date(a.date + 'T12:00:00').getDate()}
                    </div>
                    <div style={{
                      fontFamily: s.MONO, fontSize: 9, fontWeight: 500,
                      color: isToday ? `${s.accentText}BB` : s.text3,
                      textTransform: 'uppercase',
                    }}>
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>
                      {a.patientName}
                    </div>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 400, color: s.text2 }}>
                      {svc?.name || 'Session'} {prov ? `\u2014 ${prov.name}` : ''}
                    </div>
                  </div>
                  {/* Time + status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontFamily: s.MONO, fontSize: 12, fontWeight: 500, color: s.text,
                      marginBottom: 4,
                    }}>
                      {formatTime(a.time)}
                    </div>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 112,
                      fontFamily: s.FONT, fontSize: 9, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      background: st.bg, color: st.color,
                    }}>
                      {a.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Revenue Sparkline */}
          <div style={{ ...s.cardStyle, padding: '22px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{
                  fontFamily: s.FONT, fontSize: 11, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: s.text3, marginBottom: 4,
                }}>
                  7-Day Revenue
                </div>
                <div style={{
                  fontFamily: s.HEADING, fontSize: 24, fontWeight: 600, color: s.text,
                  letterSpacing: '-0.3px',
                }}>
                  {fmt(monthRevenue)}
                </div>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 112,
                fontFamily: s.FONT, fontSize: 11, fontWeight: 500,
                background: s.successBg, color: s.success,
              }}>
                +12%
              </span>
            </div>
            <MiniSparkline accent={s.accent} />
          </div>

          {/* Quick Actions */}
          <div style={{ ...s.cardStyle, padding: '22px 22px' }}>
            <div style={{
              fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: s.text,
              marginBottom: 14,
            }}>
              Quick Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Book Session', path: '/admin/schedule', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                )},
                { label: 'New Client', path: '/admin/members', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                )},
                { label: 'Send Message', path: '/admin/inbox', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                )},
                { label: 'View Schedule', path: '/admin/schedule', icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                )},
              ].map(a => (
                <button key={a.label} onClick={() => nav(a.path)} style={{
                  padding: '14px 14px', borderRadius: 12, cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text,
                  background: s.surfaceAlt, border: `1px solid ${s.borderLight}`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent; e.currentTarget.style.color = s.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = s.borderLight; e.currentTarget.style.color = s.text; }}
                >
                  <span style={{ opacity: 0.6, display: 'flex' }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
