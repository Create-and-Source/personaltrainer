import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment, getPatients, getServices, getProviders, subscribe } from '../data/store';

export default function Schedule() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 860) return 'list';
    return 'day';
  }); // 'day' | 'week' | 'list' | 'grid'
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [form, setForm] = useState({ patientId: '', serviceId: '', providerId: 'PRV-1', date: '', time: '', duration: 30, notes: '' });
  const [gridDetail, setGridDetail] = useState(null);

  const appointments = getAppointments();
  const patients = getPatients();
  const services = getServices();
  const providers = getProviders();

  const filteredAppointments = appointments;
  const dayAppts = filteredAppointments.filter(a => a.date === currentDate).sort((a, b) => a.time.localeCompare(b.time));

  // Week view
  const weekStart = new Date(currentDate + 'T12:00:00');
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const navigate = (dir) => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + ((view === 'week' || view === 'grid') ? dir * 7 : dir));
    setCurrentDate(d.toISOString().slice(0, 10));
  };

  // Category colors for class grid
  const categoryColor = (cat) => {
    const colors = {
      Strength: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
      Cardio: { bg: '#F0FDF4', border: '#22C55E', text: '#166534' },
      Group: { bg: '#FDF2F8', border: '#EC4899', text: '#9D174D' },
      Performance: { bg: '#FFF7ED', border: '#F97316', text: '#9A3412' },
      Wellness: { bg: '#F0FDFA', border: '#14B8A6', text: '#115E59' },
      Private: { bg: '#F9FAFB', border: '#9CA3AF', text: '#374151' },
    };
    return colors[cat] || colors.Private;
  };

  // Capacity by category
  const getCapacity = (cat) => {
    if (cat === 'Strength') return 12;
    if (cat === 'Cardio' || cat === 'Group') return 20;
    if (cat === 'Private') return 8;
    if (cat === 'Performance' || cat === 'Wellness') return 15;
    return 12;
  };

  // Grid time slots: 5:30 AM through 8:00 PM in 30-min increments
  const gridTimeSlots = [];
  for (let h = 5; h <= 20; h++) {
    for (let m = (h === 5 ? 30 : 0); m < 60; m += 30) {
      if (h === 20 && m > 0) break;
      gridTimeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  const formatGridTime = (t) => {
    const [hh, mm] = t.split(':').map(Number);
    const suffix = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
    return `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
  };

  // Group appointments into class blocks for the grid
  const buildClassGrid = () => {
    const filteredAppts = appointments;
    // Group by date + time + serviceId to form "classes"
    const classMap = {};
    filteredAppts.forEach(a => {
      const key = `${a.date}|${a.time}|${a.serviceId}`;
      if (!classMap[key]) {
        const svc = services.find(sv => sv.id === a.serviceId);
        const prov = providers.find(p => p.id === a.providerId);
        classMap[key] = {
          date: a.date,
          time: a.time,
          serviceId: a.serviceId,
          serviceName: svc?.name || 'Class',
          category: svc?.category || 'Strength',
          instructor: prov?.name?.split(',')[0] || 'TBD',
          duration: a.duration || svc?.duration || 55,
          attendees: [],
        };
      }
      classMap[key].attendees.push(a);
    });
    return Object.values(classMap);
  };

  // Snap a time string to the nearest 30-min slot
  const snapToSlot = (time) => {
    const [h, m] = time.split(':').map(Number);
    const snapped = m < 15 ? 0 : m < 45 ? 30 : 0;
    const snapH = m >= 45 ? h + 1 : h;
    return `${String(snapH).padStart(2, '0')}:${String(snapped).padStart(2, '0')}`;
  };

  const openNew = (date, time) => {
    setEditAppt(null);
    setForm({ patientId: '', serviceId: '', providerId: 'PRV-1', date: date || currentDate, time: time || '09:00', duration: 30, notes: '' });
    setShowForm(true);
  };

  const openEdit = (appt) => {
    setEditAppt(appt);
    setForm({ patientId: appt.patientId, serviceId: appt.serviceId, providerId: appt.providerId, date: appt.date, time: appt.time, duration: appt.duration, notes: appt.notes || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    const pat = patients.find(p => p.id === form.patientId);
    const data = { ...form, patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown', status: 'confirmed' };
    if (editAppt) {
      updateAppointment(editAppt.id, data);
    } else {
      addAppointment(data);
    }
    setShowForm(false);
  };

  const handleStatusChange = (id, status) => {
    updateAppointment(id, { status });
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM-7PM

  const statusColor = (status) => {
    if (status === 'completed') return s.success;
    if (status === 'confirmed') return s.accent;
    if (status === 'pending') return s.warning;
    if (status === 'cancelled') return s.danger;
    return s.text3;
  };

  const ApptBlock = ({ appt, compact }) => {
    const svc = services.find(sv => sv.id === appt.serviceId);
    const prov = providers.find(p => p.id === appt.providerId);
    return (
      <div onClick={() => openEdit(appt)} style={{
        padding: compact ? '6px 8px' : '10px 14px', borderRadius: 8, cursor: 'pointer',
        background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', borderLeft: `3px solid ${statusColor(appt.status)}`,
        marginBottom: 4, transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
      >
        <div style={{ font: `500 ${compact ? 11 : 13}px ${s.FONT}`, color: s.text }}>{appt.patientName}</div>
        <div style={{ font: `400 ${compact ? 10 : 12}px ${s.FONT}`, color: s.text2 }}>
          {appt.time} — {svc?.name || 'Service'}{!compact && prov ? ` · ${prov.name.split(',')[0]}` : ''}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Schedule</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{dayAppts.length} sessions {view === 'day' || view === 'list' ? 'today' : 'this week'}</p>
        </div>
        <button onClick={() => openNew()} style={s.pillAccent}>+ Book Session</button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ ...s.pillGhost, padding: '6px 12px' }}>←</button>
          <span style={{ font: `500 15px ${s.FONT}`, color: s.text, minWidth: 180, textAlign: 'center' }}>
            {new Date(currentDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <button onClick={() => navigate(1)} style={{ ...s.pillGhost, padding: '6px 12px' }}>→</button>
          <button onClick={() => setCurrentDate(new Date().toISOString().slice(0, 10))} style={{ ...s.pillGhost, padding: '6px 12px', fontSize: 11 }}>Today</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="schedule-view-toggle" style={{ display: 'flex', gap: 0, background: 'rgba(0,0,0,0.04)', borderRadius: 8, overflow: 'hidden' }}>
            {['day', 'week', 'grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} className={v === 'grid' ? 'schedule-grid-btn' : ''} style={{
                padding: '7px 16px', background: view === v ? '#fff' : 'transparent', border: 'none',
                font: `500 12px ${s.FONT}`, color: view === v ? s.text : s.text3, cursor: 'pointer',
                borderRadius: view === v ? 8 : 0, boxShadow: view === v ? s.shadow : 'none',
                textTransform: 'capitalize',
              }}>{v === 'grid' ? 'Session Grid' : v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Day View */}
      {view === 'day' && (
        <div style={s.tableWrap}>
          {hours.map(h => {
            const hourAppts = dayAppts.filter(a => parseInt(a.time.split(':')[0]) === h);
            return (
              <div key={h} style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.03)', minHeight: 72 }}>
                <div className="schedule-time-col" style={{ width: 80, padding: '12px 16px', font: `400 12px ${s.MONO}`, color: s.text3, borderRight: '1px solid rgba(0,0,0,0.03)', flexShrink: 0 }}>
                  {h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                </div>
                <div style={{ flex: 1, padding: '8px 12px', cursor: 'pointer' }} onClick={() => openNew(currentDate, `${String(h).padStart(2, '0')}:00`)}>
                  {hourAppts.map(a => <ApptBlock key={a.id} appt={a} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="schedule-week-wrap" style={{ ...s.tableWrap, overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minWidth: 800 }}>
            {weekDays.map(day => {
              const isToday = day === new Date().toISOString().slice(0, 10);
              const dayA = filteredAppointments.filter(a => a.date === day).sort((a, b) => a.time.localeCompare(b.time));
              return (
                <div key={day} style={{ borderRight: '1px solid rgba(0,0,0,0.04)', minHeight: 300 }}>
                  <div style={{
                    padding: '12px 10px', borderBottom: '1px solid rgba(0,0,0,0.04)', textAlign: 'center',
                    background: isToday ? s.accentLight : 'transparent',
                  }}>
                    <div style={{ font: `400 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase' }}>
                      {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ font: `600 18px ${s.FONT}`, color: isToday ? s.accent : s.text }}>
                      {new Date(day + 'T12:00:00').getDate()}
                    </div>
                  </div>
                  <div style={{ padding: 6 }}>
                    {dayA.map(a => <ApptBlock key={a.id} appt={a} compact />)}
                    {dayA.length === 0 && (
                      <div onClick={() => openNew(day)} style={{ padding: 12, textAlign: 'center', font: `400 11px ${s.FONT}`, color: s.text3, cursor: 'pointer' }}>+</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div style={s.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                {['Time', 'Client', 'Session', 'Trainer', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayAppts.map(a => {
                const svc = services.find(sv => sv.id === a.serviceId);
                const prov = providers.find(p => p.id === a.providerId);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.MONO}`, color: s.text }}>{a.time}</td>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.FONT}`, color: s.text }}>{a.patientName}</td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{svc?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.FONT}`, color: s.text2 }}>{prov?.name?.split(',')[0] || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)} style={{ ...s.input, width: 'auto', padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: statusColor(a.status), fontWeight: 500 }}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(a)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 11 }}>Edit</button>
                        <button onClick={() => { if (confirm('Delete?')) deleteAppointment(a.id); }} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 11, color: s.danger }}>×</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {dayAppts.length === 0 && (
                <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No sessions for this day</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Class Grid View */}
      {view === 'grid' && (() => {
        const classes = buildClassGrid();
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Build week days starting Monday
        const ws = new Date(currentDate + 'T12:00:00');
        const dow = ws.getDay();
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        ws.setDate(ws.getDate() + mondayOffset);
        const gridWeekDays = Array.from({ length: 7 }, (_, i) => {
          const dd = new Date(ws);
          dd.setDate(dd.getDate() + i);
          return dd.toISOString().slice(0, 10);
        });

        // Build lookup: slot -> day -> classes[]
        const lookup = {};
        classes.forEach(cls => {
          const slot = snapToSlot(cls.time);
          if (!lookup[slot]) lookup[slot] = {};
          const dayIdx = gridWeekDays.indexOf(cls.date);
          if (dayIdx === -1) return;
          const dayKey = gridWeekDays[dayIdx];
          if (!lookup[slot][dayKey]) lookup[slot][dayKey] = [];
          lookup[slot][dayKey].push(cls);
        });

        // Filter to only time slots that have at least one class
        const activeSlots = gridTimeSlots.filter(slot => lookup[slot] && Object.keys(lookup[slot]).length > 0);
        const slotsToShow = activeSlots.length > 0 ? gridTimeSlots : gridTimeSlots.filter((_, i) => i % 2 === 0).slice(0, 12);

        return (
          <div className="schedule-grid-wrap" style={{ ...s.tableWrap, overflowX: 'auto' }}>
            <div style={{ minWidth: 900 }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 10px', font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>Time</div>
                {gridWeekDays.map((day, i) => {
                  const isToday = day === new Date().toISOString().slice(0, 10);
                  const dateNum = new Date(day + 'T12:00:00').getDate();
                  return (
                    <div key={day} style={{
                      padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.04)',
                      background: isToday ? s.accentLight : 'transparent',
                    }}>
                      <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{dayNames[i]}</div>
                      <div style={{ font: `600 16px ${s.FONT}`, color: isToday ? s.accent : s.text, marginTop: 2 }}>{dateNum}</div>
                    </div>
                  );
                })}
              </div>

              {/* Time rows */}
              {slotsToShow.map(slot => {
                const slotClasses = lookup[slot] || {};
                const hasAny = Object.keys(slotClasses).length > 0;
                return (
                  <div key={slot} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid rgba(0,0,0,0.03)', minHeight: hasAny ? 'auto' : 36 }}>
                    <div style={{ padding: '10px 10px', font: `400 11px ${s.MONO}`, color: s.text3, borderRight: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start' }}>
                      {formatGridTime(slot)}
                    </div>
                    {gridWeekDays.map(day => {
                      const cellClasses = slotClasses[day] || [];
                      const isToday = day === new Date().toISOString().slice(0, 10);
                      return (
                        <div key={day} style={{
                          padding: '4px 4px', borderLeft: '1px solid rgba(0,0,0,0.04)',
                          background: isToday ? 'rgba(0,0,0,0.01)' : 'transparent',
                          minHeight: 36,
                        }}>
                          {cellClasses.map((cls, ci) => {
                            const cc = categoryColor(cls.category);
                            const capacity = getCapacity(cls.category);
                            const enrolled = cls.attendees.length;
                            const spotsLeft = Math.max(0, capacity - enrolled);
                            return (
                              <div key={ci} onClick={() => setGridDetail(cls)} style={{
                                background: cc.bg, border: `1px solid ${cc.border}40`, borderLeft: `3px solid ${cc.border}`,
                                borderRadius: 8, padding: '8px 10px', marginBottom: 4, cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 2px 12px ${cc.border}20`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                              >
                                <div style={{ font: `600 12px ${s.FONT}`, color: cc.text, marginBottom: 2, lineHeight: 1.2 }}>{cls.serviceName}</div>
                                <div style={{ font: `400 10px ${s.FONT}`, color: cc.text + 'BB', marginBottom: 3 }}>{cls.instructor}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ font: `500 10px ${s.MONO}`, color: cc.text + '99' }}>{formatGridTime(cls.time)}</span>
                                  <span style={{
                                    font: `600 10px ${s.FONT}`, padding: '2px 6px', borderRadius: 100,
                                    background: spotsLeft <= 3 ? '#FEE2E2' : spotsLeft <= 6 ? '#FEF3C7' : `${cc.border}15`,
                                    color: spotsLeft <= 3 ? '#991B1B' : spotsLeft <= 6 ? '#92400E' : cc.text,
                                  }}>{spotsLeft} left</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Legend */}
              <div style={{ padding: '16px 12px', display: 'flex', flexWrap: 'wrap', gap: 16, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                {['Strength', 'Cardio', 'Group', 'Performance', 'Wellness', 'Private', 'Assessment'].map(cat => {
                  const cc = categoryColor(cat);
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: cc.border }} />
                      <span style={{ font: `400 11px ${s.FONT}`, color: s.text2 }}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Class Detail Popover */}
      {gridDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setGridDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            {(() => {
              const cls = gridDetail;
              const cc = categoryColor(cls.category);
              const capacity = getCapacity(cls.category);
              const enrolled = cls.attendees.length;
              const spotsLeft = Math.max(0, capacity - enrolled);
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 4, height: 36, borderRadius: 2, background: cc.border }} />
                    <div>
                      <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, margin: 0 }}>{cls.serviceName}</h3>
                      <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{cls.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Trainer</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{cls.instructor}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Time</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{formatGridTime(cls.time)} ({cls.duration}min)</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Date</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{new Date(cls.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Spots</div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: spotsLeft <= 3 ? '#DC2626' : s.text }}>{enrolled}/{capacity} enrolled ({spotsLeft} left)</div>
                    </div>
                  </div>
                  {/* Attendee list */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Enrolled Clients</div>
                    {cls.attendees.map((a, i) => (
                      <div key={i} style={{ padding: '6px 0', borderBottom: i < cls.attendees.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ font: `400 13px ${s.FONT}`, color: s.text }}>{a.patientName}</span>
                        <span style={{ font: `400 11px ${s.FONT}`, color: statusColor(a.status), textTransform: 'capitalize' }}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                  {/* Capacity bar */}
                  <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 100, height: 6, marginBottom: 20, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (enrolled / capacity) * 100)}%`, height: '100%', background: spotsLeft <= 3 ? '#DC2626' : cc.border, borderRadius: 100, transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => setGridDetail(null)} style={s.pillGhost}>Close</button>
                    <button onClick={() => { openNew(cls.date, cls.time); setGridDetail(null); }} style={s.pillAccent}>Book Session</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .schedule-grid-btn {
            display: none !important;
          }
          .schedule-view-toggle button {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }
          .schedule-week-wrap {
            -webkit-overflow-scrolling: touch;
          }
          .schedule-week-wrap::after {
            content: 'Scroll to see full week \\2192';
            display: block;
            text-align: center;
            font: 400 11px 'Inter', sans-serif;
            color: #999;
            padding: 8px 0 4px;
          }
          .schedule-time-col {
            width: 56px !important;
            padding: 10px 6px !important;
            font-size: 10px !important;
          }
          .schedule-grid-wrap {
            -webkit-overflow-scrolling: touch;
          }
          .schedule-grid-wrap::after {
            content: 'Scroll to see full week \\2192';
            display: block;
            text-align: center;
            font: 400 11px 'Inter', sans-serif;
            color: #999;
            padding: 8px 0 4px;
          }
        }
      `}</style>

      {/* Booking Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 520, width: '90%', boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 24 }}>{editAppt ? 'Edit Session' : 'Book Session'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Client</label>
                <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Session Type</label>
                <select value={form.serviceId} onChange={e => { const svc = services.find(sv => sv.id === e.target.value); setForm({ ...form, serviceId: e.target.value, duration: svc?.duration || 30 }); }} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select session...</option>
                  {services.map(sv => <option key={sv.id} value={sv.id}>{sv.name} ({sv.duration}min)</option>)}
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
                <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} style={s.input} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={s.label}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...s.input, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSave} style={s.pillAccent}>{editAppt ? 'Save Changes' : 'Book'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
