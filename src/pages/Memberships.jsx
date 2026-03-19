import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { subscribe } from '../data/store';

const MEM_KEY = 'ms_memberships';
const PKG_KEY = 'ms_packages';

function getMemberships() { try { return JSON.parse(localStorage.getItem(MEM_KEY)) || []; } catch { return []; } }
function setMemberships(data) { localStorage.setItem(MEM_KEY, JSON.stringify(data)); }
function getPackages() { try { return JSON.parse(localStorage.getItem(PKG_KEY)) || []; } catch { return []; } }
function setPackages(data) { localStorage.setItem(PKG_KEY, JSON.stringify(data)); }
function getPatients() { try { return JSON.parse(localStorage.getItem('ms_patients')) || []; } catch { return []; } }

const TIERS = {
  '10-Session Pack': { price: 890, color: '#94A3B8', allocations: [{ service: '1-on-1 Training', units: 10, unit: 'sessions' }] },
  'Unlimited Monthly': { price: 499, color: '#A68A4C', allocations: [{ service: '1-on-1 Training', units: 99, unit: 'unlimited' }, { service: 'Nutrition Coaching', units: 4, unit: 'sessions' }] },
  'Premium Monthly': { price: 699, color: '#7C3AED', allocations: [{ service: '1-on-1 Training', units: 99, unit: 'unlimited' }, { service: 'Nutrition Coaching', units: 99, unit: 'unlimited' }, { service: 'Progress Tracking', units: 99, unit: 'unlimited' }] },
};

const TIER_FEATURES = {
  '10-Session Pack': ['10 one-on-one training sessions', 'Valid for 3 months', 'Online booking priority'],
  'Unlimited Monthly': ['Unlimited 1-on-1 sessions', '4 nutrition coaching sessions', 'Priority booking', 'Workout programming'],
  'Premium Monthly': ['Unlimited 1-on-1 sessions', 'Unlimited nutrition coaching', 'Priority booking', 'Custom meal plans', 'Progress tracking & body composition', 'Monthly fitness assessments'],
};

function seedMemberships() {
  if (localStorage.getItem('ms_memberships_seeded')) return;
  const patients = getPatients();
  if (patients.length < 16) return;
  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };
  const memberships = [
    { id: 'MEM-1', patientId: patients[0].id, patientName: `${patients[0].firstName} ${patients[0].lastName}`, tier: 'Unlimited Monthly', startDate: d(-60), nextBilling: d(0), credits: 25, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 99, total: 99 }, { service: 'Nutrition Coaching', remaining: 2, total: 4 }] },
    { id: 'MEM-2', patientId: patients[1].id, patientName: `${patients[1].firstName} ${patients[1].lastName}`, tier: 'Premium Monthly', startDate: d(-90), nextBilling: d(5), credits: 0, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 99, total: 99 }, { service: 'Nutrition Coaching', remaining: 99, total: 99 }, { service: 'Progress Tracking', remaining: 99, total: 99 }] },
    { id: 'MEM-3', patientId: patients[2].id, patientName: `${patients[2].firstName} ${patients[2].lastName}`, tier: '10-Session Pack', startDate: d(-30), nextBilling: d(1), credits: 50, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 7, total: 10 }] },
    { id: 'MEM-4', patientId: patients[3].id, patientName: `${patients[3].firstName} ${patients[3].lastName}`, tier: 'Unlimited Monthly', startDate: d(-120), nextBilling: d(10), credits: 0, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 99, total: 99 }, { service: 'Nutrition Coaching', remaining: 4, total: 4 }] },
    { id: 'MEM-5', patientId: patients[4].id, patientName: `${patients[4].firstName} ${patients[4].lastName}`, tier: 'Premium Monthly', startDate: d(-45), nextBilling: d(15), credits: 100, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 99, total: 99 }, { service: 'Nutrition Coaching', remaining: 99, total: 99 }, { service: 'Progress Tracking', remaining: 99, total: 99 }] },
    { id: 'MEM-6', patientId: patients[5].id, patientName: `${patients[5].firstName} ${patients[5].lastName}`, tier: '10-Session Pack', startDate: d(-15), nextBilling: d(15), credits: 0, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 10, total: 10 }] },
    { id: 'MEM-7', patientId: patients[6].id, patientName: `${patients[6].firstName} ${patients[6].lastName}`, tier: 'Unlimited Monthly', startDate: d(-75), nextBilling: d(14), credits: 75, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 99, total: 99 }, { service: 'Nutrition Coaching', remaining: 0, total: 4 }] },
    { id: 'MEM-8', patientId: patients[7].id, patientName: `${patients[7].firstName} ${patients[7].lastName}`, tier: 'Premium Monthly', startDate: d(-180), nextBilling: d(3), credits: 0, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 99, total: 99 }, { service: 'Nutrition Coaching', remaining: 99, total: 99 }, { service: 'Progress Tracking', remaining: 99, total: 99 }] },
    { id: 'MEM-9', patientId: patients[8].id, patientName: `${patients[8].firstName} ${patients[8].lastName}`, tier: 'Unlimited Monthly', startDate: d(-200), nextBilling: d(-5), credits: 0, status: 'paused', wallet: [{ service: '1-on-1 Training', remaining: 99, total: 99 }, { service: 'Nutrition Coaching', remaining: 3, total: 4 }] },
    { id: 'MEM-10', patientId: patients[9].id, patientName: `${patients[9].firstName} ${patients[9].lastName}`, tier: '10-Session Pack', startDate: d(-10), nextBilling: d(20), credits: 0, status: 'active', wallet: [{ service: '1-on-1 Training', remaining: 8, total: 10 }] },
  ];
  const packages = [
    { id: 'PKG-1', patientId: patients[0].id, patientName: `${patients[0].firstName} ${patients[0].lastName}`, name: '5 Private Sessions', service: 'Private Session', totalSessions: 5, usedSessions: 2, purchaseDate: d(-45), expiresDate: d(45), status: 'active' },
    { id: 'PKG-2', patientId: patients[2].id, patientName: `${patients[2].firstName} ${patients[2].lastName}`, name: '10 Strength Sessions', service: 'Strength Training', totalSessions: 10, usedSessions: 3, purchaseDate: d(-90), expiresDate: d(90), status: 'active' },
    { id: 'PKG-3', patientId: patients[4].id, patientName: `${patients[4].firstName} ${patients[4].lastName}`, name: '5 HIIT Sessions', service: 'HIIT', totalSessions: 5, usedSessions: 1, purchaseDate: d(-30), expiresDate: d(60), status: 'active' },
    { id: 'PKG-4', patientId: patients[7].id, patientName: `${patients[7].firstName} ${patients[7].lastName}`, name: '8 Recovery + Stretch', service: 'Recovery + Stretch', totalSessions: 8, usedSessions: 8, purchaseDate: d(-120), expiresDate: d(-10), status: 'completed' },
  ];
  setMemberships(memberships); setPackages(packages);
  localStorage.setItem('ms_memberships_seeded', 'true');
}

function ProgressBar({ value, total, color, height = 6 }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (<div style={{ height, borderRadius: height, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: height, background: color, transition: 'width 0.5s ease' }} /></div>);
}

export default function Memberships() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedMemberships(); setTick(t => t + 1); }, []);

  const [tab, setTab] = useState('memberships');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const memberships = getMemberships();
  const packages = getPackages();

  const filteredMemberships = memberships.filter(m => {
    if (['10-Session Pack', 'Unlimited Monthly', 'Premium Monthly'].includes(filter) && m.tier !== filter) return false;
    if (filter === 'paused' && m.status !== 'paused') return false;
    if (search) { const q = search.toLowerCase(); return m.patientName?.toLowerCase().includes(q) || m.tier?.toLowerCase().includes(q); }
    return true;
  });

  const filteredPackages = packages.filter(p => {
    if (filter === 'active' && p.status !== 'active') return false;
    if (filter === 'completed' && p.status !== 'completed') return false;
    if (search) return p.patientName?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const activeMemberships = memberships.filter(m => m.status === 'active').length;
  const mrr = memberships.filter(m => m.status === 'active').reduce((sum, m) => sum + (TIERS[m.tier]?.price || 0), 0);
  const tierBreakdown = { '10-Session Pack': memberships.filter(m => m.tier === '10-Session Pack').length, 'Unlimited Monthly': memberships.filter(m => m.tier === 'Unlimited Monthly').length, 'Premium Monthly': memberships.filter(m => m.tier === 'Premium Monthly').length };
  const activePackages = packages.filter(p => p.status === 'active').length;

  const deductUnit = (memId, serviceName) => { setMemberships(getMemberships().map(m => m.id === memId ? { ...m, wallet: m.wallet.map(w => w.service === serviceName ? { ...w, remaining: Math.max(0, w.remaining - 1) } : w) } : m)); setTick(t => t + 1); };
  const usePackageSession = (pkgId) => { setPackages(getPackages().map(p => { if (p.id === pkgId) { const used = p.usedSessions + 1; return { ...p, usedSessions: used, status: used >= p.totalSessions ? 'completed' : 'active' }; } return p; })); setTick(t => t + 1); };
  const tierColor = (tier) => TIERS[tier]?.color || s.text3;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: s.HEADING, fontSize: 32, fontWeight: 700, color: s.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Memberships & Packages</h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text2, lineHeight: 1.5 }}>Manage membership wallets, session allocations, and training packages</p>
      </div>

      {/* Tier Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        {Object.entries(TIERS).map(([name, tier]) => (
          <div key={name} style={{ ...s.cardStyle, overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: 5, width: '100%', background: `linear-gradient(135deg, ${tier.color}, ${tier.color}AA)` }} />
            <div style={{ padding: '28px 28px 24px' }}>
              <div style={{ fontFamily: s.MONO, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: tier.color, marginBottom: 12 }}>{name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: s.HEADING, fontSize: 36, fontWeight: 600, color: s.text }}>${tier.price}</span>
                <span style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>{name === '10-Session Pack' ? '/ pack' : '/ month'}</span>
              </div>
              <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text2, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tier.color, display: 'inline-block', opacity: 0.6 }} />
                {tierBreakdown[name]} active client{tierBreakdown[name] !== 1 ? 's' : ''}
              </div>
              <div style={{ height: 1, background: s.borderLight, marginBottom: 18 }} />
              <div style={{ display: 'grid', gap: 10 }}>
                {TIER_FEATURES[name].map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><circle cx="8" cy="8" r="8" fill={tier.color} opacity="0.12" /><path d="M5 8.2L7 10.2L11 6.2" stroke={tier.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.3 }}>{feat}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setTab('memberships'); setFilter(name); }} style={{ marginTop: 24, width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 13, fontWeight: 600, background: `${tier.color}14`, color: tier.color, transition: 'all 0.3s ease' }}>View {name} Clients</button>
            </div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[{ label: 'Monthly Revenue', value: `$${mrr.toLocaleString()}`, color: s.success }, { label: 'Total Clients', value: activeMemberships, color: s.accent }, { label: 'Active Packages', value: activePackages, color: '#7C3AED' }, { label: 'Alerts', value: 0, color: s.success }].map((k) => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '22px 24px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 14 }}>{k.label}</div>
            <div style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, letterSpacing: '-0.02em' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'inline-flex', padding: 4, borderRadius: 14, background: s.surface, border: `1px solid ${s.borderLight}` }}>
          {[{ id: 'memberships', label: 'Members', count: filteredMemberships.length }, { id: 'packages', label: 'Packages', count: filteredPackages.length }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setFilter('all'); }} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 13, fontWeight: 500, background: tab === t.id ? s.accent : 'transparent', color: tab === t.id ? s.accentText : s.text2, transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', gap: 8 }}>
              {t.label}<span style={{ padding: '1px 7px', borderRadius: 100, fontFamily: s.FONT, fontSize: 10, fontWeight: 600, background: tab === t.id ? 'rgba(255,255,255,0.22)' : s.borderLight, color: tab === t.id ? s.accentText : s.text3 }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...s.input, maxWidth: 280 }} />
        {tab === 'memberships' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['10-Session Pack', '10-Session Pack'], ['Unlimited Monthly', 'Unlimited Monthly'], ['Premium Monthly', 'Premium Monthly'], ['paused', 'Paused']].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 12, fontWeight: 500, background: filter === id ? (TIERS[id]?.color || s.accent) : s.surface, color: filter === id ? '#fff' : s.text2, transition: 'all 0.25s ease' }}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Members Cards */}
      {tab === 'memberships' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: 18 }}>
          {filteredMemberships.map((m) => {
            const tc = tierColor(m.tier);
            return (
              <div key={m.id} onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)} style={{ ...s.cardStyle, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                <div style={{ height: 4, width: '100%', background: `linear-gradient(135deg, ${tc}, ${tc}AA)` }} />
                <div style={{ padding: '22px 24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: s.HEADING, fontSize: 16, fontWeight: 600, color: s.text, marginBottom: 6 }}>{m.patientName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 14px', borderRadius: 100, fontFamily: s.FONT, fontSize: 11, fontWeight: 600, background: `${tc}14`, color: tc, border: `1px solid ${tc}22` }}>{m.tier}</span>
                        {m.status === 'paused' && <span style={{ padding: '4px 12px', borderRadius: 100, fontFamily: s.FONT, fontSize: 10, fontWeight: 500, background: s.dangerBg, color: s.danger }}>Paused</span>}
                        {m.credits > 0 && <span style={{ padding: '4px 12px', borderRadius: 100, fontFamily: s.FONT, fontSize: 10, fontWeight: 600, background: s.successBg, color: s.success }}>${m.credits} credit</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: s.HEADING, fontSize: 22, fontWeight: 700, color: s.text }}>${TIERS[m.tier]?.price}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, marginTop: 2 }}>Next: {new Date(m.nextBilling + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: s.borderLight, marginBottom: 16 }} />
                  <div style={{ fontFamily: s.MONO, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 12 }}>Service Wallet</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {m.wallet?.map(w => {
                      const pct = w.total > 0 ? (w.remaining / w.total) * 100 : 0;
                      const barColor = pct <= 25 ? s.danger : pct <= 50 ? s.warning : s.success;
                      return (
                        <div key={w.service}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{w.service}</span>
                            <span style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 600, color: w.remaining === 0 ? s.text3 : s.text }}>{w.remaining}/{w.total}</span>
                          </div>
                          <ProgressBar value={w.remaining} total={w.total} color={barColor} height={6} />
                        </div>
                      );
                    })}
                  </div>
                  {selectedMember === m.id && (
                    <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${s.borderLight}` }}>
                      <div style={{ fontFamily: s.MONO, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 10 }}>Record Usage</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {m.wallet?.filter(w => w.remaining > 0).map(w => (
                          <button key={w.service} onClick={(e) => { e.stopPropagation(); deductUnit(m.id, w.service); }} style={{ padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: s.FONT, fontSize: 12, fontWeight: 500, background: `${tc}0A`, color: tc, border: `1.5px solid ${tc}30`, transition: 'all 0.2s' }}>Use 1 {w.service}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filteredMemberships.length === 0 && (<div style={{ ...s.cardStyle, padding: 56, textAlign: 'center', gridColumn: '1 / -1', fontFamily: s.FONT, fontSize: 15, color: s.text3 }}>No memberships match this filter</div>)}
        </div>
      )}

      {/* Packages */}
      {tab === 'packages' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {filteredPackages.map((p) => {
            const remaining = p.totalSessions - p.usedSessions;
            const pct = (p.usedSessions / p.totalSessions) * 100;
            const daysLeft = Math.ceil((new Date(p.expiresDate) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div key={p.id} style={{ ...s.cardStyle, overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: 4, width: '100%', background: p.status === 'completed' ? s.borderLight : `linear-gradient(90deg, ${s.accent}, ${s.accent}AA)` }} />
                <div style={{ padding: '22px 24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: s.HEADING, fontSize: 16, fontWeight: 600, color: s.text, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{p.patientName}</div>
                    </div>
                    <span style={{ padding: '4px 14px', borderRadius: 100, fontFamily: s.FONT, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', background: p.status === 'active' ? s.successBg : s.borderLight, color: p.status === 'active' ? s.success : s.text3 }}>{p.status}</span>
                  </div>
                  <div style={{ fontFamily: s.MONO, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 10 }}>Session Progress</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{p.usedSessions} of {p.totalSessions} sessions</span>
                    <span style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 700, color: s.text }}>{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar value={p.usedSessions} total={p.totalSessions} color={p.status === 'completed' ? s.text3 : s.accent} height={8} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 16 }}>
                    {Array.from({ length: p.totalSessions }).map((_, i) => (<div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < p.usedSessions ? (p.status === 'completed' ? s.text3 : s.accent) : s.borderLight }} />))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: daysLeft <= 14 && daysLeft > 0 ? s.danger : p.status === 'completed' ? s.text3 : s.text2 }}>
                      {p.status === 'completed' ? 'Completed' : daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                    </div>
                    {p.status === 'active' && remaining > 0 && (
                      <button onClick={() => usePackageSession(p.id)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 12, fontWeight: 600, background: s.accent, color: s.accentText, transition: 'all 0.25s ease' }}>Use Session</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPackages.length === 0 && (<div style={{ ...s.cardStyle, padding: 56, textAlign: 'center', gridColumn: '1 / -1', fontFamily: s.FONT, fontSize: 15, color: s.text3 }}>No packages match this filter</div>)}
        </div>
      )}
    </div>
  );
}
