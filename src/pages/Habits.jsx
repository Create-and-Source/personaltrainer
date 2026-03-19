import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, subscribe } from '../data/store';

/* ── Date helpers ── */
const today = new Date();
const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };
const todayStr = d(0);
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Default habits ── */
const DEFAULT_HABITS = [
  { id: 'H-1', icon: '\u{1F4A7}', name: 'Water Intake', target: '8 glasses', targetType: 'number', targetValue: 8, unit: 'glasses', frequency: 'daily' },
  { id: 'H-2', icon: '\u{1F634}', name: 'Sleep', target: '7-8 hours', targetType: 'number', targetValue: 8, unit: 'hours', frequency: 'daily' },
  { id: 'H-3', icon: '\u{1F6B6}', name: 'Daily Steps', target: '10K steps', targetType: 'number', targetValue: 10000, unit: 'steps', frequency: 'daily' },
  { id: 'H-4', icon: '\u{1F9D8}', name: 'Stretching', target: '10 min', targetType: 'number', targetValue: 10, unit: 'min', frequency: 'daily' },
  { id: 'H-5', icon: '\u{1F48A}', name: 'Supplements', target: 'Taken', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' },
  { id: 'H-6', icon: '\u{1F957}', name: 'Eat Vegetables', target: '3+ servings', targetType: 'number', targetValue: 3, unit: 'servings', frequency: 'daily' },
  { id: 'H-7', icon: '\u{1F4F5}', name: 'No Late Screens', target: 'Before 10pm', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' },
  { id: 'H-8', icon: '\u{1F3CB}\u{FE0F}', name: 'Workout', target: 'Completed', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' },
];

const EMOJI_OPTIONS = [
  '\u{1F4A7}', '\u{1F634}', '\u{1F6B6}', '\u{1F9D8}', '\u{1F48A}', '\u{1F957}', '\u{1F4F5}', '\u{1F3CB}\u{FE0F}',
  '\u{1F4AA}', '\u{2764}\u{FE0F}', '\u{1F34E}', '\u{2615}', '\u{1F4D6}', '\u{1F3AF}', '\u{1F31E}', '\u{1F31C}',
  '\u{1F3C3}', '\u{1F6B4}', '\u{1F3CA}', '\u{2728}', '\u{1F9E0}', '\u{1F60A}', '\u{1F4DD}', '\u{1F95B}',
];

/* ── Seed data ── */
function generateSeedData(clientId) {
  const logs = [];
  if (clientId === 'CLT-1000') {
    // James: 14-day water streak, 21-day workout streak, inconsistent sleep/stretching
    for (let i = 0; i < 30; i++) {
      const date = d(-i);
      logs.push({ date, habitId: 'H-1', completed: i < 14 ? true : Math.random() > 0.4, value: 8 + Math.floor(Math.random() * 3) });
      logs.push({ date, habitId: 'H-2', completed: Math.random() > 0.5, value: 5 + Math.round(Math.random() * 3 * 10) / 10 });
      const stepsOk = Math.random() > 0.35;
      logs.push({ date, habitId: 'H-3', completed: stepsOk, value: stepsOk ? 10000 + Math.floor(Math.random() * 4000) : 4000 + Math.floor(Math.random() * 4000) });
      logs.push({ date, habitId: 'H-4', completed: Math.random() > 0.55, value: Math.random() > 0.5 ? 12 : 5 });
      logs.push({ date, habitId: 'H-5', completed: Math.random() > 0.2, value: 1 });
      logs.push({ date, habitId: 'H-6', completed: Math.random() > 0.4, value: Math.floor(2 + Math.random() * 3) });
      logs.push({ date, habitId: 'H-7', completed: Math.random() > 0.5, value: 1 });
      logs.push({ date, habitId: 'H-8', completed: i < 21 ? true : Math.random() > 0.3, value: 1 });
    }
  } else if (clientId === 'CLT-1001') {
    // Sarah: 30-day water streak, 12-day steps streak, very consistent overall
    for (let i = 0; i < 30; i++) {
      const date = d(-i);
      logs.push({ date, habitId: 'H-1', completed: true, value: 9 + Math.floor(Math.random() * 3) });
      logs.push({ date, habitId: 'H-2', completed: Math.random() > 0.25, value: 7 + Math.round(Math.random() * 1.5 * 10) / 10 });
      logs.push({ date, habitId: 'H-3', completed: i < 12 ? true : Math.random() > 0.35, value: 10000 + Math.floor(Math.random() * 5000) });
      logs.push({ date, habitId: 'H-4', completed: Math.random() > 0.2, value: 12 + Math.floor(Math.random() * 8) });
      logs.push({ date, habitId: 'H-5', completed: Math.random() > 0.1, value: 1 });
      logs.push({ date, habitId: 'H-6', completed: Math.random() > 0.15, value: 3 + Math.floor(Math.random() * 3) });
      logs.push({ date, habitId: 'H-7', completed: Math.random() > 0.3, value: 1 });
      logs.push({ date, habitId: 'H-8', completed: Math.random() > 0.3, value: 1 });
    }
  } else if (clientId === 'CLT-1002') {
    // Marcus: very disciplined athlete, 20-day workout streak, great supplements and water
    for (let i = 0; i < 30; i++) {
      const date = d(-i);
      logs.push({ date, habitId: 'H-1', completed: i < 18 ? true : Math.random() > 0.2, value: 10 + Math.floor(Math.random() * 4) });
      logs.push({ date, habitId: 'H-2', completed: Math.random() > 0.3, value: 7 + Math.round(Math.random() * 2 * 10) / 10 });
      const stepsOk = Math.random() > 0.15;
      logs.push({ date, habitId: 'H-3', completed: stepsOk, value: stepsOk ? 12000 + Math.floor(Math.random() * 6000) : 7000 + Math.floor(Math.random() * 3000) });
      logs.push({ date, habitId: 'H-4', completed: Math.random() > 0.3, value: 15 + Math.floor(Math.random() * 10) });
      logs.push({ date, habitId: 'H-5', completed: Math.random() > 0.1, value: 1 });
      logs.push({ date, habitId: 'H-6', completed: Math.random() > 0.25, value: 3 + Math.floor(Math.random() * 4) });
      logs.push({ date, habitId: 'H-7', completed: Math.random() > 0.45, value: 1 });
      logs.push({ date, habitId: 'H-8', completed: i < 20 ? true : Math.random() > 0.2, value: 1 });
    }
  } else if (clientId === 'CLT-1003') {
    // Emily: prenatal, very consistent with sleep & veggies, moderate on others
    for (let i = 0; i < 30; i++) {
      const date = d(-i);
      logs.push({ date, habitId: 'H-1', completed: i < 10 ? true : Math.random() > 0.25, value: 8 + Math.floor(Math.random() * 3) });
      logs.push({ date, habitId: 'H-2', completed: Math.random() > 0.15, value: 8 + Math.round(Math.random() * 1 * 10) / 10 });
      const stepsOk = Math.random() > 0.4;
      logs.push({ date, habitId: 'H-3', completed: stepsOk, value: stepsOk ? 8000 + Math.floor(Math.random() * 3000) : 4000 + Math.floor(Math.random() * 3000) });
      logs.push({ date, habitId: 'H-4', completed: Math.random() > 0.2, value: 10 + Math.floor(Math.random() * 10) });
      logs.push({ date, habitId: 'H-5', completed: Math.random() > 0.1, value: 1 });
      logs.push({ date, habitId: 'H-6', completed: Math.random() > 0.1, value: 4 + Math.floor(Math.random() * 3) });
      logs.push({ date, habitId: 'H-7', completed: Math.random() > 0.2, value: 1 });
      logs.push({ date, habitId: 'H-8', completed: Math.random() > 0.4, value: 1 });
    }
  } else if (clientId === 'CLT-1004') {
    // David: post-rehab, focused on mobility/stretching, moderate workout consistency
    for (let i = 0; i < 30; i++) {
      const date = d(-i);
      logs.push({ date, habitId: 'H-1', completed: i < 8 ? true : Math.random() > 0.35, value: 7 + Math.floor(Math.random() * 4) });
      logs.push({ date, habitId: 'H-2', completed: Math.random() > 0.35, value: 6 + Math.round(Math.random() * 2.5 * 10) / 10 });
      const stepsOk = Math.random() > 0.45;
      logs.push({ date, habitId: 'H-3', completed: stepsOk, value: stepsOk ? 8000 + Math.floor(Math.random() * 4000) : 3000 + Math.floor(Math.random() * 4000) });
      logs.push({ date, habitId: 'H-4', completed: i < 16 ? true : Math.random() > 0.25, value: 15 + Math.floor(Math.random() * 10) });
      logs.push({ date, habitId: 'H-5', completed: Math.random() > 0.2, value: 1 });
      logs.push({ date, habitId: 'H-6', completed: Math.random() > 0.35, value: 2 + Math.floor(Math.random() * 3) });
      logs.push({ date, habitId: 'H-7', completed: Math.random() > 0.4, value: 1 });
      logs.push({ date, habitId: 'H-8', completed: Math.random() > 0.35, value: 1 });
    }
  }
  return logs;
}

/* ── localStorage helpers ── */
function getHabits() { try { return JSON.parse(localStorage.getItem('ms_habits')) || DEFAULT_HABITS; } catch { return DEFAULT_HABITS; } }
function setHabits(habits) { localStorage.setItem('ms_habits', JSON.stringify(habits)); }
function getHabitLogs(clientId) { try { return JSON.parse(localStorage.getItem(`ms_habit_logs_${clientId}`)) || []; } catch { return []; } }
function setHabitLogs(clientId, logs) { localStorage.setItem(`ms_habit_logs_${clientId}`, JSON.stringify(logs)); }

function seedIfNeeded(clientId) {
  const key = `ms_habit_logs_${clientId}`;
  const seedClients = ['CLT-1000', 'CLT-1001', 'CLT-1002', 'CLT-1003', 'CLT-1004'];
  if (!localStorage.getItem(key) && seedClients.includes(clientId)) {
    localStorage.setItem(key, JSON.stringify(generateSeedData(clientId)));
  }
  if (!localStorage.getItem('ms_habits')) setHabits(DEFAULT_HABITS);
}

function calcStreak(logs, habitId) {
  const habitLogs = logs.filter(l => l.habitId === habitId && l.completed);
  const dates = [...new Set(habitLogs.map(l => l.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (dates.includes(dateStr)) streak++;
    else if (i > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ── Completion Ring SVG ── */
function CompletionRing({ done, total, size = 56, stroke = 5, s }) {
  const pct = total > 0 ? done / total : 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = pct > 0.75 ? s.success : pct >= 0.5 ? s.warning : pct > 0 ? s.danger : s.text3;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.borderLight} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color}
        fontFamily="'Source Code Pro', monospace" fontSize={size * 0.22} fontWeight={700}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {done}/{total}
      </text>
    </svg>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
export default function Habits() {
  const s = useStyles();
  const [patients, setPatients] = useState(getPatients());
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [habits, setHabitsState] = useState(getHabits());
  const [tick, setTick] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '\u{1F4AA}', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => { const unsub = subscribe(() => setPatients(getPatients())); return unsub; }, []);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Seed data for known clients
  useEffect(() => {
    patients.forEach(p => seedIfNeeded(p.id));
  }, [patients]);

  // Refresh habits from storage on tick
  useEffect(() => { setHabitsState(getHabits()); }, [tick]);

  /* ── Build client overview data ── */
  const clientOverviews = useMemo(() => {
    return patients.map(p => {
      const logs = getHabitLogs(p.id);
      const todayLogs = logs.filter(l => l.date === todayStr);
      const doneToday = habits.filter(h => todayLogs.find(l => l.habitId === h.id && l.completed)).length;
      const totalHabits = habits.length;

      // Best current streak across all habits
      let bestStreak = 0;
      let bestStreakHabit = '';
      habits.forEach(h => {
        const streak = calcStreak(logs, h.id);
        if (streak > bestStreak) { bestStreak = streak; bestStreakHabit = h.name; }
      });

      const pct = totalHabits > 0 ? doneToday / totalHabits : 0;
      return {
        ...p,
        fullName: `${p.firstName} ${p.lastName}`,
        initials: `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`,
        doneToday,
        totalHabits,
        pct,
        bestStreak,
        bestStreakHabit,
        onTrack: pct >= 0.5,
        logs,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [patients, habits, tick]);

  const visibleClients = clientOverviews.slice(0, 10);
  const hasMoreClients = clientOverviews.length > 10;

  /* ── Selected client detail data ── */
  const selectedClient = clientOverviews.find(c => c.id === selectedClientId);
  const selectedLogs = selectedClient?.logs || [];
  const todayLogs = useMemo(() => selectedLogs.filter(l => l.date === todayStr), [selectedLogs]);

  const streaks = useMemo(() => {
    if (!selectedClient) return {};
    const map = {};
    habits.forEach(h => { map[h.id] = calcStreak(selectedLogs, h.id); });
    return map;
  }, [selectedLogs, habits, selectedClient]);

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) { const dt = new Date(today); dt.setDate(dt.getDate() - i); days.push(dt.toISOString().slice(0, 10)); }
    return days;
  }, []);

  // Streak stats for selected client
  const streakStats = useMemo(() => {
    if (!selectedClient) return { longest: 0, longestHabit: '', currentBest: 0, perfectDays: 0 };
    let longest = 0, longestHabit = '';
    let currentBest = 0;
    habits.forEach(h => {
      const streak = streaks[h.id] || 0;
      if (streak > longest) { longest = streak; longestHabit = h.name; }
      if (streak > currentBest) currentBest = streak;
    });
    // Perfect days this week
    let perfectDays = 0;
    last7Days.forEach(date => {
      const dayLogs = selectedLogs.filter(l => l.date === date);
      const allDone = habits.every(h => dayLogs.find(l => l.habitId === h.id && l.completed));
      if (allDone) perfectDays++;
    });
    return { longest, longestHabit, currentBest, perfectDays };
  }, [selectedClient, streaks, habits, last7Days, selectedLogs]);

  /* ── Actions ── */
  const toggleHabit = useCallback((habitId) => {
    if (!selectedClientId) return;
    let logs = getHabitLogs(selectedClientId);
    const existing = logs.find(l => l.date === todayStr && l.habitId === habitId);
    if (existing) {
      logs = logs.map(l => l.date === todayStr && l.habitId === habitId ? { ...l, completed: !l.completed } : l);
    } else {
      logs = [...logs, { date: todayStr, habitId, completed: true, value: 1 }];
    }
    setHabitLogs(selectedClientId, logs);
    setTick(t => t + 1);
  }, [selectedClientId]);

  const addCustomHabit = useCallback(() => {
    if (!newHabit.name.trim()) return;
    const habit = {
      id: `H-${Date.now()}`, icon: newHabit.icon, name: newHabit.name.trim(),
      target: newHabit.targetType === 'checkbox' ? 'Yes / No' : newHabit.targetType === 'time' ? `Before ${newHabit.targetValue || '10pm'}` : `${newHabit.targetValue} ${newHabit.unit}`,
      targetType: newHabit.targetType, targetValue: newHabit.targetType === 'number' ? Number(newHabit.targetValue) || 1 : 1,
      unit: newHabit.unit, frequency: newHabit.frequency,
    };
    const updated = [...habits, habit];
    setHabitsState(updated);
    setHabits(updated);
    setShowModal(false);
    setNewHabit({ name: '', icon: '\u{1F4AA}', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' });
  }, [newHabit, habits]);

  const deleteHabit = useCallback((habitId) => {
    const updated = habits.filter(h => h.id !== habitId);
    setHabitsState(updated);
    setHabits(updated);
    setTick(t => t + 1);
  }, [habits]);

  const goBack = () => setSelectedClientId(null);

  /* ════════════════════════════════════════
     RENDER
     ════════════════════════════════════════ */

  // ── If a client is selected, show their detail view ──
  if (selectedClientId && selectedClient) {
    return (
      <div>
        {/* Back + Header */}
        <button onClick={goBack} style={{
          background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: s.FONT, fontSize: 14, color: s.accent, marginBottom: 20, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          All Clients
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, background: getAvatarGradient(selectedClient.fullName),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: s.FONT, fontSize: 18, fontWeight: 700, flexShrink: 0,
          }}>
            {selectedClient.initials}
          </div>
          <div>
            <h1 style={{ fontFamily: s.HEADING, fontSize: 24, fontWeight: 600, color: s.text, margin: 0 }}>
              {selectedClient.fullName}
            </h1>
            <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: '2px 0 0' }}>
              {selectedClient.doneToday}/{selectedClient.totalHabits} habits completed today
            </p>
          </div>
        </div>

        {/* ── Today's Habits ── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 16px' }}>
            Today's Habits
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {habits.map(habit => {
              const log = todayLogs.find(l => l.habitId === habit.id);
              const done = log?.completed || false;
              return (
                <div key={habit.id} onClick={() => toggleHabit(habit.id)} style={{
                  ...s.cardStyle, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  ...(done ? { background: s.dark ? `${s.success}10` : s.successBg, borderColor: `${s.success}30` } : {}),
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 20 }}>{habit.icon}</span>
                    <div>
                      <span style={{
                        fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: done ? s.success : s.text,
                        textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1,
                      }}>
                        {habit.name}
                      </span>
                      <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, marginLeft: 10 }}>{habit.target}</span>
                    </div>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: done ? s.success : 'transparent',
                    border: done ? 'none' : `2px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  }}>
                    {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Weekly View ── */}
        <div style={{ ...s.cardStyle, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 20px' }}>
            This Week
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.text3, textAlign: 'left', padding: '6px 10px', width: 130 }}>Habit</th>
                  {last7Days.map(date => {
                    const dt = new Date(date + 'T12:00:00');
                    const isToday = date === todayStr;
                    return (
                      <th key={date} style={{
                        fontFamily: s.MONO, fontSize: 11, fontWeight: isToday ? 700 : 500,
                        color: isToday ? s.accent : s.text3, textAlign: 'center', padding: '6px 4px',
                        ...(isToday ? { background: `${s.accent}08`, borderRadius: 8 } : {}),
                      }}>
                        {dayNames[dt.getDay()]}<br /><span style={{ fontSize: 10 }}>{dt.getDate()}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {habits.map(habit => (
                  <tr key={habit.id}>
                    <td style={{ fontFamily: s.FONT, fontSize: 13, color: s.text, padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      {habit.icon} {habit.name}
                    </td>
                    {last7Days.map(date => {
                      const log = selectedLogs.find(l => l.date === date && l.habitId === habit.id);
                      const completed = log?.completed || false;
                      const isToday = date === todayStr;
                      return (
                        <td key={date} style={{ textAlign: 'center', padding: '8px 4px', ...(isToday ? { background: `${s.accent}05` } : {}) }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', margin: '0 auto',
                            background: completed ? s.success : s.borderLight,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                          }}>
                            {completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Streak Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ ...s.cardStyle, padding: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 28, fontWeight: 700, color: s.accent }}>{streakStats.longest}</div>
            <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginTop: 4 }}>Longest Streak (days)</div>
            <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, marginTop: 2 }}>{streakStats.longestHabit}</div>
          </div>
          <div style={{ ...s.cardStyle, padding: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 28, fontWeight: 700, color: s.success }}>{streakStats.currentBest}</div>
            <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginTop: 4 }}>Current Best (days)</div>
          </div>
          <div style={{ ...s.cardStyle, padding: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 28, fontWeight: 700, color: streakStats.perfectDays >= 5 ? s.success : streakStats.perfectDays >= 3 ? s.warning : s.danger }}>
              {streakStats.perfectDays}/7
            </div>
            <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, marginTop: 4 }}>Perfect Days This Week</div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     DEFAULT VIEW — Client Overview Grid
     ════════════════════════════════════════ */
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 600, color: s.text, margin: 0, letterSpacing: '-0.3px' }}>
          Habits
        </h1>
        <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, margin: '6px 0 0' }}>
          Monitor client consistency and build healthy routines
        </p>
      </div>

      {/* ── Section 1: Client Overview Grid ── */}
      {visibleClients.length === 0 ? (
        <div style={{ ...s.cardStyle, padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>{'\u{1F4CB}'}</div>
          <div style={{ fontFamily: s.HEADING, fontSize: 17, fontWeight: 600, color: s.text, marginBottom: 6 }}>No clients yet</div>
          <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>Add clients to start tracking their habits</div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16, marginBottom: 24,
          }}>
            {visibleClients.map(client => (
              <div key={client.id} onClick={() => setSelectedClientId(client.id)} style={{
                ...s.cardStyle, padding: 20, cursor: 'pointer',
                ':hover': { transform: 'translateY(-2px)' },
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = s.shadowMd; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = s.shadow; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Top row: Avatar + Name + Ring */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, background: getAvatarGradient(client.fullName),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontFamily: s.FONT, fontSize: 14, fontWeight: 700, flexShrink: 0,
                    }}>
                      {client.initials}
                    </div>
                    <div style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text }}>
                      {client.fullName}
                    </div>
                  </div>
                  <CompletionRing done={client.doneToday} total={client.totalHabits} size={52} stroke={4} s={s} />
                </div>

                {/* Streak + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    fontFamily: s.FONT, fontSize: 13, color: s.text2, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {client.bestStreak > 0 ? (
                      <>{'\u{1F525}'} {client.bestStreak} day{client.bestStreak !== 1 ? 's' : ''}</>
                    ) : (
                      <span style={{ color: s.text3 }}>No streak</span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: s.FONT, fontSize: 12, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 100,
                    background: client.onTrack ? s.successBg : s.dangerBg,
                    color: client.onTrack ? s.success : s.danger,
                  }}>
                    {client.onTrack ? 'On track' : 'Needs attention'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {hasMoreClients && (
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <button style={{ ...s.pillGhost, fontFamily: s.FONT, fontSize: 13, color: s.accent }}>
                View All Clients ({clientOverviews.length})
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Section 3: Manage Habits ── */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>
            Manage Habits
          </h2>
          <button onClick={() => { setEditingHabit(null); setNewHabit({ name: '', icon: '\u{1F4AA}', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' }); setShowModal(true); }} style={s.pillAccent}>
            + Add Custom Habit
          </button>
        </div>

        <div style={{ ...s.cardStyle, overflow: 'hidden' }}>
          {habits.map((habit, idx) => (
            <div key={habit.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px',
              borderBottom: idx < habits.length - 1 ? `1px solid ${s.borderLight}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{habit.icon}</span>
                <div>
                  <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>{habit.name}</div>
                  <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{habit.target} &middot; {habit.frequency}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  setEditingHabit(habit);
                  setNewHabit({ name: habit.name, icon: habit.icon, targetType: habit.targetType, targetValue: habit.targetValue, unit: habit.unit, frequency: habit.frequency });
                  setShowModal(true);
                }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, fontSize: 16, padding: '4px 8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                {!habit.id.match(/^H-[1-8]$/) && (
                  <button onClick={() => deleteHabit(habit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.danger, fontSize: 16, padding: '4px 8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add/Edit Habit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: s.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: s.shadowLg, border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>
                {editingHabit ? 'Edit Habit' : 'Add Custom Habit'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, fontSize: 20 }}>{'\u{2715}'}</button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Habit Name</label>
              <input value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} placeholder="e.g., Meditate, Read 20 pages..." style={s.input} />
            </div>

            {/* Emoji picker */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Icon</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button key={emoji} onClick={() => setNewHabit({ ...newHabit, icon: emoji })} style={{
                    width: '100%', aspectRatio: '1', borderRadius: 10,
                    border: newHabit.icon === emoji ? `2px solid ${s.accent}` : `1px solid ${s.borderLight}`,
                    background: newHabit.icon === emoji ? `${s.accent}10` : 'transparent',
                    fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Target type */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Target Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ value: 'checkbox', label: 'Yes/No' }, { value: 'number', label: 'Number' }, { value: 'time', label: 'Time' }].map(opt => (
                  <button key={opt.value} onClick={() => setNewHabit({ ...newHabit, targetType: opt.value })}
                    style={{ ...(newHabit.targetType === opt.value ? s.pillAccent : s.pillOutline), flex: 1 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number fields */}
            {newHabit.targetType === 'number' && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Target</label>
                  <input type="number" value={newHabit.targetValue} onChange={e => setNewHabit({ ...newHabit, targetValue: e.target.value })} placeholder="8" style={s.input} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Unit</label>
                  <input value={newHabit.unit} onChange={e => setNewHabit({ ...newHabit, unit: e.target.value })} placeholder="glasses, steps..." style={s.input} />
                </div>
              </div>
            )}
            {newHabit.targetType === 'time' && (
              <div style={{ marginBottom: 18 }}>
                <label style={s.label}>Before Time</label>
                <input value={newHabit.targetValue} onChange={e => setNewHabit({ ...newHabit, targetValue: e.target.value })} placeholder="10:00 PM" style={s.input} />
              </div>
            )}

            {/* Frequency */}
            <div style={{ marginBottom: 22 }}>
              <label style={s.label}>Frequency</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays' }].map(opt => (
                  <button key={opt.value} onClick={() => setNewHabit({ ...newHabit, frequency: opt.value })}
                    style={newHabit.frequency === opt.value ? s.pillAccent : s.pillOutline}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button onClick={() => {
              if (editingHabit) {
                const updated = habits.map(h => h.id === editingHabit.id ? {
                  ...h, name: newHabit.name.trim() || h.name, icon: newHabit.icon,
                  targetType: newHabit.targetType,
                  targetValue: newHabit.targetType === 'number' ? Number(newHabit.targetValue) || 1 : 1,
                  unit: newHabit.unit, frequency: newHabit.frequency,
                  target: newHabit.targetType === 'checkbox' ? 'Yes / No' : newHabit.targetType === 'time' ? `Before ${newHabit.targetValue || '10pm'}` : `${newHabit.targetValue} ${newHabit.unit}`,
                } : h);
                setHabitsState(updated);
                setHabits(updated);
                setShowModal(false);
              } else {
                addCustomHabit();
              }
            }} style={{ ...s.pillAccent, width: '100%', padding: '13px 20px', fontSize: 14 }}>
              {editingHabit ? 'Update Habit' : 'Save Habit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
