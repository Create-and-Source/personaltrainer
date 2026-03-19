import { useState, useEffect, useMemo } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment, getPatients, getServices, getProviders, subscribe } from '../data/store';

const ANIM_ID = 'schedule-anims-v2';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes schedFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes schedModalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
  `;
  document.head.appendChild(sheet);
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function Schedule() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [view, setView] = useState(() => isMobile ? 'list' : 'day');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [detailAppt, setDetailAppt] = useState(null);
  const [form, setForm] = useState({ patientId: '', serviceId: '', providerId: 'PRV-1', date: '', time: '', duration: 30, notes: '' });

  const appointments = getAppointments();
  const patients = getPatients();
  const services = getServices();
  const providers = getProviders();

  const dayAppts = useMemo(() =>
    appointments.filter(a => a.date === currentDate).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, currentDate]
  );

  // Week calculations
  const weekStart = useMemo(() => {
    const d = new Date(currentDate + 'T12:00:00');
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    }),
    [weekStart]
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6AM-9PM

  const navigate = (dir) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + (view === 'week' ? dir * 7 : dir));
    setCurrentDate(d.toISOString().slice(0, 10));
  };

  const statusColor = (status) => {
    if (status === 'completed') return s.success;
    if (status === 'confirmed') return s.accent;
    if (status === 'pending') return s.warning;
    if (status === 'cancelled') return s.danger;
    return s.text3;
  };

  const statusBg = (status) => {
    if (status === 'completed') return s.successBg;
    if (status === 'confirmed') return s.accentLight;
    if (status === 'pending') return s.warningBg;
    if (status === 'cancelled') return s.dangerBg;
    return s.surfaceAlt;
  };

  const openNew = (date, time) => {
    setEditAppt(null);
    setForm({ patientId: '', serviceId: '', providerId: 'PRV-1', date: date || currentDate, time: time || '09:00', duration: 60, notes: '' });
    setShowForm(true);
  };

  const openEdit = (appt) => {
    setEditAppt(appt);
    setForm({ patientId: appt.patientId, serviceId: appt.serviceId, providerId: appt.providerId, date: appt.date, time: appt.time, duration: appt.duration || 60, notes: appt.notes || '' });
    setShowForm(true);
    setDetailAppt(null);
  };

  const handleSave = () => {
    const pat = patients.find(p => p.id === form.patientId);
    const data = { ...form, patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown', status: editAppt?.status || 'confirmed' };
    if (editAppt) {
      updateAppointment(editAppt.id, data);
    } else {
      addAppointment(data);
    }
    setShowForm(false);
  };

  const handleStatusChange = (id, status) => {
    updateAppointment(id, { status });
    if (detailAppt?.id === id) setDetailAppt({ ...detailAppt, status });
  };

  // Get recent sessions for a client (for session detail)
  const getClientRecentSessions = (patientId) => {
    return appointments
      .filter(a => a.patientId === patientId && a.id !== detailAppt?.id)
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
      .slice(0, 3);
  };

  const formatTime12 = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  const dateLabel = (dateStr) => {
    if (dateStr === todayStr) return 'Today';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Count sessions for the current view
  const viewSessionCount = view === 'week'
    ? appointments.filter(a => weekDays.includes(a.date)).length
    : dayAppts.length;

  // ── Session Block (Day View) ──
  const SessionBlock = ({ appt }) => {
    const svc = services.find(sv => sv.id === appt.serviceId);
    return (
      <div
        onClick={() => setDetailAppt(appt)}
        style={{
          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
          background: s.surface, borderLeft: `3px solid ${statusColor(appt.status)}`,
          marginBottom: 6, boxShadow: s.shadow, transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = s.shadowMd; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = s.shadow; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: getAvatarGradient(appt.patientName || ''),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `600 11px ${s.HEADING}`, color: '#FFF', flexShrink: 0,
          }}>
            {getInitials(appt.patientName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `500 13px ${s.FONT}`, color: s.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {appt.patientName}
            </div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>
              {svc?.name || 'Session'} — {appt.duration || svc?.duration || 60}min
            </div>
          </div>
          <span style={{
            font: `500 10px ${s.FONT}`, padding: '3px 8px', borderRadius: 100,
            background: statusBg(appt.status), color: statusColor(appt.status),
            textTransform: 'capitalize', flexShrink: 0,
          }}>
            {appt.status}
          </span>
        </div>
      </div>
    );
  };

  // ── Compact Session Block (Week View) ──
  const CompactBlock = ({ appt }) => {
    const svc = services.find(sv => sv.id === appt.serviceId);
    return (
      <div
        onClick={() => setDetailAppt(appt)}
        style={{
          padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
          borderLeft: `3px solid ${statusColor(appt.status)}`,
          background: s.surface, marginBottom: 4, boxShadow: s.shadow,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = s.surfaceHover}
        onMouseLeave={e => e.currentTarget.style.background = s.surface}
      >
        <div style={{ font: `500 11px ${s.FONT}`, color: s.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {appt.patientName}
        </div>
        <div style={{ font: `400 10px ${s.FONT}`, color: s.text2 }}>
          {formatTime12(appt.time)} — {svc?.name?.split(' ')[0] || 'Session'}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="sched-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.HEADING}`, color: s.text, margin: 0 }}>Schedule</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, margin: '4px 0 0' }}>
            {viewSessionCount} session{viewSessionCount !== 1 ? 's' : ''} {view === 'week' ? 'this week' : view === 'day' ? 'today' : 'today'}
          </p>
        </div>
        <button onClick={() => openNew()} style={s.pillCta}>+ Book Session</button>
      </div>

      {/* Controls */}
      <div className="sched-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        {/* Date Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ ...s.pillGhost, padding: '6px 12px' }}>
            <span style={{ fontSize: 14 }}>&larr;</span>
          </button>
          <span style={{ font: `500 15px ${s.FONT}`, color: s.text, minWidth: isMobile ? 0 : 200, textAlign: 'center' }}>
            {view === 'week' ? (
              `${new Date(weekDays[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(weekDays[6] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            ) : (
              dateLabel(currentDate)
            )}
          </span>
          <button onClick={() => navigate(1)} style={{ ...s.pillGhost, padding: '6px 12px' }}>
            <span style={{ fontSize: 14 }}>&rarr;</span>
          </button>
          <button onClick={() => setCurrentDate(todayStr)} style={{ ...s.pillGhost, padding: '6px 12px', fontSize: 11 }}>Today</button>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 0, background: s.surfaceAlt, borderRadius: 8, overflow: 'hidden' }}>
          {(isMobile ? ['day', 'list'] : ['day', 'week', 'list']).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer',
                background: view === v ? s.surface : 'transparent',
                font: `500 12px ${s.FONT}`, color: view === v ? s.text : s.text3,
                borderRadius: view === v ? 8 : 0, boxShadow: view === v ? s.shadow : 'none',
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── DAY VIEW ── */}
      {view === 'day' && (
        <div style={{ ...s.cardStyle, overflow: 'hidden' }}>
          {hours.map(h => {
            const hourAppts = dayAppts.filter(a => parseInt(a.time.split(':')[0]) === h);
            const isCurrentHour = currentDate === todayStr && new Date().getHours() === h;
            return (
              <div key={h} style={{
                display: 'flex', borderBottom: `1px solid ${s.borderLight}`, minHeight: 72,
                background: isCurrentHour ? (s.dark ? 'rgba(14,122,130,0.04)' : 'rgba(14,122,130,0.02)') : 'transparent',
              }}>
                <div className="sched-time-col" style={{
                  width: 80, padding: '14px 16px', flexShrink: 0,
                  font: `400 12px ${s.MONO}`, color: isCurrentHour ? s.accent : s.text3,
                  borderRight: `1px solid ${s.borderLight}`,
                }}>
                  {h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                </div>
                <div
                  style={{ flex: 1, padding: '8px 12px', cursor: 'pointer', minHeight: 56 }}
                  onClick={() => { if (hourAppts.length === 0) openNew(currentDate, `${String(h).padStart(2, '0')}:00`); }}
                >
                  {hourAppts.map(a => <SessionBlock key={a.id} appt={a} />)}
                  {hourAppts.length === 0 && (
                    <div style={{
                      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `400 12px ${s.FONT}`, color: s.text3, opacity: 0.4,
                    }}>
                      +
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {view === 'week' && (
        <div style={{ ...s.cardStyle, overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minWidth: 800 }}>
            {weekDays.map(day => {
              const isToday = day === todayStr;
              const dayA = appointments.filter(a => a.date === day).sort((a, b) => a.time.localeCompare(b.time));
              const isSelected = day === currentDate;
              return (
                <div key={day} style={{ borderRight: `1px solid ${s.borderLight}`, minHeight: 340 }}>
                  {/* Day header */}
                  <div
                    onClick={() => { setCurrentDate(day); setView('day'); }}
                    style={{
                      padding: '12px 10px', borderBottom: `1px solid ${s.borderLight}`, textAlign: 'center',
                      background: isToday ? s.accentLight : 'transparent', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = s.surfaceHover; }}
                    onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{
                      font: `600 18px ${s.FONT}`, color: isToday ? s.accent : s.text,
                      width: 32, height: 32, borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? (s.dark ? 'rgba(14,122,130,0.2)' : 'rgba(14,122,130,0.1)') : 'transparent',
                    }}>
                      {new Date(day + 'T12:00:00').getDate()}
                    </div>
                    <div style={{ font: `500 10px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                      {dayA.length} session{dayA.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {/* Sessions */}
                  <div style={{ padding: 6 }}>
                    {dayA.map(a => <CompactBlock key={a.id} appt={a} />)}
                    {dayA.length === 0 && (
                      <div
                        onClick={() => openNew(day)}
                        style={{ padding: 16, textAlign: 'center', font: `400 12px ${s.FONT}`, color: s.text3, cursor: 'pointer', opacity: 0.5 }}
                      >
                        + Add
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div style={s.tableWrap}>
          <table className="sched-list-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                {['Time', 'Client', 'Session Type', 'Status', 'Actions'].map(h => (
                  <th
                    key={h}
                    className={h === 'Actions' ? 'sched-hide-mobile' : ''}
                    style={{ padding: '12px 16px', font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayAppts.map(a => {
                const svc = services.find(sv => sv.id === a.serviceId);
                return (
                  <tr
                    key={a.id}
                    onClick={() => setDetailAppt(a)}
                    style={{ borderBottom: `1px solid ${s.borderLight}`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = s.surfaceHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ font: `500 13px ${s.MONO}`, color: s.text }}>{formatTime12(a.time)}</div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{a.duration || svc?.duration || 60}min</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                          background: getAvatarGradient(a.patientName || ''),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          font: `600 11px ${s.HEADING}`, color: '#FFF',
                        }}>
                          {getInitials(a.patientName)}
                        </div>
                        <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{a.patientName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{svc?.name || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        font: `500 11px ${s.FONT}`, textTransform: 'capitalize',
                        padding: '3px 10px', borderRadius: 100,
                        background: statusBg(a.status), color: statusColor(a.status),
                      }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="sched-hide-mobile" style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(a)} style={{ ...s.pillGhost, padding: '4px 12px', fontSize: 11 }}>Edit</button>
                        <button
                          onClick={() => { if (confirm('Delete this session?')) deleteAppointment(a.id); }}
                          style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 11, color: s.danger }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {dayAppts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, marginBottom: 12 }}>No sessions scheduled for this day</div>
                    <button onClick={() => openNew()} style={s.pillAccent}>Book a Session</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SESSION DETAIL MODAL ── */}
      {detailAppt && (() => {
        const a = detailAppt;
        const svc = services.find(sv => sv.id === a.serviceId);
        const prov = providers.find(p => p.id === a.providerId);
        const client = patients.find(p => p.id === a.patientId);
        const recentSessions = getClientRecentSessions(a.patientId);

        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
            onClick={() => setDetailAppt(null)}
          >
            <div
              style={{
                background: s.surface, borderRadius: 20, maxWidth: 560, width: '95%',
                boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                animation: 'schedModalIn 0.25s ease',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px 24px 20px', borderBottom: `1px solid ${s.border}`,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 26,
                  background: getAvatarGradient(a.patientName || ''),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 16px ${s.HEADING}`, color: '#FFF', flexShrink: 0,
                }}>
                  {getInitials(a.patientName)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: `600 20px ${s.HEADING}`, color: s.text }}>{a.patientName}</div>
                  <div style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{svc?.name || 'Session'}</div>
                </div>
                <span style={{
                  font: `600 12px ${s.FONT}`, textTransform: 'capitalize',
                  padding: '5px 14px', borderRadius: 100,
                  background: statusBg(a.status), color: statusColor(a.status),
                }}>
                  {a.status}
                </span>
              </div>

              {/* Session Info Grid */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${s.border}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Date', value: new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) },
                    { label: 'Time', value: `${formatTime12(a.time)} (${a.duration || svc?.duration || 60}min)` },
                    { label: 'Session Type', value: svc?.name || '—' },
                    { label: 'Trainer', value: prov?.name?.split(',')[0] || 'Marcus Cole' },
                    { label: 'Category', value: svc?.category || '—' },
                    { label: 'Price', value: svc?.price ? `$${(svc.price / 100).toFixed(0)}` : 'N/A' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Info */}
              {client && (
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${s.border}` }}>
                  <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Client Info</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Goal</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{client.goals || 'Not set'}</div>
                    </div>
                    <div style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Membership</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{client.membershipTier || 'None'}</div>
                    </div>
                    <div style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Total Sessions</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{client.visitCount || 0}</div>
                    </div>
                    <div style={{ background: s.surfaceAlt, borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Favorite</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{client.favoriteClass || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent History */}
              {recentSessions.length > 0 && (
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${s.border}` }}>
                  <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Recent Sessions</div>
                  {recentSessions.map((rs, i) => {
                    const rsSvc = services.find(sv => sv.id === rs.serviceId);
                    return (
                      <div key={rs.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                        borderBottom: i < recentSessions.length - 1 ? `1px solid ${s.borderLight}` : 'none',
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: statusColor(rs.status), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ font: `400 12px ${s.FONT}`, color: s.text }}>{rsSvc?.name || 'Session'}</span>
                        </div>
                        <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>
                          {new Date(rs.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{
                          font: `500 10px ${s.FONT}`, textTransform: 'capitalize',
                          color: statusColor(rs.status),
                        }}>
                          {rs.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Notes */}
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${s.border}` }}>
                <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Notes</div>
                <div style={{ font: `400 13px ${s.FONT}`, color: a.notes ? s.text : s.text3, minHeight: 40 }}>
                  {a.notes || 'No notes for this session'}
                </div>
              </div>

              {/* Status Changer */}
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${s.border}` }}>
                <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Update Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['pending', 'confirmed', 'completed', 'cancelled'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(a.id, st)}
                      style={{
                        padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                        font: `500 12px ${s.FONT}`, textTransform: 'capitalize', transition: 'all 0.2s',
                        background: a.status === st ? statusColor(st) : statusBg(st),
                        color: a.status === st ? '#FFF' : statusColor(st),
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { if (confirm('Delete this session?')) { deleteAppointment(a.id); setDetailAppt(null); } }}
                  style={{ ...s.pillGhost, color: s.danger }}
                >
                  Delete
                </button>
                <button onClick={() => setDetailAppt(null)} style={s.pillGhost}>Close</button>
                <button onClick={() => openEdit(a)} style={s.pillAccent}>Edit Session</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── BOOKING MODAL ── */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: s.surface, borderRadius: 20, padding: '28px 28px 80px', maxWidth: 520, width: '95%',
              boxShadow: s.shadowLg, maxHeight: '95vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
              animation: 'schedModalIn 0.25s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ font: `600 20px ${s.HEADING}`, color: s.text, marginBottom: 24 }}>
              {editAppt ? 'Edit Session' : 'Book Session'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Client</label>
                <select
                  value={form.patientId}
                  onChange={e => setForm({ ...form, patientId: e.target.value })}
                  style={{ ...s.input, cursor: 'pointer' }}
                >
                  <option value="">Select client...</option>
                  {patients.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)).map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Session Type</label>
                <select
                  value={form.serviceId}
                  onChange={e => {
                    const svc = services.find(sv => sv.id === e.target.value);
                    setForm({ ...form, serviceId: e.target.value, duration: svc?.duration || 60 });
                  }}
                  style={{ ...s.input, cursor: 'pointer' }}
                >
                  <option value="">Select session type...</option>
                  {services.map(sv => (
                    <option key={sv.id} value={sv.id}>{sv.name} ({sv.duration}min) — ${(sv.price / 100).toFixed(0)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Time</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Duration (min)</label>
                <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 60 })} style={s.input} />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Session notes, client preferences, focus areas..."
                style={{ ...s.input, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={s.pillGhost}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={!form.patientId || !form.serviceId || !form.date || !form.time}
                style={{
                  ...s.pillCta,
                  opacity: (!form.patientId || !form.serviceId || !form.date || !form.time) ? 0.5 : 1,
                  cursor: (!form.patientId || !form.serviceId || !form.date || !form.time) ? 'not-allowed' : 'pointer',
                }}
              >
                {editAppt ? 'Save Changes' : 'Book Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sched-header { flex-direction: column !important; align-items: stretch !important; }
          .sched-controls { flex-direction: column !important; gap: 10px !important; }
          .sched-time-col { width: 60px !important; padding: 10px 8px !important; font-size: 10px !important; }
          .sched-hide-mobile { display: none !important; }
          .sched-list-table th, .sched-list-table td { padding: 10px 10px !important; }
        }
      `}</style>
    </div>
  );
}
