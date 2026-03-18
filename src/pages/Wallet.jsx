import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getPatients, subscribe } from '../data/store';

const KEY = 'ms_wallet';

function get() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function initWallet() {
  if (localStorage.getItem('ms_wallet_init')) return;

  const patients = getPatients();
  if (patients.length === 0) return;

  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString(); };

  const entries = [
    // Gift cards
    { id: 'WL-1001', type: 'gift_card', patientId: patients[0]?.id, patientName: `${patients[0]?.firstName} ${patients[0]?.lastName}`, amount: 15000, balance: 11200, purchasedBy: 'Michael Johnson', recipientMessage: 'Happy Birthday! Treat yourself!', createdAt: d(-30), transactions: [
      { type: 'purchase', amount: 15000, date: d(-30), note: 'Gift card purchased' },
      { type: 'redeem', amount: -3800, date: d(-12), note: 'Applied to Reformer class' },
    ]},
    { id: 'WL-1002', type: 'gift_card', patientId: patients[3]?.id, patientName: `${patients[3]?.firstName} ${patients[3]?.lastName}`, amount: 20000, balance: 20000, purchasedBy: 'James Jones', recipientMessage: 'Merry Christmas!', createdAt: d(-15), transactions: [
      { type: 'purchase', amount: 20000, date: d(-15), note: 'Gift card purchased' },
    ]},
    { id: 'WL-1003', type: 'gift_card', patientId: patients[8]?.id, patientName: `${patients[8]?.firstName} ${patients[8]?.lastName}`, amount: 8500, balance: 0, purchasedBy: 'Lisa Harper', recipientMessage: '', createdAt: d(-60), transactions: [
      { type: 'purchase', amount: 8500, date: d(-60), note: 'Gift card purchased' },
      { type: 'redeem', amount: -8500, date: d(-20), note: 'Applied to Private Session' },
    ]},
    { id: 'WL-1004', type: 'gift_card', patientId: patients[14]?.id, patientName: `${patients[14]?.firstName} ${patients[14]?.lastName}`, amount: 10000, balance: 6200, purchasedBy: 'Online Purchase', recipientMessage: 'Enjoy your classes!', createdAt: d(-7), transactions: [
      { type: 'purchase', amount: 10000, date: d(-7), note: 'Gift card purchased' },
      { type: 'redeem', amount: -3800, date: d(-2), note: 'Applied to Barre Sculpt class' },
    ]},
    // Account credits
    { id: 'WL-1005', type: 'credit', patientId: patients[1]?.id, patientName: `${patients[1]?.firstName} ${patients[1]?.lastName}`, amount: 5000, balance: 5000, reason: 'Referral bonus', createdAt: d(-20), transactions: [
      { type: 'credit', amount: 5000, date: d(-20), note: 'Referral: brought in new member Ava Jones' },
    ]},
    { id: 'WL-1006', type: 'credit', patientId: patients[5]?.id, patientName: `${patients[5]?.firstName} ${patients[5]?.lastName}`, amount: 7500, balance: 7500, reason: 'Service adjustment', createdAt: d(-10), transactions: [
      { type: 'credit', amount: 7500, date: d(-10), note: 'Credit for service rescheduling inconvenience' },
    ]},
    { id: 'WL-1007', type: 'credit', patientId: patients[2]?.id, patientName: `${patients[2]?.firstName} ${patients[2]?.lastName}`, amount: 5000, balance: 1200, reason: 'Promotion', createdAt: d(-45), transactions: [
      { type: 'credit', amount: 5000, date: d(-45), note: 'Summer promotion credit' },
      { type: 'redeem', amount: -3800, date: d(-25), note: 'Applied to Tower class' },
    ]},
    { id: 'WL-1008', type: 'credit', patientId: patients[10]?.id, patientName: `${patients[10]?.firstName} ${patients[10]?.lastName}`, amount: 5000, balance: 5000, reason: 'Referral bonus', createdAt: d(-5), transactions: [
      { type: 'credit', amount: 5000, date: d(-5), note: 'Referral bonus: referred Charlotte Clark' },
    ]},
    { id: 'WL-1009', type: 'credit', patientId: patients[7]?.id, patientName: `${patients[7]?.firstName} ${patients[7]?.lastName}`, amount: 15000, balance: 15000, reason: 'Return / overcharge', createdAt: d(-3), transactions: [
      { type: 'credit', amount: 15000, date: d(-3), note: 'Overcharge correction on last visit' },
    ]},
    // Loyalty points
    { id: 'WL-1010', type: 'loyalty', patientId: patients[0]?.id, patientName: `${patients[0]?.firstName} ${patients[0]?.lastName}`, points: 495, lifetimePoints: 745, createdAt: d(-90), transactions: [
      { type: 'earn', points: 280, date: d(-90), note: '10-Class Pack purchase - $280 spent' },
      { type: 'earn', points: 85, date: d(-60), note: 'Private Session - $85 spent' },
      { type: 'earn', points: 210, date: d(-20), note: 'Monthly membership + grip socks - $210 spent' },
      { type: 'redeem', points: -250, date: d(-15), note: 'Redeemed for class discount' },
    ]},
    { id: 'WL-1011', type: 'loyalty', patientId: patients[1]?.id, patientName: `${patients[1]?.firstName} ${patients[1]?.lastName}`, points: 349, lifetimePoints: 349, createdAt: d(-60), transactions: [
      { type: 'earn', points: 199, date: d(-60), note: 'Unlimited Monthly membership - $199 spent' },
      { type: 'earn', points: 150, date: d(-30), note: '5-Class Pack + water bottle - $150 spent' },
    ]},
    { id: 'WL-1012', type: 'loyalty', patientId: patients[4]?.id, patientName: `${patients[4]?.firstName} ${patients[4]?.lastName}`, points: 619, lifetimePoints: 869, createdAt: d(-120), transactions: [
      { type: 'earn', points: 179, date: d(-120), note: 'Annual membership - $179 spent' },
      { type: 'earn', points: 340, date: d(-80), note: 'Private Sessions package - $340 spent' },
      { type: 'earn', points: 199, date: d(-40), note: 'Unlimited Monthly membership - $199 spent' },
      { type: 'redeem', points: -250, date: d(-20), note: 'Redeemed for class pack discount' },
    ]},
    { id: 'WL-1013', type: 'loyalty', patientId: patients[9]?.id, patientName: `${patients[9]?.firstName} ${patients[9]?.lastName}`, points: 149, lifetimePoints: 149, createdAt: d(-25), transactions: [
      { type: 'earn', points: 149, date: d(-25), note: '8-Class Pack - $149 spent' },
    ]},
    { id: 'WL-1014', type: 'loyalty', patientId: patients[12]?.id, patientName: `${patients[12]?.firstName} ${patients[12]?.lastName}`, points: 276, lifetimePoints: 276, createdAt: d(-70), transactions: [
      { type: 'earn', points: 179, date: d(-70), note: 'Annual Unlimited membership - $179 spent' },
      { type: 'earn', points: 97, date: d(-35), note: 'Private Session + Grip Socks - $97 spent' },
    ]},
  ];

  save(entries);
  localStorage.setItem('ms_wallet_init', 'true');
}

export default function Wallet() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { initWallet(); setTick(t => t + 1); }, []);

  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddGiftCard, setShowAddGiftCard] = useState(false);
  const [showApplyCredit, setShowApplyCredit] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Gift card form
  const [gcForm, setGcForm] = useState({ amount: '', purchasedBy: '', recipientId: '', message: '' });
  // Credit form
  const [crForm, setCrForm] = useState({ patientId: '', amount: '', reason: '' });

  const entries = get();
  const patients = getPatients();

  // KPIs
  const giftCards = entries.filter(e => e.type === 'gift_card');
  const credits = entries.filter(e => e.type === 'credit');
  const loyalties = entries.filter(e => e.type === 'loyalty');

  const totalGiftBalance = giftCards.reduce((sum, e) => sum + (e.balance || 0), 0);
  const totalCredits = credits.reduce((sum, e) => sum + (e.balance || 0), 0);
  const totalPoints = loyalties.reduce((sum, e) => sum + (e.points || 0), 0);

  // Build patient wallet view
  const patientWallets = {};
  entries.forEach(e => {
    if (!e.patientId) return;
    if (!patientWallets[e.patientId]) {
      patientWallets[e.patientId] = { patientId: e.patientId, patientName: e.patientName, giftBalance: 0, creditBalance: 0, loyaltyPoints: 0, entries: [] };
    }
    const pw = patientWallets[e.patientId];
    pw.entries.push(e);
    if (e.type === 'gift_card') pw.giftBalance += e.balance || 0;
    if (e.type === 'credit') pw.creditBalance += e.balance || 0;
    if (e.type === 'loyalty') pw.loyaltyPoints += e.points || 0;
  });
  const walletList = Object.values(patientWallets).sort((a, b) => (b.giftBalance + b.creditBalance) - (a.giftBalance + a.creditBalance));

  // Filtered entries
  const filtered = entries.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.patientName?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q) || e.reason?.toLowerCase().includes(q) || e.purchasedBy?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddGiftCard = () => {
    if (!gcForm.recipientId || !gcForm.amount) return;
    const pat = patients.find(p => p.id === gcForm.recipientId);
    if (!pat) return;
    const amountCents = Math.round(parseFloat(gcForm.amount) * 100);
    const all = get();
    all.unshift({
      id: `WL-${Date.now()}`,
      type: 'gift_card',
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      amount: amountCents,
      balance: amountCents,
      purchasedBy: gcForm.purchasedBy || 'Walk-in',
      recipientMessage: gcForm.message,
      createdAt: new Date().toISOString(),
      transactions: [{ type: 'purchase', amount: amountCents, date: new Date().toISOString(), note: 'Gift card purchased' }],
    });
    save(all);
    setShowAddGiftCard(false);
    setGcForm({ amount: '', purchasedBy: '', recipientId: '', message: '' });
    setTick(t => t + 1);
  };

  const handleApplyCredit = () => {
    if (!crForm.patientId || !crForm.amount) return;
    const pat = patients.find(p => p.id === crForm.patientId);
    if (!pat) return;
    const amountCents = Math.round(parseFloat(crForm.amount) * 100);
    const all = get();
    all.unshift({
      id: `WL-${Date.now()}`,
      type: 'credit',
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      amount: amountCents,
      balance: amountCents,
      reason: crForm.reason || 'Manual credit',
      createdAt: new Date().toISOString(),
      transactions: [{ type: 'credit', amount: amountCents, date: new Date().toISOString(), note: crForm.reason || 'Manual credit applied' }],
    });
    save(all);
    setShowApplyCredit(false);
    setCrForm({ patientId: '', amount: '', reason: '' });
    setTick(t => t + 1);
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const typeLabel = (t) => ({ gift_card: 'Gift Card', credit: 'Credit', loyalty: 'Loyalty' }[t] || t);
  const typeColor = (t) => ({
    gift_card: { bg: '#F5F3FF', color: '#7C3AED' },
    credit: { bg: '#FFF7ED', color: '#D97706' },
    loyalty: { bg: '#FDF2F8', color: '#BE185D' },
  }[t] || { bg: '#F5F5F5', color: s.text2 });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Wallet</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Gift cards, credits, and loyalty points — unified member balances</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowApplyCredit(true)} style={s.pillOutline}>Apply Credit</button>
          <button onClick={() => setShowAddGiftCard(true)} style={s.pillAccent}>+ Add Gift Card</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Gift Card Balance', value: fmt(totalGiftBalance), sub: `${giftCards.length} cards`, color: '#7C3AED' },
          { label: 'Credits Outstanding', value: fmt(totalCredits), sub: `${credits.length} credits`, color: '#D97706' },
          { label: 'Loyalty Points', value: totalPoints.toLocaleString(), sub: `${loyalties.length} members`, color: '#BE185D' },
          { label: 'Total Outstanding', value: fmt(totalGiftBalance + totalCredits), sub: 'gift cards + credits', color: s.text },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ font: `600 22px ${s.FONT}`, color: k.color }}>{k.value}</div>
            <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[['overview', 'Member Wallets'], ['all', 'All Entries'], ['gift_card', 'Gift Cards'], ['credit', 'Credits'], ['loyalty', 'Loyalty']].map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setTypeFilter(id === 'overview' || id === 'all' ? 'all' : id); }} style={{
            ...s.pill, padding: '7px 14px', fontSize: 12,
            background: tab === id ? s.accent : 'transparent',
            color: tab === id ? s.accentText : s.text2,
            border: tab === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Member Wallets (combined view) ── */}
      {tab === 'overview' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." style={{ ...s.input, maxWidth: 280, marginBottom: 16 }} />
          <div style={{ display: 'grid', gap: 8 }}>
            {walletList.filter(w => !search || w.patientName.toLowerCase().includes(search.toLowerCase())).map(w => (
              <div key={w.patientId} style={{ ...s.cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setSelectedEntry(selectedEntry === w.patientId ? null : w.patientId)}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: s.accentLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `500 14px ${s.FONT}`, color: s.accent,
                }}>{w.patientName?.split(' ').map(n => n[0]).join('')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: `500 14px ${s.FONT}`, color: s.text, marginBottom: 4 }}>{w.patientName}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {w.giftBalance > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: `400 12px ${s.FONT}`, color: '#7C3AED' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }} />
                        Gift: {fmt(w.giftBalance)}
                      </span>
                    )}
                    {w.creditBalance > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: `400 12px ${s.FONT}`, color: '#D97706' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} />
                        Credit: {fmt(w.creditBalance)}
                      </span>
                    )}
                    {w.loyaltyPoints > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: `400 12px ${s.FONT}`, color: '#BE185D' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BE185D' }} />
                        {w.loyaltyPoints.toLocaleString()} pts
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ font: `600 18px ${s.FONT}`, color: s.text }}>{fmt(w.giftBalance + w.creditBalance)}</div>
                  <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>total balance</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round" style={{ transform: selectedEntry === w.patientId ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            ))}
            {walletList.length === 0 && (
              <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
                No wallet entries yet
              </div>
            )}
          </div>

          {/* Expanded patient transaction history */}
          {selectedEntry && patientWallets[selectedEntry] && (
            <div style={{ ...s.cardStyle, marginTop: 8, padding: '20px', animation: 'fadeIn 0.2s' }}>
              <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Transaction History — {patientWallets[selectedEntry].patientName}</div>
              {patientWallets[selectedEntry].entries.map(entry => (
                <div key={entry.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100, font: `500 9px ${s.FONT}`, textTransform: 'uppercase',
                      background: typeColor(entry.type).bg, color: typeColor(entry.type).color,
                    }}>{typeLabel(entry.type)}</span>
                    {entry.type === 'loyalty' ? (
                      <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{entry.points?.toLocaleString()} pts available</span>
                    ) : (
                      <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>Balance: {fmt(entry.balance)}</span>
                    )}
                    <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{entry.reason || entry.purchasedBy || ''}</span>
                  </div>
                  {entry.transactions?.map((tx, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, paddingLeft: 12, marginBottom: 4, borderLeft: `2px solid ${typeColor(entry.type).bg}` }}>
                      <span style={{ font: `400 10px ${s.MONO}`, color: s.text3, minWidth: 75 }}>{fmtDate(tx.date)}</span>
                      <span style={{ font: `400 12px ${s.FONT}`, color: s.text2, flex: 1 }}>{tx.note}</span>
                      <span style={{ font: `500 12px ${s.MONO}`, color: (tx.amount || 0) >= 0 && (tx.points || 0) >= 0 ? s.success : s.danger, flexShrink: 0 }}>
                        {entry.type === 'loyalty'
                          ? `${(tx.points || 0) >= 0 ? '+' : ''}${tx.points} pts`
                          : `${(tx.amount || 0) >= 0 ? '+' : ''}${fmt(Math.abs(tx.amount || 0))}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── All Entries / Filtered Lists ── */}
      {tab !== 'overview' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..." style={{ ...s.input, maxWidth: 280, marginBottom: 16 }} />
          <div style={s.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                    {['Member', 'Type', 'Original', 'Balance / Points', 'Details', 'Created'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(entry => {
                    const tc = typeColor(entry.type);
                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                        <td style={{ padding: '14px', font: `500 13px ${s.FONT}`, color: s.text }}>
                          {entry.patientName}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 100, font: `500 10px ${s.FONT}`, textTransform: 'uppercase', background: tc.bg, color: tc.color }}>{typeLabel(entry.type)}</span>
                        </td>
                        <td style={{ padding: '14px', font: `400 13px ${s.MONO}`, color: s.text2 }}>
                          {entry.type === 'loyalty' ? `${entry.lifetimePoints?.toLocaleString()} pts` : fmt(entry.amount || 0)}
                        </td>
                        <td style={{ padding: '14px' }}>
                          {entry.type === 'loyalty' ? (
                            <span style={{ font: `600 14px ${s.MONO}`, color: '#BE185D' }}>{entry.points?.toLocaleString()} pts</span>
                          ) : (
                            <span style={{ font: `600 14px ${s.MONO}`, color: entry.balance > 0 ? s.text : s.text3 }}>{fmt(entry.balance || 0)}</span>
                          )}
                          {entry.type !== 'loyalty' && entry.balance === 0 && (
                            <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 100, font: `500 9px ${s.FONT}`, background: '#F5F5F5', color: s.text3 }}>REDEEMED</span>
                          )}
                        </td>
                        <td style={{ padding: '14px', font: `400 12px ${s.FONT}`, color: s.text3, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.type === 'gift_card' && `From: ${entry.purchasedBy}${entry.recipientMessage ? ` — "${entry.recipientMessage}"` : ''}`}
                          {entry.type === 'credit' && (entry.reason || '—')}
                          {entry.type === 'loyalty' && `${entry.transactions?.length || 0} transactions`}
                        </td>
                        <td style={{ padding: '14px', font: `400 12px ${s.FONT}`, color: s.text3 }}>{fmtDate(entry.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ padding: 48, textAlign: 'center', font: `400 14px ${s.FONT}`, color: s.text3 }}>
                  No entries match this filter
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Gift Card Modal ── */}
      {showAddGiftCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowAddGiftCard(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Add Gift Card</h2>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Create a new gift card and assign it to a member</p>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={s.label}>Recipient</label>
                <select value={gcForm.recipientId} onChange={e => setGcForm({ ...gcForm, recipientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select a member...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Amount ($)</label>
                <input type="number" step="0.01" min="0" value={gcForm.amount} onChange={e => setGcForm({ ...gcForm, amount: e.target.value })} style={s.input} placeholder="e.g., 250.00" />
              </div>
              <div>
                <label style={s.label}>Purchased By</label>
                <input value={gcForm.purchasedBy} onChange={e => setGcForm({ ...gcForm, purchasedBy: e.target.value })} style={s.input} placeholder="Name of purchaser" />
              </div>
              <div>
                <label style={s.label}>Message (optional)</label>
                <input value={gcForm.message} onChange={e => setGcForm({ ...gcForm, message: e.target.value })} style={s.input} placeholder="e.g., Happy Birthday!" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddGiftCard(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleAddGiftCard} style={{ ...s.pillAccent, opacity: gcForm.recipientId && gcForm.amount ? 1 : 0.5 }}>Add Gift Card</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply Credit Modal ── */}
      {showApplyCredit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowApplyCredit(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Apply Credit</h2>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Add account credit to a member's wallet</p>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={s.label}>Member</label>
                <select value={crForm.patientId} onChange={e => setCrForm({ ...crForm, patientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select a member...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Amount ($)</label>
                <input type="number" step="0.01" min="0" value={crForm.amount} onChange={e => setCrForm({ ...crForm, amount: e.target.value })} style={s.input} placeholder="e.g., 50.00" />
              </div>
              <div>
                <label style={s.label}>Reason</label>
                <select value={crForm.reason} onChange={e => setCrForm({ ...crForm, reason: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option value="">Select a reason...</option>
                  <option value="Referral bonus">Referral bonus</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Service adjustment">Service adjustment</option>
                  <option value="Return / overcharge">Return / overcharge</option>
                  <option value="Loyalty reward">Loyalty reward</option>
                  <option value="Goodwill credit">Goodwill credit</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowApplyCredit(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleApplyCredit} style={{ ...s.pillAccent, opacity: crForm.patientId && crForm.amount ? 1 : 0.5 }}>Apply Credit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
