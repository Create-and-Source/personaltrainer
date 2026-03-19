import { useState, useEffect, useMemo } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, subscribe } from '../data/store';

/* ── Keyframes ── */
const PROGRESS_ANIM_ID = 'progress-premium-anims';
if (!document.getElementById(PROGRESS_ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = PROGRESS_ANIM_ID;
  sheet.textContent = `
    @keyframes progFadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes progDrawLine {
      from { stroke-dashoffset: 2000; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes progPulseGold {
      0%, 100% { box-shadow: 0 0 0 0 rgba(184,150,12,0); }
      50%      { box-shadow: 0 0 24px 4px rgba(184,150,12,0.18); }
    }
    @keyframes progScaleIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    .prog-card-hover:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03) !important;
    }
    .prog-pr-recent {
      animation: progPulseGold 2.5s ease-in-out infinite !important;
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Helpers ── */
const today = new Date();
const d = (offset) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
};
const weeksAgo = (w) => d(-w * 7);

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const dt = new Date(dateStr + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtDateFull = (dateStr) => {
  if (!dateStr) return '';
  const dt = new Date(dateStr + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

/* ── Seed Data Generation ── */
function generateWeightData(startWeight, endWeight, weeks) {
  const data = [];
  for (let i = 0; i <= weeks; i++) {
    const progress = i / weeks;
    const base = startWeight + (endWeight - startWeight) * progress;
    const noise = (Math.sin(i * 1.7) * 0.8 + Math.cos(i * 2.3) * 0.5);
    data.push({
      date: weeksAgo(weeks - i),
      weight: Math.round((base + noise) * 10) / 10,
    });
  }
  return data;
}

function generateBodyFatData(startBf, endBf, weeks) {
  const data = [];
  for (let i = 0; i <= weeks; i++) {
    const progress = i / weeks;
    const base = startBf + (endBf - startBf) * progress;
    const noise = (Math.sin(i * 1.3) * 0.3 + Math.cos(i * 2.1) * 0.2);
    data.push({
      date: weeksAgo(weeks - i),
      bodyFat: Math.round((base + noise) * 10) / 10,
    });
  }
  return data;
}

function getSeedProgress(clientId) {
  const key = `ms_progress_${clientId}`;
  const existing = localStorage.getItem(key);
  if (existing) {
    try { return JSON.parse(existing); } catch { /* fall through */ }
  }

  let data = null;
  if (clientId === 'CLT-1000') {
    const weights = generateWeightData(195, 183, 12);
    const bodyFats = generateBodyFatData(22, 17, 12);
    data = weights.map((w, i) => ({
      date: w.date,
      weight: w.weight,
      bodyFat: bodyFats[i]?.bodyFat || 17,
    }));
  } else if (clientId === 'CLT-1001') {
    const weights = generateWeightData(145, 138, 12);
    const bodyFats = generateBodyFatData(28, 23, 12);
    data = weights.map((w, i) => ({
      date: w.date,
      weight: w.weight,
      bodyFat: bodyFats[i]?.bodyFat || 23,
    }));
  } else if (clientId === 'CLT-1004') {
    const weights = generateWeightData(170, 175, 12);
    const bodyFats = generateBodyFatData(18, 15, 12);
    data = weights.map((w, i) => ({
      date: w.date,
      weight: w.weight,
      bodyFat: bodyFats[i]?.bodyFat || 15,
    }));
  }

  if (data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  return data;
}

function getSeedPRs(clientId) {
  const key = 'ms_prs';
  const existing = localStorage.getItem(key);
  let all;
  try { all = existing ? JSON.parse(existing) : null; } catch { all = null; }
  if (all) return all.filter(pr => pr.clientId === clientId);

  const allPRs = [
    // James Thompson (CLT-1000) - strong dude, cutting
    { id: 'PR-1', clientId: 'CLT-1000', exercise: 'Bench Press', value: 225, unit: 'lbs', reps: 1, date: d(-8), previousValue: 215, previousDate: d(-35), notes: 'Clean rep, paused at chest' },
    { id: 'PR-2', clientId: 'CLT-1000', exercise: 'Squat', value: 315, unit: 'lbs', reps: 1, date: d(-22), previousValue: 295, previousDate: d(-50), notes: 'ATG, belt only' },
    { id: 'PR-3', clientId: 'CLT-1000', exercise: 'Deadlift', value: 385, unit: 'lbs', reps: 1, date: d(-5), previousValue: 365, previousDate: d(-40), notes: 'Conventional, no straps' },
    { id: 'PR-4', clientId: 'CLT-1000', exercise: 'Overhead Press', value: 155, unit: 'lbs', reps: 1, date: d(-45), previousValue: 145, previousDate: d(-80), notes: 'Strict press' },
    { id: 'PR-5', clientId: 'CLT-1000', exercise: 'Pull-ups', value: 18, unit: 'reps', reps: null, date: d(-12), previousValue: 15, previousDate: d(-55), notes: 'Bodyweight, full ROM' },
    { id: 'PR-6', clientId: 'CLT-1000', exercise: 'Mile Run', value: '6:45', unit: 'time', reps: null, date: d(-20), previousValue: '7:12', previousDate: d(-60), notes: 'Treadmill, 1% incline' },

    // Sarah Chen (CLT-1001) - getting strong
    { id: 'PR-7', clientId: 'CLT-1001', exercise: 'Bench Press', value: 95, unit: 'lbs', reps: 1, date: d(-10), previousValue: 85, previousDate: d(-42), notes: 'First time with 95!' },
    { id: 'PR-8', clientId: 'CLT-1001', exercise: 'Squat', value: 155, unit: 'lbs', reps: 1, date: d(-15), previousValue: 135, previousDate: d(-48), notes: 'Parallel depth, great form' },
    { id: 'PR-9', clientId: 'CLT-1001', exercise: 'Deadlift', value: 185, unit: 'lbs', reps: 1, date: d(-3), previousValue: 165, previousDate: d(-38), notes: 'Sumo stance' },
    { id: 'PR-10', clientId: 'CLT-1001', exercise: 'Overhead Press', value: 65, unit: 'lbs', reps: 1, date: d(-55), previousValue: 55, previousDate: d(-90), notes: '' },
    { id: 'PR-11', clientId: 'CLT-1001', exercise: 'Pull-ups', value: 5, unit: 'reps', reps: null, date: d(-7), previousValue: 3, previousDate: d(-45), notes: 'First unassisted set of 5!' },
    { id: 'PR-12', clientId: 'CLT-1001', exercise: 'Mile Run', value: '8:20', unit: 'time', reps: null, date: d(-25), previousValue: '9:05', previousDate: d(-65), notes: '' },

    // David Garcia (CLT-1004) - gaining muscle
    { id: 'PR-13', clientId: 'CLT-1004', exercise: 'Bench Press', value: 185, unit: 'lbs', reps: 1, date: d(-18), previousValue: 165, previousDate: d(-52), notes: 'Big jump, confidence is up' },
    { id: 'PR-14', clientId: 'CLT-1004', exercise: 'Squat', value: 225, unit: 'lbs', reps: 1, date: d(-6), previousValue: 205, previousDate: d(-44), notes: 'Post-rehab PR, knee feels good' },
    { id: 'PR-15', clientId: 'CLT-1004', exercise: 'Deadlift', value: 275, unit: 'lbs', reps: 1, date: d(-28), previousValue: 255, previousDate: d(-58), notes: 'Conventional' },
    { id: 'PR-16', clientId: 'CLT-1004', exercise: 'Overhead Press', value: 115, unit: 'lbs', reps: 1, date: d(-40), previousValue: 105, previousDate: d(-75), notes: '' },
    { id: 'PR-17', clientId: 'CLT-1004', exercise: 'Pull-ups', value: 12, unit: 'reps', reps: null, date: d(-14), previousValue: 9, previousDate: d(-50), notes: 'Strict, no kip' },
    { id: 'PR-18', clientId: 'CLT-1004', exercise: 'Mile Run', value: '7:30', unit: 'time', reps: null, date: d(-35), previousValue: '8:00', previousDate: d(-70), notes: '' },
  ];
  localStorage.setItem(key, JSON.stringify(allPRs));
  return allPRs.filter(pr => pr.clientId === clientId);
}

function getSeedMeasurements(clientId) {
  const key = `ms_measurements_${clientId}`;
  const existing = localStorage.getItem(key);
  if (existing) {
    try { return JSON.parse(existing); } catch { /* fall through */ }
  }

  let data = null;
  if (clientId === 'CLT-1000') {
    data = [
      { date: weeksAgo(12), chest: 42, waist: 36, hips: 40, armL: 15, armR: 15.5, thighL: 24, thighR: 24.5 },
      { date: weeksAgo(8), chest: 42.5, waist: 34.5, hips: 39.5, armL: 15.5, armR: 16, thighL: 24, thighR: 24 },
      { date: weeksAgo(4), chest: 43, waist: 33, hips: 39, armL: 16, armR: 16, thighL: 24.5, thighR: 24.5 },
      { date: weeksAgo(0), chest: 43.5, waist: 32, hips: 38.5, armL: 16, armR: 16.5, thighL: 25, thighR: 25 },
    ];
  } else if (clientId === 'CLT-1001') {
    data = [
      { date: weeksAgo(12), chest: 36, waist: 30, hips: 38, armL: 11, armR: 11, thighL: 22, thighR: 22 },
      { date: weeksAgo(8), chest: 35.5, waist: 29, hips: 37.5, armL: 11.5, armR: 11.5, thighL: 21.5, thighR: 21.5 },
      { date: weeksAgo(4), chest: 35, waist: 28, hips: 37, armL: 11.5, armR: 12, thighL: 21, thighR: 21 },
      { date: weeksAgo(0), chest: 34.5, waist: 27, hips: 36.5, armL: 12, armR: 12, thighL: 21, thighR: 21 },
    ];
  }

  if (data) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  return data;
}

/* ── SVG Weight Chart ── */
function WeightChart({ data, accent, s }) {
  if (!data || data.length < 2) return null;

  const W = 720, H = 280, padL = 55, padR = 20, padT = 20, padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const weights = data.map(d => d.weight);
  const minW = Math.floor(Math.min(...weights) - 2);
  const maxW = Math.ceil(Math.max(...weights) + 2);
  const rangeW = maxW - minW || 1;

  const coords = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + ((maxW - d.weight) / rangeW) * chartH,
    weight: d.weight,
    date: d.date,
  }));

  // Smooth cubic bezier path
  let pathD = '';
  coords.forEach((c, i) => {
    if (i === 0) {
      pathD += `M${c.x},${c.y}`;
    } else {
      const prev = coords[i - 1];
      const cpx = (prev.x + c.x) / 2;
      pathD += ` C${cpx},${prev.y} ${cpx},${c.y} ${c.x},${c.y}`;
    }
  });

  const areaD = `${pathD} L${coords[coords.length - 1].x},${padT + chartH} L${coords[0].x},${padT + chartH} Z`;
  const gradId = 'weightChartGrad-' + Math.random().toString(36).slice(2, 8);

  // Y-axis ticks
  const yTicks = [];
  const yStep = rangeW <= 10 ? 2 : rangeW <= 20 ? 4 : Math.ceil(rangeW / 5);
  for (let v = minW; v <= maxW; v += yStep) {
    yTicks.push({ value: v, y: padT + ((maxW - v) / rangeW) * chartH });
  }

  // Path length estimate for animation
  let pathLen = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    pathLen += Math.sqrt(dx * dx + dy * dy);
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.05" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          <text x={padL - 10} y={t.y + 4} textAnchor="end"
            style={{ font: `500 10px 'JetBrains Mono', monospace`, fill: '#999' }}>
            {t.value}
          </text>
        </g>
      ))}

      {/* X-axis dates */}
      {coords.filter((_, i) => i % Math.max(1, Math.floor(coords.length / 6)) === 0 || i === coords.length - 1).map((c, i) => (
        <text key={i} x={c.x} y={H - 10} textAnchor="middle"
          style={{ font: `500 10px 'JetBrains Mono', monospace`, fill: '#999' }}>
          {fmtDate(c.date)}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradId})`} style={{ animation: 'progFadeInUp 0.8s ease both' }} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: pathLen + 50, strokeDashoffset: pathLen + 50, animation: `progDrawLine 1.5s cubic-bezier(0.4,0,0.2,1) 0.3s forwards` }} />

      {/* Dots */}
      {coords.map((c, i) => (
        <g key={i} style={{ animation: `progScaleIn 0.3s ease ${0.5 + i * 0.08}s both` }}>
          <circle cx={c.x} cy={c.y} r={i === coords.length - 1 ? 6 : 4}
            fill={i === coords.length - 1 ? accent : '#fff'} stroke={accent} strokeWidth="2" />
          {i === coords.length - 1 && (
            <text x={c.x} y={c.y - 14} textAnchor="middle"
              style={{ font: `600 12px 'Inter', sans-serif`, fill: accent }}>
              {c.weight} lbs
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ── Modal Overlay ── */
function Modal({ show, onClose, title, children, s }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'progFadeInUp 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: s.cardSolid, borderRadius: 20, padding: 32, width: '90%', maxWidth: 480,
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '95vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        animation: 'progScaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 20 }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function Progress() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const patients = getPatients();
  const [selectedClient, setSelectedClient] = useState('');
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal form state
  const [metricForm, setMetricForm] = useState({ weight: '', bodyFat: '', date: today.toISOString().slice(0, 10) });
  const [prForm, setPrForm] = useState({ exercise: 'Bench Press', value: '', unit: 'lbs', reps: '1', date: today.toISOString().slice(0, 10), notes: '' });
  const [measForm, setMeasForm] = useState({ date: today.toISOString().slice(0, 10), chest: '', waist: '', hips: '', armL: '', armR: '', thighL: '', thighR: '' });

  // Progress photo comparison state
  const [photoDateA, setPhotoDateA] = useState(0);
  const [photoDateB, setPhotoDateB] = useState(-1);

  const client = useMemo(() => patients.find(p => p.id === selectedClient), [patients, selectedClient]);
  const progressData = useMemo(() => selectedClient ? getSeedProgress(selectedClient) : null, [selectedClient, refreshKey]);
  const prData = useMemo(() => selectedClient ? getSeedPRs(selectedClient) : [], [selectedClient, refreshKey]);
  const measurementData = useMemo(() => selectedClient ? getSeedMeasurements(selectedClient) : null, [selectedClient, refreshKey]);

  const latestMetrics = progressData && progressData.length > 0 ? progressData[progressData.length - 1] : null;
  const prevMetrics = progressData && progressData.length > 1 ? progressData[progressData.length - 2] : null;

  const bmi = latestMetrics ? (latestMetrics.weight / (70 * 70) * 703 * 70 / 2.205).toFixed(1) : null;
  // Simplified BMI: weight(lbs) / height^2(in) * 703. Assume 5'10" = 70in
  const calcBMI = latestMetrics ? ((latestMetrics.weight / (70 * 70)) * 703).toFixed(1) : null;

  const weightTrend = latestMetrics && prevMetrics ? latestMetrics.weight - prevMetrics.weight : 0;
  const bfTrend = latestMetrics && prevMetrics ? latestMetrics.bodyFat - prevMetrics.bodyFat : 0;

  // Photo dates (mock)
  const photoDates = progressData ? [
    { label: fmtDate(progressData[0]?.date), idx: 0 },
    { label: fmtDate(progressData[Math.floor(progressData.length / 2)]?.date), idx: Math.floor(progressData.length / 2) },
    { label: fmtDate(progressData[progressData.length - 1]?.date), idx: progressData.length - 1 },
  ] : [];

  // Save functions
  const saveMetrics = () => {
    if (!metricForm.weight || !selectedClient) return;
    const key = `ms_progress_${selectedClient}`;
    const existing = progressData || [];
    existing.push({ date: metricForm.date, weight: parseFloat(metricForm.weight), bodyFat: parseFloat(metricForm.bodyFat) || null });
    existing.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(key, JSON.stringify(existing));
    setShowMetricsModal(false);
    setMetricForm({ weight: '', bodyFat: '', date: today.toISOString().slice(0, 10) });
    setRefreshKey(k => k + 1);
  };

  const savePR = () => {
    if (!prForm.value || !selectedClient) return;
    const key = 'ms_prs';
    let all;
    try { all = JSON.parse(localStorage.getItem(key)) || []; } catch { all = []; }
    all.push({
      id: `PR-${Date.now()}`,
      clientId: selectedClient,
      exercise: prForm.exercise,
      value: prForm.unit === 'time' ? prForm.value : parseFloat(prForm.value),
      unit: prForm.unit,
      reps: prForm.reps ? parseInt(prForm.reps) : null,
      date: prForm.date,
      previousValue: null,
      previousDate: null,
      notes: prForm.notes,
    });
    localStorage.setItem(key, JSON.stringify(all));
    setShowPRModal(false);
    setPrForm({ exercise: 'Bench Press', value: '', unit: 'lbs', reps: '1', date: today.toISOString().slice(0, 10), notes: '' });
    setRefreshKey(k => k + 1);
  };

  const saveMeasurements = () => {
    if (!selectedClient) return;
    const key = `ms_measurements_${selectedClient}`;
    const existing = measurementData || [];
    const entry = { date: measForm.date };
    ['chest', 'waist', 'hips', 'armL', 'armR', 'thighL', 'thighR'].forEach(f => {
      entry[f] = parseFloat(measForm[f]) || null;
    });
    existing.push(entry);
    existing.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(key, JSON.stringify(existing));
    setShowMeasurementsModal(false);
    setMeasForm({ date: today.toISOString().slice(0, 10), chest: '', waist: '', hips: '', armL: '', armR: '', thighL: '', thighR: '' });
    setRefreshKey(k => k + 1);
  };

  const glass = {
    background: s.card,
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${s.borderLight}`,
    borderRadius: 18,
    boxShadow: s.shadow,
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
  };

  const exercises = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Pull-ups', 'Mile Run'];

  const isRecent = (dateStr) => {
    if (!dateStr) return false;
    return daysBetween(dateStr, today.toISOString().slice(0, 10)) <= 30;
  };

  return (
    <div className="prog-page">
      {/* ═══ HEADER ═══ */}
      <div style={{
        ...glass, padding: '28px 32px', marginBottom: 28,
        background: `linear-gradient(135deg, rgba(255,255,255,0.75) 0%, ${s.accentLight} 100%)`,
        borderLeft: `3px solid ${s.accent}`,
        animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.3px', margin: 0 }}>
          Progress Tracking
        </h1>
        <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, margin: '6px 0 0' }}>
          Track client metrics, personal records, and transformations
        </p>
      </div>

      {/* ═══ CLIENT SELECTOR ═══ */}
      <div style={{
        ...glass, padding: '20px 24px', marginBottom: 28,
        animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 80ms backwards',
      }}>
        <label style={s.label}>Select Client</label>
        <select
          value={selectedClient}
          onChange={e => { setSelectedClient(e.target.value); setRefreshKey(k => k + 1); }}
          style={{
            ...s.input, cursor: 'pointer',
            appearance: 'none', WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
            paddingRight: 40,
          }}
        >
          <option value="">Choose a client to view progress...</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>
          ))}
        </select>
      </div>

      {/* ═══ CLIENT DASHBOARD ═══ */}
      {selectedClient && client && (
        <div>
          {/* Section 1: Body Metrics Cards */}
          <div className="prog-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            {/* Weight Card */}
            <div className="prog-card-hover" style={{
              ...glass, padding: '22px 20px',
              animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 160ms backwards',
            }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 10 }}>Current Weight</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ font: `600 32px ${s.FONT}`, color: s.text, letterSpacing: '-0.5px' }}>
                  {latestMetrics ? latestMetrics.weight : '--'}
                </span>
                <span style={{ font: `500 13px ${s.FONT}`, color: s.text3 }}>lbs</span>
              </div>
              {prevMetrics && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 100,
                    font: `500 11px ${s.FONT}`,
                    background: weightTrend < 0 ? (s.dark ? 'rgba(74,222,128,0.12)' : '#F0FDF4') : weightTrend > 0 ? (s.dark ? 'rgba(220,38,38,0.12)' : '#FEF2F2') : s.borderLight,
                    color: weightTrend < 0 ? s.success : weightTrend > 0 ? s.danger : s.text3,
                  }}>
                    {weightTrend < 0 ? '\u2193' : weightTrend > 0 ? '\u2191' : '\u2192'} {Math.abs(weightTrend).toFixed(1)} lbs
                  </span>
                </div>
              )}
            </div>

            {/* Body Fat Card */}
            <div className="prog-card-hover" style={{
              ...glass, padding: '22px 20px',
              animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 240ms backwards',
            }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 10 }}>Body Fat</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ font: `600 32px ${s.FONT}`, color: s.text, letterSpacing: '-0.5px' }}>
                  {latestMetrics?.bodyFat ? latestMetrics.bodyFat : '--'}
                </span>
                <span style={{ font: `500 13px ${s.FONT}`, color: s.text3 }}>%</span>
              </div>
              {prevMetrics && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 100,
                    font: `500 11px ${s.FONT}`,
                    background: bfTrend < 0 ? (s.dark ? 'rgba(74,222,128,0.12)' : '#F0FDF4') : bfTrend > 0 ? (s.dark ? 'rgba(220,38,38,0.12)' : '#FEF2F2') : s.borderLight,
                    color: bfTrend < 0 ? s.success : bfTrend > 0 ? s.danger : s.text3,
                  }}>
                    {bfTrend < 0 ? '\u2193' : bfTrend > 0 ? '\u2191' : '\u2192'} {Math.abs(bfTrend).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* BMI Card */}
            <div className="prog-card-hover" style={{
              ...glass, padding: '22px 20px',
              animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 320ms backwards',
            }}>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 10 }}>BMI</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ font: `600 32px ${s.FONT}`, color: s.text, letterSpacing: '-0.5px' }}>
                  {calcBMI || '--'}
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 100,
                  font: `500 11px ${s.FONT}`,
                  background: calcBMI < 18.5 ? (s.dark ? 'rgba(251,191,36,0.12)' : '#FFFBEB') : calcBMI < 25 ? (s.dark ? 'rgba(74,222,128,0.12)' : '#F0FDF4') : calcBMI < 30 ? (s.dark ? 'rgba(251,191,36,0.12)' : '#FFFBEB') : (s.dark ? 'rgba(220,38,38,0.12)' : '#FEF2F2'),
                  color: calcBMI < 18.5 ? s.warning : calcBMI < 25 ? s.success : calcBMI < 30 ? s.warning : s.danger,
                }}>
                  {calcBMI < 18.5 ? 'Underweight' : calcBMI < 25 ? 'Normal' : calcBMI < 30 ? 'Overweight' : 'Obese'}
                </span>
              </div>
            </div>

            {/* Log Metrics Button Card */}
            <div className="prog-card-hover" onClick={() => setShowMetricsModal(true)} style={{
              ...glass, padding: '22px 20px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${s.accentLight} 0%, rgba(255,255,255,0.6) 100%)`,
              border: `1.5px dashed ${s.accent}40`,
              animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 400ms backwards',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span style={{ font: `500 13px ${s.FONT}`, color: s.accent, marginTop: 8 }}>Log Metrics</span>
            </div>
          </div>

          {/* Section 2: Weight Chart */}
          {progressData && progressData.length > 1 && (
            <div className="prog-chart-section" style={{
              ...glass, padding: '24px', marginBottom: 28, overflow: 'hidden',
              animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 480ms backwards',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>Weight Over Time</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                    Last {progressData.length} weeks &middot; {progressData[0].weight} lbs \u2192 {progressData[progressData.length - 1].weight} lbs
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px', borderRadius: 100,
                  background: (progressData[progressData.length - 1].weight - progressData[0].weight) < 0 ? '#F0FDF4' : '#FEF2F2',
                  font: `600 12px ${s.FONT}`,
                  color: (progressData[progressData.length - 1].weight - progressData[0].weight) < 0 ? s.success : s.danger,
                }}>
                  {(progressData[progressData.length - 1].weight - progressData[0].weight) > 0 ? '+' : ''}
                  {(progressData[progressData.length - 1].weight - progressData[0].weight).toFixed(1)} lbs
                </div>
              </div>
              <WeightChart data={progressData} accent={s.accent} s={s} />
            </div>
          )}

          {/* Section 3: PR Board */}
          <div style={{
            ...glass, padding: '24px', marginBottom: 28, overflow: 'hidden',
            animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 560ms backwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>Personal Records</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                  {prData.filter(pr => isRecent(pr.date)).length} PRs in the last 30 days
                </div>
              </div>
              <button onClick={() => setShowPRModal(true)} style={s.pillAccent}>
                Log PR
              </button>
            </div>
            <div className="prog-pr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {exercises.map((ex, idx) => {
                const pr = prData.find(p => p.exercise === ex);
                const recent = pr && isRecent(pr.date);
                return (
                  <div key={ex}
                    className={`prog-card-hover ${recent ? 'prog-pr-recent' : ''}`}
                    style={{
                      padding: '20px 18px',
                      borderRadius: 14,
                      background: recent
                        ? 'linear-gradient(135deg, rgba(184,150,12,0.06) 0%, rgba(255,255,255,0.8) 100%)'
                        : 'rgba(255,255,255,0.5)',
                      border: recent ? '1.5px solid rgba(184,150,12,0.25)' : `1px solid ${s.borderLight}`,
                      backdropFilter: 'blur(8px)',
                      animation: `progFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${600 + idx * 60}ms backwards`,
                      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3 }}>
                        {ex}
                      </div>
                      {recent && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 100,
                          font: `600 9px ${s.FONT}`, textTransform: 'uppercase', letterSpacing: 0.5,
                          background: 'rgba(184,150,12,0.12)', color: '#B8960C',
                        }}>NEW PR</span>
                      )}
                    </div>
                    {pr ? (
                      <>
                        <div style={{ font: `600 26px ${s.FONT}`, color: s.text, letterSpacing: '-0.5px', marginBottom: 4 }}>
                          {pr.value}{pr.unit === 'lbs' ? '' : pr.unit === 'reps' ? '' : ''}<span style={{ font: `500 13px ${s.FONT}`, color: s.text3, marginLeft: 4 }}>{pr.unit === 'lbs' ? 'lbs' : pr.unit === 'reps' ? 'reps' : ''}</span>
                        </div>
                        <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginBottom: 6 }}>
                          {fmtDateFull(pr.date)}
                        </div>
                        {pr.previousValue && (
                          <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>
                            Previous: <span style={{ font: `500 11px ${s.MONO}`, color: s.text2 }}>{pr.previousValue} {pr.unit === 'lbs' ? 'lbs' : pr.unit === 'reps' ? 'reps' : ''}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ font: `400 13px ${s.FONT}`, color: s.text3, padding: '8px 0' }}>No PR logged</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Measurements */}
          <div style={{
            ...glass, padding: '24px', marginBottom: 28, overflow: 'hidden',
            animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 640ms backwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>Body Measurements</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>
                  {measurementData ? `${measurementData.length} entries logged` : 'No measurements logged yet'}
                </div>
              </div>
              <button onClick={() => setShowMeasurementsModal(true)} style={s.pillAccent}>
                Log Measurements
              </button>
            </div>
            {measurementData && measurementData.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      {['', 'Chest', 'Waist', 'Hips', 'Arm (L)', 'Arm (R)', 'Thigh (L)', 'Thigh (R)'].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 14px', textAlign: i === 0 ? 'left' : 'center',
                          font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5,
                          color: s.text3, borderBottom: `1px solid ${s.borderLight}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {measurementData.map((row, ri) => {
                      const first = measurementData[0];
                      const isLast = ri === measurementData.length - 1;
                      return (
                        <tr key={ri} style={{
                          background: isLast ? `${s.accentLight}` : 'transparent',
                          animation: `progFadeInUp 0.3s ease ${700 + ri * 60}ms backwards`,
                        }}>
                          <td style={{ padding: '12px 14px', font: `500 12px ${s.MONO}`, color: s.text2, borderBottom: `1px solid ${s.borderLight}`, whiteSpace: 'nowrap' }}>
                            {fmtDate(row.date)}
                            {isLast && <span style={{ font: `500 9px ${s.FONT}`, color: s.accent, marginLeft: 6, textTransform: 'uppercase' }}>Latest</span>}
                          </td>
                          {['chest', 'waist', 'hips', 'armL', 'armR', 'thighL', 'thighR'].map((field, fi) => {
                            const val = row[field];
                            const startVal = first[field];
                            const diff = val && startVal ? val - startVal : null;
                            return (
                              <td key={fi} style={{
                                padding: '12px 14px', textAlign: 'center',
                                font: `500 13px ${s.FONT}`, color: s.text,
                                borderBottom: `1px solid ${s.borderLight}`,
                              }}>
                                {val ? `${val}"` : '-'}
                                {isLast && diff !== null && diff !== 0 && (
                                  <span style={{
                                    display: 'block', font: `500 10px ${s.MONO}`,
                                    color: diff < 0 ? s.success : s.danger,
                                    marginTop: 2,
                                  }}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}"
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>
                No measurements recorded for this client yet
              </div>
            )}
          </div>

          {/* Section 5: Progress Photos */}
          <div style={{
            ...glass, padding: '24px', marginBottom: 28, overflow: 'hidden',
            animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 720ms backwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>Progress Photos</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>Before & after comparison</div>
              </div>
            </div>

            {/* Date selectors */}
            {photoDates.length > 0 && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div>
                  <label style={s.label}>Before</label>
                  <select value={photoDateA} onChange={e => setPhotoDateA(Number(e.target.value))}
                    style={{ ...s.input, width: 'auto', minWidth: 140 }}>
                    {photoDates.map((pd, i) => (
                      <option key={i} value={pd.idx}>{pd.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={s.label}>After</label>
                  <select value={photoDateB < 0 ? photoDates.length - 1 : photoDateB}
                    onChange={e => setPhotoDateB(Number(e.target.value))}
                    style={{ ...s.input, width: 'auto', minWidth: 140 }}>
                    {photoDates.map((pd, i) => (
                      <option key={i} value={pd.idx}>{pd.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Side by side comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {['Before', 'After'].map((label, idx) => {
                const dateIdx = idx === 0 ? photoDateA : (photoDateB < 0 ? (progressData?.length || 1) - 1 : photoDateB);
                const dateStr = progressData && progressData[dateIdx] ? fmtDate(progressData[dateIdx].date) : '';
                return (
                  <div key={label} style={{
                    borderRadius: 16, overflow: 'hidden',
                    border: `1px solid ${s.borderLight}`,
                    animation: `progScaleIn 0.5s cubic-bezier(0.16,1,0.3,1) ${780 + idx * 100}ms backwards`,
                  }}>
                    {/* Photo placeholder */}
                    <div style={{
                      height: 280,
                      background: idx === 0
                        ? 'linear-gradient(135deg, #E8E4E0 0%, #D5D0CB 50%, #C8C3BE 100%)'
                        : `linear-gradient(135deg, ${s.accentLight} 0%, rgba(255,255,255,0.9) 50%, ${s.accentLight} 100%)`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={idx === 0 ? '#AAA' : s.accent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span style={{ font: `400 12px ${s.FONT}`, color: idx === 0 ? '#AAA' : `${s.accent}99` }}>
                        Upload {label.toLowerCase()} photo
                      </span>
                    </div>
                    {/* Label */}
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.8)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ font: `600 12px ${s.FONT}`, color: s.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                      <span style={{ font: `500 11px ${s.MONO}`, color: s.text3 }}>{dateStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Photo grid thumbnails */}
            <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 12 }}>Photo Timeline</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {(photoDates.length > 0 ? photoDates : [{ label: 'No photos', idx: 0 }]).map((pd, i) => (
                <div key={i} style={{
                  width: 80, height: 80, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${i === 0 ? '#E8E4E0' : i === photoDates.length - 1 ? s.accentLight : '#EDEBE8'} 0%, rgba(255,255,255,0.8) 100%)`,
                  border: `1px solid ${s.borderLight}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  animation: `progScaleIn 0.3s ease ${900 + i * 60}ms backwards`,
                  transition: 'all 0.2s ease',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span style={{ font: `500 9px ${s.MONO}`, color: s.text3, marginTop: 4 }}>{pd.label}</span>
                </div>
              ))}
              {/* Add photo button */}
              <div style={{
                width: 80, height: 80, borderRadius: 12, flexShrink: 0,
                border: `1.5px dashed ${s.accent}40`,
                background: `${s.accentLight}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span style={{ font: `500 8px ${s.MONO}`, color: s.accent, marginTop: 3 }}>ADD</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMPTY STATE ═══ */}
      {!selectedClient && (
        <div style={{
          ...glass, padding: '80px 40px', textAlign: 'center',
          animation: 'progFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 160ms backwards',
        }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 16 }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <div style={{ font: `500 16px ${s.FONT}`, color: s.text2, marginBottom: 6 }}>Select a client to view progress</div>
          <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>
            Choose from the dropdown above to see metrics, PRs, and transformation data
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Log Metrics Modal */}
      <Modal show={showMetricsModal} onClose={() => setShowMetricsModal(false)} title="Log Body Metrics" s={s}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={s.label}>Date</label>
            <input type="date" value={metricForm.date}
              onChange={e => setMetricForm({ ...metricForm, date: e.target.value })}
              style={s.input} />
          </div>
          <div>
            <label style={s.label}>Weight (lbs)</label>
            <input type="number" placeholder="185.0" value={metricForm.weight}
              onChange={e => setMetricForm({ ...metricForm, weight: e.target.value })}
              style={s.input} />
          </div>
          <div>
            <label style={s.label}>Body Fat %</label>
            <input type="number" placeholder="18.5" value={metricForm.bodyFat}
              onChange={e => setMetricForm({ ...metricForm, bodyFat: e.target.value })}
              style={s.input} />
          </div>
          <button onClick={saveMetrics} style={{ ...s.pillAccent, padding: '12px 24px', width: '100%', marginTop: 8 }}>
            Save Metrics
          </button>
        </div>
      </Modal>

      {/* Log PR Modal */}
      <Modal show={showPRModal} onClose={() => setShowPRModal(false)} title="Log Personal Record" s={s}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={s.label}>Exercise</label>
            <select value={prForm.exercise}
              onChange={e => {
                const ex = e.target.value;
                const unit = ex === 'Pull-ups' ? 'reps' : ex === 'Mile Run' ? 'time' : 'lbs';
                setPrForm({ ...prForm, exercise: ex, unit });
              }}
              style={s.input}>
              {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>{prForm.unit === 'time' ? 'Time (e.g. 6:45)' : prForm.unit === 'reps' ? 'Reps' : 'Weight (lbs)'}</label>
            <input type={prForm.unit === 'time' ? 'text' : 'number'}
              placeholder={prForm.unit === 'time' ? '6:45' : prForm.unit === 'reps' ? '15' : '225'}
              value={prForm.value}
              onChange={e => setPrForm({ ...prForm, value: e.target.value })}
              style={s.input} />
          </div>
          {prForm.unit === 'lbs' && (
            <div>
              <label style={s.label}>Reps</label>
              <input type="number" placeholder="1" value={prForm.reps}
                onChange={e => setPrForm({ ...prForm, reps: e.target.value })}
                style={s.input} />
            </div>
          )}
          <div>
            <label style={s.label}>Date</label>
            <input type="date" value={prForm.date}
              onChange={e => setPrForm({ ...prForm, date: e.target.value })}
              style={s.input} />
          </div>
          <div>
            <label style={s.label}>Notes (optional)</label>
            <input type="text" placeholder="Clean rep, paused at chest" value={prForm.notes}
              onChange={e => setPrForm({ ...prForm, notes: e.target.value })}
              style={s.input} />
          </div>
          <button onClick={savePR} style={{ ...s.pillAccent, padding: '12px 24px', width: '100%', marginTop: 8 }}>
            Save PR
          </button>
        </div>
      </Modal>

      {/* Log Measurements Modal */}
      <Modal show={showMeasurementsModal} onClose={() => setShowMeasurementsModal(false)} title="Log Measurements" s={s}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={s.label}>Date</label>
            <input type="date" value={measForm.date}
              onChange={e => setMeasForm({ ...measForm, date: e.target.value })}
              style={s.input} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'chest', label: 'Chest (in)' },
              { key: 'waist', label: 'Waist (in)' },
              { key: 'hips', label: 'Hips (in)' },
              { key: 'armL', label: 'Arm Left (in)' },
              { key: 'armR', label: 'Arm Right (in)' },
              { key: 'thighL', label: 'Thigh Left (in)' },
              { key: 'thighR', label: 'Thigh Right (in)' },
            ].map(f => (
              <div key={f.key}>
                <label style={s.label}>{f.label}</label>
                <input type="number" step="0.1" placeholder="0.0" value={measForm[f.key]}
                  onChange={e => setMeasForm({ ...measForm, [f.key]: e.target.value })}
                  style={s.input} />
              </div>
            ))}
          </div>
          <button onClick={saveMeasurements} style={{ ...s.pillAccent, padding: '12px 24px', width: '100%', marginTop: 8 }}>
            Save Measurements
          </button>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 860px) {
          /* Global spacing */
          .prog-page h1 { font-size: 22px !important; margin-bottom: 4px !important; }
          .prog-page > div:first-child p { font-size: 13px !important; }
          .prog-page > div { margin-bottom: 20px !important; }

          /* KPI metrics: 2 columns */
          .prog-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .prog-metrics-grid > div {
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }

          /* Weight chart */
          .prog-chart-section {
            padding: 16px !important;
            border-radius: 14px !important;
          }
          .prog-chart-section svg {
            width: 100% !important;
            height: auto !important;
            max-height: 200px;
          }

          /* PR cards: 2 columns, hide previous PR */
          .prog-pr-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .prog-pr-grid > div {
            padding: 14px 16px !important;
            border-radius: 14px !important;
          }
          .prog-pr-prev {
            display: none !important;
          }

          /* Measurements table: horizontal scroll */
          .prog-meas-table-wrap {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .prog-meas-table-wrap table {
            min-width: 500px;
          }

          /* Cards general */
          .prog-card-hover {
            border-radius: 14px !important;
          }

          /* Touch targets */
          .prog-page button {
            min-height: 44px;
          }

          /* Form inputs */
          .prog-page input, .prog-page select {
            font-size: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .prog-pr-grid { grid-template-columns: 1fr !important; }
          .prog-metrics-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
