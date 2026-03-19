import { useState, useEffect, useCallback } from 'react';
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
    @keyframes progSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
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

/* ── Icons ── */
const ICO = {
  arrowUp: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m18 15-6-6-6 6"/></svg>,
  arrowDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>,
  trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  camera: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  ruler: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>,
  scale: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v17.25M18.5 8h-13L2 16h20z"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  muscle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 6.5c1.5-1.5 3.5-2 5-1s2 3 1 5-3.5 3-5 4-3 2-3 4c0 1.5 1 2.5 2 3"/><path d="M17.5 6.5c-1.5-1.5-3.5-2-5-1s-2 3-1 5 3.5 3 5 4 3 2 3 4c0 1.5-1 2.5-2 3"/></svg>,
  droplet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  flame: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  link: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  download: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

/* ── Seed progress data for 3 clients ── */
function seedProgressData() {
  const clients = getPatients();
  if (clients.length < 3) return;
  const ids = [clients[0].id, clients[1].id, clients[2].id];
  const names = [
    `${clients[0].firstName} ${clients[0].lastName}`,
    `${clients[1].firstName} ${clients[1].lastName}`,
    `${clients[2].firstName} ${clients[2].lastName}`,
  ];

  // Weight + body metrics over 12 weeks
  const weightBases = [195, 155, 215];
  const weightTrends = [-0.6, -0.9, 0.3]; // lbs per week change
  const bfBases = [22, 28, 18];
  const bfTrends = [-0.3, -0.5, -0.15];
  const heightsInches = [71, 64, 73];

  ids.forEach((id, ci) => {
    const progressKey = `ms_progress_${id}`;
    if (localStorage.getItem(progressKey)) return;

    const entries = [];
    for (let w = 12; w >= 0; w--) {
      const date = weeksAgo(w);
      const noise = (Math.random() - 0.5) * 1.5;
      const weight = +(weightBases[ci] + weightTrends[ci] * (12 - w) + noise).toFixed(1);
      const bf = +(bfBases[ci] + bfTrends[ci] * (12 - w) + (Math.random() - 0.5) * 0.5).toFixed(1);
      const heightM = heightsInches[ci] * 0.0254;
      const weightKg = weight * 0.453592;
      const bmi = +(weightKg / (heightM * heightM)).toFixed(1);
      entries.push({ date, weight, bodyFat: bf, bmi });
    }
    localStorage.setItem(progressKey, JSON.stringify(entries));

    // PRs
    const prKey = `ms_prs_${id}`;
    if (!localStorage.getItem(prKey)) {
      const prSets = [
        [
          { lift: 'Bench Press', current: 225, previous: 205, unit: 'lbs', date: d(-7), recent: true },
          { lift: 'Squat', current: 315, previous: 295, unit: 'lbs', date: d(-14), recent: false },
          { lift: 'Deadlift', current: 405, previous: 385, unit: 'lbs', date: d(-5), recent: true },
          { lift: 'OHP', current: 145, previous: 135, unit: 'lbs', date: d(-21), recent: false },
          { lift: 'Pull-ups', current: 18, previous: 15, unit: 'reps', date: d(-10), recent: true },
          { lift: 'Mile Run', current: '6:42', previous: '7:05', unit: 'min', date: d(-28), recent: false },
        ],
        [
          { lift: 'Bench Press', current: 115, previous: 95, unit: 'lbs', date: d(-3), recent: true },
          { lift: 'Squat', current: 165, previous: 145, unit: 'lbs', date: d(-10), recent: true },
          { lift: 'Deadlift', current: 185, previous: 165, unit: 'lbs', date: d(-17), recent: false },
          { lift: 'OHP', current: 65, previous: 55, unit: 'lbs', date: d(-7), recent: true },
          { lift: 'Pull-ups', current: 5, previous: 2, unit: 'reps', date: d(-5), recent: true },
          { lift: 'Mile Run', current: '8:15', previous: '9:30', unit: 'min', date: d(-14), recent: false },
        ],
        [
          { lift: 'Bench Press', current: 275, previous: 265, unit: 'lbs', date: d(-21), recent: false },
          { lift: 'Squat', current: 365, previous: 355, unit: 'lbs', date: d(-4), recent: true },
          { lift: 'Deadlift', current: 455, previous: 445, unit: 'lbs', date: d(-12), recent: false },
          { lift: 'OHP', current: 185, previous: 175, unit: 'lbs', date: d(-8), recent: true },
          { lift: 'Pull-ups', current: 22, previous: 20, unit: 'reps', date: d(-15), recent: false },
          { lift: 'Mile Run', current: '7:20', previous: '7:45', unit: 'min', date: d(-30), recent: false },
        ],
      ];
      localStorage.setItem(prKey, JSON.stringify(prSets[ci]));
    }

    // Measurements
    const measKey = `ms_measurements_${id}`;
    if (!localStorage.getItem(measKey)) {
      const measSets = [
        [
          { area: 'Chest', current: 42.5, start: 40.0, unit: 'in' },
          { area: 'Waist', current: 33.0, start: 35.5, unit: 'in' },
          { area: 'Hips', current: 38.0, start: 39.0, unit: 'in' },
          { area: 'Right Arm', current: 15.5, start: 14.0, unit: 'in' },
          { area: 'Left Arm', current: 15.0, start: 13.5, unit: 'in' },
          { area: 'Right Thigh', current: 24.5, start: 23.0, unit: 'in' },
          { area: 'Left Thigh', current: 24.0, start: 22.5, unit: 'in' },
          { area: 'Shoulders', current: 48.0, start: 46.0, unit: 'in' },
        ],
        [
          { area: 'Chest', current: 34.0, start: 34.5, unit: 'in' },
          { area: 'Waist', current: 26.5, start: 29.0, unit: 'in' },
          { area: 'Hips', current: 36.0, start: 38.0, unit: 'in' },
          { area: 'Right Arm', current: 11.5, start: 11.0, unit: 'in' },
          { area: 'Left Arm', current: 11.0, start: 10.5, unit: 'in' },
          { area: 'Right Thigh', current: 21.0, start: 22.5, unit: 'in' },
          { area: 'Left Thigh', current: 20.5, start: 22.0, unit: 'in' },
          { area: 'Shoulders', current: 38.0, start: 38.0, unit: 'in' },
        ],
        [
          { area: 'Chest', current: 46.0, start: 44.5, unit: 'in' },
          { area: 'Waist', current: 35.0, start: 34.0, unit: 'in' },
          { area: 'Hips', current: 40.0, start: 39.5, unit: 'in' },
          { area: 'Right Arm', current: 17.0, start: 16.5, unit: 'in' },
          { area: 'Left Arm', current: 16.5, start: 16.0, unit: 'in' },
          { area: 'Right Thigh', current: 26.5, start: 25.5, unit: 'in' },
          { area: 'Left Thigh', current: 26.0, start: 25.0, unit: 'in' },
          { area: 'Shoulders', current: 52.0, start: 50.5, unit: 'in' },
        ],
      ];
      localStorage.setItem(measKey, JSON.stringify(measSets[ci]));
    }
  });
}

/* ── Simulated API data per client index ── */
const INBODY_DATA = [
  { weight: 183, bodyFat: 17, smm: 82.5, bmi: 24.2, tbw: 52.3, vfl: 8, bmr: 1890, score: 78 },
  { weight: 142, bodyFat: 24, smm: 54.2, bmi: 24.4, tbw: 38.1, vfl: 5, bmr: 1380, score: 72 },
  { weight: 218, bodyFat: 15, smm: 98.6, bmi: 26.8, tbw: 59.7, vfl: 10, bmr: 2120, score: 82 },
];

const STYKU_DATA = [
  { chest: 43.5, waist: 32, hips: 38.5, thighL: 25, thighR: 25, armL: 16, armR: 16.5, neck: 16, calf: 15.5 },
  { chest: 34.5, waist: 27, hips: 36.5, thighL: 21.5, thighR: 21, armL: 11.5, armR: 11.5, neck: 13, calf: 14 },
  { chest: 46.5, waist: 35.5, hips: 40, thighL: 27, thighR: 27, armL: 17, armR: 17.5, neck: 17.5, calf: 16.5 },
];

function getClientIndex(clientId, clients) {
  const idx = clients.findIndex(c => c.id === clientId);
  return idx >= 0 ? idx % 3 : 0;
}

/* ── Import Body Scan Modal ── */
function ImportScanModal({ isOpen, onClose, s, clientId, clients, onSaved }) {
  const [step, setStep] = useState('choose'); // 'choose' | 'connecting-inbody' | 'connected-inbody' | 'connecting-styku' | 'connected-styku' | 'saved'
  const [inBodyData, setInBodyData] = useState(null);
  const [stykuData, setStykuData] = useState(null);

  const resetState = useCallback(() => {
    setStep('choose');
    setInBodyData(null);
    setStykuData(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const ci = getClientIndex(clientId, clients);

  const connectInBody = useCallback(() => {
    setStep('connecting-inbody');
    setTimeout(() => {
      setInBodyData(INBODY_DATA[ci]);
      setStep('connected-inbody');
    }, 1500);
  }, [ci]);

  const connectStyku = useCallback(() => {
    setStep('connecting-styku');
    setTimeout(() => {
      setStykuData(STYKU_DATA[ci]);
      setStep('connected-styku');
    }, 1500);
  }, [ci]);

  const importInBody = useCallback(() => {
    if (!clientId || !inBodyData) return;
    const dateStr = new Date().toISOString().slice(0, 10);

    // Save to progress
    const progressKey = `ms_progress_${clientId}`;
    let progress = [];
    try { progress = JSON.parse(localStorage.getItem(progressKey) || '[]'); } catch {}
    progress.push({ date: dateStr, weight: inBodyData.weight, bodyFat: inBodyData.bodyFat, bmi: inBodyData.bmi });
    localStorage.setItem(progressKey, JSON.stringify(progress));

    // Save full scan
    const scanKey = `ms_body_scans_${clientId}`;
    let scans = [];
    try { scans = JSON.parse(localStorage.getItem(scanKey) || '[]'); } catch {}
    scans.push({ date: dateStr, source: 'inbody', ...inBodyData });
    localStorage.setItem(scanKey, JSON.stringify(scans));

    setStep('saved');
    if (onSaved) onSaved();
  }, [clientId, inBodyData, onSaved]);

  const importStyku = useCallback(() => {
    if (!clientId || !stykuData) return;
    const dateStr = new Date().toISOString().slice(0, 10);

    // Save measurements
    const measKey = `ms_measurements_${clientId}`;
    let measurements = [];
    try { measurements = JSON.parse(localStorage.getItem(measKey) || '[]'); } catch {}

    const stykuMap = {
      chest: 'Chest', waist: 'Waist', hips: 'Hips',
      thighL: 'Left Thigh', thighR: 'Right Thigh',
      armL: 'Left Arm', armR: 'Right Arm',
      neck: 'Neck', calf: 'Calf',
    };
    for (const [key, label] of Object.entries(stykuMap)) {
      if (stykuData[key]) {
        const existing = measurements.find(m => m.area === label);
        if (existing) {
          existing.current = stykuData[key];
        } else {
          measurements.push({ area: label, current: stykuData[key], start: stykuData[key], unit: 'in' });
        }
      }
    }
    localStorage.setItem(measKey, JSON.stringify(measurements));

    // Save full scan
    const scanKey = `ms_body_scans_${clientId}`;
    let scans = [];
    try { scans = JSON.parse(localStorage.getItem(scanKey) || '[]'); } catch {}
    scans.push({ date: dateStr, source: 'styku', ...stykuData });
    localStorage.setItem(scanKey, JSON.stringify(scans));

    setStep('saved');
    if (onSaved) onSaved();
  }, [clientId, stykuData, onSaved]);

  if (!isOpen) return null;

  const inBodyFields = [
    { label: 'Weight', value: inBodyData?.weight, unit: 'lbs' },
    { label: 'Body Fat', value: inBodyData?.bodyFat, unit: '%' },
    { label: 'Skeletal Muscle', value: inBodyData?.smm, unit: 'lbs' },
    { label: 'BMI', value: inBodyData?.bmi, unit: '' },
    { label: 'Body Water', value: inBodyData?.tbw, unit: 'L' },
    { label: 'Visceral Fat', value: inBodyData?.vfl, unit: '' },
    { label: 'BMR', value: inBodyData?.bmr, unit: 'kcal' },
    { label: 'InBody Score', value: inBodyData?.score, unit: '/100' },
  ];

  const stykuFields = [
    { label: 'Chest', value: stykuData?.chest, unit: 'in' },
    { label: 'Waist', value: stykuData?.waist, unit: 'in' },
    { label: 'Hips', value: stykuData?.hips, unit: 'in' },
    { label: 'Left Thigh', value: stykuData?.thighL, unit: 'in' },
    { label: 'Right Thigh', value: stykuData?.thighR, unit: 'in' },
    { label: 'Left Arm', value: stykuData?.armL, unit: 'in' },
    { label: 'Right Arm', value: stykuData?.armR, unit: 'in' },
    { label: 'Neck', value: stykuData?.neck, unit: 'in' },
    { label: 'Calf', value: stykuData?.calf, unit: 'in' },
  ];

  const isConnecting = step === 'connecting-inbody' || step === 'connecting-styku';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    }} onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={{
        ...s.cardStyle, width: '100%', maxWidth: 560, maxHeight: '90vh',
        overflow: 'auto', padding: 0, margin: 16,
        animation: 'progScaleIn 0.25s ease',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: `1px solid ${s.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: s.accent }}>{ICO.link}</span>
            <h3 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>
              Import Body Scan
            </h3>
          </div>
          <button onClick={handleClose} style={{
            background: 'none', border: 'none', color: s.text3, cursor: 'pointer',
            padding: 4, borderRadius: 8, display: 'flex',
          }}>{ICO.close}</button>
        </div>

        <div style={{ padding: 24 }}>

          {/* ── Saved confirmation ── */}
          {step === 'saved' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: s.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: s.success,
              }}>{ICO.check}</div>
              <h4 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 6px' }}>
                Imported to Progress
              </h4>
              <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: '0 0 20px' }}>
                Scan data has been saved to this client's records.
              </p>
              <button onClick={handleClose} style={{
                ...s.btnPrimary, padding: '10px 28px', borderRadius: 10, cursor: 'pointer',
                fontFamily: s.FONT, fontSize: 14, fontWeight: 600,
              }}>Done</button>
            </div>
          )}

          {/* ── Connecting spinner ── */}
          {isConnecting && (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{
                width: 40, height: 40, border: `3px solid ${s.border}`,
                borderTopColor: step === 'connecting-inbody' ? '#1B365D' : '#00B4D8',
                borderRadius: '50%', margin: '0 auto 20px',
                animation: 'progSpin 0.8s linear infinite',
              }} />
              <p style={{ fontFamily: s.FONT, fontSize: 15, fontWeight: 600, color: s.text, margin: '0 0 4px' }}>
                {step === 'connecting-inbody' ? 'Connecting to LookinBody Web...' : 'Connecting to Styku Cloud...'}
              </p>
              <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: 0 }}>
                Authenticating and pulling latest scan
              </p>
            </div>
          )}

          {/* ── Choose provider ── */}
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: '0 0 4px' }}>
                Connect to a body scanning platform to import the latest results.
              </p>

              {/* InBody option */}
              <button onClick={connectInBody} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
                background: s.surfaceAlt, border: `1px solid ${s.border}`, color: s.text,
                fontFamily: s.FONT, fontSize: 15, fontWeight: 500, textAlign: 'left',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#1B365D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'system-ui', fontSize: 18, fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.02em', flexShrink: 0,
                }}>IB</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>InBody Connect</div>
                  <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>Body composition via LookinBody Web API</div>
                </div>
                <span style={{ color: s.text3 }}>{ICO.link}</span>
              </button>

              {/* Styku option */}
              <button onClick={connectStyku} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
                background: s.surfaceAlt, border: `1px solid ${s.border}`, color: s.text,
                fontFamily: s.FONT, fontSize: 15, fontWeight: 500, textAlign: 'left',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#00B4D8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'system-ui', fontSize: 18, fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.02em', flexShrink: 0,
                }}>Sk</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Styku Connect</div>
                  <div style={{ fontSize: 12, color: s.text3, marginTop: 2 }}>3D body measurements via Styku Cloud API</div>
                </div>
                <span style={{ color: s.text3 }}>{ICO.link}</span>
              </button>
            </div>
          )}

          {/* ── InBody results ── */}
          {step === 'connected-inbody' && inBodyData && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: '#1B365D',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'system-ui', fontSize: 13, fontWeight: 800, color: '#fff',
                }}>IB</div>
                <div>
                  <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: s.text }}>InBody Connected</div>
                  <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.success, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ICO.check} LookinBody Web
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {inBodyFields.map(f => (
                  <div key={f.label} style={{
                    background: s.surfaceAlt, padding: '14px 16px', borderRadius: 10,
                    border: `1px solid ${s.border}`,
                  }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 11, fontWeight: 600, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {f.label}
                    </div>
                    <div style={{ fontFamily: s.MONO, fontSize: 22, fontWeight: 700, color: s.text, lineHeight: 1 }}>
                      {f.value}<span style={{ fontSize: 12, color: s.text3, fontWeight: 400, marginLeft: 3 }}>{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={importInBody} style={{
                ...s.btnPrimary, width: '100%', padding: '12px 20px', borderRadius: 10,
                cursor: 'pointer', fontFamily: s.FONT, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {ICO.download} Import to Progress
              </button>
            </div>
          )}

          {/* ── Styku results ── */}
          {step === 'connected-styku' && stykuData && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: '#00B4D8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'system-ui', fontSize: 13, fontWeight: 800, color: '#fff',
                }}>Sk</div>
                <div>
                  <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: s.text }}>Styku Connected</div>
                  <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.success, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {ICO.check} Styku Cloud
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {stykuFields.map(f => (
                  <div key={f.label} style={{
                    background: s.surfaceAlt, padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${s.border}`,
                  }}>
                    <div style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 600, color: s.text3, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {f.label}
                    </div>
                    <div style={{ fontFamily: s.MONO, fontSize: 18, fontWeight: 700, color: s.text, lineHeight: 1 }}>
                      {f.value}<span style={{ fontSize: 11, color: s.text3, fontWeight: 400, marginLeft: 2 }}>{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={importStyku} style={{
                ...s.btnPrimary, width: '100%', padding: '12px 20px', borderRadius: 10,
                cursor: 'pointer', fontFamily: s.FONT, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {ICO.download} Import to Progress
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Progress() {
  const s = useStyles();
  const [clients, setClients] = useState(getPatients);
  const [selectedClient, setSelectedClient] = useState('');
  const [progressData, setProgressData] = useState([]);
  const [prs, setPrs] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanData, setScanData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { seedProgressData(); }, []);
  useEffect(() => subscribe(() => setClients(getPatients())), []);

  useEffect(() => {
    if (!selectedClient && clients.length > 0) setSelectedClient(clients[0].id);
  }, [clients, selectedClient]);

  useEffect(() => {
    if (!selectedClient) return;
    try {
      setProgressData(JSON.parse(localStorage.getItem(`ms_progress_${selectedClient}`) || '[]'));
      setPrs(JSON.parse(localStorage.getItem(`ms_prs_${selectedClient}`) || '[]'));
      setMeasurements(JSON.parse(localStorage.getItem(`ms_measurements_${selectedClient}`) || '[]'));
      setScanData(JSON.parse(localStorage.getItem(`ms_body_scans_${selectedClient}`) || '[]'));
    } catch {
      setProgressData([]);
      setPrs([]);
      setMeasurements([]);
      setScanData([]);
    }
  }, [selectedClient, refreshKey]);

  const latest = progressData[progressData.length - 1] || {};
  const prev = progressData[progressData.length - 2] || {};
  const first = progressData[0] || {};

  const weightDelta = latest.weight && prev.weight ? +(latest.weight - prev.weight).toFixed(1) : 0;
  const bfDelta = latest.bodyFat && prev.bodyFat ? +(latest.bodyFat - prev.bodyFat).toFixed(1) : 0;
  const bmiDelta = latest.bmi && prev.bmi ? +(latest.bmi - prev.bmi).toFixed(1) : 0;

  const client = clients.find(c => c.id === selectedClient);
  const latestScan = scanData.length > 0 ? scanData[scanData.length - 1] : null;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Import Body Scan Modal */}
      <ImportScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        s={s}
        clientId={selectedClient}
        clients={clients}
        onSaved={() => setRefreshKey(k => k + 1)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, margin: 0 }}>Progress</h1>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: '4px 0 0' }}>
            Body metrics, PRs, and transformation tracking
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {selectedClient && (
            <button onClick={() => setScanModalOpen(true)} style={{
              ...s.btnPrimary, padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
              fontFamily: s.FONT, fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {ICO.download} Import Body Scan
            </button>
          )}
          <select
            style={{ ...s.input, width: 'auto', minWidth: 220, cursor: 'pointer' }}
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
          >
            <option value="">Select client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClient ? (
        <div style={{ ...s.cardStyle, padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: s.FONT, fontSize: 16, color: s.text3 }}>Select a client to view progress</p>
        </div>
      ) : (
        <>
          {/* ═══ BODY METRICS CARDS ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Weight', value: latest.weight, unit: 'lbs', delta: weightDelta, icon: ICO.scale, desiredDown: client?.goals?.toLowerCase().includes('lose') },
              { label: 'Body Fat', value: latest.bodyFat, unit: '%', delta: bfDelta, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>, desiredDown: true },
              { label: 'BMI', value: latest.bmi, unit: '', delta: bmiDelta, icon: ICO.ruler, desiredDown: true },
            ].map((m, i) => {
              const isGood = m.desiredDown ? m.delta <= 0 : m.delta >= 0;
              return (
                <div
                  key={m.label}
                  className="prog-card-hover"
                  style={{
                    ...s.cardStyle,
                    padding: 20,
                    animation: `progFadeInUp 0.4s ease ${i * 0.06}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: s.text3 }}>{m.icon}</span>
                    {m.delta !== 0 && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        fontFamily: s.MONO, fontSize: 12, fontWeight: 600,
                        color: isGood ? s.success : s.danger,
                        background: isGood ? s.successBg : s.dangerBg,
                        padding: '3px 10px', borderRadius: 100,
                      }}>
                        {m.delta > 0 ? ICO.arrowUp : ICO.arrowDown}
                        {Math.abs(m.delta)}{m.unit}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: s.MONO, fontSize: 32, fontWeight: 700, color: s.text, lineHeight: 1 }}>
                    {m.value || '--'}<span style={{ fontSize: 16, color: s.text3, fontWeight: 400, marginLeft: 4 }}>{m.unit}</span>
                  </div>
                  <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginTop: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, marginTop: 2 }}>
                    Started: {first[m.label.toLowerCase().replace(' ', '')] || first.weight || '--'}{m.unit}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ BODY SCAN HISTORY ═══ */}
          <BodyScanHistory scanData={scanData} s={s} clientId={selectedClient} clients={clients} onRefresh={() => setRefreshKey(k => k + 1)} />

          {/* ═══ WEIGHT CHART ═══ */}
          <div style={{ ...s.cardStyle, padding: 24, marginBottom: 24, animation: 'progFadeInUp 0.4s ease 0.1s both' }}>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 20px' }}>
              Weight Over 12 Weeks
            </h2>
            <WeightChart data={progressData} s={s} />
          </div>

          {/* ═══ PR BOARD ═══ */}
          <div style={{ marginBottom: 24, animation: 'progFadeInUp 0.4s ease 0.15s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ color: s.accent }}>{ICO.trophy}</span>
              <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>
                PR Board
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {prs.map((pr, i) => {
                const isRecent = pr.recent;
                return (
                  <div
                    key={pr.lift}
                    className={`prog-card-hover ${isRecent ? 'prog-pr-recent' : ''}`}
                    style={{
                      ...s.cardStyle,
                      padding: 20,
                      animation: `progScaleIn 0.4s ease ${i * 0.06}s both`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isRecent && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        fontFamily: s.FONT, fontSize: 10, fontWeight: 700,
                        color: '#B8960C', background: 'rgba(184,150,12,0.12)',
                        padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        New PR
                      </div>
                    )}
                    <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text2, marginBottom: 8 }}>
                      {pr.lift}
                    </div>
                    <div style={{ fontFamily: s.MONO, fontSize: 28, fontWeight: 700, color: isRecent ? '#B8960C' : s.text, lineHeight: 1 }}>
                      {pr.current}<span style={{ fontSize: 14, color: s.text3, fontWeight: 400, marginLeft: 4 }}>{pr.unit}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3, textDecoration: 'line-through' }}>
                        {pr.previous} {pr.unit}
                      </span>
                      <span style={{
                        fontFamily: s.MONO, fontSize: 11, fontWeight: 600,
                        color: s.success, background: s.successBg,
                        padding: '2px 6px', borderRadius: 100,
                      }}>
                        {typeof pr.current === 'number' ? `+${pr.current - pr.previous}` : 'PR'}
                      </span>
                    </div>
                    <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, marginTop: 6 }}>
                      {fmtDate(pr.date)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ MEASUREMENTS TABLE ═══ */}
          <div style={{ ...s.cardStyle, padding: 0, marginBottom: 24, overflow: 'hidden', animation: 'progFadeInUp 0.4s ease 0.2s both' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: s.text3 }}>{ICO.ruler}</span>
              <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>
                Body Measurements
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                    {['Area', 'Current', 'Start', 'Change', ''].map(h => (
                      <th key={h} style={{
                        fontFamily: s.FONT, fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: s.text3, padding: '12px 16px', textAlign: 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m, i) => {
                    const change = +(m.current - m.start).toFixed(1);
                    const isGain = change > 0;
                    // Arms/chest/shoulders gain = good, waist/hips loss = good
                    const goodAreas = ['chest', 'right arm', 'left arm', 'right thigh', 'left thigh', 'shoulders'];
                    const isGood = goodAreas.includes(m.area.toLowerCase()) ? isGain : !isGain;
                    return (
                      <tr key={m.area} style={{ borderBottom: i < measurements.length - 1 ? `1px solid ${s.borderLight}` : 'none' }}>
                        <td style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text, padding: '12px 16px' }}>{m.area}</td>
                        <td style={{ fontFamily: s.MONO, fontSize: 14, fontWeight: 600, color: s.text, padding: '12px 16px' }}>{m.current} {m.unit}</td>
                        <td style={{ fontFamily: s.MONO, fontSize: 14, color: s.text3, padding: '12px 16px' }}>{m.start} {m.unit}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontFamily: s.MONO, fontSize: 12, fontWeight: 600,
                            color: change === 0 ? s.text3 : (isGood ? s.success : s.danger),
                            background: change === 0 ? s.surfaceAlt : (isGood ? s.successBg : s.dangerBg),
                            padding: '3px 10px', borderRadius: 100,
                          }}>
                            {change > 0 ? '+' : ''}{change} {m.unit}
                            {change !== 0 && (change > 0 ? ICO.arrowUp : ICO.arrowDown)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {/* Mini trend bar */}
                          <div style={{ width: 60, height: 6, borderRadius: 3, background: s.surfaceAlt, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(Math.abs(change) / 3 * 100, 100)}%`,
                              height: '100%', borderRadius: 3,
                              background: change === 0 ? s.text3 : (isGood ? s.success : s.danger),
                            }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ PROGRESS PHOTOS ═══ */}
          <div style={{ ...s.cardStyle, padding: 24, animation: 'progFadeInUp 0.4s ease 0.25s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: s.text3 }}>{ICO.camera}</span>
              <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>
                Progress Photos
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {/* Before placeholder */}
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: `2px dashed ${s.border}`,
                background: s.surfaceAlt,
                aspectRatio: '3/4',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8,
              }}>
                <span style={{ color: s.text3, opacity: 0.4 }}>{ICO.camera}</span>
                <span style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text3 }}>Before</span>
                <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>
                  {fmtDate(first.date) || 'Start date'}
                </span>
                <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3 }}>
                  {first.weight ? `${first.weight} lbs` : ''}
                </span>
              </div>
              {/* After placeholder */}
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: `2px dashed ${s.border}`,
                background: s.surfaceAlt,
                aspectRatio: '3/4',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8,
              }}>
                <span style={{ color: s.text3, opacity: 0.4 }}>{ICO.camera}</span>
                <span style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text3 }}>Current</span>
                <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>
                  {fmtDate(latest.date) || 'Current'}
                </span>
                <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3 }}>
                  {latest.weight ? `${latest.weight} lbs` : ''}
                </span>
              </div>
              {/* Upload placeholder */}
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: `2px dashed ${s.accent}40`,
                background: s.accentLight,
                aspectRatio: '3/4',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.accent }}>Upload Photo</span>
                <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>JPG, PNG up to 10MB</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ Body Scan History section ═══ */
function BodyScanHistory({ scanData, s, clientId, clients, onRefresh }) {
  if (!scanData || scanData.length === 0) return null;

  const latestInBody = [...scanData].reverse().find(sc => sc.source === 'inbody');
  const latestStyku = [...scanData].reverse().find(sc => sc.source === 'styku');

  if (!latestInBody && !latestStyku) return null;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const ci = getClientIndex(clientId, clients);
    const dateStr = new Date().toISOString().slice(0, 10);

    // Simulate pulling fresh data with slight variation
    const scanKey = `ms_body_scans_${clientId}`;
    let scans = [];
    try { scans = JSON.parse(localStorage.getItem(scanKey) || '[]'); } catch {}

    // Add a new InBody scan with small random variation
    const base = INBODY_DATA[ci];
    const fresh = {
      date: dateStr,
      source: 'inbody',
      weight: +(base.weight + (Math.random() - 0.5) * 2).toFixed(1),
      bodyFat: +(base.bodyFat + (Math.random() - 0.5) * 0.6).toFixed(1),
      smm: +(base.smm + (Math.random() - 0.3) * 1).toFixed(1),
      bmi: +(base.bmi + (Math.random() - 0.5) * 0.3).toFixed(1),
      tbw: +(base.tbw + (Math.random() - 0.5) * 0.8).toFixed(1),
      vfl: base.vfl,
      bmr: Math.round(base.bmr + (Math.random() - 0.5) * 20),
      score: Math.round(base.score + (Math.random() - 0.3) * 2),
    };
    scans.push(fresh);
    localStorage.setItem(scanKey, JSON.stringify(scans));

    setTimeout(() => {
      setRefreshing(false);
      if (onRefresh) onRefresh();
    }, 1200);
  }, [clientId, clients, onRefresh]);

  const inBodyFields = latestInBody ? [
    { label: 'Weight', value: latestInBody.weight, unit: 'lbs', icon: ICO.scale },
    { label: 'Body Fat', value: latestInBody.bodyFat, unit: '%', icon: ICO.flame },
    { label: 'Skeletal Muscle', value: latestInBody.smm, unit: 'lbs', icon: ICO.muscle },
    { label: 'BMI', value: latestInBody.bmi, unit: '', icon: ICO.ruler },
    { label: 'Body Water', value: latestInBody.tbw, unit: 'L', icon: ICO.droplet },
    { label: 'Visceral Fat', value: latestInBody.vfl, unit: '', icon: ICO.scale },
    { label: 'BMR', value: latestInBody.bmr, unit: 'kcal', icon: ICO.flame },
    { label: 'InBody Score', value: latestInBody.score, unit: '/100', icon: ICO.trophy },
  ] : [];

  const stykuFields = latestStyku ? [
    { label: 'Chest', value: latestStyku.chest },
    { label: 'Waist', value: latestStyku.waist },
    { label: 'Hips', value: latestStyku.hips },
    { label: 'Left Thigh', value: latestStyku.thighL },
    { label: 'Right Thigh', value: latestStyku.thighR },
    { label: 'Left Arm', value: latestStyku.armL },
    { label: 'Right Arm', value: latestStyku.armR },
    { label: 'Neck', value: latestStyku.neck },
    { label: 'Calf', value: latestStyku.calf },
  ].filter(f => f.value) : [];

  return (
    <div style={{ marginBottom: 24, animation: 'progFadeInUp 0.4s ease 0.08s both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: s.accent }}>{ICO.link}</span>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>
            Body Scan History
          </h2>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{
          background: s.surfaceAlt, border: `1px solid ${s.border}`,
          padding: '6px 14px', borderRadius: 8, cursor: refreshing ? 'wait' : 'pointer',
          fontFamily: s.FONT, fontSize: 12, fontWeight: 600, color: s.text2,
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.2s',
        }}>
          <span style={{ display: 'flex', animation: refreshing ? 'progSpin 0.8s linear infinite' : 'none' }}>{ICO.refresh}</span>
          {refreshing ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: latestInBody && latestStyku ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* InBody Card */}
        {latestInBody && (
          <div style={{ ...s.cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px',
              borderBottom: `1px solid ${s.border}`, background: s.surfaceAlt,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: '#1B365D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'system-ui', fontSize: 12, fontWeight: 800, color: '#fff',
              }}>IB</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text }}>InBody Results</div>
                <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>{fmtDate(latestInBody.date)}</div>
              </div>
              <span style={{
                fontFamily: s.MONO, fontSize: 10, fontWeight: 600,
                color: s.success, background: s.successBg,
                padding: '2px 8px', borderRadius: 100,
              }}>CONNECTED</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: s.border }}>
              {inBodyFields.map(f => (
                <div key={f.label} style={{ padding: '12px 16px', background: s.surface }}>
                  <div style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                    {f.label}
                  </div>
                  <div style={{ fontFamily: s.MONO, fontSize: 18, fontWeight: 700, color: s.text, lineHeight: 1 }}>
                    {f.value}<span style={{ fontSize: 11, color: s.text3, fontWeight: 400, marginLeft: 2 }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Styku Card */}
        {latestStyku && (
          <div style={{ ...s.cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px',
              borderBottom: `1px solid ${s.border}`, background: s.surfaceAlt,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: '#00B4D8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'system-ui', fontSize: 12, fontWeight: 800, color: '#fff',
              }}>Sk</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text }}>Styku Measurements</div>
                <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>{fmtDate(latestStyku.date)}</div>
              </div>
              <span style={{
                fontFamily: s.MONO, fontSize: 10, fontWeight: 600,
                color: s.success, background: s.successBg,
                padding: '2px 8px', borderRadius: 100,
              }}>CONNECTED</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: s.border }}>
              {stykuFields.map(f => (
                <div key={f.label} style={{ padding: '12px 14px', background: s.surface }}>
                  <div style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 600, color: s.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                    {f.label}
                  </div>
                  <div style={{ fontFamily: s.MONO, fontSize: 16, fontWeight: 700, color: s.text, lineHeight: 1 }}>
                    {f.value}<span style={{ fontSize: 11, color: s.text3, fontWeight: 400, marginLeft: 2 }}>in</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Weight Chart — SVG line with gradient fill ═══ */
function WeightChart({ data, s }) {
  if (!data || data.length < 2) {
    return <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, textAlign: 'center', padding: 40 }}>Not enough data to display chart</p>;
  }

  const W = 800;
  const H = 260;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const rangeW = maxW - minW || 1;

  const points = data.map((d, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const y = PAD.top + chartH - ((d.weight - minW) / rangeW) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${PAD.top + chartH} L ${points[0].x} ${PAD.top + chartH} Z`;

  // Y-axis labels
  const yLabels = [];
  const step = rangeW / 4;
  for (let i = 0; i <= 4; i++) {
    const val = minW + step * i;
    const y = PAD.top + chartH - (i / 4) * chartH;
    yLabels.push({ val: val.toFixed(0), y });
  }

  const gradientId = `weightGrad-${s.dark ? 'dark' : 'light'}`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', minWidth: 400 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={s.accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke={s.border} strokeWidth="1" strokeDasharray={i > 0 ? "4 4" : "0"} />
            <text x={PAD.left - 10} y={l.y + 4} fill={s.text3} fontSize="11" fontFamily={s.MONO} textAnchor="end">{l.val}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={s.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2000"
          strokeDashoffset="0"
          style={{ animation: 'progDrawLine 1.5s ease' }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4.5" fill={s.surface} stroke={s.accent} strokeWidth="2.5" />
            {/* X labels (every other to avoid crowding) */}
            {(i % 2 === 0 || i === points.length - 1) && (
              <text x={p.x} y={H - 10} fill={s.text3} fontSize="10" fontFamily={s.FONT} textAnchor="middle">
                {fmtDate(p.date)}
              </text>
            )}
          </g>
        ))}

        {/* Latest weight label */}
        {points.length > 0 && (
          <g>
            <rect
              x={points[points.length - 1].x - 28}
              y={points[points.length - 1].y - 28}
              width="56" height="20" rx="6"
              fill={s.accent}
            />
            <text
              x={points[points.length - 1].x}
              y={points[points.length - 1].y - 14}
              fill="#fff" fontSize="11" fontFamily={s.MONO} fontWeight="600" textAnchor="middle"
            >
              {points[points.length - 1].weight}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
