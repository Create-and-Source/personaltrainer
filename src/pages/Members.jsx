import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, addPatient, updatePatient, deletePatient, getAppointments, getServices, subscribe } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

/* --- inject member page keyframes once --- */
const MEM_ANIM_ID = 'members-premium-anims';
if (!document.getElementById(MEM_ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = MEM_ANIM_ID;
  sheet.textContent = `
    @keyframes memFadeInUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes memSlideIn {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .mem-card-hover {
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1) !important;
    }
    .mem-card-hover:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(var(--accent-rgb), 0.1), 0 4px 12px rgba(0,0,0,0.04) !important;
    }
    .mem-row-hover {
      transition: background 0.15s ease !important;
    }
    .mem-row-hover:hover {
      background: rgba(var(--accent-rgb), 0.03) !important;
    }
    .mem-filter-pill {
      transition: all 0.2s cubic-bezier(0.16,1,0.3,1) !important;
    }
    .mem-filter-pill:hover {
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(sheet);
}

const TIER_BADGE = {
  'Drop-in': null,
  '10-Session Pack': { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
  'Unlimited Monthly': { bg: '#FFFBEB', color: '#B8960C', border: '#FDE68A' },
  'Premium Monthly': { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

export default function Members() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('lastVisit');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', goals: '', notes: '', membershipTier: 'None' });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [detail, setDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 860);
  const [mobileDetail, setMobileDetail] = useState(null);
  const [addedClient, setAddedClient] = useState(null); // tracks newly added client for intake form UI
  const [intakeToast, setIntakeToast] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const members = getPatients();
  const appointments = getAppointments();
  const services = getServices();

  const filtered = members.filter(p => {
    const q = search.toLowerCase();
    const nameMatch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q);
    if (!nameMatch) return false;
    if (filter === 'All') return true;
    return p.membershipTier === filter;
  }).sort((a, b) => {
    if (sort === 'lastVisit') return (b.lastVisit || '').localeCompare(a.lastVisit || '');
    if (sort === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    if (sort === 'spent') return b.totalSpent - a.totalSpent;
    if (sort === 'visits') return b.visitCount - a.visitCount;
    return 0;
  });

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    if (selected) {
      updatePatient(selected.id, form);
      setShowForm(false);
      setSelected(null);
    } else {
      const newClient = addPatient({ ...form, totalSpent: 0, visitCount: 0, lastVisit: null });
      setAddedClient({ ...form, id: newClient.id });
    }
    setForm({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', goals: '', notes: '', membershipTier: 'None' });
  };

  const handleEdit = (p) => {
    setForm({ firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone, dob: p.dob || '', gender: p.gender || 'Female', goals: p.goals || p.allergies || '', notes: p.notes || '', membershipTier: p.membershipTier || 'None' });
    setSelected(p);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this client?')) {
      deletePatient(id);
      if (selected?.id === id) { setSelected(null); setShowForm(false); }
      if (detail?.id === id) setDetail(null);
    }
  };

  const memberClasses = (memberId) => appointments.filter(a => a.patientId === memberId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = members.filter(p => p.createdAt?.startsWith(thisMonth)).length;
  const avgSpend = members.length > 0 ? Math.round(members.reduce((sum, p) => sum + p.totalSpent, 0) / members.length) : 0;
  const activeMembers = members.filter(p => p.membershipTier && p.membershipTier !== 'None').length;

  const glass = {
    background: s.card,
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${s.borderLight}`,
    borderRadius: 18,
    boxShadow: s.shadow,
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
  };

  const filterOptions = ['All', 'Drop-in', '10-Session Pack', 'Unlimited Monthly', 'Premium Monthly'];
  const sortOptions = [
    { value: 'lastVisit', label: 'Last Session' },
    { value: 'name', label: 'Name' },
    { value: 'spent', label: 'Top Spenders' },
    { value: 'visits', label: 'Most Sessions' },
  ];

  // ═══ MOBILE CLIENT LIST ═══
  if (isMobile) {
    const mobileFiltered = members.filter(p => {
      const q = search.toLowerCase();
      return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q);
    }).sort((a, b) => {
      // Sort by next session date (soonest first), then last visit
      const aNext = appointments.filter(ap => ap.patientId === a.id && ap.date >= new Date().toISOString().slice(0, 10)).sort((x, y) => x.date.localeCompare(y.date))[0]?.date || 'zzzz';
      const bNext = appointments.filter(ap => ap.patientId === b.id && ap.date >= new Date().toISOString().slice(0, 10)).sort((x, y) => x.date.localeCompare(y.date))[0]?.date || 'zzzz';
      return aNext.localeCompare(bNext);
    });

    const getActivityStatus = (p) => {
      if (!p.lastVisit) return 'red';
      const daysSince = Math.floor((Date.now() - new Date(p.lastVisit + 'T12:00:00').getTime()) / 86400000);
      if (daysSince <= 7) return 'green';
      if (daysSince <= 30) return 'yellow';
      return 'red';
    };
    const statusColors = { green: '#16A34A', yellow: '#D97706', red: '#DC2626' };

    // Dark mobile color tokens
    const dm = {
      text: '#F5F5F7', text2: '#A0A0A8', text3: '#6B6B73',
      accent: '#4ADE80', accentBg: '#252529',
      card: '#1A1A1E', border: '#2A2A2E', bg: '#0D0D0F',
    };

    // Mobile full-screen detail view — dark
    if (mobileDetail) {
      const p = mobileDetail;
      const tier = TIER_BADGE[p.membershipTier || 'None'];
      const pClasses = memberClasses(p.id);
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 250, background: dm.bg,
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          animation: 'memMobileSlideIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {/* Top bar — dark */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 2, padding: '0 16px', height: 52,
            background: dm.bg, borderBottom: `1px solid ${dm.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button onClick={() => setMobileDetail(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: dm.accent,
              font: `500 14px ${s.FONT}`, display: 'flex', alignItems: 'center', gap: 4, padding: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Clients
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleEdit(p)} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 100, border: `1px solid ${dm.border}`, background: dm.card, color: dm.text2, cursor: 'pointer' }}>Edit</button>
              <button onClick={() => { handleDelete(p.id); setMobileDetail(null); }} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 100, border: '1px solid rgba(220,38,38,0.3)', background: dm.card, color: '#EF4444', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>

          {/* Profile header — dark */}
          <div style={{ padding: '24px 20px', textAlign: 'center', background: `linear-gradient(135deg, ${dm.card}, ${dm.bg})` }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
              background: `linear-gradient(135deg, ${dm.card}, ${dm.accent}18)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: `600 22px ${s.FONT}`, color: dm.accent, border: `3px solid ${dm.border}`,
            }}>
              {p.firstName[0]}{p.lastName[0]}
            </div>
            <div style={{ font: `600 20px ${s.FONT}`, color: dm.text, marginBottom: 4 }}>{p.firstName} {p.lastName}</div>
            {tier && (
              <span style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 100,
                font: `600 10px ${s.FONT}`, textTransform: 'uppercase',
                background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
              }}>{p.membershipTier}</span>
            )}
          </div>

          {/* Stats row — dark */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: dm.border, margin: '0 0 16px' }}>
            {[
              { label: 'Sessions', value: p.visitCount },
              { label: 'Spent', value: fmt(p.totalSpent) },
              { label: 'Last Session', value: p.lastVisit ? new Date(p.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---' },
            ].map(item => (
              <div key={item.label} style={{ background: dm.card, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: dm.text3, marginBottom: 4 }}>{item.label}</div>
                <div style={{ font: `600 16px ${s.FONT}`, color: dm.text }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Info — dark */}
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {[
                { label: 'Email', value: p.email },
                { label: 'Phone', value: p.phone },
                { label: 'DOB', value: p.dob || '---' },
                { label: 'Gender', value: p.gender },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: dm.text3, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: dm.text, wordBreak: 'break-word' }}>{f.value}</div>
                </div>
              ))}
            </div>
            {(p.goals || p.allergies) && (
              <div style={{
                padding: '10px 14px', background: dm.accentBg, borderRadius: 10, marginBottom: 16,
                font: `400 12px ${s.FONT}`, color: dm.accent, border: `1px solid ${dm.accent}30`,
              }}>
                Goals: {p.goals || p.allergies}
              </div>
            )}
            <div style={{ font: `600 14px ${s.FONT}`, color: dm.text, marginBottom: 10 }}>Recent Sessions</div>
            {pClasses.length === 0 ? (
              <div style={{ font: `400 12px ${s.FONT}`, color: dm.text3, padding: '8px 0' }}>No sessions yet</div>
            ) : pClasses.map(a => {
              const svc = services.find(sv => sv.id === a.serviceId);
              const statusColor = a.status === 'completed' ? '#4ADE80' : a.status === 'confirmed' ? '#60A5FA' : '#FBBF24';
              const statusBg = a.status === 'completed' ? 'rgba(74,222,128,0.12)' : a.status === 'confirmed' ? 'rgba(96,165,250,0.12)' : 'rgba(251,191,36,0.12)';
              return (
                <div key={a.id} style={{
                  padding: '10px 12px', marginBottom: 6, borderRadius: 10,
                  background: dm.card, border: `1px solid ${dm.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ font: `500 12px ${s.FONT}`, color: dm.text }}>{svc?.name || 'Session'}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: dm.text3 }}>
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 100,
                    font: `500 9px ${s.FONT}`, textTransform: 'uppercase', color: statusColor,
                    background: statusBg,
                  }}>{a.status}</span>
                </div>
              );
            })}
          </div>

          <style>{`
            @keyframes memMobileSlideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      );
    }

    return (
      <div style={{ paddingTop: 12 }}>
        {/* Mobile header — dark */}
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ font: `600 24px ${s.FONT}`, color: dm.text, margin: '0 0 2px', letterSpacing: '-0.3px' }}>Clients</h1>
          <p style={{ font: `400 13px ${s.FONT}`, color: dm.text3, margin: 0 }}>{members.length} total</p>
        </div>

        {/* Search input — dark */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dm.text3} strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            style={{
              width: '100%', padding: '14px 16px 14px 44px', height: 48,
              background: dm.card, border: `1px solid ${dm.border}`,
              borderRadius: 100, font: `400 14px ${s.FONT}`, color: dm.text, outline: 'none',
              boxSizing: 'border-box',
            }} />
        </div>

        {/* Client cards — dark */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mobileFiltered.map((p, idx) => {
            const status = getActivityStatus(p);
            const tier = TIER_BADGE[p.membershipTier || 'None'];
            return (
              <div key={p.id} onClick={() => setMobileDetail(p)} style={{
                background: dm.card,
                border: `1px solid ${dm.border}`, borderRadius: 16,
                padding: '16px', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
                animation: `memFadeInUp 0.2s ease ${idx * 30}ms backwards`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${dm.card}, ${dm.accent}18)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `600 15px ${s.FONT}`, color: dm.accent, border: `2px solid ${dm.border}`,
                  }}>
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: `600 16px ${s.FONT}`, color: dm.text, marginBottom: 1 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ font: `400 13px ${s.FONT}`, color: dm.text2, marginBottom: 2 }}>{p.goals || p.allergies || 'No goals set'}</div>
                    <div style={{ font: `400 11px ${s.FONT}`, color: dm.text3 }}>
                      {p.lastVisit ? `Last: ${new Date(p.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No sessions yet'}
                    </div>
                  </div>
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: statusColors[status],
                    boxShadow: `0 0 8px ${statusColors[status]}50`,
                  }} />
                </div>
                {/* Package pill at bottom */}
                {tier && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 100,
                      font: `600 9px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.5,
                      background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                    }}>{p.membershipTier}</span>
                  </div>
                )}
              </div>
            );
          })}
          {mobileFiltered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ font: `400 14px ${s.FONT}`, color: dm.text3, marginBottom: 12 }}>No clients found</div>
            </div>
          )}
        </div>

        {/* Floating Action Button — green accent */}
        <button onClick={() => { setSelected(null); setForm({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', goals: '', notes: '', membershipTier: 'None' }); setShowForm(true); }} style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 140,
          width: 56, height: 56, borderRadius: '50%',
          background: '#4ADE80', color: '#0D0D0F',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(74,222,128,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s ease',
          fontSize: 24, fontWeight: 300,
        }}>
          +
        </button>

        {/* Add/Edit Modal — dark bottom sheet */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300,
          }} onClick={() => { setShowForm(false); setAddedClient(null); }}>
            <div style={{
              background: dm.card, borderRadius: '20px 20px 0 0', padding: '24px 20px 100px', width: '100%',
              maxHeight: '95vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
              animation: 'memFadeInUp 0.2s cubic-bezier(0.16,1,0.3,1) both',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ width: 36, height: 4, borderRadius: 100, background: dm.border }} />
              </div>
              {addedClient ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: 'rgba(74,222,128,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  }}>
                    <span style={{ fontSize: 24, color: dm.accent }}>&#10003;</span>
                  </div>
                  <h2 style={{ font: `600 20px ${s.FONT}`, color: dm.text, marginBottom: 6 }}>Client Added!</h2>
                  <p style={{ font: `400 14px ${s.FONT}`, color: dm.text2, marginBottom: 24 }}>
                    {addedClient.firstName} {addedClient.lastName} has been added.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={() => {
                      const email = addedClient.email || `${addedClient.firstName.toLowerCase()}@email.com`;
                      setIntakeToast(`Intake form sent to ${email}`);
                      setTimeout(() => setIntakeToast(null), 3000);
                    }} style={{ padding: '14px', textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, border: `1px solid ${dm.border}`, background: dm.bg, color: dm.text, cursor: 'pointer', font: `500 14px ${s.FONT}` }}>
                      <span style={{ fontSize: 16 }}>&#9993;</span>
                      Send Intake Form
                    </button>
                    <button onClick={() => { setShowForm(false); setAddedClient(null); }} style={{ padding: '14px', textAlign: 'center', width: '100%', borderRadius: 12, border: 'none', background: dm.accent, color: dm.bg, cursor: 'pointer', font: `600 14px ${s.FONT}` }}>
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ font: `600 20px ${s.FONT}`, color: dm.text, marginBottom: 20 }}>{selected ? 'Edit Client' : 'New Client'}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { key: 'firstName', label: 'First Name', type: 'text' },
                      { key: 'lastName', label: 'Last Name', type: 'text' },
                      { key: 'email', label: 'Email', type: 'email' },
                      { key: 'phone', label: 'Phone', type: 'tel' },
                      { key: 'dob', label: 'Date of Birth', type: 'date' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: dm.text3, marginBottom: 4, display: 'block' }}>{f.label}</label>
                        <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ width: '100%', padding: '12px 14px', background: dm.bg, border: `1px solid ${dm.border}`, borderRadius: 10, color: dm.text, font: `400 14px ${s.FONT}`, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: dm.text3, marginBottom: 4, display: 'block' }}>Membership</label>
                      <select value={form.membershipTier} onChange={e => setForm({ ...form, membershipTier: e.target.value })} style={{ width: '100%', padding: '12px 14px', background: dm.bg, border: `1px solid ${dm.border}`, borderRadius: 10, color: dm.text, font: `400 14px ${s.FONT}`, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                        <option>Drop-in</option><option>10-Session Pack</option><option>Unlimited Monthly</option><option>Premium Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: dm.text3, marginBottom: 4, display: 'block' }}>Goals</label>
                    <input value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} style={{ width: '100%', padding: '12px 14px', background: dm.bg, border: `1px solid ${dm.border}`, borderRadius: 10, color: dm.text, font: `400 14px ${s.FONT}`, outline: 'none', boxSizing: 'border-box' }} placeholder="e.g., Build muscle, Lose weight" />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '14px', textAlign: 'center', borderRadius: 12, border: `1px solid ${dm.border}`, background: dm.bg, color: dm.text2, cursor: 'pointer', font: `500 14px ${s.FONT}` }}>Cancel</button>
                    <button onClick={handleSave} style={{ flex: 1, padding: '14px', textAlign: 'center', borderRadius: 12, border: 'none', background: dm.accent, color: dm.bg, cursor: 'pointer', font: `600 14px ${s.FONT}` }}>{selected ? 'Save' : 'Add Client'}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes memMobileSlideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  // ═══ DESKTOP VIEW (unchanged) ═══
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12,
        animation: 'memFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.3px' }}>Clients</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>{members.length} total clients</p>
        </div>
        <button onClick={() => { setSelected(null); setForm({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', goals: '', notes: '', membershipTier: 'None' }); setShowForm(true); }} style={s.pillAccent}>
          + Add Client
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Clients', value: members.length, icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )},
          { label: 'New This Month', value: newThisMonth, icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.success} strokeWidth="1.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
          )},
          { label: 'Avg. Revenue', value: fmt(avgSpend), icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          )},
          { label: 'Active Clients', value: activeMembers, icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )},
        ].map((k, idx) => (
          <div key={k.label} style={{
            ...glass, padding: '18px 20px',
            animation: `memFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${(idx + 1) * 60}ms backwards`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {k.icon}
              </div>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3 }}>{k.label}</div>
            </div>
            <div style={{ font: `600 24px ${s.FONT}`, color: s.text, letterSpacing: '-0.3px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search / Filter Bar */}
      <div style={{
        ...glass, padding: '14px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        animation: 'memFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 300ms backwards',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            style={{ ...s.input, paddingLeft: 40, background: s.card, borderRadius: 100 }} />
        </div>

        {/* Filter pills */}
        <div className="mem-filter-row" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterOptions.map(f => (
            <button key={f} className="mem-filter-pill" onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
              font: `500 12px ${s.FONT}`,
              background: filter === f ? s.accent : s.card,
              color: filter === f ? s.accentText : s.text2,
              boxShadow: filter === f ? `0 2px 10px ${s.accent}30` : '0 1px 4px rgba(0,0,0,0.04)',
              backdropFilter: 'blur(8px)',
            }}>
              {f === 'None' ? 'Non-Members' : f === 'All' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          ...s.input, width: 'auto', minWidth: 130, cursor: 'pointer',
          borderRadius: 100, padding: '9px 16px', background: s.card,
        }}>
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* View toggle */}
        <div className="mem-view-toggle" style={{ display: 'flex', gap: 0, background: s.borderLight, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          {[['cards', 'Cards'], ['table', 'Table']].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding: '8px 16px', background: viewMode === v ? 'rgba(255,255,255,0.8)' : 'transparent', border: 'none',
              font: `500 12px ${s.FONT}`, color: viewMode === v ? s.text : s.text3, cursor: 'pointer',
              borderRadius: viewMode === v ? 10 : 0, boxShadow: viewMode === v ? s.shadow : 'none',
              backdropFilter: viewMode === v ? 'blur(8px)' : 'none',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="members-main-grid" style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 380px' : '1fr', gap: 20 }}>

        {/* Card View */}
        {(viewMode === 'cards' || true) && (
          <div className="mem-cards-grid" style={{ display: viewMode === 'cards' ? 'grid' : 'none', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map((p, idx) => {
              const tier = TIER_BADGE[p.membershipTier || 'None'];
              const isActive = detail?.id === p.id;
              return (
                <div key={p.id} className="mem-card-hover" onClick={() => setDetail(p)} style={{
                  ...glass, padding: '22px 20px', cursor: 'pointer',
                  borderLeft: isActive ? `3px solid ${s.accent}` : '3px solid transparent',
                  background: isActive ? s.accentLight : glass.background,
                  animation: `memFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${360 + idx * 40}ms backwards`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${s.accentLight}, ${s.accent}18)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: `600 15px ${s.FONT}`, color: s.accent, flexShrink: 0,
                      border: `2px solid ${s.accent}20`,
                    }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                    </div>
                    {tier && (
                      <span style={{
                        padding: '3px 10px', borderRadius: 100,
                        font: `600 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.5,
                        background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                        flexShrink: 0,
                      }}>{p.membershipTier}</span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 3 }}>Sessions</div>
                      <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>{p.visitCount}</div>
                    </div>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 3 }}>Spent</div>
                      <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>{fmt(p.totalSpent)}</div>
                    </div>
                    <div>
                      <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 3 }}>Last Session</div>
                      <div style={{ font: `500 12px ${s.FONT}`, color: s.text2 }}>
                        {p.lastVisit ? new Date(p.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ ...glass, padding: 48, textAlign: 'center', gridColumn: '1 / -1' }}>
                <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, marginBottom: 12 }}>No clients found</div>
                <button onClick={() => { setSelected(null); setForm({ firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Female', goals: '', notes: '', membershipTier: 'None' }); setShowForm(true); }} style={s.pillAccent}>
                  + Add Client
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="mem-table-section" style={{ ...glass, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                    {['Client', 'Contact', 'Membership', 'Sessions', 'Total Spent', 'Last Session', ''].map(h => (
                      <th key={h} style={{ padding: '14px 18px', font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const tier = TIER_BADGE[p.membershipTier || 'None'];
                    const isActive = detail?.id === p.id;
                    return (
                      <tr key={p.id} className="mem-row-hover" onClick={() => setDetail(p)} style={{
                        borderBottom: `1px solid ${s.borderLight}`, cursor: 'pointer',
                        background: isActive ? s.accentLight : 'transparent',
                        animation: `memFadeInUp 0.3s ease ${idx * 30}ms backwards`,
                      }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: '50%',
                              background: `linear-gradient(135deg, ${s.accentLight}, ${s.accent}18)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              font: `500 13px ${s.FONT}`, color: s.accent, flexShrink: 0,
                            }}>
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{p.firstName} {p.lastName}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{p.email}</div>
                          <div style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>{p.phone}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {tier && (
                            <span style={{
                              padding: '3px 10px', borderRadius: 100,
                              font: `600 10px ${s.FONT}`, textTransform: 'uppercase',
                              background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                            }}>{p.membershipTier}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', font: `500 13px ${s.MONO}`, color: s.text }}>{p.visitCount}</td>
                        <td style={{ padding: '14px 18px', font: `500 13px ${s.MONO}`, color: s.text }}>{fmt(p.totalSpent)}</td>
                        <td style={{ padding: '14px 18px', font: `400 13px ${s.FONT}`, color: s.text2 }}>
                          {p.lastVisit ? new Date(p.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <button onClick={e => { e.stopPropagation(); handleEdit(p); }} style={{ ...s.pillGhost, padding: '4px 12px', fontSize: 11 }}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan="7" style={{ padding: 48, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No clients found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {detail && (
          <div className="members-detail-panel" style={{
            alignSelf: 'start', position: 'sticky', top: 80, overflow: 'hidden',
            ...glass, borderRadius: 20, padding: 0,
            animation: 'memSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {/* Accent header area */}
            <div style={{
              background: `linear-gradient(135deg, ${s.accent}12, ${s.accent}08)`,
              padding: '28px 24px 20px', textAlign: 'center', position: 'relative',
              borderBottom: `1px solid ${s.accent}10`,
            }}>
              <button onClick={() => setDetail(null)} style={{
                position: 'absolute', top: 12, right: 14,
                background: s.card, border: 'none', cursor: 'pointer',
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.text3, fontSize: 16, backdropFilter: 'blur(8px)',
              }}>x</button>
              {/* Large avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
                background: `linear-gradient(135deg, ${s.accentLight}, ${s.accent}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `600 22px ${s.FONT}`, color: s.accent,
                border: `3px solid ${s.accent}25`,
                boxShadow: `0 4px 20px ${s.accent}15`,
              }}>
                {detail.firstName[0]}{detail.lastName[0]}
              </div>
              <div style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 4 }}>{detail.firstName} {detail.lastName}</div>
              {detail.membershipTier && detail.membershipTier !== 'None' && (() => {
                const tier = TIER_BADGE[detail.membershipTier];
                return (
                  <span style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 100,
                    font: `600 10px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.8,
                    background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
                  }}>{detail.membershipTier} Member</span>
                );
              })()}
            </div>

            {/* Key-value pairs */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Email', value: detail.email },
                  { label: 'Phone', value: detail.phone },
                  { label: 'DOB', value: detail.dob || '---' },
                  { label: 'Gender', value: detail.gender },
                  { label: 'Sessions Attended', value: detail.visitCount },
                  { label: 'Total Spent', value: fmt(detail.totalSpent) },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 4 }}>{f.label}</div>
                    <div style={{ font: `400 13px ${s.FONT}`, color: s.text, wordBreak: 'break-word' }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {(detail.goals || detail.allergies) && (
                <div style={{
                  padding: '10px 14px', background: s.accentLight, borderRadius: 10, marginBottom: 16,
                  font: `400 12px ${s.FONT}`, color: s.accent, border: `1px solid ${s.accent}20`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Goals: {detail.goals || detail.allergies}
                </div>
              )}

              {/* Recent classes */}
              <div style={{ font: `600 13px ${s.FONT}`, color: s.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.text2} strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Recent Sessions
              </div>
              {memberClasses(detail.id).length === 0 ? (
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, padding: '8px 0' }}>No sessions found</div>
              ) : memberClasses(detail.id).map(a => {
                const svc = services.find(sv => sv.id === a.serviceId);
                const statusColor = a.status === 'completed' ? s.success : a.status === 'confirmed' ? s.accent : s.warning;
                return (
                  <div key={a.id} style={{
                    padding: '10px 12px', marginBottom: 6, borderRadius: 10,
                    background: s.card, border: `1px solid ${s.borderLight}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ font: `500 12px ${s.FONT}`, color: s.text }}>{svc?.name || 'Session'}</div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>
                        {new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100,
                      font: `500 9px ${s.FONT}`, textTransform: 'uppercase', color: statusColor,
                      background: a.status === 'completed' ? (s.dark ? 'rgba(74,222,128,0.12)' : '#F0FDF4') : a.status === 'confirmed' ? s.accentLight : (s.dark ? 'rgba(251,191,36,0.12)' : '#FFFBEB'),
                    }}>{a.status}</span>
                  </div>
                );
              })}

              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <button onClick={() => handleEdit(detail)} style={{ ...s.pillOutline, padding: '8px 18px', fontSize: 12, flex: 1 }}>Edit</button>
                <button onClick={() => handleDelete(detail.id)} style={{ ...s.pillGhost, padding: '8px 18px', fontSize: 12, color: s.danger, borderColor: `${s.danger}40` }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .members-main-grid {
            grid-template-columns: 1fr !important;
          }
          .mem-view-toggle {
            display: none !important;
          }
          .mem-filter-row {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            scrollbar-width: none;
          }
          .mem-filter-row::-webkit-scrollbar {
            display: none;
          }
          .mem-filter-pill {
            white-space: nowrap;
            flex-shrink: 0;
          }
          .mem-cards-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }
          .mem-table-section {
            display: none !important;
          }
          .members-detail-panel {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 92vw !important;
            max-width: 400px !important;
            z-index: 200 !important;
            border-radius: 20px 0 0 20px !important;
            overflow-y: auto !important;
            box-shadow: -8px 0 40px rgba(0,0,0,0.15) !important;
            animation: slideIn 0.3s cubic-bezier(0.16,1,0.3,1) both !important;
          }
        }
      `}</style>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }} onClick={() => { setShowForm(false); setAddedClient(null); }}>
          <div style={{
            background: s.cardSolid, borderRadius: 20, padding: 32, maxWidth: 540, width: '90%',
            boxShadow: s.shadowLg, maxHeight: '95vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            animation: 'memFadeInUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
          }} onClick={e => e.stopPropagation()}>
            {addedClient ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: `${s.accent}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <span style={{ fontSize: 28 }}>&#10003;</span>
                </div>
                <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>Client Added!</h2>
                <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 28 }}>
                  {addedClient.firstName} {addedClient.lastName} has been added to your roster.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <button onClick={() => {
                    const email = addedClient.email || `${addedClient.firstName.toLowerCase()}@email.com`;
                    setIntakeToast(`Intake form sent to ${email}`);
                    setTimeout(() => setIntakeToast(null), 3000);
                  }} style={{
                    ...s.pillOutline, padding: '12px 28px', borderRadius: 100,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>&#9993;</span>
                    Send Intake Form
                  </button>
                  <button onClick={() => { setShowForm(false); setAddedClient(null); }} style={s.pillAccent}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 24 }}>{selected ? 'Edit Client' : 'New Client'}</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { key: 'firstName', label: 'First Name', type: 'text' },
                    { key: 'lastName', label: 'Last Name', type: 'text' },
                    { key: 'email', label: 'Email', type: 'email' },
                    { key: 'phone', label: 'Phone', type: 'tel' },
                    { key: 'dob', label: 'Date of Birth', type: 'date' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={s.label}>{f.label}</label>
                      <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={s.input} />
                    </div>
                  ))}
                  <div>
                    <label style={s.label}>Gender</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                      <option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Membership</label>
                    <select value={form.membershipTier} onChange={e => setForm({ ...form, membershipTier: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                      <option>Drop-in</option><option>10-Session Pack</option><option>Unlimited Monthly</option><option>Premium Monthly</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={s.label}>Goals</label>
                  <input value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} style={s.input} placeholder="e.g., Build muscle, Lose weight, Get stronger" />
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={s.label}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...s.input, resize: 'vertical' }} placeholder="Internal notes..." />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowForm(false)} style={s.pillGhost}>Cancel</button>
                  <button onClick={handleSave} style={s.pillAccent}>{selected ? 'Save Changes' : 'Add Client'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Intake form toast */}
      {intakeToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
          background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)', color: '#fff',
          padding: '14px 28px', borderRadius: 100, font: `500 13px ${s.FONT}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'memFadeInUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {intakeToast}
        </div>
      )}
    </div>
  );
}
