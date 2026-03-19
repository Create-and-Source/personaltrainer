import { useState, useEffect, useMemo } from 'react';
import { useStyles } from '../theme';
import { getClassPackages, addClassPackage, updateClassPackage, deleteClassPackage, getPatients, getServices, getProviders, subscribe } from '../data/store';

export default function ClassPackages() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('plans');
  const [form, setForm] = useState({ patientId: '', name: '', providerId: 'PRV-1', sessions: [] });
  const [sessionForm, setSessionForm] = useState({ serviceId: '', name: '', date: '', notes: '' });

  const plans = getClassPackages();
  const patients = getPatients();
  const services = getServices();
  const providers = getProviders();
  const today = new Date().toISOString().slice(0, 10);

  const getProgress = (plan) => {
    const done = plan.sessions.filter(se => se.status === 'completed').length;
    return { done, total: plan.sessions.length, pct: plan.sessions.length > 0 ? Math.round((done / plan.sessions.length) * 100) : 0 };
  };

  const getPlanStatus = (plan) => {
    const prog = getProgress(plan);
    if (prog.pct === 100) return 'completed';
    if (plan.sessions.some(se => se.status === 'in-progress')) return 'active';
    return 'upcoming';
  };

  const allSessions = useMemo(() => {
    const sessions = [];
    plans.forEach(plan => {
      const prov = providers.find(p => p.id === plan.providerId);
      plan.sessions.forEach((ses, idx) => {
        sessions.push({
          ...ses, planId: plan.id, planName: plan.name,
          patientName: plan.patientName, patientId: plan.patientId,
          providerName: prov?.name?.split(',')[0] || 'Trainer',
          providerId: plan.providerId, sessionIdx: idx,
        });
      });
    });
    return sessions.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  }, [plans, providers]);

  const upcomingSessions = allSessions.filter(se => se.status !== 'completed' && se.date >= today).slice(0, 20);
  const todaySessions = allSessions.filter(se => se.date === today);

  const filtered = plans.filter(plan => {
    if (search) {
      const q = search.toLowerCase();
      if (!plan.patientName?.toLowerCase().includes(q) && !plan.name?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all') {
      const status = getPlanStatus(plan);
      if (statusFilter !== status) return false;
    }
    return true;
  });

  const activePlans = plans.filter(p => getPlanStatus(p) === 'active').length;
  const completedPlans = plans.filter(p => getPlanStatus(p) === 'completed').length;
  const totalSessions = plans.reduce((sum, p) => sum + p.sessions.length, 0);
  const completedSessions = plans.reduce((sum, p) => sum + p.sessions.filter(se => se.status === 'completed').length, 0);

  const openNew = () => { setEditPlan(null); setForm({ patientId: '', name: '', providerId: 'PRV-1', sessions: [] }); setShowForm(true); };
  const openEdit = (plan) => { setEditPlan(plan); setForm({ patientId: plan.patientId, name: plan.name, providerId: 'PRV-1', sessions: [...plan.sessions] }); setShowForm(true); };

  const addSession = () => {
    if (!sessionForm.serviceId) return;
    const svc = services.find(sv => sv.id === sessionForm.serviceId);
    setForm({ ...form, sessions: [...form.sessions, { ...sessionForm, name: sessionForm.name || svc?.name || 'Class', status: 'upcoming' }] });
    setSessionForm({ serviceId: '', name: '', date: '', notes: '' });
  };

  const removeSession = (idx) => setForm({ ...form, sessions: form.sessions.filter((_, i) => i !== idx) });

  const handleSave = () => {
    if (!form.patientId || !form.name) return;
    const pat = patients.find(p => p.id === form.patientId);
    const data = { ...form, patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown' };
    if (editPlan) updateClassPackage(editPlan.id, data);
    else addClassPackage(data);
    setShowForm(false);
  };

  const toggleSessionStatus = (planId, idx) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const sessions = [...plan.sessions];
    const current = sessions[idx].status;
    sessions[idx].status = current === 'completed' ? 'upcoming' : current === 'upcoming' ? 'in-progress' : 'completed';
    updateClassPackage(planId, { sessions });
  };

  const statusColor = (status) => status === 'completed' ? s.success : status === 'active' || status === 'in-progress' ? s.accent : s.text3;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 600, color: s.text, marginBottom: 6, letterSpacing: '-0.3px' }}>Training Programs</h1>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>Multi-session client programs -- track every step of the journey</p>
        </div>
        <button onClick={openNew} style={s.pillAccent}>+ New Program</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Active Programs', value: activePlans, color: s.accent },
          { label: 'Completed', value: completedPlans, color: s.success },
          { label: 'Sessions Done', value: `${completedSessions}/${totalSessions}`, color: s.text },
          { label: 'Today', value: todaySessions.length, color: todaySessions.length > 0 ? s.accent : s.text3 },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '18px 20px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: s.FONT, fontSize: 26, fontWeight: 600, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member or package..." style={{ ...s.input, maxWidth: 240 }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...s.input, width: 'auto', cursor: 'pointer' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 0, background: s.surfaceAlt, borderRadius: 10, overflow: 'hidden' }}>
          {[['plans', 'Programs'], ['timeline', 'Timeline']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 18px', background: view === v ? s.surface : 'transparent', border: 'none',
              fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: view === v ? s.text : s.text3, cursor: 'pointer',
              borderRadius: view === v ? 10 : 0, boxShadow: view === v ? s.shadow : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* PACKAGES VIEW */}
      {view === 'plans' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((plan) => {
            const prog = getProgress(plan);
            const prov = providers.find(p => p.id === plan.providerId);
            const expanded = expandedId === plan.id;
            const planStatus = getPlanStatus(plan);
            const nextSession = plan.sessions.find(se => se.status !== 'completed');

            return (
              <div key={plan.id} style={{ ...s.cardStyle, overflow: 'hidden' }}>
                {/* Header */}
                <div onClick={() => setExpandedId(expanded ? null : plan.id)} style={{
                  padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: s.accent, flexShrink: 0 }}>
                      {plan.patientName?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text }}>{plan.name}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 100, fontFamily: s.FONT, fontSize: 9, fontWeight: 500, textTransform: 'uppercase',
                          background: planStatus === 'completed' ? s.successBg : planStatus === 'active' ? s.accentLight : s.borderLight,
                          color: statusColor(planStatus),
                        }}>{planStatus}</span>
                      </div>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>
                        {plan.patientName} -- {prov?.name?.split(',')[0] || 'Trainer'}
                        {nextSession?.date && <span style={{ color: s.text3 }}> -- Next: {new Date(nextSession.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    {/* Progress ring */}
                    <div style={{ position: 'relative', width: 44, height: 44 }}>
                      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="22" cy="22" r="18" fill="none" stroke={s.borderLight} strokeWidth="3" />
                        <circle cx="22" cy="22" r="18" fill="none" stroke={statusColor(planStatus)} strokeWidth="3"
                          strokeDasharray={`${prog.pct * 1.13} 113`} strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: s.MONO, fontSize: 11, fontWeight: 600, color: s.text }}>
                        {prog.pct}%
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round"
                      style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Expanded sessions */}
                {expanded && (
                  <div style={{ borderTop: `1px solid ${s.borderLight}` }}>
                    {plan.sessions.map((ses, idx) => {
                      const isToday = ses.date === today;
                      return (
                        <div key={idx} style={{
                          padding: '14px 24px', borderBottom: `1px solid ${s.borderLight}`,
                          display: 'flex', alignItems: 'center', gap: 14,
                          background: isToday ? s.accentLight : 'transparent',
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, width: 32 }}>
                            <button onClick={() => toggleSessionStatus(plan.id, idx)} style={{
                              width: 28, height: 28, borderRadius: '50%',
                              border: `2px solid ${ses.status === 'completed' ? s.success : ses.status === 'in-progress' ? s.accent : s.borderLight}`,
                              background: ses.status === 'completed' ? s.success : 'transparent', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0,
                              transition: 'all 0.2s',
                            }}>
                              {ses.status === 'completed' && '\u2713'}
                              {ses.status === 'in-progress' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent }} />}
                            </button>
                            {idx < plan.sessions.length - 1 && (
                              <div style={{ width: 2, height: 16, background: ses.status === 'completed' ? s.success + '40' : s.borderLight, borderRadius: 1 }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily: s.FONT, fontSize: 13, fontWeight: 500,
                              color: ses.status === 'completed' ? s.text2 : s.text,
                              textDecoration: ses.status === 'completed' ? 'line-through' : 'none',
                            }}>{ses.name}</div>
                            {ses.notes && <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, marginTop: 1 }}>{ses.notes}</div>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            {isToday && <span style={{ padding: '2px 8px', borderRadius: 100, background: s.accent, color: s.accentText, fontFamily: s.FONT, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>Today</span>}
                            <span style={{ fontFamily: s.MONO, fontSize: 12, color: isToday ? s.accent : s.text3, minWidth: 50, textAlign: 'right' }}>
                              {ses.date ? new Date(ses.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ padding: '14px 24px', display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(plan)} style={{ ...s.pillOutline, padding: '6px 14px', fontSize: 11 }}>Edit Program</button>
                      <button onClick={() => { if (confirm('Delete this program?')) deleteClassPackage(plan.id); }} style={{ ...s.pillGhost, padding: '6px 14px', fontSize: 11, color: s.danger }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center' }}>
              <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, marginBottom: 12 }}>No programs match your filters</div>
              <button onClick={openNew} style={s.pillAccent}>Create Program</button>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE VIEW */}
      {view === 'timeline' && (
        <div>
          <div style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text, marginBottom: 16 }}>Upcoming Sessions</div>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: s.borderLight, borderRadius: 1 }} />
            {upcomingSessions.map((ses, idx) => {
              const isToday = ses.date === today;
              const isTomorrow = ses.date === new Date(Date.now() + 86400000).toISOString().slice(0, 10);
              return (
                <div key={`${ses.planId}-${ses.sessionIdx}`} style={{ display: 'flex', gap: 16, marginBottom: 12, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -20, top: 16, width: 10, height: 10, borderRadius: '50%',
                    background: isToday ? s.accent : ses.status === 'in-progress' ? s.accent : s.borderLight,
                    border: isToday ? `2px solid ${s.accent}40` : 'none',
                    boxShadow: isToday ? `0 0 8px ${s.accent}40` : 'none',
                  }} />
                  <div style={{ width: 56, flexShrink: 0, textAlign: 'center', paddingTop: 8 }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: isToday ? s.accent : s.text }}>
                      {new Date(ses.date + 'T12:00:00').getDate()}
                    </div>
                    <div style={{ fontFamily: s.MONO, fontSize: 9, fontWeight: 500, color: s.text3, textTransform: 'uppercase' }}>
                      {new Date(ses.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{
                    ...s.cardStyle, flex: 1, padding: '14px 18px',
                    borderLeft: `3px solid ${isToday ? s.accent : ses.status === 'in-progress' ? s.accent : s.borderLight}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>{ses.name}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isToday && <span style={{ padding: '2px 8px', borderRadius: 100, background: s.accent, color: s.accentText, fontFamily: s.FONT, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>Today</span>}
                        {isTomorrow && <span style={{ padding: '2px 8px', borderRadius: 100, background: s.warningBg, color: s.warning, fontFamily: s.FONT, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>Tomorrow</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}>{ses.patientName} -- {ses.planName}</div>
                    <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, marginTop: 2 }}>
                      {ses.providerName}{ses.notes && <span> -- {ses.notes}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {upcomingSessions.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: s.FONT, fontSize: 13, color: s.text3 }}>No upcoming sessions</div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowForm(false)}>
          <div style={{ background: s.surface, borderRadius: 20, padding: 32, maxWidth: 600, width: '90%', boxShadow: s.shadowLg, maxHeight: '95vh', overflowY: 'auto', border: `1px solid ${s.border}` }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: s.text, marginBottom: 24 }}>{editPlan ? 'Edit Training Program' : 'New Training Program'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Client</label>
                <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select client...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Program Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} placeholder="e.g., 12-Week Muscle Builder" />
              </div>
            </div>

            <div style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 12 }}>Sessions ({form.sessions.length})</div>
            {form.sessions.map((ses, idx) => (
              <div key={idx} style={{ padding: '10px 14px', background: s.surfaceAlt, borderRadius: 10, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text }}>{ses.name}</div>
                  <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>{ses.date || 'TBD'}{ses.notes ? ` -- ${ses.notes}` : ''}</div>
                </div>
                <button onClick={() => removeSession(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.danger, fontSize: 16 }}>x</button>
              </div>
            ))}

            <div style={{ padding: 14, background: s.surfaceAlt, borderRadius: 12, border: `1px dashed ${s.borderLight}`, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...s.label, fontSize: 10 }}>Service</label>
                  <select value={sessionForm.serviceId} onChange={e => { const svc = services.find(sv => sv.id === e.target.value); setSessionForm({ ...sessionForm, serviceId: e.target.value, name: svc?.name || '' }); }} style={{ ...s.input, fontSize: 12, padding: '8px 10px', cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {services.map(sv => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...s.label, fontSize: 10 }}>Date</label>
                  <input type="date" value={sessionForm.date} onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })} style={{ ...s.input, fontSize: 12, padding: '8px 10px' }} />
                </div>
                <div>
                  <label style={{ ...s.label, fontSize: 10 }}>Session Name</label>
                  <input value={sessionForm.name} onChange={e => setSessionForm({ ...sessionForm, name: e.target.value })} style={{ ...s.input, fontSize: 12, padding: '8px 10px' }} placeholder="Override name" />
                </div>
                <div>
                  <label style={{ ...s.label, fontSize: 10 }}>Notes</label>
                  <input value={sessionForm.notes} onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })} style={{ ...s.input, fontSize: 12, padding: '8px 10px' }} placeholder="Optional" />
                </div>
              </div>
              <button onClick={addSession} style={{ ...s.pillOutline, padding: '6px 14px', fontSize: 11, marginTop: 10 }}>+ Add Session</button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSave} style={s.pillAccent}>{editPlan ? 'Save Changes' : 'Create Program'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
