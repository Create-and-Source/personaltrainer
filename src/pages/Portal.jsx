// Client Portal — standalone client-facing app
import { useState, useEffect, useRef } from 'react';
import {
  getPatients, getAppointments, getServices,
  getClassPackages, subscribe,
} from '../data/store';

/* ── Standalone Design Tokens ── */
const FONT = "'Figtree', -apple-system, BlinkMacSystemFont, sans-serif";
const HEADING = "'Poppins', 'Figtree', sans-serif";
const MONO = "'Source Code Pro', 'SF Mono', monospace";
const ACCENT = '#0E7A82';
const ACCENT_LIGHT = 'rgba(14,122,130,0.1)';
const DARK_GRAD = 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)';
const DARK_BG = '#1A1A2E';
const CARD_BG = '#FFFFFF';
const CARD_BORDER = '#F0F0F5';
const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.06)';
const TEXT = '#1A1A2E';
const TEXT2 = '#6B7280';
const TEXT3 = '#9CA3AF';
const SUCCESS = '#22C55E';
const WARNING = '#EAB308';

/* ── Helpers ── */
const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d + (d.length === 10 ? 'T12:00:00' : ''));
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const fmtWeekday = (d) => {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};
const today = () => new Date().toISOString().slice(0, 10);
const weeksAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n * 7); return d.toISOString().slice(0, 10); };

/* ── Keyframe Injection ── */
const ANIM_ID = 'portal-client-anims-v2';
if (typeof document !== 'undefined' && !document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes ptFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes ptPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.04); } }
    .pt-fadeUp { animation: ptFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
    .pt-fadeUp-1 { animation-delay: 0.05s; }
    .pt-fadeUp-2 { animation-delay: 0.1s; }
    .pt-fadeUp-3 { animation-delay: 0.15s; }
    .pt-fadeUp-4 { animation-delay: 0.2s; }
    .pt-fadeUp-5 { animation-delay: 0.25s; }
    .portal-scroll::-webkit-scrollbar { display:none; }
    @media (max-width:640px) {
      .portal-page { padding-bottom: 80px !important; }
      .portal-grid-2 { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Seed Progress Data ── */
function getSeedProgress(clientId) {
  const key = `ms_progress_${clientId}`;
  const existing = localStorage.getItem(key);
  if (existing) try { return JSON.parse(existing); } catch {}
  const seeds = {
    'CLT-1000': { start: 195, end: 183, bfStart: 22, bfEnd: 17 },
    'CLT-1001': { start: 145, end: 138, bfStart: 28, bfEnd: 23 },
    'CLT-1004': { start: 170, end: 175, bfStart: 18, bfEnd: 15 },
  };
  const se = seeds[clientId];
  if (!se) return null;
  const data = [];
  for (let i = 0; i <= 12; i++) {
    const p = i / 12;
    const w = se.start + (se.end - se.start) * p + (Math.sin(i * 1.5) * 0.8);
    const bf = se.bfStart + (se.bfEnd - se.bfStart) * p + (Math.sin(i * 1.3) * 0.3);
    data.push({ date: weeksAgo(12 - i), weight: Math.round(w * 10) / 10, bodyFat: Math.round(bf * 10) / 10 });
  }
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

function getSeedPRs(clientId) {
  const key = 'ms_prs';
  const existing = localStorage.getItem(key);
  let all;
  try { all = existing ? JSON.parse(existing) : null; } catch { all = null; }
  if (all) return all.filter(pr => pr.clientId === clientId);
  const d = (off) => { const dt = new Date(); dt.setDate(dt.getDate() + off); return dt.toISOString().slice(0, 10); };
  const allPRs = [
    { id: 'PR-1', clientId: 'CLT-1000', exercise: 'Bench Press', value: 225, unit: 'lbs', date: d(-8), previousValue: 215 },
    { id: 'PR-2', clientId: 'CLT-1000', exercise: 'Squat', value: 315, unit: 'lbs', date: d(-22), previousValue: 295 },
    { id: 'PR-3', clientId: 'CLT-1000', exercise: 'Deadlift', value: 385, unit: 'lbs', date: d(-5), previousValue: 365 },
    { id: 'PR-4', clientId: 'CLT-1001', exercise: 'Hip Thrust', value: 185, unit: 'lbs', date: d(-3), previousValue: 155 },
    { id: 'PR-5', clientId: 'CLT-1001', exercise: 'Goblet Squat', value: 60, unit: 'lbs', date: d(-12), previousValue: 45 },
    { id: 'PR-6', clientId: 'CLT-1004', exercise: 'Leg Press', value: 360, unit: 'lbs', date: d(-6), previousValue: 320 },
    { id: 'PR-7', clientId: 'CLT-1004', exercise: 'Lat Pulldown', value: 150, unit: 'lbs', date: d(-15), previousValue: 130 },
  ];
  localStorage.setItem(key, JSON.stringify(allPRs));
  return allPRs.filter(pr => pr.clientId === clientId);
}

function getSeedMeasurements(clientId) {
  const key = `ms_measurements_${clientId}`;
  const existing = localStorage.getItem(key);
  if (existing) try { return JSON.parse(existing); } catch {}
  const seeds = {
    'CLT-1000': { chest: [42, 43, 43.5], waist: [36, 34.5, 33], hips: [40, 39.5, 39], arms: [15, 15.5, 16] },
    'CLT-1001': { chest: [36, 35.5, 35], waist: [30, 28.5, 27], hips: [38, 37, 36], arms: [12, 12, 12.5] },
  };
  return seeds[clientId] || null;
}

/* ── Seed Nutrition Data ── */
function getSeedNutrition(clientId) {
  const seeds = {
    'CLT-1000': { calories: { target: 2800, current: 2650 }, protein: { target: 200, current: 185 }, carbs: { target: 300, current: 280 }, fat: { target: 90, current: 85 },
      meals: [
        { time: '7:00 AM', name: 'Oats + Protein Shake', cal: 520, protein: 45, carbs: 65, fat: 10 },
        { time: '10:30 AM', name: 'Greek Yogurt + Berries', cal: 280, protein: 25, carbs: 30, fat: 8 },
        { time: '1:00 PM', name: 'Chicken Rice Bowl', cal: 680, protein: 50, carbs: 75, fat: 18 },
        { time: '4:00 PM', name: 'Pre-Workout Banana + PB', cal: 320, protein: 10, carbs: 40, fat: 16 },
        { time: '7:30 PM', name: 'Salmon + Sweet Potato', cal: 620, protein: 42, carbs: 55, fat: 22 },
        { time: '9:00 PM', name: 'Casein Shake', cal: 230, protein: 30, carbs: 15, fat: 5 },
      ],
    },
    'CLT-1001': { calories: { target: 1800, current: 1720 }, protein: { target: 130, current: 118 }, carbs: { target: 180, current: 170 }, fat: { target: 60, current: 55 },
      meals: [
        { time: '8:00 AM', name: 'Egg White Omelet + Toast', cal: 380, protein: 32, carbs: 30, fat: 10 },
        { time: '12:00 PM', name: 'Turkey Meatball Salad', cal: 450, protein: 38, carbs: 25, fat: 18 },
        { time: '3:30 PM', name: 'Protein Bar', cal: 220, protein: 20, carbs: 25, fat: 8 },
        { time: '6:30 PM', name: 'Grilled Chicken + Veggies', cal: 520, protein: 42, carbs: 35, fat: 16 },
        { time: '8:30 PM', name: 'Cottage Cheese + Almonds', cal: 150, protein: 18, carbs: 8, fat: 6 },
      ],
    },
  };
  return seeds[clientId] || {
    calories: { target: 2200, current: 2050 }, protein: { target: 160, current: 140 }, carbs: { target: 240, current: 210 }, fat: { target: 75, current: 68 },
    meals: [
      { time: '7:30 AM', name: 'Breakfast', cal: 450, protein: 30, carbs: 50, fat: 12 },
      { time: '12:00 PM', name: 'Lunch', cal: 600, protein: 45, carbs: 60, fat: 20 },
      { time: '6:00 PM', name: 'Dinner', cal: 550, protein: 40, carbs: 50, fat: 18 },
    ],
  };
}

/* ── Chat Data ── */
function getSeedChat(clientName) {
  return [
    { id: 'cm1', from: 'trainer', text: `Hey ${clientName.split(' ')[0]}! Great session yesterday. How are you feeling today?`, ts: '2026-03-17T09:00:00' },
    { id: 'cm2', from: 'client', text: 'A little sore but in a good way! Those RDLs were intense', ts: '2026-03-17T09:15:00' },
    { id: 'cm3', from: 'trainer', text: 'That means you pushed the right muscles. Make sure to foam roll tonight and get 7+ hours of sleep.', ts: '2026-03-17T09:20:00' },
    { id: 'cm4', from: 'client', text: 'Will do! Also wanted to ask about adding cardio on off days?', ts: '2026-03-18T08:30:00' },
    { id: 'cm5', from: 'trainer', text: '20-30 min of low-intensity steady state would be perfect. Walking, cycling, or swimming. Nothing that hammers your legs before our Thursday session.', ts: '2026-03-18T08:45:00' },
  ];
}

/* ── SVG Icons ── */
const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const DumbbellIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6 12h12M2 9v6M22 9v6M4 8v8M20 8v8" />
  </svg>
);
const ChartIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const AppleIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.5 2 6 5 6 9c0 6 6 13 6 13s6-7 6-13c0-4-2.5-7-6-7z" />
    <path d="M12 2c1 1 2 2 2 4" />
  </svg>
);
const ChatBubbleIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const FireIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#EAB308" stroke="none">
    <path d="M12 23c-4.97 0-9-3.58-9-8 0-4 3.5-7.5 4-8 .5 2.5 2 4.5 3 5.5 1-5 4-8 5-9.5.5 2 2 4.5 3 6 1-1.5 2-3 2-5 2 2.5 1 5 1 7 0 4.42-4.03 8-9 8z" />
  </svg>
);
const TrophyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H3V5h3M18 9h3V5h-3M12 15v4M8 19h8" />
    <path d="M6 5a6 6 0 0 0 12 0" />
  </svg>
);
const SendIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── Card Component ── */
const Card = ({ children, style, className }) => (
  <div className={className} style={{
    background: CARD_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 16,
    boxShadow: CARD_SHADOW,
    padding: 20,
    ...style,
  }}>
    {children}
  </div>
);

/* ── Macro Ring (SVG donut) ── */
const MacroRing = ({ label, current, target, color, size = 80 }) => {
  const pct = Math.min(current / target, 1);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F0F5" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ marginTop: -size + 8, width: size, textAlign: 'center', paddingTop: size / 2 - 14 }}>
        <div style={{ font: `700 16px ${MONO}`, color: TEXT }}>{current}</div>
        <div style={{ font: `400 10px ${FONT}`, color: TEXT3 }}>/ {target}g</div>
      </div>
      <div style={{ font: `500 11px ${FONT}`, color: TEXT2, marginTop: size / 2 - 16 }}>{label}</div>
    </div>
  );
};

/* ── Mini line chart (SVG) ── */
const MiniChart = ({ data, width = 280, height = 120 }) => {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.weight);
  const min = Math.min(...vals) - 2;
  const max = Math.max(...vals) + 2;
  const range = max - min || 1;
  const px = (i) => (i / (vals.length - 1)) * (width - 20) + 10;
  const py = (v) => height - 16 - ((v - min) / range) * (height - 32);
  const points = vals.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const areaPoints = `${px(0)},${height - 16} ${points} ${px(vals.length - 1)},${height - 16}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.2" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline points={points} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r={i === vals.length - 1 ? 5 : 3}
          fill={i === vals.length - 1 ? ACCENT : '#fff'} stroke={ACCENT} strokeWidth="2" />
      ))}
      {/* Start and end labels */}
      <text x={px(0)} y={height - 2} textAnchor="start" style={{ font: `400 9px ${MONO}`, fill: TEXT3 }}>
        {fmtDate(data[0].date)}
      </text>
      <text x={px(vals.length - 1)} y={height - 2} textAnchor="end" style={{ font: `400 9px ${MONO}`, fill: TEXT3 }}>
        {fmtDate(data[data.length - 1].date)}
      </text>
    </svg>
  );
};

/* ═══════════════════════════════════
   MAIN PORTAL COMPONENT
   ═══════════════════════════════════ */

export default function Portal() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const patients = getPatients();
  const appointments = getAppointments();
  const services = getServices();
  const programs = getClassPackages();

  // Client selector
  const topClients = patients.slice(0, 8);
  const [selectedClientId, setSelectedClientId] = useState(topClients[0]?.id || null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const client = patients.find(p => p.id === selectedClientId) || topClients[0];
  const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client';

  // Bottom tab
  const [activeTab, setActiveTab] = useState('home');

  // Chat state
  const [chatMessages, setChatMessages] = useState(() => client ? getSeedChat(clientName) : []);
  const [chatDraft, setChatDraft] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (client) setChatMessages(getSeedChat(`${client.firstName} ${client.lastName}`));
  }, [selectedClientId]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!client) return <div style={{ padding: 40, fontFamily: FONT, color: TEXT3 }}>No clients found. Add clients first.</div>;

  // Derived data
  const clientAppts = appointments.filter(a => a.patientId === client.id);
  const todayAppts = clientAppts.filter(a => a.date === today());
  const upcomingAppts = clientAppts.filter(a => a.date >= today() && a.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 3);
  const clientPrograms = programs.filter(p => p.patientId === client.id);
  const progressData = getSeedProgress(client.id);
  const prs = getSeedPRs(client.id);
  const measurements = getSeedMeasurements(client.id);
  const nutrition = getSeedNutrition(client.id);

  // Streak calc
  const completedDates = [...new Set(clientAppts.filter(a => a.status === 'completed').map(a => a.date))].sort().reverse();
  let streak = 0;
  if (completedDates.length > 0) {
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() - i);
      const ds = check.toISOString().slice(0, 10);
      if (completedDates.includes(ds)) streak++;
      else if (i > 0) break;
    }
  }
  const streakCount = Math.max(streak, 3); // min display 3

  const sendChat = () => {
    if (!chatDraft.trim()) return;
    setChatMessages(prev => [...prev, { id: `cm${Date.now()}`, from: 'client', text: chatDraft.trim(), ts: new Date().toISOString() }]);
    setChatDraft('');
  };

  const getServiceName = (svcId) => {
    const svc = services.find(s => s.id === svcId);
    return svc ? svc.name : 'Session';
  };

  // ── Tab Content ──

  const renderHome = () => (
    <div className="portal-page pt-fadeUp" style={{ padding: '20px 16px 100px' }}>
      {/* Greeting */}
      <div className="pt-fadeUp pt-fadeUp-1" style={{ marginBottom: 24 }}>
        <h2 style={{ font: `700 24px ${HEADING}`, color: TEXT, margin: '0 0 4px' }}>
          Hey {client.firstName}
        </h2>
        <p style={{ font: `400 14px ${FONT}`, color: TEXT2, margin: 0 }}>
          {todayAppts.length > 0 ? `You have ${todayAppts.length} session${todayAppts.length > 1 ? 's' : ''} today` : "No sessions today — rest up!"}
        </p>
      </div>

      {/* Streak + Quick Stats */}
      <div className="pt-fadeUp pt-fadeUp-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <Card style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><FireIcon /></div>
          <div style={{ font: `700 20px ${MONO}`, color: TEXT }}>{streakCount}</div>
          <div style={{ font: `400 10px ${FONT}`, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day Streak</div>
        </Card>
        <Card style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ font: `700 20px ${MONO}`, color: TEXT }}>{client.visitCount || 0}</div>
          <div style={{ font: `400 10px ${FONT}`, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>Sessions</div>
        </Card>
        <Card style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ font: `700 20px ${MONO}`, color: TEXT }}>{prs.length}</div>
          <div style={{ font: `400 10px ${FONT}`, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>PRs</div>
        </Card>
      </div>

      {/* Today's Workout */}
      {todayAppts.length > 0 && (
        <Card className="pt-fadeUp pt-fadeUp-3" style={{ marginBottom: 16 }}>
          <div style={{ font: `600 12px ${FONT}`, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Today's Session
          </div>
          {todayAppts.map(appt => (
            <div key={appt.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: `1px solid ${CARD_BORDER}`,
            }}>
              <div>
                <div style={{ font: `600 14px ${FONT}`, color: TEXT }}>{getServiceName(appt.serviceId)}</div>
                <div style={{ font: `400 12px ${MONO}`, color: TEXT2 }}>{fmtTime(appt.time)} - {appt.duration}min</div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 100,
                background: appt.status === 'confirmed' ? `${SUCCESS}18` : `${WARNING}18`,
                color: appt.status === 'confirmed' ? SUCCESS : WARNING,
                font: `500 11px ${FONT}`, textTransform: 'capitalize',
              }}>{appt.status}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Upcoming Sessions */}
      {upcomingAppts.length > 0 && (
        <Card className="pt-fadeUp pt-fadeUp-4" style={{ marginBottom: 16 }}>
          <div style={{ font: `600 12px ${FONT}`, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Upcoming
          </div>
          {upcomingAppts.map(appt => (
            <div key={appt.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: `1px solid ${CARD_BORDER}`,
            }}>
              <div>
                <div style={{ font: `500 13px ${FONT}`, color: TEXT }}>{getServiceName(appt.serviceId)}</div>
                <div style={{ font: `400 12px ${MONO}`, color: TEXT3 }}>{fmtWeekday(appt.date)} at {fmtTime(appt.time)}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Trainer Card */}
      <Card className="pt-fadeUp pt-fadeUp-5" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: DARK_GRAD,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: FONT,
        }}>MC</div>
        <div>
          <div style={{ font: `600 14px ${FONT}`, color: TEXT }}>Marcus Cole</div>
          <div style={{ font: `400 12px ${FONT}`, color: TEXT2 }}>Head Trainer / Owner</div>
          <div style={{ font: `400 11px ${FONT}`, color: ACCENT, marginTop: 2 }}>NASM-CPT, CSCS</div>
        </div>
      </Card>
    </div>
  );

  const renderWorkouts = () => {
    const prog = clientPrograms[0];
    const completedCount = prog ? prog.sessions.filter(s => s.status === 'completed').length : 0;
    const totalCount = prog ? prog.sessions.length : 0;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
      <div className="portal-page pt-fadeUp" style={{ padding: '20px 16px 100px' }}>
        <h2 style={{ font: `700 20px ${HEADING}`, color: TEXT, margin: '0 0 16px' }}>Workouts</h2>

        {prog ? (
          <>
            {/* Program card */}
            <Card className="pt-fadeUp pt-fadeUp-1" style={{ marginBottom: 16 }}>
              <div style={{ font: `600 16px ${HEADING}`, color: TEXT, marginBottom: 4 }}>{prog.name}</div>
              <div style={{ font: `400 12px ${FONT}`, color: TEXT2, marginBottom: 14 }}>
                {completedCount} of {totalCount} sessions complete
              </div>
              {/* Progress bar */}
              <div style={{ height: 8, borderRadius: 4, background: '#F0F0F5', overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', borderRadius: 4, background: ACCENT, width: `${pct}%`, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ font: `500 11px ${MONO}`, color: ACCENT, textAlign: 'right' }}>{pct}%</div>
            </Card>

            {/* Session list */}
            <div style={{ font: `600 12px ${FONT}`, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Sessions
            </div>
            {prog.sessions.map((session, i) => (
              <Card key={i} className={`pt-fadeUp pt-fadeUp-${Math.min(i + 2, 5)}`} style={{ marginBottom: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ font: `500 14px ${FONT}`, color: TEXT }}>{session.name}</div>
                    <div style={{ font: `400 12px ${MONO}`, color: TEXT3, marginTop: 2 }}>{fmtWeekday(session.date)}</div>
                    {session.notes && (
                      <div style={{ font: `400 12px ${FONT}`, color: TEXT2, marginTop: 6 }}>{session.notes}</div>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 100, flexShrink: 0,
                    background: session.status === 'completed' ? `${SUCCESS}18` :
                      session.status === 'in-progress' ? `${ACCENT}14` : '#F5F5F5',
                    color: session.status === 'completed' ? SUCCESS :
                      session.status === 'in-progress' ? ACCENT : TEXT3,
                    font: `500 10px ${FONT}`, textTransform: 'capitalize',
                  }}>{session.status === 'in-progress' ? 'In Progress' : session.status}</span>
                </div>
              </Card>
            ))}
          </>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: 20, color: TEXT3, fontFamily: FONT }}>
              No active program. Ask your trainer to set one up!
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderProgress = () => (
    <div className="portal-page pt-fadeUp" style={{ padding: '20px 16px 100px' }}>
      <h2 style={{ font: `700 20px ${HEADING}`, color: TEXT, margin: '0 0 16px' }}>Progress</h2>

      {/* Weight Chart */}
      {progressData && (
        <Card className="pt-fadeUp pt-fadeUp-1" style={{ marginBottom: 16 }}>
          <div style={{ font: `600 14px ${FONT}`, color: TEXT, marginBottom: 4 }}>Weight Trend</div>
          <div style={{ font: `400 12px ${FONT}`, color: TEXT2, marginBottom: 14 }}>
            {progressData[0].weight} lbs → {progressData[progressData.length - 1].weight} lbs
          </div>
          <div style={{ overflowX: 'auto' }}>
            <MiniChart data={progressData} width={Math.max(280, (progressData.length - 1) * 24 + 40)} height={130} />
          </div>
        </Card>
      )}

      {/* PRs */}
      {prs.length > 0 && (
        <Card className="pt-fadeUp pt-fadeUp-2" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrophyIcon />
            <span style={{ font: `600 14px ${FONT}`, color: TEXT }}>Personal Records</span>
          </div>
          {prs.map(pr => (
            <div key={pr.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: `1px solid ${CARD_BORDER}`,
            }}>
              <div>
                <div style={{ font: `500 14px ${FONT}`, color: TEXT }}>{pr.exercise}</div>
                <div style={{ font: `400 11px ${MONO}`, color: TEXT3 }}>{fmtDate(pr.date)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ font: `700 16px ${MONO}`, color: ACCENT }}>{pr.value} {pr.unit}</div>
                {pr.previousValue && (
                  <div style={{ font: `400 11px ${MONO}`, color: SUCCESS }}>+{pr.value - pr.previousValue} {pr.unit}</div>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Measurements */}
      {measurements && (
        <Card className="pt-fadeUp pt-fadeUp-3">
          <div style={{ font: `600 14px ${FONT}`, color: TEXT, marginBottom: 12 }}>Measurements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {Object.entries(measurements).map(([key, vals]) => (
              <div key={key} style={{
                padding: 12, borderRadius: 10,
                background: '#FAFAFA', border: `1px solid ${CARD_BORDER}`,
              }}>
                <div style={{ font: `400 11px ${FONT}`, color: TEXT3, textTransform: 'capitalize', marginBottom: 4 }}>{key}</div>
                <div style={{ font: `700 16px ${MONO}`, color: TEXT }}>{vals[vals.length - 1]}"</div>
                {vals.length > 1 && (
                  <div style={{
                    font: `400 10px ${MONO}`,
                    color: vals[vals.length - 1] <= vals[0] ? SUCCESS : TEXT3,
                  }}>
                    {vals[vals.length - 1] <= vals[0] ? '' : '+'}{(vals[vals.length - 1] - vals[0]).toFixed(1)}" from start
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!progressData && prs.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: 20, color: TEXT3, fontFamily: FONT }}>
            Progress data will appear after a few sessions.
          </div>
        </Card>
      )}
    </div>
  );

  const renderNutrition = () => {
    const n = nutrition;
    const calPct = Math.round((n.calories.current / n.calories.target) * 100);

    return (
      <div className="portal-page pt-fadeUp" style={{ padding: '20px 16px 100px' }}>
        <h2 style={{ font: `700 20px ${HEADING}`, color: TEXT, margin: '0 0 16px' }}>Nutrition</h2>

        {/* Calories header */}
        <Card className="pt-fadeUp pt-fadeUp-1" style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{ font: `400 12px ${FONT}`, color: TEXT2, marginBottom: 4 }}>Today's Calories</div>
          <div style={{ font: `700 28px ${MONO}`, color: TEXT }}>{n.calories.current.toLocaleString()}</div>
          <div style={{ font: `400 12px ${MONO}`, color: TEXT3 }}>of {n.calories.target.toLocaleString()} kcal ({calPct}%)</div>
          {/* Calorie bar */}
          <div style={{ height: 6, borderRadius: 3, background: '#F0F0F5', overflow: 'hidden', marginTop: 12 }}>
            <div style={{ height: '100%', borderRadius: 3, background: ACCENT, width: `${Math.min(calPct, 100)}%` }} />
          </div>
        </Card>

        {/* Macro Rings */}
        <Card className="pt-fadeUp pt-fadeUp-2" style={{ marginBottom: 16 }}>
          <div style={{ font: `600 12px ${FONT}`, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Macros
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <MacroRing label="Protein" current={n.protein.current} target={n.protein.target} color="#EF4444" size={80} />
            <MacroRing label="Carbs" current={n.carbs.current} target={n.carbs.target} color="#3B82F6" size={80} />
            <MacroRing label="Fat" current={n.fat.current} target={n.fat.target} color="#EAB308" size={80} />
          </div>
        </Card>

        {/* Meal Log */}
        <Card className="pt-fadeUp pt-fadeUp-3">
          <div style={{ font: `600 12px ${FONT}`, color: TEXT2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Meal Log
          </div>
          {n.meals.map((meal, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < n.meals.length - 1 ? `1px solid ${CARD_BORDER}` : 'none',
            }}>
              <div>
                <div style={{ font: `500 13px ${FONT}`, color: TEXT }}>{meal.name}</div>
                <div style={{ font: `400 11px ${MONO}`, color: TEXT3 }}>{meal.time}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ font: `500 13px ${MONO}`, color: TEXT }}>{meal.cal} cal</div>
                <div style={{ font: `400 10px ${MONO}`, color: TEXT3 }}>P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  const renderChat = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* Chat header */}
      <div style={{
        padding: '14px 16px', background: CARD_BG,
        borderBottom: `1px solid ${CARD_BORDER}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: DARK_GRAD,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: FONT,
        }}>MC</div>
        <div>
          <div style={{ font: `600 14px ${FONT}`, color: TEXT }}>Marcus Cole</div>
          <div style={{ font: `400 11px ${FONT}`, color: SUCCESS }}>Your trainer</div>
        </div>
      </div>

      {/* Messages */}
      <div className="portal-scroll" style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {chatMessages.map((msg, i) => {
          const isClient = msg.from === 'client';
          const showTime = i === 0 || new Date(msg.ts).getTime() - new Date(chatMessages[i - 1].ts).getTime() > 3600000;
          return (
            <div key={msg.id}>
              {showTime && (
                <div style={{ textAlign: 'center', font: `400 11px ${FONT}`, color: TEXT3, margin: '10px 0 6px' }}>
                  {fmtDate(msg.ts)} {new Date(msg.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isClient ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%', padding: '10px 14px',
                  borderRadius: isClient ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isClient ? ACCENT : '#F0F0F5',
                  color: isClient ? '#fff' : TEXT,
                  font: `400 14px ${FONT}`, lineHeight: 1.5, wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 16px 10px', background: CARD_BG,
        borderTop: `1px solid ${CARD_BORDER}`,
        display: 'flex', alignItems: 'flex-end', gap: 10,
      }}>
        <textarea
          value={chatDraft}
          onChange={e => setChatDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          placeholder="Message your trainer..."
          rows={1}
          style={{
            flex: 1, padding: '11px 16px', borderRadius: 22,
            border: `1px solid ${CARD_BORDER}`, background: '#FAFAFA',
            font: `400 14px ${FONT}`, color: TEXT, outline: 'none',
            resize: 'none', minHeight: 42, maxHeight: 100,
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={sendChat}
          disabled={!chatDraft.trim()}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
            background: chatDraft.trim() ? ACCENT : '#E8E8EA',
            cursor: chatDraft.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SendIcon color={chatDraft.trim() ? '#fff' : TEXT3} />
        </button>
      </div>
    </div>
  );

  // ── Bottom Tabs Config ──
  const bottomTabs = [
    { id: 'home', label: 'Home', Icon: HomeIcon },
    { id: 'workouts', label: 'Workouts', Icon: DumbbellIcon },
    { id: 'progress', label: 'Progress', Icon: ChartIcon },
    { id: 'nutrition', label: 'Nutrition', Icon: AppleIcon },
    { id: 'chat', label: 'Chat', Icon: ChatBubbleIcon },
  ];

  return (
    <div style={{ background: '#F8F8FA', minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>
      {/* ── Dark Gradient Header ── */}
      <div style={{
        background: DARK_GRAD,
        padding: '20px 16px 18px',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ font: `400 11px ${FONT}`, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Client Portal
            </div>
            <div style={{ font: `600 18px ${HEADING}`, color: '#fff' }}>FORGE</div>
          </div>

          {/* Client Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowClientDropdown(!showClientDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', cursor: 'pointer',
                font: `500 13px ${FONT}`,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `linear-gradient(135deg, ${ACCENT}, #065a60)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 600, fontSize: 11, fontFamily: FONT,
              }}>
                {client.firstName[0]}{client.lastName[0]}
              </div>
              {client.firstName}
              <ChevronDown />
            </button>

            {showClientDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                background: CARD_BG, borderRadius: 12, padding: 6,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                border: `1px solid ${CARD_BORDER}`,
                zIndex: 100, minWidth: 200, maxHeight: 300, overflowY: 'auto',
              }}>
                {topClients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedClientId(p.id); setShowClientDropdown(false); setActiveTab('home'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: 'none', cursor: 'pointer',
                      background: p.id === selectedClientId ? ACCENT_LIGHT : 'transparent',
                      font: `500 13px ${FONT}`, color: TEXT,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${ACCENT}, #065a60)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 600, fontSize: 10, fontFamily: FONT, flexShrink: 0,
                    }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {showClientDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          onClick={() => setShowClientDropdown(false)}
        />
      )}

      {/* ── Main Content Area ── */}
      <div style={{ overflowY: 'auto' }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'workouts' && renderWorkouts()}
        {activeTab === 'progress' && renderProgress()}
        {activeTab === 'nutrition' && renderNutrition()}
        {activeTab === 'chat' && renderChat()}
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderTop: `1px solid ${CARD_BORDER}`,
        display: 'flex', justifyContent: 'space-around',
        padding: '6px 0 env(safe-area-inset-bottom, 8px)',
        zIndex: 200,
      }}>
        {bottomTabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer',
                minWidth: 56,
              }}
            >
              <t.Icon active={active} />
              <span style={{
                font: `${active ? 600 : 400} 10px ${FONT}`,
                color: active ? ACCENT : TEXT3,
              }}>{t.label}</span>
              {active && (
                <div style={{ width: 4, height: 4, borderRadius: 2, background: ACCENT, marginTop: 1 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
