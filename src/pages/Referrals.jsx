import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { subscribe } from '../data/store';

const STORAGE_KEY = 'ms_referrals';
const SETTINGS_KEY = 'ms_referral_settings';

function getReferrals() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function setReferrals(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getRefSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { referrerCredit: 50, friendCredit: 50 }; } catch { return { referrerCredit: 50, friendCredit: 50 }; }
}
function setRefSettings(data) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); }

function getPatients() {
  try { return JSON.parse(localStorage.getItem('ms_patients')) || []; } catch { return []; }
}

function seedReferrals() {
  if (localStorage.getItem('ms_referrals_seeded')) return;
  const patients = getPatients();
  if (patients.length < 12) return;

  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };

  const seed = [
    { id: 'REF-1', referrerId: patients[0].id, referrerName: `${patients[0].firstName} ${patients[0].lastName}`, code: `REF-${patients[0].firstName.toUpperCase()}-1000`, friendName: `${patients[10].firstName} ${patients[10].lastName}`, friendId: patients[10].id, friendEmail: patients[10].email, status: 'credited', referredDate: d(-45), bookedDate: d(-38), creditedDate: d(-38), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-2', referrerId: patients[0].id, referrerName: `${patients[0].firstName} ${patients[0].lastName}`, code: `REF-${patients[0].firstName.toUpperCase()}-1000`, friendName: `${patients[11].firstName} ${patients[11].lastName}`, friendId: patients[11].id, friendEmail: patients[11].email, status: 'credited', referredDate: d(-30), bookedDate: d(-24), creditedDate: d(-24), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-3', referrerId: patients[0].id, referrerName: `${patients[0].firstName} ${patients[0].lastName}`, code: `REF-${patients[0].firstName.toUpperCase()}-1000`, friendName: 'Taylor Swift', friendId: null, friendEmail: 'taylor@example.com', status: 'pending', referredDate: d(-5), bookedDate: null, creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-4', referrerId: patients[1].id, referrerName: `${patients[1].firstName} ${patients[1].lastName}`, code: `REF-${patients[1].firstName.toUpperCase()}-1001`, friendName: `${patients[12].firstName} ${patients[12].lastName}`, friendId: patients[12].id, friendEmail: patients[12].email, status: 'credited', referredDate: d(-60), bookedDate: d(-52), creditedDate: d(-52), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-5', referrerId: patients[1].id, referrerName: `${patients[1].firstName} ${patients[1].lastName}`, code: `REF-${patients[1].firstName.toUpperCase()}-1001`, friendName: `${patients[13].firstName} ${patients[13].lastName}`, friendId: patients[13].id, friendEmail: patients[13].email, status: 'booked', referredDate: d(-10), bookedDate: d(-3), creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-6', referrerId: patients[2].id, referrerName: `${patients[2].firstName} ${patients[2].lastName}`, code: `REF-${patients[2].firstName.toUpperCase()}-1002`, friendName: `${patients[14].firstName} ${patients[14].lastName}`, friendId: patients[14].id, friendEmail: patients[14].email, status: 'credited', referredDate: d(-90), bookedDate: d(-82), creditedDate: d(-82), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-7', referrerId: patients[3].id, referrerName: `${patients[3].firstName} ${patients[3].lastName}`, code: `REF-${patients[3].firstName.toUpperCase()}-1003`, friendName: 'Jordan Lee', friendId: null, friendEmail: 'jordan@example.com', status: 'pending', referredDate: d(-2), bookedDate: null, creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-8', referrerId: patients[4].id, referrerName: `${patients[4].firstName} ${patients[4].lastName}`, code: `REF-${patients[4].firstName.toUpperCase()}-1004`, friendName: `${patients[15].firstName} ${patients[15].lastName}`, friendId: patients[15].id, friendEmail: patients[15].email, status: 'booked', referredDate: d(-14), bookedDate: d(-7), creditedDate: null, referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-9', referrerId: patients[5].id, referrerName: `${patients[5].firstName} ${patients[5].lastName}`, code: `REF-${patients[5].firstName.toUpperCase()}-1005`, friendName: `${patients[16].firstName} ${patients[16].lastName}`, friendId: patients[16].id, friendEmail: patients[16].email, status: 'credited', referredDate: d(-40), bookedDate: d(-33), creditedDate: d(-33), referrerCredit: 50, friendCredit: 50 },
    { id: 'REF-10', referrerId: patients[6].id, referrerName: `${patients[6].firstName} ${patients[6].lastName}`, code: `REF-${patients[6].firstName.toUpperCase()}-1006`, friendName: 'Morgan Blake', friendId: null, friendEmail: 'morgan@example.com', status: 'pending', referredDate: d(-1), bookedDate: null, creditedDate: null, referrerCredit: 50, friendCredit: 50 },
  ];

  setReferrals(seed);
  localStorage.setItem('ms_referrals_seeded', 'true');
}

export default function Referrals() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedReferrals(); setTick(t => t + 1); }, []);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [settings, setSettings] = useState(getRefSettings);
  const [generateSearch, setGenerateSearch] = useState('');

  const referrals = getReferrals();
  const patients = getPatients();

  // Filter referrals
  const filtered = referrals.filter(r => {
    if (filter === 'pending' && r.status !== 'pending') return false;
    if (filter === 'booked' && r.status !== 'booked') return false;
    if (filter === 'credited' && r.status !== 'credited') return false;
    if (search) {
      const q = search.toLowerCase();
      return r.referrerName?.toLowerCase().includes(q) || r.friendName?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
    }
    return true;
  });

  // KPIs
  const totalReferrals = referrals.length;
  const pendingCount = referrals.filter(r => r.status === 'pending').length;
  const bookedCount = referrals.filter(r => r.status === 'booked' || r.status === 'credited').length;
  const conversionRate = totalReferrals > 0 ? Math.round((bookedCount / totalReferrals) * 100) : 0;
  const totalCredits = referrals.filter(r => r.status === 'credited').reduce((sum, r) => sum + (r.referrerCredit || 0) + (r.friendCredit || 0), 0);

  // Top referrers leaderboard
  const referrerMap = {};
  referrals.forEach(r => {
    if (!referrerMap[r.referrerId]) referrerMap[r.referrerId] = { name: r.referrerName, count: 0, credited: 0 };
    referrerMap[r.referrerId].count++;
    if (r.status === 'credited') referrerMap[r.referrerId].credited += r.referrerCredit || 0;
  });
  const leaderboard = Object.entries(referrerMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Actions
  const markBooked = (id) => {
    const all = getReferrals().map(r => r.id === id ? { ...r, status: 'booked', bookedDate: new Date().toISOString().slice(0, 10) } : r);
    setReferrals(all);
    setTick(t => t + 1);
  };

  const markCredited = (id) => {
    const cfg = getRefSettings();
    const all = getReferrals().map(r => r.id === id ? { ...r, status: 'credited', creditedDate: new Date().toISOString().slice(0, 10), referrerCredit: cfg.referrerCredit, friendCredit: cfg.friendCredit } : r);
    setReferrals(all);
    setTick(t => t + 1);
  };

  const generateLink = (patient) => {
    const code = `REF-${patient.firstName.toUpperCase()}-${patient.id.split('-')[1]}`;
    navigator.clipboard?.writeText(`https://forgeperformance.com/refer/${code}`);
    setShowGenerate(false);
    setGenerateSearch('');
  };

  const saveSettings = () => {
    setRefSettings(settings);
    setShowSettings(false);
  };

  const filteredPatients = patients.filter(p => {
    if (!generateSearch) return true;
    const q = generateSearch.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
  }).slice(0, 8);

  const statusColor = (status) => {
    if (status === 'credited') return s.success;
    if (status === 'booked') return s.accent;
    return s.warning;
  };

  const statusBg = (status) => {
    if (status === 'credited') return s.dark ? 'rgba(74,222,128,0.12)' : '#F0FDF4';
    if (status === 'booked') return s.accentLight;
    return s.dark ? 'rgba(251,191,36,0.12)' : '#FFFBEB';
  };

  return (
    <div className="referrals-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Referrals</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Track referrals, reward loyalty, and grow your client base</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowSettings(true)} style={s.pillGhost}>Settings</button>
          <button onClick={() => setShowGenerate(true)} style={s.pillOutline}>View Client Links</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="referrals-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Referrals', value: totalReferrals, color: s.text },
          { label: 'Pending', value: pendingCount, color: pendingCount > 0 ? s.warning : s.success },
          { label: 'Conversion Rate', value: `${conversionRate}%`, color: conversionRate >= 50 ? s.success : s.warning },
          { label: 'Credits Issued', value: `$${totalCredits.toLocaleString()}`, color: s.success },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ font: `600 24px ${s.FONT}`, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ ...s.cardStyle, padding: 20, marginBottom: 24 }}>
        <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 14 }}>Top Referrers</div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
          {leaderboard.map((ref, i) => (
            <div key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, padding: '10px 14px', background: i === 0 ? s.accentLight : (s.dark ? '#252529' : '#F8F8F8'), borderRadius: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? s.accent : s.borderLight, color: i === 0 ? s.accentText : s.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 13px ${s.FONT}`, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{ref.name}</div>
                <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{ref.count} referral{ref.count !== 1 ? 's' : ''} &middot; ${ref.credited} earned</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>No referrals yet</div>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search referrals..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['pending', 'Pending'], ['booked', 'Booked'], ['credited', 'Credited']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              ...s.pill, padding: '7px 14px', fontSize: 12,
              background: filter === id ? s.accent : 'transparent',
              color: filter === id ? s.accentText : s.text2,
              border: filter === id ? `1px solid ${s.accent}` : `1px solid ${s.borderLight}`,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Referral Table */}
      <div className="referrals-table-wrap" style={s.tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse', font: `400 13px ${s.FONT}` }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${s.borderLight}` }}>
              {['Referrer', 'Code', 'Friend', 'Referred', 'Booked', 'Status', 'Credits', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(ref => (
              <tr key={ref.id} style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                <td style={{ padding: '12px 16px', font: `500 13px ${s.FONT}`, color: s.text }}>{ref.referrerName}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ font: `400 12px ${s.MONO}`, color: s.text2, background: s.dark ? '#252529' : '#F5F5F5', padding: '3px 8px', borderRadius: 6 }}>{ref.code}</span>
                </td>
                <td style={{ padding: '12px 16px', color: s.text }}>{ref.friendName}</td>
                <td style={{ padding: '12px 16px', color: s.text2, font: `400 12px ${s.FONT}` }}>
                  {ref.referredDate ? new Date(ref.referredDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: s.text2, font: `400 12px ${s.FONT}` }}>
                  {ref.bookedDate ? new Date(ref.bookedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 100, font: `500 11px ${s.FONT}`, textTransform: 'capitalize', background: statusBg(ref.status), color: statusColor(ref.status) }}>{ref.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {ref.status === 'credited' ? (
                    <span style={{ font: `500 13px ${s.FONT}`, color: s.success }}>${(ref.referrerCredit || 0) + (ref.friendCredit || 0)}</span>
                  ) : (
                    <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {ref.status === 'pending' && (
                      <button onClick={() => markBooked(ref.id)} style={{ ...s.pillOutline, padding: '4px 10px', fontSize: 11 }}>Mark Booked</button>
                    )}
                    {ref.status === 'booked' && (
                      <button onClick={() => markCredited(ref.id)} style={{ ...s.pillAccent, padding: '4px 10px', fontSize: 11 }}>Apply Credit</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
            {filter === 'all' ? 'No referrals yet — generate a link to get started' : 'No referrals match this filter'}
          </div>
        )}
      </div>

      {/* Generate Link Modal */}
      {showGenerate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setShowGenerate(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...s.cardStyle, padding: 28, width: 420, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Generate Referral Link</div>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 16 }}>Select a client to generate their unique referral link</div>
            <input value={generateSearch} onChange={e => setGenerateSearch(e.target.value)} placeholder="Search clients..." style={{ ...s.input, marginBottom: 12 }} />
            <div style={{ display: 'grid', gap: 6 }}>
              {filteredPatients.map(p => {
                const code = `REF-${p.firstName.toUpperCase()}-${p.id.split('-')[1]}`;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: `1px solid ${s.borderLight}`, cursor: 'pointer' }}>
                    <div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{p.firstName} {p.lastName}</div>
                      <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>{code}</div>
                    </div>
                    <button onClick={() => generateLink(p)} style={{ ...s.pillAccent, padding: '5px 12px', fontSize: 11 }}>Copy Link</button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowGenerate(false)} style={{ ...s.pillGhost, marginTop: 14, width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setShowSettings(false)}>
          <div onClick={e => e.stopPropagation()} style={{ ...s.cardStyle, padding: 28, width: 380 }}>
            <div style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Referral Settings</div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Referrer Credit ($)</label>
              <input type="number" value={settings.referrerCredit} onChange={e => setSettings({ ...settings, referrerCredit: parseInt(e.target.value) || 0 })} style={s.input} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Friend Credit ($)</label>
              <input type="number" value={settings.friendCredit} onChange={e => setSettings({ ...settings, friendCredit: parseInt(e.target.value) || 0 })} style={s.input} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveSettings} style={{ ...s.pillAccent, flex: 1 }}>Save</button>
              <button onClick={() => setShowSettings(false)} style={{ ...s.pillGhost, flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 860px) {
          /* Global */
          .referrals-page h1 { font-size: 22px !important; margin-bottom: 4px !important; }
          .referrals-page > div:first-child p { font-size: 13px !important; }
          .referrals-page > div { margin-bottom: 20px !important; }

          /* KPIs: 2 columns */
          .referrals-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .referrals-kpi-grid > div {
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }

          /* Referral cards: full width */
          .referrals-page div[style*="padding: 20"] {
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }

          /* Table: horizontal scroll, hide less important columns */
          .referrals-table-wrap {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .referrals-table-wrap table { min-width: 600px; }
          .referrals-table-wrap th:nth-child(2),
          .referrals-table-wrap td:nth-child(2),
          .referrals-table-wrap th:nth-child(5),
          .referrals-table-wrap td:nth-child(5) {
            display: none !important;
          }

          /* Leaderboard: wrap */
          .referrals-page div[style*="overflowX: 'auto'"] > div {
            min-width: 160px !important;
          }

          /* Modals */
          .referrals-page div[style*="position: fixed"] > div {
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
          }

          /* Touch targets & inputs */
          .referrals-page button { min-height: 44px; }
          .referrals-page input, .referrals-page select { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
