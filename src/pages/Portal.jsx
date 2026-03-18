import { useState, useEffect, useRef } from 'react';
import {
  getPatients, getAppointments, getServices, getProviders,
  getClassPackages, getPhotos, subscribe,
} from '../data/store';

/* ── Helpers ── */
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const ACCENT = '#FF6B35'; // vibrant orange for fitness CTA
const ACCENT_DARK = '#E55A28';
const DARK_BG = '#1A1A2E';
const DARK_GRAD = 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)';
const CARD_SHADOW = '0 2px 16px rgba(0,0,0,0.06)';

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

function lsGet(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

const today = () => new Date().toISOString().slice(0, 10);
const weeksAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n * 7); return d.toISOString().slice(0, 10); };

/* ── Keyframe Injection ── */
const ANIM_ID = 'portal-client-anims';
if (typeof document !== 'undefined' && !document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes ptFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes ptSlideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
    @keyframes ptPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
    @keyframes ptStreakGlow { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.2); } }
    @keyframes ptRingFill { from { stroke-dashoffset: var(--ring-circumference); } }
    .pt-fadeUp { animation: ptFadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
    .pt-fadeUp-1 { animation-delay: 0.05s; }
    .pt-fadeUp-2 { animation-delay: 0.1s; }
    .pt-fadeUp-3 { animation-delay: 0.15s; }
    .pt-fadeUp-4 { animation-delay: 0.2s; }
    .pt-fadeUp-5 { animation-delay: 0.25s; }
    .pt-streak { animation: ptStreakGlow 2s ease-in-out infinite; }
    .portal-client-scroll::-webkit-scrollbar { display:none; }
    @media (max-width:640px) {
      .portal-client-page { padding-bottom: 80px !important; }
      .portal-grid-2 { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Seed helpers for progress data ── */
function getSeedProgress(clientId) {
  const key = `ms_progress_${clientId}`;
  const existing = localStorage.getItem(key);
  if (existing) try { return JSON.parse(existing); } catch {}
  const seeds = {
    'CLT-1000': { start: 195, end: 183, bfStart: 22, bfEnd: 17 },
    'CLT-1001': { start: 145, end: 138, bfStart: 28, bfEnd: 23 },
    'CLT-1004': { start: 170, end: 175, bfStart: 18, bfEnd: 15 },
  };
  const s = seeds[clientId];
  if (!s) return null;
  const data = [];
  for (let i = 0; i <= 12; i++) {
    const p = i / 12;
    const w = s.start + (s.end - s.start) * p + (Math.sin(i * 1.5) * 0.8);
    const bf = s.bfStart + (s.bfEnd - s.bfStart) * p + (Math.sin(i * 1.3) * 0.3);
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
    { id: 'PR-4', clientId: 'CLT-1000', exercise: 'Overhead Press', value: 155, unit: 'lbs', date: d(-45), previousValue: 145 },
    { id: 'PR-5', clientId: 'CLT-1000', exercise: 'Pull-ups', value: 18, unit: 'reps', date: d(-12), previousValue: 15 },
    { id: 'PR-7', clientId: 'CLT-1001', exercise: 'Bench Press', value: 95, unit: 'lbs', date: d(-10), previousValue: 85 },
    { id: 'PR-8', clientId: 'CLT-1001', exercise: 'Squat', value: 155, unit: 'lbs', date: d(-15), previousValue: 135 },
    { id: 'PR-9', clientId: 'CLT-1001', exercise: 'Deadlift', value: 185, unit: 'lbs', date: d(-3), previousValue: 165 },
    { id: 'PR-13', clientId: 'CLT-1004', exercise: 'Bench Press', value: 185, unit: 'lbs', date: d(-18), previousValue: 165 },
    { id: 'PR-14', clientId: 'CLT-1004', exercise: 'Squat', value: 225, unit: 'lbs', date: d(-6), previousValue: 205 },
    { id: 'PR-15', clientId: 'CLT-1004', exercise: 'Deadlift', value: 275, unit: 'lbs', date: d(-28), previousValue: 255 },
  ];
  localStorage.setItem(key, JSON.stringify(allPRs));
  return allPRs.filter(pr => pr.clientId === clientId);
}

function getSeedMeasurements(clientId) {
  const key = `ms_measurements_${clientId}`;
  const existing = localStorage.getItem(key);
  if (existing) try { return JSON.parse(existing); } catch {}
  const seeds = {
    'CLT-1000': [
      { date: weeksAgo(12), chest: 42, waist: 36, hips: 40, armL: 15, armR: 15.5 },
      { date: weeksAgo(8), chest: 42.5, waist: 34.5, hips: 39.5, armL: 15.5, armR: 16 },
      { date: weeksAgo(4), chest: 43, waist: 33, hips: 39, armL: 16, armR: 16 },
      { date: weeksAgo(0), chest: 43.5, waist: 32, hips: 38.5, armL: 16, armR: 16.5 },
    ],
    'CLT-1001': [
      { date: weeksAgo(12), chest: 36, waist: 30, hips: 38, armL: 11, armR: 11 },
      { date: weeksAgo(8), chest: 35.5, waist: 29, hips: 37.5, armL: 11.5, armR: 11.5 },
      { date: weeksAgo(4), chest: 35, waist: 28, hips: 37, armL: 11.5, armR: 12 },
      { date: weeksAgo(0), chest: 34.5, waist: 27, hips: 36.5, armL: 12, armR: 12 },
    ],
  };
  const data = seeds[clientId] || null;
  if (data) localStorage.setItem(key, JSON.stringify(data));
  return data;
}

/* ── SVG Mini Weight Chart ── */
function MiniWeightChart({ data }) {
  if (!data || data.length < 2) return <div style={{ color: '#999', fontSize: 13, padding: 20, textAlign: 'center' }}>No weight data yet</div>;
  const W = 320, H = 140, pad = { l: 40, r: 12, t: 12, b: 28 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
  const weights = data.map(d => d.weight);
  const minW = Math.floor(Math.min(...weights) - 2), maxW = Math.ceil(Math.max(...weights) + 2);
  const range = maxW - minW || 1;
  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * cW,
    y: pad.t + cH - ((d.weight - minW) / range) * cH,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${H - pad.b} L${pts[0].x},${H - pad.b} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="wgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.2" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = pad.t + cH * (1 - f);
        const val = Math.round(minW + range * f);
        return <g key={i}>
          <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#EEE" strokeWidth="1" />
          <text x={pad.l - 6} y={y + 4} textAnchor="end" fill="#999" fontSize="10" fontFamily={FONT}>{val}</text>
        </g>;
      })}
      <path d={area} fill="url(#wgFill)" />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke={ACCENT} strokeWidth="2" />)}
      {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((d, i) => {
        const idx = i === 0 ? 0 : i === 1 ? Math.floor(data.length / 2) : data.length - 1;
        return <text key={i} x={pts[idx].x} y={H - 8} textAnchor="middle" fill="#999" fontSize="9" fontFamily={FONT}>{fmtDate(data[idx].date)}</text>;
      })}
    </svg>
  );
}

/* ── Donut Ring (for macros) ── */
function DonutRing({ value, max, color, size = 64, strokeWidth = 6 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F0F0" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

/* ── Bottom Tab Bar ── */
const TABS = [
  { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'workouts', label: 'Workouts', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'progress', label: 'Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'nutrition', label: 'Nutrition', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

function BottomNav({ active, onNav }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: '#fff', borderTop: '1px solid #EBEBEB',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '6px 0 env(safe-area-inset-bottom, 8px)',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
    }}>
      {TABS.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 12px', minWidth: 56, color: isActive ? ACCENT : '#999',
            transition: 'color 0.2s',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={isActive ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, fontFamily: FONT }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   PORTAL — Main Component
   ══════════════════════════════════════════════ */
export default function Portal() {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState('home');
  const [selectedClientId, setSelectedClientId] = useState('CLT-1000');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  // Seed chat messages for selected client
  useEffect(() => {
    const client = getPatients().find(p => p.id === selectedClientId);
    const name = client ? client.firstName : 'there';
    setChatMessages([
      { id: 1, from: 'trainer', text: `Hey ${name}! Welcome to FORGE. I've put together your first program based on our assessment. How are you feeling about everything?`, time: '9:00 AM', date: 'Mon' },
      { id: 2, from: 'client', text: 'Feeling great Marcus! A little sore from yesterday but in a good way 💪', time: '9:15 AM', date: 'Mon' },
      { id: 3, from: 'trainer', text: 'That\'s exactly what we want — good soreness means progress. Make sure you\'re hitting your protein goals today and getting plenty of sleep tonight.', time: '9:18 AM', date: 'Mon' },
      { id: 4, from: 'client', text: 'Will do! Quick question — should I be doing any cardio on my off days?', time: '10:30 AM', date: 'Mon' },
      { id: 5, from: 'trainer', text: 'Light cardio is great on rest days — 20-30 min walk, light bike, or swimming. Nothing too intense. Save your energy for our sessions. See you tomorrow at 7am! 🔥', time: '10:35 AM', date: 'Mon' },
      { id: 6, from: 'client', text: 'Perfect, see you then!', time: '10:36 AM', date: 'Mon' },
    ]);
  }, [selectedClientId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, tab]);

  // Data
  const clients = getPatients();
  const client = clients.find(p => p.id === selectedClientId) || clients[0];
  const appointments = getAppointments();
  const services = getServices();
  const providers = getProviders();
  const programs = getClassPackages();
  const trainer = providers[0] || { name: 'Marcus Cole', title: 'Head Trainer' };

  const todayStr = today();
  const myAppts = appointments.filter(a => a.patientId === client?.id);
  const todayAppt = myAppts.find(a => a.date === todayStr && a.status !== 'completed');
  const upcomingAppts = myAppts.filter(a => a.date >= todayStr && a.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const pastAppts = myAppts.filter(a => a.date < todayStr || a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));
  const myProgram = programs.find(p => p.patientId === client?.id);
  const sessionsThisMonth = myAppts.filter(a => a.status === 'completed' && a.date?.startsWith(todayStr.slice(0, 7))).length;

  // Streak calculation (consecutive days with completed sessions counting backwards from today)
  const completedDates = new Set(myAppts.filter(a => a.status === 'completed').map(a => a.date));
  let streak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = checkDate.toISOString().slice(0, 10);
    if (completedDates.has(ds)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else if (i === 0) { checkDate.setDate(checkDate.getDate() - 1); } // skip today if no session yet
    else break;
  }
  // Default to a demo streak if none
  const displayStreak = streak || 12;

  // Progress data
  const progressData = getSeedProgress(client?.id);
  const currentWeight = progressData ? progressData[progressData.length - 1]?.weight : null;
  const prs = getSeedPRs(client?.id);
  const measurements = getSeedMeasurements(client?.id);

  const getServiceName = (id) => services.find(s => s.id === id)?.name || 'Training Session';

  // Next session date
  const nextSession = upcomingAppts[0];

  // Nutrition mock data
  const macros = { protein: { current: 142, goal: 180 }, carbs: { current: 210, goal: 250 }, fat: { current: 58, goal: 70 }, calories: { current: 1910, goal: 2200 } };
  const meals = [
    { time: '7:00 AM', name: 'Breakfast', items: 'Eggs (3), oatmeal, banana', cals: 520 },
    { time: '10:30 AM', name: 'Snack', items: 'Protein shake, almonds', cals: 320 },
    { time: '1:00 PM', name: 'Lunch', items: 'Grilled chicken, rice, broccoli', cals: 580 },
    { time: '4:00 PM', name: 'Pre-Workout', items: 'Apple, peanut butter', cals: 210 },
    { time: '7:30 PM', name: 'Dinner', items: 'Salmon, sweet potato, asparagus', cals: 620 },
  ];

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(), from: 'client', text: chatInput.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      date: 'Now',
    }]);
    setChatInput('');
    // Simulate trainer response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1, from: 'trainer', text: 'Got it! I\'ll get back to you shortly. Keep up the great work! 💪',
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        date: 'Now',
      }]);
    }, 1500);
  };

  /* ── Card wrapper ── */
  const Card = ({ children, style = {}, className = '' }) => (
    <div className={`pt-fadeUp ${className}`} style={{
      background: '#fff', borderRadius: 16, padding: '20px',
      boxShadow: CARD_SHADOW, ...style,
    }}>{children}</div>
  );

  const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: '#999', marginBottom: 12, fontFamily: FONT }}>{children}</div>
  );

  /* ════════════════════════
     TAB: HOME
     ════════════════════════ */
  const renderHome = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Today's Workout */}
      {todayAppt ? (
        <Card className="pt-fadeUp-1">
          <SectionLabel>Today's Workout</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#111', fontFamily: FONT }}>{getServiceName(todayAppt.serviceId)}</div>
              <div style={{ fontSize: 13, color: '#777', marginTop: 4, fontFamily: FONT }}>{fmtTime(todayAppt.time)} &middot; {todayAppt.duration || 60} min</div>
            </div>
            <button style={{
              background: ACCENT, color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 24px', fontFamily: FONT, fontWeight: 600, fontSize: 14,
              cursor: 'pointer', boxShadow: `0 4px 14px ${ACCENT}44`,
              transition: 'all 0.2s',
            }}>Start Workout</button>
          </div>
        </Card>
      ) : (
        <Card className="pt-fadeUp-1">
          <SectionLabel>Today</SectionLabel>
          <div style={{ fontSize: 14, color: '#777', fontFamily: FONT }}>No workout scheduled today. Rest day! 😴</div>
        </Card>
      )}

      {/* Streak + Quick Stats */}
      <div className="portal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card className="pt-fadeUp-2" style={{ textAlign: 'center', padding: '16px' }}>
          <div className="pt-streak" style={{ fontSize: 36, fontWeight: 700, fontFamily: FONT }}>🔥 {displayStreak}</div>
          <div style={{ fontSize: 12, color: '#777', fontFamily: FONT, marginTop: 2 }}>Day Streak</div>
        </Card>
        <Card className="pt-fadeUp-2" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: ACCENT, fontFamily: FONT }}>{sessionsThisMonth}</div>
          <div style={{ fontSize: 12, color: '#777', fontFamily: FONT, marginTop: 2 }}>Sessions This Month</div>
        </Card>
      </div>

      <div className="portal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card className="pt-fadeUp-3" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#111', fontFamily: FONT }}>{currentWeight ? `${currentWeight} lbs` : '--'}</div>
          <div style={{ fontSize: 12, color: '#777', fontFamily: FONT, marginTop: 2 }}>Current Weight</div>
        </Card>
        <Card className="pt-fadeUp-3" style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111', fontFamily: FONT }}>{nextSession ? fmtWeekday(nextSession.date) : 'None scheduled'}</div>
          <div style={{ fontSize: 12, color: '#777', fontFamily: FONT, marginTop: 2 }}>Next Session</div>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      {upcomingAppts.length > 0 && (
        <Card className="pt-fadeUp-4">
          <SectionLabel>Upcoming Sessions</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingAppts.slice(0, 4).map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: '#FAFAFA', borderRadius: 12,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111', fontFamily: FONT }}>{getServiceName(a.serviceId)}</div>
                  <div style={{ fontSize: 12, color: '#999', fontFamily: FONT }}>{fmtWeekday(a.date)} &middot; {fmtTime(a.time)}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: a.status === 'confirmed' ? '#16A34A' : '#D97706',
                  background: a.status === 'confirmed' ? '#F0FDF4' : '#FFFBEB',
                  padding: '4px 10px', borderRadius: 20, fontFamily: FONT,
                }}>{a.status}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trainer Card */}
      <Card className="pt-fadeUp-5">
        <SectionLabel>Your Trainer</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #1A1A2E, #0F3460)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            fontSize: 20, fontWeight: 700, fontFamily: FONT, flexShrink: 0,
          }}>{trainer.name?.split(' ').map(n => n[0]).join('')}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', fontFamily: FONT }}>{trainer.name}</div>
            <div style={{ fontSize: 12, color: '#777', fontFamily: FONT }}>{trainer.title}</div>
          </div>
          <button onClick={() => setTab('chat')} style={{
            background: ACCENT + '15', color: ACCENT, border: 'none', borderRadius: 10,
            padding: '10px 18px', fontFamily: FONT, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Message</button>
        </div>
      </Card>
    </div>
  );

  /* ════════════════════════
     TAB: WORKOUTS
     ════════════════════════ */
  const renderWorkouts = () => {
    const completedSessions = myProgram?.sessions?.filter(s => s.status === 'completed').length || 0;
    const totalSessions = myProgram?.sessions?.length || 1;
    const progressPct = Math.round((completedSessions / totalSessions) * 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Current Program */}
        {myProgram && (
          <Card className="pt-fadeUp-1">
            <SectionLabel>Current Program</SectionLabel>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#111', fontFamily: FONT }}>{myProgram.name}</div>
            <div style={{ fontSize: 13, color: '#777', fontFamily: FONT, marginTop: 4 }}>{completedSessions} of {totalSessions} sessions completed</div>
            {/* Progress bar */}
            <div style={{ marginTop: 12, height: 8, background: '#F0F0F0', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                width: `${progressPct}%`, height: '100%', background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DARK})`,
                borderRadius: 100, transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, fontFamily: FONT, marginTop: 6, textAlign: 'right' }}>{progressPct}%</div>
          </Card>
        )}

        {/* Program Sessions */}
        {myProgram?.sessions?.length > 0 && (
          <Card className="pt-fadeUp-2">
            <SectionLabel>Program Schedule</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myProgram.sessions.map((session, i) => {
                const isCompleted = session.status === 'completed';
                const isCurrent = session.status === 'in-progress';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', background: isCurrent ? `${ACCENT}08` : '#FAFAFA',
                    borderRadius: 12, border: isCurrent ? `1.5px solid ${ACCENT}30` : '1px solid transparent',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      background: isCompleted ? '#16A34A' : isCurrent ? ACCENT : '#E5E7EB',
                      color: (isCompleted || isCurrent) ? '#fff' : '#999', fontWeight: 600,
                    }}>{isCompleted ? '✓' : i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111', fontFamily: FONT }}>{session.name}</div>
                      <div style={{ fontSize: 12, color: '#999', fontFamily: FONT }}>{fmtDate(session.date)}{session.notes ? ` — ${session.notes}` : ''}</div>
                    </div>
                    {isCurrent && <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, background: `${ACCENT}15`, padding: '3px 10px', borderRadius: 20, fontFamily: FONT }}>NOW</span>}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Upcoming Sessions */}
        <Card className="pt-fadeUp-3">
          <SectionLabel>Upcoming Sessions</SectionLabel>
          {upcomingAppts.length === 0 ? (
            <div style={{ color: '#999', fontSize: 13, fontFamily: FONT }}>No upcoming sessions</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingAppts.slice(0, 6).map(a => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: '#FAFAFA', borderRadius: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111', fontFamily: FONT }}>{getServiceName(a.serviceId)}</div>
                    <div style={{ fontSize: 12, color: '#999', fontFamily: FONT }}>{fmtWeekday(a.date)} &middot; {fmtTime(a.time)} &middot; {a.duration || 60}min</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Past Sessions */}
        <Card className="pt-fadeUp-4">
          <SectionLabel>Past Sessions</SectionLabel>
          {pastAppts.length === 0 ? (
            <div style={{ color: '#999', fontSize: 13, fontFamily: FONT }}>No past sessions yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pastAppts.slice(0, 8).map(a => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 14px', background: '#FAFAFA', borderRadius: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#555', fontFamily: FONT }}>{getServiceName(a.serviceId)}</div>
                    <div style={{ fontSize: 11, color: '#BBB', fontFamily: FONT }}>{fmtDate(a.date)} &middot; {fmtTime(a.time)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', fontFamily: FONT }}>✓ Done</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  /* ════════════════════════
     TAB: PROGRESS
     ════════════════════════ */
  const renderProgress = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Weight Chart */}
      <Card className="pt-fadeUp-1">
        <SectionLabel>Weight Trend</SectionLabel>
        <MiniWeightChart data={progressData} />
        {progressData && progressData.length >= 2 && (() => {
          const first = progressData[0].weight;
          const last = progressData[progressData.length - 1].weight;
          const diff = last - first;
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 4px' }}>
              <span style={{ fontSize: 12, color: '#999', fontFamily: FONT }}>Start: {first} lbs</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: diff <= 0 ? '#16A34A' : '#D97706', fontFamily: FONT }}>
                {diff <= 0 ? '↓' : '↑'} {Math.abs(Math.round(diff * 10) / 10)} lbs
              </span>
              <span style={{ fontSize: 12, color: '#999', fontFamily: FONT }}>Now: {last} lbs</span>
            </div>
          );
        })()}
      </Card>

      {/* Body Measurements */}
      {measurements && measurements.length > 0 && (
        <Card className="pt-fadeUp-2">
          <SectionLabel>Body Measurements</SectionLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                  {['Date', 'Chest', 'Waist', 'Hips', 'Arm L', 'Arm R'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measurements.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F8F8F8' }}>
                    <td style={{ padding: '8px 10px', color: '#777', fontSize: 12 }}>{fmtDate(m.date)}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111' }}>{m.chest}"</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111' }}>{m.waist}"</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111' }}>{m.hips}"</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111' }}>{m.armL}"</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#111' }}>{m.armR}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PRs Board */}
      <Card className="pt-fadeUp-3">
        <SectionLabel>Personal Records 🏆</SectionLabel>
        {(!prs || prs.length === 0) ? (
          <div style={{ color: '#999', fontSize: 13, fontFamily: FONT }}>No PRs recorded yet. Keep training!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {prs.map(pr => (
              <div key={pr.id} style={{
                background: '#FAFAFA', borderRadius: 12, padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: '#999', fontFamily: FONT, marginBottom: 4 }}>{pr.exercise}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111', fontFamily: FONT }}>{pr.value}</div>
                <div style={{ fontSize: 11, color: '#999', fontFamily: FONT }}>{pr.unit}</div>
                {pr.previousValue && (
                  <div style={{ fontSize: 10, color: '#16A34A', fontFamily: FONT, marginTop: 4 }}>
                    ↑ from {pr.previousValue} {pr.unit}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Progress Photos */}
      <Card className="pt-fadeUp-4">
        <SectionLabel>Progress Photos</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {['Before', 'After'].map(label => (
            <div key={label} style={{
              background: '#F5F5F5', borderRadius: 12, height: 180,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed #DDD', cursor: 'pointer',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div style={{ fontSize: 12, color: '#999', fontFamily: FONT, marginTop: 8 }}>{label}</div>
              <div style={{ fontSize: 10, color: '#CCC', fontFamily: FONT }}>Tap to upload</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  /* ════════════════════════
     TAB: NUTRITION
     ════════════════════════ */
  const renderNutrition = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Calories Summary */}
      <Card className="pt-fadeUp-1">
        <SectionLabel>Today's Calories</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '8px 0' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <DonutRing value={macros.calories.current} max={macros.calories.goal} color={ACCENT} size={100} strokeWidth={10} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111', fontFamily: FONT }}>{macros.calories.current}</div>
              <div style={{ fontSize: 9, color: '#999', fontFamily: FONT }}>/ {macros.calories.goal}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#999', fontFamily: FONT }}>{macros.calories.goal - macros.calories.current} cal remaining</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontFamily: FONT, fontWeight: 500 }}>On track! 👍</div>
          </div>
        </div>
      </Card>

      {/* Macro Rings */}
      <Card className="pt-fadeUp-2">
        <SectionLabel>Macros</SectionLabel>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
          {[
            { label: 'Protein', color: '#EF4444', ...macros.protein, unit: 'g' },
            { label: 'Carbs', color: '#3B82F6', ...macros.carbs, unit: 'g' },
            { label: 'Fat', color: '#F59E0B', ...macros.fat, unit: 'g' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <DonutRing value={m.current} max={m.goal} color={m.color} size={68} strokeWidth={6} />
                <div style={{ position: 'absolute', fontSize: 13, fontWeight: 600, color: '#111', fontFamily: FONT }}>{m.current}{m.unit}</div>
              </div>
              <div style={{ fontSize: 11, color: '#777', fontFamily: FONT, marginTop: 4 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: '#BBB', fontFamily: FONT }}>/ {m.goal}{m.unit}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Meal Log */}
      <Card className="pt-fadeUp-3">
        <SectionLabel>Today's Meals</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {meals.map((meal, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: '#FAFAFA', borderRadius: 12,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111', fontFamily: FONT }}>{meal.name}</div>
                <div style={{ fontSize: 12, color: '#999', fontFamily: FONT }}>{meal.items}</div>
                <div style={{ fontSize: 11, color: '#BBB', fontFamily: FONT }}>{meal.time}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#555', fontFamily: FONT }}>{meal.cals} cal</div>
            </div>
          ))}
        </div>
        <button style={{
          width: '100%', marginTop: 12, padding: '12px', background: '#FAFAFA',
          border: '2px dashed #DDD', borderRadius: 12, cursor: 'pointer',
          fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#999',
        }}>+ Log a Meal</button>
      </Card>

      {/* Meal Plan from Trainer */}
      <Card className="pt-fadeUp-4">
        <SectionLabel>Trainer's Meal Plan</SectionLabel>
        <div style={{ background: `${ACCENT}08`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111', fontFamily: FONT, marginBottom: 8 }}>Muscle Building — Week 5</div>
          <div style={{ fontSize: 13, color: '#555', fontFamily: FONT, lineHeight: 1.6 }}>
            <strong>Goal:</strong> 2,200 cal/day &middot; 180g protein &middot; 250g carbs &middot; 70g fat<br />
            <strong>Focus:</strong> High protein at every meal. Time carbs around workouts. Stay hydrated — minimum 100oz water daily.<br />
            <strong>Supplements:</strong> Creatine 5g, Whey protein post-workout, Vitamin D3
          </div>
        </div>
      </Card>
    </div>
  );

  /* ════════════════════════
     TAB: CHAT
     ════════════════════════ */
  const renderChat = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 230px)', minHeight: 400 }}>
      {/* Chat Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: '#fff', borderRadius: 16, boxShadow: CARD_SHADOW, marginBottom: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #1A1A2E, #0F3460)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          fontSize: 15, fontWeight: 700, fontFamily: FONT, flexShrink: 0,
        }}>MC</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111', fontFamily: FONT }}>{trainer.name}</div>
          <div style={{ fontSize: 11, color: '#16A34A', fontFamily: FONT }}>● Online</div>
        </div>
      </div>

      {/* Messages */}
      <div className="portal-client-scroll" style={{
        flex: 1, overflowY: 'auto', padding: '8px 4px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {chatMessages.map(msg => {
          const isTrainer = msg.from === 'trainer';
          return (
            <div key={msg.id} style={{
              display: 'flex', justifyContent: isTrainer ? 'flex-start' : 'flex-end',
            }}>
              <div style={{
                maxWidth: '78%', padding: '10px 14px',
                background: isTrainer ? '#F0F0F0' : ACCENT,
                color: isTrainer ? '#111' : '#fff',
                borderRadius: isTrainer ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                fontSize: 14, fontFamily: FONT, lineHeight: 1.5,
              }}>
                {msg.text}
                <div style={{
                  fontSize: 10, marginTop: 4, textAlign: 'right',
                  color: isTrainer ? '#999' : 'rgba(255,255,255,0.7)',
                }}>{msg.time}</div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 0 4px',
      }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendChat()}
          placeholder="Message your trainer..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 14,
            border: '1px solid #E5E7EB', background: '#FAFAFA',
            fontFamily: FONT, fontSize: 14, color: '#111', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = ACCENT}
          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
        />
        <button onClick={sendChat} style={{
          background: ACCENT, color: '#fff', border: 'none', borderRadius: 14,
          width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );

  /* ════════════════════════
     MAIN RENDER
     ════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: FONT }} className="portal-client-page">
      {/* Dark Hero Header */}
      <div style={{
        background: DARK_GRAD, padding: '24px 20px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />

        {/* Client Selector */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
              padding: '6px 12px', fontFamily: FONT, fontSize: 11, cursor: 'pointer',
              outline: 'none', marginBottom: 16, appearance: 'none',
              WebkitAppearance: 'none', paddingRight: 28,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
            }}
          >
            {clients.slice(0, 10).map(c => (
              <option key={c.id} value={c.id} style={{ color: '#111', background: '#fff' }}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>

          {/* Greeting */}
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Hey {client?.firstName} 💪
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
            {todayAppt
              ? `You have a ${getServiceName(todayAppt.serviceId).toLowerCase()} today at ${fmtTime(todayAppt.time)}`
              : "Let's keep the momentum going!"
            }
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '16px 16px 88px', maxWidth: 560, margin: '0 auto' }}>
        {tab === 'home' && renderHome()}
        {tab === 'workouts' && renderWorkouts()}
        {tab === 'progress' && renderProgress()}
        {tab === 'nutrition' && renderNutrition()}
        {tab === 'chat' && renderChat()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active={tab} onNav={setTab} />
    </div>
  );
}
