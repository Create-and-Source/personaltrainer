// Client Portal — Premium iOS-native fitness app experience
// 5-tab structure: Home, Train, Mind, Progress, Profile
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  getPatients, getAppointments, getServices,
  getClassPackages, subscribe,
} from '../data/store';
import { useStyles as useAppStyles } from '../theme';

/* ══════════════════════════════════════
   DESIGN TOKENS — bridged from theme system
   ══════════════════════════════════════ */
const PortalTokens = createContext(null);
function useTokens() { return useContext(PortalTokens); }
function buildTokens(s) {
  return {
    FONT: s.FONT,
    MONO: s.MONO,
    BG: s.bg,
    SURFACE: s.surface,
    ACCENT: s.accent,
    ACCENT_LIGHT: s.accentLight,
    BORDER: s.border,
    TEXT: s.text,
    TEXT2: s.text2,
    TEXT3: s.text3,
    SUCCESS: s.success,
    WARNING: s.warning,
    CARD_RADIUS: 14,
    CARD_SHADOW: s.shadow,
    CARD_PAD: 16,
    dark: s.dark,
  };
}
// Legacy module-level fallbacks for seed data helpers (non-UI code)
const FONT = "-apple-system, 'Figtree', BlinkMacSystemFont, sans-serif";
const MONO = "'SF Mono', 'Source Code Pro', monospace";

/* ── Helpers ── */
const today = () => new Date().toISOString().slice(0, 10);
const weeksAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n * 7); return d.toISOString().slice(0, 10); };
const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d.length === 10 ? d + 'T12:00:00' : d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const fmtWeekday = (d) => {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
};
const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const fmtFullDate = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

/* ── Keyframe Injection ── */
const ANIM_ID = 'portal-ios-anims';
if (typeof document !== 'undefined' && !document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes ptSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes ptFadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes ptCountdown { from { stroke-dashoffset: 0; } }
    @keyframes ptPulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(98,85,74,0.2); } 50% { box-shadow: 0 0 0 8px rgba(98,85,74,0); } }
    @keyframes ptBreathe { 0% { transform: scale(0.6); opacity: 0.4; } 25% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1); opacity: 0.9; } 75% { transform: scale(0.6); opacity: 0.4; } 100% { transform: scale(0.6); opacity: 0.4; } }
    .mind-breathe { animation: ptBreathe 16s ease-in-out infinite; }
    .mind-breathe-active { animation: ptBreathe 16s ease-in-out infinite; }
    .mind-breathe-paused { animation: none; }
    .ios-fadeUp { animation: ptSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .ios-d1 { animation-delay: 0.03s; }
    .ios-d2 { animation-delay: 0.06s; }
    .ios-d3 { animation-delay: 0.09s; }
    .ios-d4 { animation-delay: 0.12s; }
    .ios-d5 { animation-delay: 0.15s; }
    .ios-d6 { animation-delay: 0.18s; }
    .ios-card { transition: transform 0.15s ease; }
    .ios-card:active { transform: scale(0.98); }
    .ios-scroll::-webkit-scrollbar { display: none; }
    .ios-seg-btn { transition: all 0.2s ease; }
    @media (max-width:640px) {
      .ios-page { padding-bottom: 80px !important; }
    }
  `;
  document.head.appendChild(sheet);
}

/* ══════════════════════════════════════
   SEED DATA
   ══════════════════════════════════════ */

const SAMPLE_WORKOUT = {
  title: 'Full Body Strength',
  duration: 35,
  difficulty: 'Intermediate',
  focus: ['Legs', 'Chest', 'Back'],
  sections: [
    { name: 'Warm-up', exercises: [
      { name: 'Jump Rope', sets: null, reps: null, weight: null, time: '3 min', icon: null },
      { name: "World's Greatest Stretch", sets: null, reps: null, weight: null, time: '2 min', icon: null },
    ]},
    { name: 'Main', exercises: [
      { name: 'Barbell Back Squat', sets: 4, reps: 8, weight: '185 lbs', time: null, icon: null },
      { name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: '50 lbs', time: null, icon: null },
      { name: 'Bent Over Row', sets: 3, reps: 10, weight: '135 lbs', time: null, icon: null },
      { name: 'Romanian Deadlift', sets: 3, reps: 12, weight: '155 lbs', time: null, icon: null },
      { name: 'Overhead Press', sets: 3, reps: 8, weight: '95 lbs', time: null, icon: null },
    ]},
    { name: 'Cooldown', exercises: [
      { name: 'Hamstring Stretch', sets: null, reps: null, weight: null, time: '60s each', icon: null },
      { name: 'Chest Opener', sets: null, reps: null, weight: null, time: '60s', icon: null },
      { name: "Child's Pose", sets: null, reps: null, weight: null, time: '90s', icon: null },
    ]},
  ],
};

const SAMPLE_HABITS = [
  { id: 'water', label: 'Water (8 glasses)' },
  { id: 'sleep', label: 'Sleep 7h+' },
  { id: 'steps', label: '10K Steps' },
  { id: 'eat', label: 'Eat Clean' },
];

const SAMPLE_PROGRAMS = [
  { id: 'prog-1', name: 'Strength Foundations', week: 2, totalWeeks: 6, frequency: '4x/week', phases: ['Base', 'Build', 'Peak'], progress: 28 },
  { id: 'prog-2', name: 'Mobility Reset', week: 1, totalWeeks: 3, frequency: '3x/week', phases: ['Unlock', 'Strengthen'], progress: 12 },
];

const SAMPLE_LIBRARY = [
  { id: 'lib-1', title: 'Upper Body Push', duration: 40, tags: ['Chest', 'Shoulders', 'Triceps'], level: 'Intermediate' },
  { id: 'lib-2', title: 'Lower Body Power', duration: 45, tags: ['Quads', 'Glutes', 'Hamstrings'], level: 'Advanced' },
  { id: 'lib-3', title: 'Core & Conditioning', duration: 25, tags: ['Core', 'Cardio'], level: 'Beginner' },
  { id: 'lib-4', title: 'Active Recovery Flow', duration: 30, tags: ['Mobility', 'Flexibility'], level: 'Beginner' },
];

const AI_CONVERSATION = [
  { from: 'user', text: 'I want to focus more on my squat this month. Can you adjust my program?' },
  { from: 'ai', text: "Absolutely! I can increase your squat frequency to 3x/week with varied rep ranges. Here's what I'd suggest:\n\n• Monday: Heavy Squats (4x5)\n• Wednesday: Pause Squats (3x6)\n• Friday: Front Squats (3x8)\n\nThis progressive approach will build both strength and technique.", actions: ['Apply to plan', 'Save as workout', 'Modify'] },
  { from: 'user', text: 'That looks great. Can you also add some accessory work?' },
  { from: 'ai', text: "Here's your accessory pairing for each squat day:\n\n• Monday: Bulgarian Split Squats 3x10, Leg Press 3x12\n• Wednesday: Box Step-Ups 3x8, Leg Curl 3x15\n• Friday: Walking Lunges 3x12, Calf Raises 4x15\n\nThis targets all supporting muscle groups while keeping volume manageable.", actions: ['Schedule this', 'Save as workout'] },
];

function getSeedProgress(clientId) {
  const key = `ms_progress_${clientId}`;
  const existing = localStorage.getItem(key);
  if (existing) try { return JSON.parse(existing); } catch {}
  const seeds = {
    'CLT-1000': { start: 195, end: 183, bfStart: 22, bfEnd: 17 },
    'CLT-1001': { start: 145, end: 138, bfStart: 28, bfEnd: 23 },
    'CLT-1004': { start: 170, end: 175, bfStart: 18, bfEnd: 15 },
  };
  const se = seeds[clientId] || { start: 175, end: 170, bfStart: 20, bfEnd: 17 };
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
  const filtered = allPRs.filter(pr => pr.clientId === clientId);
  if (filtered.length > 0) return filtered;
  // Generate fallback PRs for any client not in seed data
  return [
    { id: `PR-${clientId}-1`, clientId, exercise: 'Bench Press', value: 185, unit: 'lbs', date: d(-10), previousValue: 170 },
    { id: `PR-${clientId}-2`, clientId, exercise: 'Squat', value: 245, unit: 'lbs', date: d(-6), previousValue: 225 },
    { id: `PR-${clientId}-3`, clientId, exercise: 'Deadlift', value: 275, unit: 'lbs', date: d(-3), previousValue: 255 },
  ];
}

function getSeedNutrition(clientId) {
  const seeds = {
    'CLT-1000': { calories: { target: 2800, current: 2650 }, protein: { target: 200, current: 185 }, carbs: { target: 300, current: 280 }, fat: { target: 90, current: 85 } },
    'CLT-1001': { calories: { target: 1800, current: 1720 }, protein: { target: 130, current: 118 }, carbs: { target: 180, current: 170 }, fat: { target: 60, current: 55 } },
  };
  return seeds[clientId] || { calories: { target: 2200, current: 2050 }, protein: { target: 160, current: 140 }, carbs: { target: 240, current: 210 }, fat: { target: 75, current: 68 } };
}

function getSeedChat(clientName) {
  return [
    { id: 'cm1', from: 'trainer', text: `Hey ${clientName.split(' ')[0]}! Great session yesterday. How are you feeling today?`, ts: '2026-03-17T09:00:00' },
    { id: 'cm2', from: 'client', text: 'A little sore but in a good way! Those RDLs were intense', ts: '2026-03-17T09:15:00' },
    { id: 'cm3', from: 'trainer', text: 'That means you pushed the right muscles. Make sure to foam roll tonight and get 7+ hours of sleep.', ts: '2026-03-17T09:20:00' },
    { id: 'cm4', from: 'client', text: 'Will do! Also wanted to ask about adding cardio on off days?', ts: '2026-03-18T08:30:00' },
    { id: 'cm5', from: 'trainer', text: '20-30 min of low-intensity steady state would be perfect. Walking, cycling, or swimming. Nothing that hammers your legs before our Thursday session.', ts: '2026-03-18T08:45:00' },
  ];
}

const BADGES = [
  { name: 'First Workout', earned: true },
  { name: '7-Day Streak', earned: true },
  { name: '10 Workouts', earned: true },
  { name: '30-Day Streak', earned: false },
  { name: 'PR Crusher', earned: true },
  { name: '100 Workouts', earned: false },
];

/* ══════════════════════════════════════
   SVG ICONS (SF-symbol style, 22px)
   ══════════════════════════════════════ */

const IconHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? ACCENT : 'none'} stroke={active ? ACCENT : TEXT3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5l9-7 9 7v10.5a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-5v6H5.5A1.5 1.5 0 0 1 4 18V9.5" fill={active ? ACCENT : 'none'} opacity={active ? 0.15 : 0} />
    <path d="M3 9.5l9-7 9 7v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const IconTrain = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="7" width="4" height="10" rx="1" />
    <rect x="19" y="7" width="4" height="10" rx="1" />
    <line x1="5" y1="12" x2="19" y2="12" />
    <rect x="7" y="9" width="3" height="6" rx="0.5" />
    <rect x="14" y="9" width="3" height="6" rx="0.5" />
  </svg>
);

const IconMind = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.5 2 5 4.5 5 8c0 2.5 1.5 4 3 5s2 2.5 2 4h4c0-1.5.5-3 2-4s3-2.5 3-5c0-3.5-3.5-6-7-6z" fill={active ? ACCENT : 'none'} opacity={active ? 0.15 : 0} />
    <ellipse cx="12" cy="19" rx="3" ry="1.5" />
    <path d="M9 17c-3-1-5-3.5-5-6.5C4 6 8 3 12 3s8 3 8 7.5c0 3-2 5.5-5 6.5" />
    <path d="M12 3v8" />
    <path d="M8.5 7.5C9.5 8.5 10.5 9 12 9" />
    <path d="M15.5 7.5C14.5 8.5 13.5 9 12 9" />
    <path d="M10 21h4" />
  </svg>
);

const IconProgress = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconProfile = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? ACCENT : TEXT3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSend = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const IconChevron = ({ dir = 'right', size = 16, color = TEXT3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'right' && <polyline points="9 18 15 12 9 6" />}
    {dir === 'down' && <polyline points="6 9 12 15 18 9" />}
    {dir === 'left' && <polyline points="15 18 9 12 15 6" />}
  </svg>
);

const IconCheck = ({ checked, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={checked ? ACCENT : 'none'} stroke={checked ? ACCENT : BORDER} strokeWidth="1.5" />
    {checked && <polyline points="7 12 10.5 15.5 17 9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const IconClose = ({ size = 24, color = TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPause = ({ size = 24, color = TEXT }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const IconPlay = ({ size = 20, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/* ══════════════════════════════════════
   REUSABLE COMPONENTS
   ══════════════════════════════════════ */

const Card = ({ children, style, onClick, className = '' }) => (
  <div
    className={`ios-card ${className}`}
    onClick={onClick}
    style={{
      background: SURFACE,
      borderRadius: CARD_RADIUS,
      boxShadow: CARD_SHADOW,
      padding: CARD_PAD,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
  >
    {children}
  </div>
);

const SegmentedControl = ({ options, active, onChange }) => (
  <div style={{
    display: 'flex', gap: 0,
    background: '#EFEBE7',
    borderRadius: 10, padding: 3,
  }}>
    {options.map(opt => (
      <button
        key={opt}
        className="ios-seg-btn"
        onClick={() => onChange(opt)}
        style={{
          flex: 1, padding: '8px 0',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          font: `500 13px ${FONT}`,
          background: active === opt ? SURFACE : 'transparent',
          color: active === opt ? TEXT : TEXT2,
          boxShadow: active === opt ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {opt}
      </button>
    ))}
  </div>
);

const PillButton = ({ children, onClick, variant = 'primary', style: extraStyle, disabled }) => {
  const base = {
    width: '100%', padding: '15px 24px',
    borderRadius: CARD_RADIUS, border: 'none', cursor: disabled ? 'default' : 'pointer',
    font: `600 15px ${FONT}`,
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { ...base, background: ACCENT, color: '#fff' },
    secondary: { ...base, background: 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` },
    ghost: { ...base, background: ACCENT_LIGHT, color: ACCENT },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...variants[variant], ...extraStyle }}>{children}</button>;
};

const SectionLabel = ({ children, style }) => (
  <div style={{
    font: `600 13px ${FONT}`, color: TEXT2,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    marginBottom: 10, ...style,
  }}>{children}</div>
);

const MacroBar = ({ label, current, target, color }) => {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ font: `500 12px ${FONT}`, color: TEXT2 }}>{label}</span>
        <span style={{ font: `500 12px ${MONO}`, color: TEXT }}>{current}/{target}g</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: '#EFEBE7', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
};

/* ── SVG Line Chart ── */
const LineChart = ({ data, dataKey, width = 300, height = 140, color = ACCENT }) => {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d[dataKey]);
  const min = Math.min(...vals) - 2;
  const max = Math.max(...vals) + 2;
  const range = max - min || 1;
  const padX = 12, padY = 16;
  const px = (i) => padX + (i / (vals.length - 1)) * (width - padX * 2);
  const py = (v) => padY + (1 - (v - min) / range) * (height - padY * 2);
  const points = vals.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const area = `${px(0)},${height - padY} ${points} ${px(vals.length - 1)},${height - padY}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={padX} y1={padY + p * (height - padY * 2)} x2={width - padX} y2={padY + p * (height - padY * 2)}
          stroke={BORDER} strokeWidth="0.5" strokeDasharray="4 4" />
      ))}
      <polygon points={area} fill={`url(#grad-${dataKey})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r={i === vals.length - 1 ? 4.5 : 2.5}
          fill={i === vals.length - 1 ? color : SURFACE} stroke={color} strokeWidth="1.5" />
      ))}
      <text x={padX} y={height - 2} style={{ font: `400 9px ${MONO}`, fill: TEXT3 }}>{fmtDate(data[0].date)}</text>
      <text x={width - padX} y={height - 2} textAnchor="end" style={{ font: `400 9px ${MONO}`, fill: TEXT3 }}>{fmtDate(data[data.length - 1].date)}</text>
    </svg>
  );
};

/* ── Bar Chart (workouts per week) ── */
const BarChart = ({ width = 300, height = 130 }) => {
  const data = [3, 4, 4, 2, 5, 3, 4];
  const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
  const maxVal = Math.max(...data);
  const barW = (width - 40) / data.length - 6;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const barH = (v / maxVal) * (height - 40);
        const x = 20 + i * ((width - 40) / data.length) + 3;
        const y = height - 24 - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={i === data.length - 1 ? ACCENT : '#DDD8D3'} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" style={{ font: `600 10px ${MONO}`, fill: i === data.length - 1 ? ACCENT : TEXT2 }}>{v}</text>
            <text x={x + barW / 2} y={height - 8} textAnchor="middle" style={{ font: `400 9px ${FONT}`, fill: TEXT3 }}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ══════════════════════════════════════
   MAIN PORTAL COMPONENT
   ══════════════════════════════════════ */

class PortalErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: "'Figtree', sans-serif" }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{this.state.error?.message}</div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '10px 24px', borderRadius: 100, border: 'none', background: '#C9A96E', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Reset & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Portal() {
  const appStyles = useAppStyles();
  const tokens = buildTokens(appStyles);
  return (
    <PortalErrorBoundary>
      <PortalTokens.Provider value={tokens}>
        <PortalInner />
      </PortalTokens.Provider>
    </PortalErrorBoundary>
  );
}

function PortalInner() {
  const { FONT, MONO, BG, SURFACE, ACCENT, ACCENT_LIGHT, BORDER, TEXT, TEXT2, TEXT3, SUCCESS, WARNING, CARD_RADIUS, CARD_SHADOW, CARD_PAD, dark } = useTokens();
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
  const client = patients.find(p => p.id === selectedClientId) || topClients[0] || { id: 'none', firstName: 'You', lastName: '' };
  const clientName = `${client.firstName} ${client.lastName}`.trim() || 'Client';

  // Navigation
  const [activeTab, setActiveTab] = useState('home');
  const [subView, setSubView] = useState(null); // 'workout-detail', 'active-workout', 'workout-complete'
  const [selectedWorkout, setSelectedWorkout] = useState(null); // tracks which workout to show in detail
  const [selectedProgram, setSelectedProgram] = useState(null); // tracks which program to show in detail

  // Train tab segments
  const [trainSeg, setTrainSeg] = useState('Calendar');
  // Coach tab segments
  const [coachSeg, setCoachSeg] = useState('AI Coach');
  // Mind tab state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0); // 0=in, 1=hold, 2=out, 3=hold
  const breathingTimer = useRef(null);
  // Progress tab segments
  const [progressSeg, setProgressSeg] = useState('Workouts');

  // Habits
  const [habits, setHabits] = useState({ water: false, sleep: true, steps: false, eat: false });

  // Meal log modal
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealForm, setMealForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [mealLog, setMealLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ms_meal_log_${selectedClientId}`)) || []; } catch { return []; }
  });

  // Refresh meal log when client changes
  useEffect(() => {
    try { setMealLog(JSON.parse(localStorage.getItem(`ms_meal_log_${selectedClientId}`)) || []); } catch { setMealLog([]); }
  }, [selectedClientId]);

  // Active workout state
  const [workoutIndex, setWorkoutIndex] = useState(0);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const timerRef = useRef(null);

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

  // Workout timer
  useEffect(() => {
    if (subView === 'active-workout' && !workoutPaused) {
      timerRef.current = setInterval(() => setWorkoutTimer(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [subView, workoutPaused]);

  if (!client) return <div style={{ padding: 40, fontFamily: FONT, color: TEXT3 }}>No clients found. Add clients in the admin panel first.</div>;

  // Derived data
  const clientAppts = appointments.filter(a => a.patientId === client.id);
  const todayAppts = clientAppts.filter(a => a.date === today());
  const clientPrograms = programs.filter(p => p.patientId === client.id);
  const progressData = getSeedProgress(client.id);
  const prs = getSeedPRs(client.id);
  const nutrition = getSeedNutrition(client.id);

  // Streak
  const completedDates = [...new Set(clientAppts.filter(a => a.status === 'completed').map(a => a.date))].sort().reverse();
  let streak = 0;
  if (completedDates.length > 0) {
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const check = new Date(d); check.setDate(check.getDate() - i);
      if (completedDates.includes(check.toISOString().slice(0, 10))) streak++;
      else if (i > 0) break;
    }
  }
  const streakCount = Math.max(streak, 12);
  const weekWorkouts = Math.max(clientAppts.filter(a => a.status === 'completed' && a.date >= weeksAgo(1)).length, 4);
  const totalMin = weekWorkouts * 45;

  const getServiceName = (svcId) => (services.find(s => s.id === svcId) || {}).name || 'Session';

  const allExercises = activeWorkoutData.sections.flatMap(s => s.exercises);
  const totalExerciseCount = allExercises.length;
  const totalSets = activeWorkoutData.sections.flatMap(s => s.exercises).reduce((sum, e) => sum + (e.sets || 1), 0);

  const sendChat = () => {
    if (!chatDraft.trim()) return;
    setChatMessages(prev => [...prev, { id: `cm${Date.now()}`, from: 'client', text: chatDraft.trim(), ts: new Date().toISOString() }]);
    setChatDraft('');
  };

  const saveMeal = () => {
    if (!mealForm.name.trim()) return;
    const entry = {
      id: `meal-${Date.now()}`,
      name: mealForm.name.trim(),
      calories: Number(mealForm.calories) || 0,
      protein: Number(mealForm.protein) || 0,
      carbs: Number(mealForm.carbs) || 0,
      fat: Number(mealForm.fat) || 0,
      date: today(),
      ts: new Date().toISOString(),
    };
    const updated = [...mealLog, entry];
    setMealLog(updated);
    localStorage.setItem(`ms_meal_log_${selectedClientId}`, JSON.stringify(updated));
    setMealForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setShowMealModal(false);
  };

  // Build workout data for library items so detail view can show real exercises
  const LIBRARY_WORKOUTS = {
    'lib-1': {
      title: 'Upper Body Push', duration: 40, difficulty: 'Intermediate',
      focus: ['Chest', 'Shoulders', 'Triceps'],
      sections: [
        { name: 'Warm-up', exercises: [
          { name: 'Arm Circles', sets: null, reps: null, weight: null, time: '2 min', icon: null },
          { name: 'Band Pull-Aparts', sets: null, reps: null, weight: null, time: '2 min', icon: null },
        ]},
        { name: 'Main', exercises: [
          { name: 'Incline Dumbbell Press', sets: 4, reps: 10, weight: '45 lbs', time: null, icon: null },
          { name: 'Flat Barbell Bench', sets: 4, reps: 8, weight: '165 lbs', time: null, icon: null },
          { name: 'Overhead Press', sets: 3, reps: 10, weight: '85 lbs', time: null, icon: null },
          { name: 'Cable Flyes', sets: 3, reps: 12, weight: '25 lbs', time: null, icon: null },
          { name: 'Lateral Raises', sets: 3, reps: 15, weight: '20 lbs', time: null, icon: null },
          { name: 'Tricep Pushdowns', sets: 3, reps: 12, weight: '40 lbs', time: null, icon: null },
        ]},
        { name: 'Cooldown', exercises: [
          { name: 'Chest Stretch', sets: null, reps: null, weight: null, time: '60s each', icon: null },
          { name: 'Shoulder Stretch', sets: null, reps: null, weight: null, time: '60s each', icon: null },
        ]},
      ],
    },
    'lib-2': {
      title: 'Lower Body Power', duration: 45, difficulty: 'Advanced',
      focus: ['Quads', 'Glutes', 'Hamstrings'],
      sections: [
        { name: 'Warm-up', exercises: [
          { name: 'Leg Swings', sets: null, reps: null, weight: null, time: '2 min', icon: null },
          { name: 'Bodyweight Squats', sets: null, reps: null, weight: null, time: '2 min', icon: null },
        ]},
        { name: 'Main', exercises: [
          { name: 'Barbell Back Squat', sets: 5, reps: 5, weight: '225 lbs', time: null, icon: null },
          { name: 'Romanian Deadlift', sets: 4, reps: 8, weight: '185 lbs', time: null, icon: null },
          { name: 'Bulgarian Split Squats', sets: 3, reps: 10, weight: '50 lbs', time: null, icon: null },
          { name: 'Leg Press', sets: 3, reps: 12, weight: '360 lbs', time: null, icon: null },
          { name: 'Hamstring Curls', sets: 3, reps: 12, weight: '90 lbs', time: null, icon: null },
        ]},
        { name: 'Cooldown', exercises: [
          { name: 'Quad Stretch', sets: null, reps: null, weight: null, time: '60s each', icon: null },
          { name: 'Hamstring Stretch', sets: null, reps: null, weight: null, time: '60s each', icon: null },
        ]},
      ],
    },
    'lib-3': {
      title: 'Core & Conditioning', duration: 25, difficulty: 'Beginner',
      focus: ['Core', 'Cardio'],
      sections: [
        { name: 'Warm-up', exercises: [
          { name: 'Jumping Jacks', sets: null, reps: null, weight: null, time: '2 min', icon: null },
        ]},
        { name: 'Main', exercises: [
          { name: 'Plank', sets: 3, reps: null, weight: null, time: '45s', icon: null },
          { name: 'Mountain Climbers', sets: 3, reps: 20, weight: null, time: null, icon: null },
          { name: 'Russian Twists', sets: 3, reps: 20, weight: '15 lbs', time: null, icon: null },
          { name: 'Bicycle Crunches', sets: 3, reps: 20, weight: null, time: null, icon: null },
          { name: 'Dead Bug', sets: 3, reps: 12, weight: null, time: null, icon: null },
        ]},
        { name: 'Cooldown', exercises: [
          { name: "Child's Pose", sets: null, reps: null, weight: null, time: '90s', icon: null },
        ]},
      ],
    },
    'lib-4': {
      title: 'Active Recovery Flow', duration: 30, difficulty: 'Beginner',
      focus: ['Mobility', 'Flexibility'],
      sections: [
        { name: 'Flow', exercises: [
          { name: 'Cat-Cow', sets: null, reps: null, weight: null, time: '3 min', icon: null },
          { name: "World's Greatest Stretch", sets: null, reps: null, weight: null, time: '3 min', icon: null },
          { name: 'Pigeon Pose', sets: null, reps: null, weight: null, time: '2 min each', icon: null },
          { name: 'Thoracic Rotation', sets: null, reps: null, weight: null, time: '2 min each', icon: null },
          { name: 'Hip 90/90', sets: null, reps: null, weight: null, time: '2 min each', icon: null },
          { name: 'Foam Roll - Full Body', sets: null, reps: null, weight: null, time: '10 min', icon: null },
        ]},
      ],
    },
  };

  // Get the active workout data (selected or default)
  const activeWorkoutData = selectedWorkout || SAMPLE_WORKOUT;

  const openWorkoutDetail = (workout) => {
    setSelectedWorkout(workout);
    setSubView('workout-detail');
  };

  const startWorkout = () => {
    setWorkoutIndex(0);
    setWorkoutTimer(0);
    setWorkoutPaused(false);
    setCompletedExercises(new Set());
    setSubView('active-workout');
  };

  const finishWorkout = () => {
    clearInterval(timerRef.current);
    setSubView('workout-complete');
  };

  const fmtTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Week strip for calendar ──
  const getWeekDays = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        date: d.getDate(),
        isToday: d.toISOString().slice(0, 10) === today(),
        fullDate: d.toISOString().slice(0, 10),
        hasEvent: clientAppts.some(a => a.date === d.toISOString().slice(0, 10)),
      };
    });
  };

  /* ══════════════════════════════════════
     TAB 1: HOME
     ══════════════════════════════════════ */
  const SERIF = "'Playfair Display', Georgia, serif";

  // Editorial image cards — warm gradient placeholders (replace with real photos later)
  const IMG_MOVEMENT = 'linear-gradient(160deg, #C4A882 0%, #8B7355 50%, #6B5B45 100%)';
  const IMG_NOURISH  = 'linear-gradient(160deg, #7A8C6A 0%, #5C6B4A 50%, #4A5838 100%)';
  const IMG_CONNECT  = 'linear-gradient(160deg, #B8A090 0%, #8C7768 50%, #6B5B50 100%)';
  const IMG_MIND     = 'linear-gradient(160deg, #A0906E 0%, #7A6B50 50%, #5C4E38 100%)';

  const renderHome = () => (
    <div className="ios-page" style={{ padding: '0 0 100px' }}>

      {/* Editorial Header */}
      <div className="ios-fadeUp" style={{ padding: '28px 20px 20px' }}>
        <p style={{ font: `400 13px ${FONT}`, color: TEXT3, margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {fmtFullDate()}
        </p>
        <h1 style={{ font: `500 32px ${SERIF}`, color: TEXT, margin: 0, letterSpacing: '-0.3px', lineHeight: 1.15 }}>
          Welcome back,<br />{client.firstName}
        </h1>
      </div>

      {/* Daily Affirmation */}
      <div className="ios-fadeUp ios-d1" style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: `linear-gradient(135deg, ${ACCENT}08, ${ACCENT}04)`,
          border: `1px solid ${ACCENT}15`,
        }}>
          <p style={{ font: `italic 400 16px ${SERIF}`, color: TEXT, margin: 0, lineHeight: 1.6 }}>
            "I am becoming the person I was always meant to be."
          </p>
          <p style={{ font: `400 11px ${FONT}`, color: TEXT3, margin: '10px 0 0', letterSpacing: '0.04em' }}>
            Today's intention
          </p>
        </div>
      </div>

      {/* Hero Pillars — Movement, Nourishment, Connection (full-bleed photo cards) */}
      <div className="ios-fadeUp ios-d2" style={{ padding: '0 20px', marginBottom: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Movement */}
          <div onClick={() => setActiveTab('train')} className="ios-card" style={{
            height: 180, borderRadius: 18, overflow: 'hidden', position: 'relative', cursor: 'pointer',
            background: IMG_MOVEMENT,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.4) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
              <div style={{ font: `500 24px ${SERIF}`, color: '#FFFFFF', letterSpacing: '-0.2px' }}>Movement</div>
              <div style={{ font: `400 13px ${FONT}`, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                {SAMPLE_WORKOUT.title} &middot; {SAMPLE_WORKOUT.duration} min
              </div>
            </div>
          </div>

          {/* Two-up: Nourishment + Connection */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div onClick={() => setActiveTab('progress')} className="ios-card" style={{
              flex: 1, height: 160, borderRadius: 18, overflow: 'hidden', position: 'relative', cursor: 'pointer',
              background: IMG_NOURISH,
              boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.45) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 18 }}>
                <div style={{ font: `500 20px ${SERIF}`, color: '#FFFFFF' }}>Nourishment</div>
                <div style={{ font: `400 12px ${FONT}`, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                  {nutrition.calories.current} / {nutrition.calories.target} cal
                </div>
              </div>
            </div>

            <div onClick={() => setActiveTab('mind')} className="ios-card" style={{
              flex: 1, height: 160, borderRadius: 18, overflow: 'hidden', position: 'relative', cursor: 'pointer',
              background: IMG_CONNECT,
              boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.45) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 18 }}>
                <div style={{ font: `500 20px ${SERIF}`, color: '#FFFFFF' }}>Stillness</div>
                <div style={{ font: `400 12px ${FONT}`, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                  Breathe &middot; Journal &middot; Reflect
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habits — minimal, elegant */}
      <div className="ios-fadeUp ios-d3" style={{ padding: '0 20px', marginBottom: 28 }}>
        <div style={{ font: `500 11px ${FONT}`, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
          Daily Practice
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {SAMPLE_HABITS.map((h, i) => (
            <div
              key={h.id}
              onClick={() => setHabits(prev => ({ ...prev, [h.id]: !prev[h.id] }))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0', cursor: 'pointer',
                borderBottom: i < SAMPLE_HABITS.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}
            >
              <span style={{
                font: `400 15px ${FONT}`,
                color: habits[h.id] ? TEXT3 : TEXT,
                textDecoration: habits[h.id] ? 'line-through' : 'none',
                transition: 'all 0.2s ease',
              }}>
                {h.label}
              </span>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                border: habits[h.id] ? 'none' : `1.5px solid ${BORDER}`,
                background: habits[h.id] ? ACCENT : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                {habits[h.id] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats — quiet, understated */}
      <div className="ios-fadeUp ios-d4" style={{ padding: '0 20px', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { value: streakCount, label: 'day streak' },
            { value: weekWorkouts, label: 'this week' },
            { value: totalMin, label: 'min total' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '20px 0',
              borderRight: i < 2 ? `1px solid ${BORDER}` : 'none',
            }}>
              <div style={{ font: `500 24px ${SERIF}`, color: TEXT }}>{stat.value}</div>
              <div style={{ font: `400 11px ${FONT}`, color: TEXT3, marginTop: 4, letterSpacing: '0.02em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* On-Demand Classes Preview */}
      <div className="ios-fadeUp ios-d5" style={{ padding: '0 20px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ font: `500 11px ${FONT}`, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>On Demand</div>
          <span style={{ font: `400 13px ${FONT}`, color: ACCENT, cursor: 'pointer' }}>See all</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="ios-scroll">
          {[
            { title: 'Morning Flow', type: 'Pilates', mins: 20, bg: IMG_MOVEMENT },
            { title: 'Sunset Stretch', type: 'Yoga', mins: 15, bg: IMG_MIND },
            { title: 'Full Body Burn', type: 'HIIT', mins: 30, bg: IMG_NOURISH },
          ].map((cls, i) => (
            <div key={i} className="ios-card" style={{
              minWidth: 150, height: 200, borderRadius: 16, overflow: 'hidden',
              position: 'relative', cursor: 'pointer', flexShrink: 0,
              background: cls.bg,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
                <div style={{ font: `500 16px ${SERIF}`, color: '#FFFFFF' }}>{cls.title}</div>
                <div style={{ font: `400 11px ${FONT}`, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                  {cls.type} &middot; {cls.mins} min
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message from practitioner */}
      <div className="ios-fadeUp ios-d6" style={{ padding: '0 20px' }}>
        <div onClick={() => { setActiveTab('mind'); }} style={{
          padding: '20px', borderRadius: 16, cursor: 'pointer',
          background: SURFACE, border: `1px solid ${BORDER}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, #C4A882, #8B7355)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', font: `600 12px ${FONT}`, flexShrink: 0,
            }}>MC</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `500 14px ${FONT}`, color: TEXT }}>Marcus Cole</div>
              <div style={{ font: `400 13px ${FONT}`, color: TEXT2, marginTop: 2 }}>
                Great session yesterday. Rest up today.
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  /* ══════════════════════════════════════
     TAB 2: TRAIN
     ══════════════════════════════════════ */
  const renderTrain = () => (
    <div className="ios-page" style={{ padding: '24px 16px 100px' }}>
      <h1 style={{ font: `700 28px ${FONT}`, color: TEXT, margin: '0 0 16px', letterSpacing: '-0.3px' }}>Train</h1>
      <SegmentedControl options={['Calendar', 'Programs', 'Library']} active={trainSeg} onChange={(seg) => { setTrainSeg(seg); setSelectedProgram(null); }} />
      <div style={{ marginTop: 16 }}>
        {trainSeg === 'Calendar' && renderTrainCalendar()}
        {trainSeg === 'Programs' && renderTrainPrograms()}
        {trainSeg === 'Library' && renderTrainLibrary()}
      </div>
    </div>
  );

  const renderTrainCalendar = () => {
    const week = getWeekDays();
    return (
      <>
        {/* Week Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          {week.map(d => (
            <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ font: `500 11px ${FONT}`, color: TEXT3 }}>{d.label}</span>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: d.isToday ? ACCENT : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ font: `600 14px ${FONT}`, color: d.isToday ? '#fff' : TEXT }}>{d.date}</span>
              </div>
              {d.hasEvent && <div style={{ width: 5, height: 5, borderRadius: '50%', background: d.isToday ? '#fff' : ACCENT }} />}
            </div>
          ))}
        </div>

        {/* Today's Schedule */}
        <SectionLabel>Today</SectionLabel>

        {/* Workout card */}
        <Card className="ios-fadeUp ios-d1" style={{ marginBottom: 10 }} onClick={() => openWorkoutDetail(SAMPLE_WORKOUT)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: ACCENT_LIGHT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🏋️</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `500 15px ${FONT}`, color: TEXT }}>{SAMPLE_WORKOUT.title}</div>
              <div style={{ font: `400 13px ${FONT}`, color: TEXT2 }}>{SAMPLE_WORKOUT.duration} min</div>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${BORDER}` }} />
          </div>
        </Card>

        {/* Habits card */}
        <Card className="ios-fadeUp ios-d2" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `500 15px ${FONT}`, color: TEXT }}>Daily Habits</div>
              <div style={{ font: `400 13px ${FONT}`, color: TEXT2 }}>{Object.values(habits).filter(Boolean).length}/4 complete</div>
            </div>
            <IconCheck checked={Object.values(habits).every(Boolean)} />
          </div>
        </Card>

        {/* Nutrition card */}
        <Card className="ios-fadeUp ios-d3" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🥗</div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `500 15px ${FONT}`, color: TEXT }}>Nutrition Tracking</div>
              <div style={{ font: `400 13px ${FONT}`, color: TEXT2 }}>{nutrition.calories.current}/{nutrition.calories.target} cal</div>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', position: 'relative' }}>
              <svg width={30} height={30} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={15} cy={15} r={12} fill="none" stroke="#EFEBE7" strokeWidth={2.5} />
                <circle cx={15} cy={15} r={12} fill="none" stroke={ACCENT} strokeWidth={2.5}
                  strokeDasharray={75.4} strokeDashoffset={75.4 * (1 - nutrition.calories.current / nutrition.calories.target)}
                  strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Today's Sessions from store */}
        {todayAppts.length > 0 && (
          <>
            <SectionLabel style={{ marginTop: 20 }}>Scheduled Sessions</SectionLabel>
            {todayAppts.map(appt => (
              <Card key={appt.id} className="ios-fadeUp" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: `500 15px ${FONT}`, color: TEXT }}>{getServiceName(appt.serviceId)}</div>
                    <div style={{ font: `400 13px ${FONT}`, color: TEXT2 }}>{fmtTime(appt.time)} - {appt.duration}min</div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 100,
                    background: appt.status === 'confirmed' ? '#ECFDF5' : '#FFFBEB',
                    color: appt.status === 'confirmed' ? SUCCESS : WARNING,
                    font: `500 11px ${FONT}`, textTransform: 'capitalize',
                  }}>{appt.status}</span>
                </div>
              </Card>
            ))}
          </>
        )}
      </>
    );
  };

  const renderProgramDetail = (prog) => {
    const isSampleProg = !!prog.phases;
    const completedCount = isSampleProg
      ? Math.round((prog.progress / 100) * (prog.totalWeeks * (parseInt(prog.frequency) || 4)))
      : (prog.sessions ? prog.sessions.filter(s => s.status === 'completed').length : 0);
    const totalCount = isSampleProg
      ? (prog.totalWeeks * (parseInt(prog.frequency) || 4))
      : (prog.sessions ? prog.sessions.length : 0);

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: BG, overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setSelectedProgram(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <IconChevron dir="left" size={24} color={ACCENT} />
          </button>
          <span style={{ font: `600 15px ${FONT}`, color: TEXT }}>Program</span>
          <div style={{ width: 32 }} />
        </div>
        <div style={{ padding: '20px 16px 100px' }}>
          <h1 style={{ font: `700 28px ${FONT}`, color: TEXT, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{prog.name}</h1>
          {isSampleProg && (
            <div style={{ font: `400 14px ${FONT}`, color: TEXT2, marginBottom: 12 }}>
              Week {prog.week} of {prog.totalWeeks} — {prog.frequency}
            </div>
          )}
          {!isSampleProg && prog.sessions && (
            <div style={{ font: `400 14px ${FONT}`, color: TEXT2, marginBottom: 12 }}>
              {completedCount} of {totalCount} sessions completed
            </div>
          )}

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 8, borderRadius: 4, background: '#EFEBE7', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 4, background: ACCENT, width: `${isSampleProg ? prog.progress : (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0)}%`, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ font: `500 12px ${MONO}`, color: ACCENT, textAlign: 'right' }}>
              {isSampleProg ? prog.progress : (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0)}% complete
            </div>
          </div>

          {/* Phases for sample programs */}
          {isSampleProg && prog.phases && (
            <>
              <SectionLabel>Phases</SectionLabel>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {prog.phases.map((p, idx) => (
                  <Card key={p} style={{ flex: 1, padding: 14, textAlign: 'center', border: idx === 0 ? `2px solid ${ACCENT}` : 'none' }}>
                    <div style={{ font: `600 14px ${FONT}`, color: idx === 0 ? ACCENT : TEXT }}>{p}</div>
                    <div style={{ font: `400 11px ${FONT}`, color: TEXT3, marginTop: 4 }}>
                      {idx === 0 ? 'Current' : idx < Math.ceil(prog.week / (prog.totalWeeks / prog.phases.length)) ? 'Completed' : 'Upcoming'}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Sessions list for store programs */}
          {!isSampleProg && prog.sessions && (
            <>
              <SectionLabel>Sessions</SectionLabel>
              {prog.sessions.map((sess, idx) => (
                <Card key={idx} style={{ marginBottom: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: sess.status === 'completed' ? ACCENT : '#EFEBE7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sess.status === 'completed' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <span style={{ font: `600 12px ${FONT}`, color: TEXT3 }}>{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ font: `500 14px ${FONT}`, color: TEXT }}>{sess.name || `Session ${idx + 1}`}</div>
                        {sess.date && <div style={{ font: `400 12px ${FONT}`, color: TEXT3 }}>{fmtDate(sess.date)}</div>}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 100,
                      background: sess.status === 'completed' ? '#ECFDF5' : ACCENT_LIGHT,
                      color: sess.status === 'completed' ? SUCCESS : TEXT2,
                      font: `500 11px ${FONT}`, textTransform: 'capitalize',
                    }}>{sess.status || 'upcoming'}</span>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Card style={{ flex: 1, padding: 14, textAlign: 'center' }}>
              <div style={{ font: `700 20px ${FONT}`, color: TEXT }}>{completedCount}</div>
              <div style={{ font: `400 11px ${FONT}`, color: TEXT3 }}>Completed</div>
            </Card>
            <Card style={{ flex: 1, padding: 14, textAlign: 'center' }}>
              <div style={{ font: `700 20px ${FONT}`, color: TEXT }}>{totalCount - completedCount}</div>
              <div style={{ font: `400 11px ${FONT}`, color: TEXT3 }}>Remaining</div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderTrainPrograms = () => (
    <>
      {selectedProgram && renderProgramDetail(selectedProgram)}

      {SAMPLE_PROGRAMS.map(prog => (
        <Card key={prog.id} className="ios-fadeUp" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setSelectedProgram(prog)}>
          <div style={{ font: `600 17px ${FONT}`, color: TEXT, marginBottom: 4 }}>{prog.name}</div>
          <div style={{ font: `400 13px ${FONT}`, color: TEXT2, marginBottom: 4 }}>
            Week {prog.week} of {prog.totalWeeks} — {prog.frequency}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {prog.phases.map(p => (
              <span key={p} style={{
                padding: '3px 8px', borderRadius: 6, background: ACCENT_LIGHT,
                font: `500 11px ${FONT}`, color: ACCENT,
              }}>{p}</span>
            ))}
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#EFEBE7', overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', borderRadius: 3, background: ACCENT, width: `${prog.progress}%` }} />
          </div>
          <div style={{ font: `500 11px ${MONO}`, color: ACCENT, textAlign: 'right' }}>{prog.progress}%</div>
        </Card>
      ))}

      {/* Programs from store */}
      {clientPrograms.map(prog => (
        <Card key={prog.id} className="ios-fadeUp" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setSelectedProgram(prog)}>
          <div style={{ font: `600 17px ${FONT}`, color: TEXT, marginBottom: 4 }}>{prog.name}</div>
          <div style={{ font: `400 13px ${FONT}`, color: TEXT2, marginBottom: 8 }}>
            {prog.sessions ? `${prog.sessions.filter(s => s.status === 'completed').length} of ${prog.sessions.length} sessions` : 'Program'}
          </div>
          {prog.sessions && (
            <div style={{ height: 6, borderRadius: 3, background: '#EFEBE7', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: ACCENT, width: `${Math.round((prog.sessions.filter(s => s.status === 'completed').length / prog.sessions.length) * 100)}%` }} />
            </div>
          )}
        </Card>
      ))}
    </>
  );

  const renderTrainLibrary = () => (
    <>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 12,
        background: SURFACE, border: `1px solid ${BORDER}`,
        marginBottom: 14,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <span style={{ font: `400 14px ${FONT}`, color: TEXT3 }}>Search workouts...</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }} className="ios-scroll">
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(f => (
          <span key={f} style={{
            padding: '6px 14px', borderRadius: 100, whiteSpace: 'nowrap',
            background: f === 'All' ? ACCENT : SURFACE,
            color: f === 'All' ? '#fff' : TEXT2,
            font: `500 12px ${FONT}`,
            border: f === 'All' ? 'none' : `1px solid ${BORDER}`,
          }}>{f}</span>
        ))}
      </div>

      {SAMPLE_LIBRARY.map(w => (
        <Card key={w.id} className="ios-fadeUp" style={{ marginBottom: 10 }} onClick={() => openWorkoutDetail(LIBRARY_WORKOUTS[w.id] || SAMPLE_WORKOUT)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ font: `500 15px ${FONT}`, color: TEXT, marginBottom: 4 }}>{w.title}</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <span style={{ font: `400 12px ${FONT}`, color: TEXT2 }}>{w.duration} min</span>
                <span style={{ font: `400 12px ${FONT}`, color: TEXT3 }}>{w.level}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {w.tags.map(t => (
                  <span key={t} style={{
                    padding: '2px 8px', borderRadius: 6, background: ACCENT_LIGHT,
                    font: `400 11px ${FONT}`, color: ACCENT,
                  }}>{t}</span>
                ))}
              </div>
            </div>
            <IconChevron dir="right" color={TEXT3} />
          </div>
        </Card>
      ))}
    </>
  );

  /* ══════════════════════════════════════
     WORKOUT DETAIL OVERLAY
     ══════════════════════════════════════ */
  const renderWorkoutDetail = () => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: BG, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setSubView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <IconChevron dir="left" size={24} color={ACCENT} />
        </button>
        <span style={{ font: `600 15px ${FONT}`, color: TEXT }}>Workout</span>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: '20px 16px 120px' }}>
        {/* Hero */}
        <div className="ios-fadeUp ios-d1" style={{ marginBottom: 20 }}>
          <h1 style={{ font: `700 28px ${FONT}`, color: TEXT, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{activeWorkoutData.title}</h1>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <span style={{ font: `400 14px ${FONT}`, color: TEXT2 }}>{activeWorkoutData.duration} min</span>
            <span style={{ font: `400 14px ${FONT}`, color: TEXT2 }}>{activeWorkoutData.difficulty}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {activeWorkoutData.focus.map(f => (
              <span key={f} style={{
                padding: '5px 12px', borderRadius: 100, background: ACCENT_LIGHT,
                font: `500 12px ${FONT}`, color: ACCENT,
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="ios-fadeUp ios-d2" style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <Card style={{ flex: 1, padding: 12, textAlign: 'center' }}>
            <div style={{ font: `700 20px ${FONT}`, color: TEXT }}>{totalExerciseCount}</div>
            <div style={{ font: `400 11px ${FONT}`, color: TEXT3 }}>Exercises</div>
          </Card>
          <Card style={{ flex: 1, padding: 12, textAlign: 'center' }}>
            <div style={{ font: `700 20px ${FONT}`, color: TEXT }}>{totalSets}</div>
            <div style={{ font: `400 11px ${FONT}`, color: TEXT3 }}>Total Sets</div>
          </Card>
          <Card style={{ flex: 1, padding: 12, textAlign: 'center' }}>
            <div style={{ font: `700 20px ${FONT}`, color: TEXT }}>~280</div>
            <div style={{ font: `400 11px ${FONT}`, color: TEXT3 }}>Est. Cal</div>
          </Card>
        </div>

        {/* Exercise List by Section */}
        {activeWorkoutData.sections.map((section, si) => (
          <div key={si} className="ios-fadeUp" style={{ animationDelay: `${0.08 + si * 0.04}s`, marginBottom: 20 }}>
            <SectionLabel>{section.name}</SectionLabel>
            {section.exercises.map((ex, ei) => (
              <Card key={ei} style={{ marginBottom: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: ACCENT_LIGHT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `400 16px ${FONT}`,
                  }}>{ex.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: `500 14px ${FONT}`, color: TEXT }}>{ex.name}</div>
                    <div style={{ font: `400 12px ${FONT}`, color: TEXT2, marginTop: 1 }}>
                      {ex.sets ? `${ex.sets} x ${ex.reps} @ ${ex.weight}` : ex.time}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>

      {/* Sticky Start Button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 8px))',
        background: 'linear-gradient(transparent, rgba(247,243,240,0.95) 20%)',
      }}>
        <PillButton onClick={startWorkout}>Start Workout</PillButton>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     ACTIVE WORKOUT FLOW
     ══════════════════════════════════════ */
  const renderActiveWorkout = () => {
    const currentExercise = allExercises[workoutIndex];
    if (!currentExercise) return null;
    const progressPct = ((workoutIndex + 1) / totalExerciseCount) * 100;
    const isTimed = !currentExercise.sets;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: BG, display: 'flex', flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button onClick={() => { clearInterval(timerRef.current); setSubView(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <IconClose size={22} color={TEXT2} />
            </button>
            <span style={{ font: `600 13px ${MONO}`, color: ACCENT }}>{fmtTimer(workoutTimer)}</span>
            <span style={{ font: `500 13px ${FONT}`, color: TEXT2 }}>{workoutIndex + 1}/{totalExerciseCount}</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 2, background: '#EFEBE7', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: ACCENT, width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 24 }}>
          {/* Exercise icon / video placeholder */}
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            background: ACCENT_LIGHT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 56,
          }}>
            {currentExercise.icon}
          </div>

          {/* Exercise name */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: `700 24px ${FONT}`, color: TEXT, marginBottom: 8, letterSpacing: '-0.3px' }}>
              {currentExercise.name}
            </div>
            {currentExercise.sets ? (
              <div style={{ font: `400 16px ${FONT}`, color: TEXT2 }}>
                {currentExercise.sets} sets x {currentExercise.reps} reps @ {currentExercise.weight}
              </div>
            ) : (
              <div style={{ font: `400 16px ${FONT}`, color: TEXT2 }}>
                {currentExercise.time}
              </div>
            )}
          </div>

          {/* Timed exercise: countdown ring */}
          {isTimed && (
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={50} cy={50} r={44} fill="none" stroke="#EFEBE7" strokeWidth={3} />
                <circle cx={50} cy={50} r={44} fill="none" stroke={ACCENT} strokeWidth={3}
                  strokeDasharray={276.5} strokeDashoffset={0}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <span style={{ font: `700 20px ${MONO}`, color: TEXT }}>{currentExercise.time}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div style={{ padding: '16px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 8px))' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button
              onClick={() => setWorkoutIndex(Math.max(0, workoutIndex - 1))}
              disabled={workoutIndex === 0}
              style={{
                flex: 1, padding: '14px 0', borderRadius: CARD_RADIUS, border: `1.5px solid ${BORDER}`,
                background: SURFACE, font: `500 14px ${FONT}`, color: workoutIndex === 0 ? TEXT3 : TEXT2,
                cursor: workoutIndex === 0 ? 'default' : 'pointer', opacity: workoutIndex === 0 ? 0.5 : 1,
              }}
            >Previous</button>
            <button
              onClick={() => setWorkoutPaused(!workoutPaused)}
              style={{
                width: 52, height: 52, borderRadius: '50%', border: `1.5px solid ${BORDER}`,
                background: SURFACE, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {workoutPaused ? <IconPlay size={18} color={TEXT} /> : <IconPause size={20} color={TEXT} />}
            </button>
            <button style={{ display: 'none' }} /> {/* spacer */}
          </div>
          <PillButton onClick={() => {
            const newCompleted = new Set(completedExercises);
            newCompleted.add(workoutIndex);
            setCompletedExercises(newCompleted);
            if (workoutIndex < totalExerciseCount - 1) {
              setWorkoutIndex(workoutIndex + 1);
            } else {
              finishWorkout();
            }
          }}>
            {workoutIndex < totalExerciseCount - 1 ? 'Next Exercise' : 'Finish Workout'}
          </PillButton>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════
     WORKOUT COMPLETE SUMMARY
     ══════════════════════════════════════ */
  const renderWorkoutComplete = () => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: BG, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="ios-fadeUp" style={{ textAlign: 'center', maxWidth: 340 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <h1 style={{ font: `700 28px ${FONT}`, color: TEXT, margin: '0 0 8px' }}>Workout Complete!</h1>
        <p style={{ font: `400 15px ${FONT}`, color: TEXT2, margin: '0 0 32px' }}>{activeWorkoutData.title}</p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: `700 24px ${FONT}`, color: TEXT }}>{fmtTimer(workoutTimer)}</div>
            <div style={{ font: `400 12px ${FONT}`, color: TEXT3, marginTop: 4 }}>Duration</div>
          </div>
          <div style={{ width: 1, background: BORDER }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: `700 24px ${FONT}`, color: TEXT }}>{completedExercises.size}</div>
            <div style={{ font: `400 12px ${FONT}`, color: TEXT3, marginTop: 4 }}>Exercises</div>
          </div>
          <div style={{ width: 1, background: BORDER }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: `700 24px ${FONT}`, color: TEXT }}>~280</div>
            <div style={{ font: `400 12px ${FONT}`, color: TEXT3, marginTop: 4 }}>Calories</div>
          </div>
        </div>

        <PillButton onClick={() => { setSubView(null); setActiveTab('coach'); setCoachSeg('Messages'); }} style={{ marginBottom: 12 }}>
          Leave Feedback for Coach
        </PillButton>
        <PillButton variant="ghost" onClick={() => setSubView(null)}>
          Done
        </PillButton>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     TAB 3: MIND
     ══════════════════════════════════════ */
  const BREATHING_LABELS = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
  const startBreathing = () => {
    setBreathingActive(true);
    setBreathingPhase(0);
    let phase = 0;
    breathingTimer.current = setInterval(() => {
      phase = (phase + 1) % 4;
      setBreathingPhase(phase);
    }, 4000);
  };
  const stopBreathing = () => {
    setBreathingActive(false);
    clearInterval(breathingTimer.current);
    setBreathingPhase(0);
  };

  const JOURNAL_ENTRIES = [
    { id: 1, text: 'Felt really grounded after this morning\'s session. The breathwork before lifting made a noticeable difference in my focus.', time: 'Today, 8:42 AM', hearts: 3, type: 'text' },
    { id: 2, text: 'Post-workout sunset walk. Grateful for the progress this month.', time: 'Yesterday, 6:15 PM', hearts: 5, type: 'photo' },
    { id: 3, text: 'Voice note: Recovery reflections after a tough week', time: 'Mar 15, 9:30 PM', hearts: 2, type: 'voice' },
  ];

  const SOUNDSCAPES = [
    { id: 's1', label: 'Rain' },
    { id: 's2', label: 'Ocean' },
    { id: 's3', label: 'Forest' },
    { id: 's4', label: 'Fire' },
    { id: 's5', label: 'Night' },
  ];

  const AUDIO_LIBRARY = [
    { id: 'a1', title: 'Evening Body Scan', practitioner: 'Sarah', role: 'Hypnotherapist', duration: '12 min' },
    { id: 'a2', title: 'Morning Meditation', practitioner: 'Sarah', role: 'Hypnotherapist', duration: '8 min' },
    { id: 'a3', title: 'Sleep Story: Mountain Lake', practitioner: 'Sarah', role: 'Hypnotherapist', duration: '20 min' },
  ];

  const renderMind = () => (
    <div style={{ padding: '20px 16px 100px' }}>
      <h1 className="ios-fadeUp" style={{ font: `700 28px ${FONT}`, color: TEXT, margin: '0 0 20px', letterSpacing: '-0.3px' }}>Mind</h1>

      {/* Breathing Exercise */}
      <div className="ios-fadeUp ios-d1 ios-card" style={{
        background: SURFACE, borderRadius: CARD_RADIUS, padding: CARD_PAD + 8,
        boxShadow: CARD_SHADOW, marginBottom: 16, textAlign: 'center',
      }}>
        <div style={{ font: `600 11px ${FONT}`, color: TEXT3, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Breathing Exercise</div>
        <div style={{ font: `600 17px ${FONT}`, color: TEXT, marginBottom: 16 }}>Box Breathing</div>

        {/* Animated circle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140, marginBottom: 12 }}>
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={breathingActive ? 'mind-breathe-active' : 'mind-breathe-paused'} style={{
              width: 100, height: 100, borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT}30, ${ACCENT}10)`,
              border: `2px solid ${ACCENT}40`,
              position: 'absolute',
              transform: breathingActive ? undefined : 'scale(0.6)',
              opacity: breathingActive ? undefined : 0.4,
              transition: breathingActive ? undefined : 'all 0.4s ease',
            }} />
            <div style={{ position: 'relative', zIndex: 1, font: `500 13px ${FONT}`, color: ACCENT }}>
              {breathingActive ? BREATHING_LABELS[breathingPhase] : 'Ready'}
            </div>
          </div>
        </div>

        <div style={{ font: `400 13px ${FONT}`, color: TEXT3, marginBottom: 16 }}>
          4s in &middot; 4s hold &middot; 4s out &middot; 4s hold
        </div>

        <button
          onClick={breathingActive ? stopBreathing : startBreathing}
          style={{
            padding: '10px 32px', borderRadius: 100, border: 'none',
            background: breathingActive ? `${ACCENT}15` : ACCENT,
            color: breathingActive ? ACCENT : '#fff',
            font: `600 14px ${FONT}`, cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {breathingActive ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* SOS Calm Button */}
      <div className="ios-fadeUp ios-d2" style={{ marginBottom: 20, textAlign: 'center' }}>
        <button style={{
          width: '100%', padding: '16px 24px', borderRadius: 100, border: 'none',
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}CC)`,
          color: '#fff', font: `600 16px ${FONT}`, cursor: 'pointer',
          boxShadow: `0 4px 16px ${ACCENT}30`,
          transition: 'transform 0.15s ease',
        }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          I Need Calm Now
        </button>
      </div>

      {/* Journal Wall */}
      <div className="ios-fadeUp ios-d3" style={{ marginBottom: 24 }}>
        <div style={{ font: `600 18px ${FONT}`, color: TEXT, marginBottom: 12 }}>My Journal</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {JOURNAL_ENTRIES.map(entry => (
            <div key={entry.id} className="ios-card" style={{
              background: SURFACE, borderRadius: CARD_RADIUS, padding: CARD_PAD,
              boxShadow: CARD_SHADOW,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                {entry.type === 'photo' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>}
                {entry.type === 'voice' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>}
                <div style={{ flex: 1 }}>
                  <div style={{ font: `400 14px/${1.55} ${FONT}`, color: TEXT }}>{entry.text}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ font: `400 11px ${FONT}`, color: TEXT3 }}>{entry.time}</span>
                <span style={{ font: `400 12px ${FONT}`, color: TEXT3, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={TEXT3} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> {entry.hearts}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Journal input */}
        <div style={{
          marginTop: 10, padding: '10px 14px', borderRadius: 22,
          background: SURFACE, border: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ font: `400 14px ${FONT}`, color: TEXT3, flex: 1 }}>Write something...</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
      </div>

      {/* Soundscapes */}
      <div className="ios-fadeUp ios-d4" style={{ marginBottom: 24 }}>
        <div style={{ font: `600 18px ${FONT}`, color: TEXT, marginBottom: 12 }}>Soundscapes</div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="ios-scroll">
          {SOUNDSCAPES.map(s => (
            <div key={s.id} className="ios-card" style={{
              minWidth: 90, padding: '16px 12px', borderRadius: CARD_RADIUS,
              background: SURFACE, boxShadow: CARD_SHADOW,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              cursor: 'pointer', flexShrink: 0,
            }}>
              <span style={{ font: `300 20px ${FONT}`, color: ACCENT, letterSpacing: '-0.5px' }}>{s.label[0]}</span>
              <span style={{ font: `500 12px ${FONT}`, color: TEXT, letterSpacing: '0.02em' }}>{s.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={TEXT3} stroke="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Audio Library */}
      <div className="ios-fadeUp ios-d5" style={{ marginBottom: 24 }}>
        <div style={{ font: `600 18px ${FONT}`, color: TEXT, marginBottom: 12 }}>From Your Practitioners</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AUDIO_LIBRARY.map(item => (
            <div key={item.id} className="ios-card" style={{
              background: SURFACE, borderRadius: CARD_RADIUS, padding: CARD_PAD,
              boxShadow: CARD_SHADOW,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={ACCENT} stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: `500 15px ${FONT}`, color: TEXT, marginBottom: 2 }}>{item.title}</div>
                <div style={{ font: `400 12px ${FONT}`, color: TEXT3 }}>{item.practitioner} ({item.role}) &middot; {item.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Micro-Lesson */}
      <div className="ios-fadeUp ios-d6" style={{ marginBottom: 24 }}>
        <div style={{ font: `600 18px ${FONT}`, color: TEXT, marginBottom: 12 }}>Daily Micro-Lesson</div>
        <div className="ios-card" style={{
          background: SURFACE, borderRadius: CARD_RADIUS, padding: CARD_PAD + 4,
          boxShadow: CARD_SHADOW,
        }}>
          <div style={{ font: `600 11px ${FONT}`, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Today's Lesson</div>
          <div style={{ font: `600 16px ${FONT}`, color: TEXT, marginBottom: 8 }}>Why habits are neural pathways</div>
          <div style={{ font: `400 14px/${1.6} ${FONT}`, color: TEXT2, marginBottom: 12 }}>
            Think of a new habit like dragging your finger through wet sand — the first time takes effort, but each repetition deepens the groove until the path becomes automatic. Your brain works the same way...
          </div>
          <span style={{ font: `500 13px ${FONT}`, color: ACCENT, cursor: 'pointer' }}>Read more</span>
        </div>
      </div>
    </div>
  );

  const renderCoach = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px - env(safe-area-inset-bottom, 8px))' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px' }}>
        <h1 style={{ font: `700 28px ${FONT}`, color: TEXT, margin: '0 0 12px', letterSpacing: '-0.3px' }}>Coach</h1>
        <SegmentedControl options={['AI Coach', 'Messages']} active={coachSeg} onChange={setCoachSeg} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {coachSeg === 'AI Coach' && renderAICoach()}
        {coachSeg === 'Messages' && renderMessages()}
      </div>
    </div>
  );

  const renderAICoach = () => (
    <div style={{ padding: '8px 16px 100px' }}>
      {/* Quick Chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }} className="ios-scroll">
        {['Adjust my program', 'Build a 4-week plan', 'Nutrition help', 'Recovery tips'].map(chip => (
          <span key={chip} style={{
            padding: '8px 14px', borderRadius: 100, whiteSpace: 'nowrap',
            background: SURFACE, border: `1px solid ${BORDER}`,
            font: `400 13px ${FONT}`, color: TEXT2, cursor: 'pointer',
          }}>{chip}</span>
        ))}
      </div>

      {/* Conversation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {AI_CONVERSATION.map((msg, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
              {msg.from === 'ai' && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: ACCENT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', font: `700 10px ${FONT}`, marginRight: 8, flexShrink: 0, marginTop: 2,
                }}>AI</div>
              )}
              <div style={{
                maxWidth: '80%', padding: '12px 16px',
                borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.from === 'user' ? ACCENT : SURFACE,
                color: msg.from === 'user' ? '#fff' : TEXT,
                font: `400 14px ${FONT}`, lineHeight: 1.6,
                boxShadow: msg.from === 'ai' ? CARD_SHADOW : 'none',
                whiteSpace: 'pre-line',
              }}>
                {msg.text}
              </div>
            </div>
            {/* Action cards */}
            {msg.actions && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 36, marginTop: 8, flexWrap: 'wrap' }}>
                {msg.actions.map(action => (
                  <span key={action} style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: ACCENT_LIGHT, border: `1px solid ${ACCENT}20`,
                    font: `500 12px ${FONT}`, color: ACCENT, cursor: 'pointer',
                  }}>{action}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI input */}
      <div style={{
        marginTop: 20, padding: '10px 14px', borderRadius: 22,
        background: SURFACE, border: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
        <span style={{ font: `400 14px ${FONT}`, color: TEXT3, flex: 1 }}>Ask your AI coach anything...</span>
        <IconSend color={TEXT3} />
      </div>
    </div>
  );

  const renderMessages = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Coach header */}
      <div style={{
        padding: '12px 16px', background: SURFACE,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: ACCENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', font: `600 13px ${FONT}`, flexShrink: 0,
        }}>MC</div>
        <div>
          <div style={{ font: `600 15px ${FONT}`, color: TEXT }}>Marcus Cole</div>
          <div style={{ font: `400 12px ${FONT}`, color: SUCCESS }}>Online</div>
        </div>
      </div>

      {/* Messages */}
      <div className="ios-scroll" style={{
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
                  background: isClient ? ACCENT : SURFACE,
                  color: isClient ? '#fff' : TEXT,
                  font: `400 14px ${FONT}`, lineHeight: 1.5, wordBreak: 'break-word',
                  boxShadow: isClient ? 'none' : CARD_SHADOW,
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
        padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 70px))',
        background: SURFACE, borderTop: `1px solid ${BORDER}`,
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
            border: `1px solid ${BORDER}`, background: BG,
            font: `400 16px ${FONT}`, fontSize: 16, color: TEXT, outline: 'none',
            resize: 'none', minHeight: 42, maxHeight: 100, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={sendChat}
          disabled={!chatDraft.trim()}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
            background: chatDraft.trim() ? ACCENT : '#E8E3DD',
            cursor: chatDraft.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <IconSend color={chatDraft.trim() ? '#fff' : TEXT3} />
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     TAB 4: PROGRESS
     ══════════════════════════════════════ */
  const renderProgress = () => (
    <div className="ios-page" style={{ padding: '24px 16px 100px' }}>
      <h1 style={{ font: `700 28px ${FONT}`, color: TEXT, margin: '0 0 16px', letterSpacing: '-0.3px' }}>Progress</h1>

      {/* Summary Strip */}
      <div className="ios-fadeUp ios-d1" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Card style={{ flex: 1, padding: 12, textAlign: 'center' }}>
          <div style={{ font: `700 18px ${FONT}`, color: TEXT }}>🔥 {streakCount}</div>
          <div style={{ font: `400 10px ${FONT}`, color: TEXT3 }}>Streak</div>
        </Card>
        <Card style={{ flex: 1, padding: 12, textAlign: 'center' }}>
          <div style={{ font: `700 18px ${FONT}`, color: TEXT }}>{weekWorkouts}</div>
          <div style={{ font: `400 10px ${FONT}`, color: TEXT3 }}>This Week</div>
        </Card>
        <Card style={{ flex: 1, padding: 12, textAlign: 'center' }}>
          <div style={{ font: `700 18px ${FONT}`, color: TEXT }}>87%</div>
          <div style={{ font: `400 10px ${FONT}`, color: TEXT3 }}>Compliance</div>
        </Card>
      </div>

      {/* Chart Segment */}
      <div className="ios-fadeUp ios-d2" style={{ marginBottom: 16 }}>
        <SegmentedControl options={['Workouts', 'Body Stats', 'Compliance']} active={progressSeg} onChange={setProgressSeg} />
      </div>

      {/* Chart Area */}
      <Card className="ios-fadeUp ios-d3" style={{ marginBottom: 16 }}>
        {progressSeg === 'Workouts' && (
          <>
            <div style={{ font: `600 15px ${FONT}`, color: TEXT, marginBottom: 4 }}>Workouts Per Week</div>
            <div style={{ font: `400 13px ${FONT}`, color: TEXT2, marginBottom: 14 }}>Last 7 weeks</div>
            <div style={{ overflowX: 'auto' }}>
              <BarChart width={300} height={130} />
            </div>
          </>
        )}
        {progressSeg === 'Body Stats' && progressData && (
          <>
            <div style={{ font: `600 15px ${FONT}`, color: TEXT, marginBottom: 4 }}>Weight Trend</div>
            <div style={{ font: `400 13px ${FONT}`, color: TEXT2, marginBottom: 14 }}>
              {progressData[0].weight} lbs → {progressData[progressData.length - 1].weight} lbs
            </div>
            <div style={{ overflowX: 'auto' }}>
              <LineChart data={progressData} dataKey="weight" width={Math.max(300, (progressData.length - 1) * 24 + 40)} height={140} />
            </div>
          </>
        )}
        {progressSeg === 'Body Stats' && !progressData && (
          <div style={{ textAlign: 'center', padding: 24, font: `400 14px ${FONT}`, color: TEXT3 }}>No body stats recorded yet.</div>
        )}
        {progressSeg === 'Compliance' && (
          <>
            <div style={{ font: `600 15px ${FONT}`, color: TEXT, marginBottom: 4 }}>Weekly Compliance</div>
            <div style={{ font: `400 13px ${FONT}`, color: TEXT2, marginBottom: 14 }}>Workouts + Habits + Nutrition</div>
            <div style={{ overflowX: 'auto' }}>
              <LineChart
                data={[
                  { date: weeksAgo(6), compliance: 72 },
                  { date: weeksAgo(5), compliance: 78 },
                  { date: weeksAgo(4), compliance: 81 },
                  { date: weeksAgo(3), compliance: 75 },
                  { date: weeksAgo(2), compliance: 88 },
                  { date: weeksAgo(1), compliance: 85 },
                  { date: today(), compliance: 91 },
                ]}
                dataKey="compliance" width={300} height={140} color={SUCCESS}
              />
            </div>
          </>
        )}
      </Card>

      {/* PRs Section */}
      {prs.length > 0 && (
        <div className="ios-fadeUp ios-d4">
          <SectionLabel>Personal Records</SectionLabel>
          {prs.map(pr => (
            <Card key={pr.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ font: `500 15px ${FONT}`, color: TEXT }}>{pr.exercise}</div>
                  <div style={{ font: `400 12px ${FONT}`, color: TEXT3 }}>{fmtDate(pr.date)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: `700 17px ${MONO}`, color: ACCENT }}>{pr.value} {pr.unit}</div>
                  {pr.previousValue && (
                    <div style={{ font: `400 11px ${MONO}`, color: SUCCESS }}>+{pr.value - pr.previousValue} {pr.unit}</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Photos Timeline */}
      <div className="ios-fadeUp ios-d5" style={{ marginTop: 20 }}>
        <SectionLabel>Progress Photos</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {['Week 1', 'Week 4', 'Week 8', 'Week 12', '', ''].map((label, i) => (
            <div key={i} style={{
              aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden',
              background: label ? '#E8E3DD' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: label ? 'none' : `1.5px dashed ${BORDER}`,
            }}>
              {label ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ font: `600 11px ${FONT}`, color: TEXT2 }}>{label}</div>
                  <div style={{ font: `400 10px ${FONT}`, color: TEXT3, marginTop: 2 }}>📷</div>
                </div>
              ) : (
                <span style={{ font: `400 20px ${FONT}`, color: BORDER }}>+</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="ios-fadeUp ios-d6" style={{ marginTop: 20 }}>
        <SectionLabel>Badges</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {BADGES.map((badge, i) => (
            <Card key={i} style={{
              padding: 12, textAlign: 'center',
              opacity: badge.earned ? 1 : 0.4,
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{badge.icon}</div>
              <div style={{ font: `500 11px ${FONT}`, color: TEXT }}>{badge.name}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     TAB 5: PROFILE
     ══════════════════════════════════════ */
  const renderProfile = () => (
    <div className="ios-page" style={{ padding: '24px 16px 100px' }}>
      {/* Avatar + Name */}
      <div className="ios-fadeUp ios-d1" style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
          background: ACCENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', font: `700 26px ${FONT}`,
        }}>
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <h1 style={{ font: `700 22px ${FONT}`, color: TEXT, margin: '0 0 4px' }}>{clientName}</h1>
        <p style={{ font: `400 14px ${FONT}`, color: TEXT2, margin: 0 }}>
          {client.goal || 'Build strength & improve health'}
        </p>
      </div>

      {/* Account & Billing */}
      <SectionLabel className="ios-fadeUp ios-d2">Account & Billing</SectionLabel>
      <Card className="ios-fadeUp ios-d2" style={{ marginBottom: 20, padding: 0 }}>
        <ProfileRow label="Current Plan" value="Premium Training" />
        <ProfileRow label="Next Payment" value="Apr 1, 2026" />
        <ProfileRow label="Member Since" value={fmtDate(client.createdAt || '2025-09-15')} last />
      </Card>

      {/* Goals */}
      <SectionLabel className="ios-fadeUp ios-d3">Goals</SectionLabel>
      <Card className="ios-fadeUp ios-d3" style={{ marginBottom: 20, padding: 0 }}>
        <ProfileRow label="Goal Type" value={client.goal || 'Strength & Muscle'} />
        <ProfileRow label="Target Weight" value="180 lbs" />
        <ProfileRow label="Training Days" value="4x / week" last />
      </Card>

      {/* Coach Info */}
      <SectionLabel className="ios-fadeUp ios-d4">Your Coach</SectionLabel>
      <Card className="ios-fadeUp ios-d4" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', font: `600 15px ${FONT}`, flexShrink: 0,
          }}>MC</div>
          <div style={{ flex: 1 }}>
            <div style={{ font: `600 15px ${FONT}`, color: TEXT }}>Marcus Cole</div>
            <div style={{ font: `400 13px ${FONT}`, color: TEXT2 }}>NASM-CPT, CSCS</div>
          </div>
          <button
            onClick={() => { setActiveTab('coach'); setCoachSeg('Messages'); }}
            style={{
              padding: '8px 16px', borderRadius: 100,
              background: ACCENT_LIGHT, border: 'none',
              font: `500 12px ${FONT}`, color: ACCENT, cursor: 'pointer',
            }}
          >Message</button>
        </div>
      </Card>

      {/* Integrations */}
      <SectionLabel className="ios-fadeUp ios-d5">Integrations</SectionLabel>
      <Card className="ios-fadeUp ios-d5" style={{ marginBottom: 20, padding: 0 }}>
        <ProfileToggleRow label="Apple Health" defaultOn />
        <ProfileToggleRow label="Fitbit" last />
      </Card>

      {/* App Settings */}
      <SectionLabel className="ios-fadeUp ios-d6">App Settings</SectionLabel>
      <Card className="ios-fadeUp ios-d6" style={{ marginBottom: 20, padding: 0 }}>
        <ProfileToggleRow label="Push Notifications" defaultOn />
        <ProfileRow label="Units" value="Imperial (lbs)" />
        <ProfileRow label="Theme" value="Light" last />
      </Card>

      {/* About */}
      <SectionLabel>About</SectionLabel>
      <Card style={{ marginBottom: 20, padding: 0 }}>
        <ProfileRow label="Stoa" value="" />
        <ProfileRow label="Terms of Service" value="" chevron />
        <ProfileRow label="Privacy Policy" value="" chevron last />
      </Card>

      {/* Sign Out */}
      <button style={{
        width: '100%', padding: '14px 0', borderRadius: CARD_RADIUS,
        background: 'transparent', border: `1.5px solid #D4A0A0`,
        font: `500 14px ${FONT}`, color: '#B85C5C', cursor: 'pointer',
      }}>Sign Out</button>
    </div>
  );

  /* ── Profile Row Components ── */
  const ProfileRow = ({ label, value, chevron, last }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${BORDER}`,
    }}>
      <span style={{ font: `400 15px ${FONT}`, color: TEXT }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {value && <span style={{ font: `400 14px ${FONT}`, color: TEXT2 }}>{value}</span>}
        {chevron && <IconChevron dir="right" size={14} color={TEXT3} />}
      </div>
    </div>
  );

  const ProfileToggleRow = ({ label, icon, defaultOn, last }) => {
    const [on, setOn] = useState(!!defaultOn);
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${BORDER}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{icon}</span>
          <span style={{ font: `400 15px ${FONT}`, color: TEXT }}>{label}</span>
        </div>
        <button
          onClick={() => setOn(!on)}
          style={{
            width: 48, height: 28, borderRadius: 14, border: 'none',
            background: on ? ACCENT : '#DDD8D3',
            position: 'relative', cursor: 'pointer', padding: 0,
            transition: 'background 0.2s ease',
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            position: 'absolute', top: 3,
            left: on ? 23 : 3,
            transition: 'left 0.2s ease',
          }} />
        </button>
      </div>
    );
  };

  /* ══════════════════════════════════════
     BOTTOM TAB BAR
     ══════════════════════════════════════ */
  const bottomTabs = [
    { id: 'home', label: 'Home', Icon: IconHome },
    { id: 'train', label: 'Train', Icon: IconTrain },
    { id: 'mind', label: 'Mind', Icon: IconMind },
    { id: 'progress', label: 'Progress', Icon: IconProgress },
    { id: 'profile', label: 'Profile', Icon: IconProfile },
  ];

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: FONT, position: 'relative' }}>
      {/* Overlays */}
      {subView === 'workout-detail' && renderWorkoutDetail()}
      {subView === 'active-workout' && renderActiveWorkout()}
      {subView === 'workout-complete' && renderWorkoutComplete()}

      {/* Client Selector Bar */}
      <div style={{
        padding: '14px 16px 10px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: BG,
      }}>
        <div style={{ font: `600 17px ${FONT}`, color: TEXT, letterSpacing: '-0.2px' }}>Stoa</div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowClientDropdown(!showClientDropdown)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 100,
              background: SURFACE, border: `1px solid ${BORDER}`,
              cursor: 'pointer', font: `500 13px ${FONT}`, color: TEXT,
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: ACCENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', font: `600 9px ${FONT}`,
            }}>{client.firstName[0]}{client.lastName[0]}</div>
            {client.firstName}
            <IconChevron dir="down" size={14} color={TEXT3} />
          </button>

          {showClientDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 6,
              background: SURFACE, borderRadius: 14, padding: 6,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: `1px solid ${BORDER}`,
              zIndex: 100, minWidth: 200, maxHeight: 300, overflowY: 'auto',
            }}>
              {topClients.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedClientId(p.id); setShowClientDropdown(false); setActiveTab('home'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: 'none', cursor: 'pointer',
                    background: p.id === selectedClientId ? ACCENT_LIGHT : 'transparent',
                    font: `500 14px ${FONT}`, color: TEXT, textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: ACCENT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', font: `600 9px ${FONT}`, flexShrink: 0,
                  }}>{p.firstName[0]}{p.lastName[0]}</div>
                  {p.firstName} {p.lastName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {showClientDropdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowClientDropdown(false)} />
      )}

      {/* Main Content */}
      <div style={{ overflowY: 'auto' }}>
        {activeTab === 'home' && renderHome()}
        {activeTab === 'train' && renderTrain()}
        {activeTab === 'mind' && renderMind()}
        {activeTab === 'progress' && renderProgress()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Meal Log Modal */}
      {showMealModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowMealModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ font: `600 18px ${FONT}`, color: TEXT, margin: 0 }}>Log Meal</h3>
              <button onClick={() => setShowMealModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <IconClose size={20} color={TEXT3} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ font: `500 12px ${FONT}`, color: TEXT2, display: 'block', marginBottom: 6 }}>Food Name</label>
                <input value={mealForm.name} onChange={e => setMealForm({...mealForm, name: e.target.value})} placeholder="e.g., Grilled Chicken Salad"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, font: `400 15px ${FONT}`, color: TEXT, outline: 'none', boxSizing: 'border-box', background: BG }} />
              </div>
              <div>
                <label style={{ font: `500 12px ${FONT}`, color: TEXT2, display: 'block', marginBottom: 6 }}>Calories</label>
                <input type="number" value={mealForm.calories} onChange={e => setMealForm({...mealForm, calories: e.target.value})} placeholder="0"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, font: `400 15px ${MONO}`, color: TEXT, outline: 'none', boxSizing: 'border-box', background: BG }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ font: `500 12px ${FONT}`, color: TEXT2, display: 'block', marginBottom: 6 }}>Protein (g)</label>
                  <input type="number" value={mealForm.protein} onChange={e => setMealForm({...mealForm, protein: e.target.value})} placeholder="0"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, font: `400 15px ${MONO}`, color: TEXT, outline: 'none', boxSizing: 'border-box', background: BG }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ font: `500 12px ${FONT}`, color: TEXT2, display: 'block', marginBottom: 6 }}>Carbs (g)</label>
                  <input type="number" value={mealForm.carbs} onChange={e => setMealForm({...mealForm, carbs: e.target.value})} placeholder="0"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, font: `400 15px ${MONO}`, color: TEXT, outline: 'none', boxSizing: 'border-box', background: BG }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ font: `500 12px ${FONT}`, color: TEXT2, display: 'block', marginBottom: 6 }}>Fat (g)</label>
                  <input type="number" value={mealForm.fat} onChange={e => setMealForm({...mealForm, fat: e.target.value})} placeholder="0"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, font: `400 15px ${MONO}`, color: TEXT, outline: 'none', boxSizing: 'border-box', background: BG }} />
                </div>
              </div>
            </div>
            {/* Today's logged meals */}
            {mealLog.filter(m => m.date === today()).length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                <div style={{ font: `500 12px ${FONT}`, color: TEXT3, marginBottom: 8 }}>Today's Meals</div>
                {mealLog.filter(m => m.date === today()).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', font: `400 13px ${FONT}`, color: TEXT2 }}>
                    <span>{m.name}</span>
                    <span style={{ font: `500 12px ${MONO}`, color: TEXT }}>{m.calories} cal</span>
                  </div>
                ))}
              </div>
            )}
            <PillButton onClick={saveMeal} style={{ marginTop: 20 }}>Save Meal</PillButton>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 'calc(56px + env(safe-area-inset-bottom, 16px))',
        background: SURFACE,
        borderTop: `1px solid ${BORDER}`,
        display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
        paddingTop: 8,
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        zIndex: 200,
      }}>
        {bottomTabs.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSubView(null); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer',
                minWidth: 56,
              }}
            >
              <t.Icon active={active} />
              <span style={{
                font: `${active ? 600 : 400} 10px ${FONT}`,
                color: active ? ACCENT : TEXT3,
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
