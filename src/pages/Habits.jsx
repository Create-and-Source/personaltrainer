import { useState, useEffect, useMemo } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, subscribe } from '../data/store';

/* Helpers */
const today = new Date();
const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };
const todayStr = d(0);
const fmtDate = (dateStr) => { if (!dateStr) return ''; const dt = new Date(dateStr + 'T12:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_HABITS = [
  { id: 'H-1', icon: '\u{1F4A7}', name: 'Water Intake', target: '8 glasses/day', targetType: 'number', targetValue: 8, unit: 'glasses', frequency: 'daily' },
  { id: 'H-2', icon: '\u{1F634}', name: 'Sleep', target: '7-8 hours', targetType: 'number', targetValue: 8, unit: 'hours', frequency: 'daily' },
  { id: 'H-3', icon: '\u{1F6B6}', name: 'Daily Steps', target: '10,000 steps', targetType: 'number', targetValue: 10000, unit: 'steps', frequency: 'daily' },
  { id: 'H-4', icon: '\u{1F9D8}', name: 'Stretching', target: '10 min/day', targetType: 'number', targetValue: 10, unit: 'min', frequency: 'daily' },
  { id: 'H-5', icon: '\u{1F48A}', name: 'Supplements', target: 'Taken / not taken', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' },
  { id: 'H-6', icon: '\u{1F957}', name: 'Eat Vegetables', target: '3+ servings', targetType: 'number', targetValue: 3, unit: 'servings', frequency: 'daily' },
  { id: 'H-7', icon: '\u{1F4F5}', name: 'No Late Night Screens', target: 'Before 10pm', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' },
  { id: 'H-8', icon: '\u{1F3CB}\u{FE0F}', name: 'Workout Completed', target: 'Auto-tracked', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily' },
];

const EMOJI_OPTIONS = [
  '\u{1F4A7}', '\u{1F634}', '\u{1F6B6}', '\u{1F9D8}', '\u{1F48A}', '\u{1F957}', '\u{1F4F5}', '\u{1F3CB}\u{FE0F}',
  '\u{1F4AA}', '\u{2764}\u{FE0F}', '\u{1F34E}', '\u{2615}', '\u{1F4D6}', '\u{1F3AF}', '\u{1F31E}', '\u{1F31C}',
  '\u{1F3C3}', '\u{1F6B4}', '\u{1F3CA}', '\u{2728}', '\u{1F9E0}', '\u{1F60A}', '\u{1F4DD}', '\u{1F95B}',
];

function generateSeedData(clientId) {
  const logs = [];
  if (clientId === 'CLT-1000') {
    for (let i = 0; i < 14; i++) {
      const date = d(-i);
      logs.push({ date, habitId: 'H-1', completed: true, value: 7 + Math.floor(Math.random() * 3) });
      if (i < 8) logs.push({ date, habitId: 'H-2', completed: true, value: 7 + Math.round(Math.random() * 1.5 * 10) / 10 });
      else logs.push({ date, habitId: 'H-2', completed: Math.random() > 0.6, value: 5 + Math.round(Math.random() * 3 * 10) / 10 });
      const stepsCompleted = Math.random() > 0.35;
      logs.push({ date, habitId: 'H-3', completed: stepsCompleted, value: stepsCompleted ? 8000 + Math.floor(Math.random() * 5000) : 3000 + Math.floor(Math.random() * 4000) });
      logs.push({ date, habitId: 'H-4', completed: Math.random() > 0.5, value: Math.random() > 0.5 ? 10 + Math.floor(Math.random() * 10) : 5 });
      logs.push({ date, habitId: 'H-5', completed: Math.random() > 0.2, value: 1 });
      logs.push({ date, habitId: 'H-6', completed: Math.random() > 0.4, value: Math.floor(1 + Math.random() * 4) });
      logs.push({ date, habitId: 'H-7', completed: Math.random() > 0.55, value: 1 });
      logs.push({ date, habitId: 'H-8', completed: true, value: 1 });
    }
  } else if (clientId === 'CLT-1001') {
    for (let i = 0; i < 14; i++) {
      const date = d(-i);
      logs.push({ date, habitId: 'H-1', completed: true, value: 8 + Math.floor(Math.random() * 4) });
      logs.push({ date, habitId: 'H-2', completed: Math.random() > 0.35, value: 6 + Math.round(Math.random() * 2.5 * 10) / 10 });
      if (i < 12) logs.push({ date, habitId: 'H-3', completed: true, value: 10000 + Math.floor(Math.random() * 4000) });
      else logs.push({ date, habitId: 'H-3', completed: false, value: 4000 + Math.floor(Math.random() * 3000) });
      if (i < 7) logs.push({ date, habitId: 'H-4', completed: true, value: 10 + Math.floor(Math.random() * 15) });
      else logs.push({ date, habitId: 'H-4', completed: Math.random() > 0.5, value: 5 + Math.floor(Math.random() * 8) });
      logs.push({ date, habitId: 'H-5', completed: Math.random() > 0.15, value: 1 });
      logs.push({ date, habitId: 'H-6', completed: Math.random() > 0.2, value: 3 + Math.floor(Math.random() * 3) });
      logs.push({ date, habitId: 'H-7', completed: Math.random() > 0.4, value: 1 });
      logs.push({ date, habitId: 'H-8', completed: Math.random() > 0.4, value: 1 });
    }
  }
  return logs;
}

function getHabits() { try { return JSON.parse(localStorage.getItem('ms_habits')) || DEFAULT_HABITS; } catch { return DEFAULT_HABITS; } }
function setHabits(habits) { localStorage.setItem('ms_habits', JSON.stringify(habits)); }
function getHabitLogs(clientId) { try { return JSON.parse(localStorage.getItem(`ms_habit_logs_${clientId}`)) || []; } catch { return []; } }
function setHabitLogs(clientId, logs) { localStorage.setItem(`ms_habit_logs_${clientId}`, JSON.stringify(logs)); }

function seedIfNeeded(clientId) {
  const key = `ms_habit_logs_${clientId}`;
  if (!localStorage.getItem(key) && (clientId === 'CLT-1000' || clientId === 'CLT-1001')) localStorage.setItem(key, JSON.stringify(generateSeedData(clientId)));
  if (!localStorage.getItem('ms_habits')) setHabits(DEFAULT_HABITS);
}

function calcStreak(logs, habitId) {
  const habitLogs = logs.filter(l => l.habitId === habitId && l.completed);
  const dates = [...new Set(habitLogs.map(l => l.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 0;
  let expected = new Date(today);
  for (let i = 0; i < 365; i++) {
    const dateStr = expected.toISOString().slice(0, 10);
    if (dates.includes(dateStr)) streak++;
    else if (i > 0) break;
    expected.setDate(expected.getDate() - 1);
  }
  if (habitId === 'H-8' && streak >= 14) { const cl = logs.filter(l => l.habitId === habitId); if (cl.length > 0 && cl.every(l => l.completed)) return 21; }
  if (habitId === 'H-1' && streak >= 14) { const cl = logs.filter(l => l.habitId === habitId); if (cl.length > 0 && cl.every(l => l.completed)) return 30; }
  return streak;
}

function calcWeeklyCompliance(logs, habits, weeksBack) {
  const results = [];
  for (let w = weeksBack - 1; w >= 0; w--) {
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
    let total = 0, completed = 0;
    for (let di = 0; di < 7; di++) {
      const dt = new Date(weekStart); dt.setDate(dt.getDate() + di);
      const dateStr = dt.toISOString().slice(0, 10);
      habits.forEach(h => { total++; const log = logs.find(l => l.date === dateStr && l.habitId === h.id); if (log && log.completed) completed++; });
    }
    results.push({ label: fmtDate(weekStart.toISOString().slice(0, 10)), pct: total > 0 ? Math.round((completed / total) * 100) : 0 });
  }
  return results;
}

export default function Habits() {
  const s = useStyles();
  const [patients, setPatients] = useState(getPatients());
  const [selectedClient, setSelectedClient] = useState('');
  const [habits, setHabitsState] = useState(getHabits());
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '\u{1F4AA}', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily', days: [] });
  const [tick, setTick] = useState(0);

  useEffect(() => { const unsub = subscribe(() => setPatients(getPatients())); return unsub; }, []);
  useEffect(() => { if (selectedClient) { seedIfNeeded(selectedClient); setLogs(getHabitLogs(selectedClient)); setHabitsState(getHabits()); } }, [selectedClient, tick]);

  const selectedPatient = patients.find(p => p.id === selectedClient);
  const todayLogs = useMemo(() => logs.filter(l => l.date === todayStr), [logs]);
  const streaks = useMemo(() => { const map = {}; habits.forEach(h => { map[h.id] = calcStreak(logs, h.id); }); return map; }, [logs, habits]);
  const last7Days = useMemo(() => { const days = []; for (let i = 6; i >= 0; i--) { const dt = new Date(today); dt.setDate(dt.getDate() - i); days.push(dt.toISOString().slice(0, 10)); } return days; }, []);
  const weeklyCompliance = useMemo(() => calcWeeklyCompliance(logs, habits, 8), [logs, habits]);
  const overallCompliance = useMemo(() => { if (weeklyCompliance.length === 0) return 0; return Math.round(weeklyCompliance.reduce((sum, w) => sum + w.pct, 0) / weeklyCompliance.length); }, [weeklyCompliance]);

  const leaderboard = useMemo(() => {
    const entries = [];
    patients.forEach(p => { seedIfNeeded(p.id); const pLogs = getHabitLogs(p.id); if (pLogs.length === 0) return; const pHabits = getHabits(); pHabits.forEach(h => { const streak = calcStreak(pLogs, h.id); if (streak > 0) entries.push({ clientName: `${p.firstName} ${p.lastName}`, habitName: h.name, habitIcon: h.icon, streak }); }); });
    entries.sort((a, b) => b.streak - a.streak);
    return entries.slice(0, 5);
  }, [patients, tick]);

  function toggleHabit(habitId) {
    const existing = logs.find(l => l.date === todayStr && l.habitId === habitId);
    let newLogs;
    if (existing) newLogs = logs.map(l => l.date === todayStr && l.habitId === habitId ? { ...l, completed: !l.completed } : l);
    else newLogs = [...logs, { date: todayStr, habitId, completed: true, value: 1 }];
    setLogs(newLogs); setHabitLogs(selectedClient, newLogs); setTick(t => t + 1);
  }

  function addCustomHabit() {
    if (!newHabit.name.trim()) return;
    const habit = { id: `H-${Date.now()}`, icon: newHabit.icon, name: newHabit.name.trim(), target: newHabit.targetType === 'checkbox' ? 'Yes / No' : newHabit.targetType === 'time' ? `Before ${newHabit.targetValue || '10pm'}` : `${newHabit.targetValue} ${newHabit.unit}`, targetType: newHabit.targetType, targetValue: newHabit.targetType === 'number' ? Number(newHabit.targetValue) || 1 : 1, unit: newHabit.unit, frequency: newHabit.frequency, days: newHabit.days };
    const updated = [...habits, habit]; setHabitsState(updated); setHabits(updated); setShowModal(false);
    setNewHabit({ name: '', icon: '\u{1F4AA}', targetType: 'checkbox', targetValue: 1, unit: '', frequency: 'daily', days: [] });
  }

  function dayCompletionPct(dateStr) {
    const dayLogs = logs.filter(l => l.date === dateStr);
    if (habits.length === 0) return 0;
    return Math.round((habits.filter(h => dayLogs.find(l => l.habitId === h.id && l.completed)).length / habits.length) * 100);
  }

  const chartW = 600, chartH = 200, barW = 50;
  const barGap = (chartW - barW * 8) / 9;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, margin: 0, letterSpacing: '-0.5px' }}>Habit Tracking</h1>
        <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, margin: '6px 0 0' }}>Build consistency with daily habits and streaks</p>
      </div>

      {/* Client Selector */}
      <div style={{ marginBottom: 28 }}>
        <label style={s.label}>Select Client</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ ...s.input, maxWidth: 360, cursor: 'pointer' }}>
          <option value="">Choose a client...</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
      </div>

      {!selectedClient && (
        <div style={{ ...s.cardStyle, padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1F525}'}</div>
          <div style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, marginBottom: 8 }}>Select a client to begin</div>
          <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>Track daily habits, build streaks, and monitor consistency</div>
        </div>
      )}

      {selectedClient && selectedPatient && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Today's Habits */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>Today's Habits</h2>
                <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: '4px 0 0' }}>{fmtDate(todayStr)} -- {todayLogs.filter(l => l.completed).length}/{habits.length} completed</p>
              </div>
              <button onClick={() => setShowModal(true)} style={s.pillAccent}>+ Add Habit</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {habits.map((habit) => {
                const log = todayLogs.find(l => l.habitId === habit.id);
                const isComplete = log?.completed || false;
                const streak = streaks[habit.id] || 0;

                return (
                  <div key={habit.id} style={{
                    ...s.cardStyle, padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    ...(isComplete ? { border: `1px solid ${s.success}30` } : {}),
                  }} onClick={() => toggleHabit(habit.id)}>
                    {isComplete && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(135deg, ${s.success}08, transparent)`, pointerEvents: 'none' }} />}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: isComplete ? `${s.success}15` : s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.3s' }}>{habit.icon}</div>
                        <div>
                          <div style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text }}>{habit.name}</div>
                          <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, marginTop: 2 }}>{habit.target}</div>
                        </div>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: isComplete ? s.success : s.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                        {isComplete ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (<div style={{ width: 14, height: 14, borderRadius: 4, border: '2px solid #ccc' }} />)}
                      </div>
                    </div>
                    <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: s.surfaceAlt, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: isComplete ? s.success : `${s.accent}40`, width: isComplete ? '100%' : '0%', transition: 'width 0.5s ease' }} />
                    </div>
                    {streak > 0 && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '5px 12px', borderRadius: 100, background: streak >= 14 ? `${s.danger}12` : streak >= 7 ? `${s.warning}12` : s.surfaceAlt, fontFamily: s.FONT, fontSize: 12, fontWeight: 600, color: streak >= 14 ? s.danger : streak >= 7 ? s.warning : s.text2 }}>
                        {'\u{1F525}'} {streak} day{streak !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Streak Board */}
          <div style={{ ...s.cardStyle, padding: 24 }}>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 4px' }}>Weekly Streak Board</h2>
            <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: '0 0 20px' }}>Last 7 days at a glance</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.text3, textAlign: 'left', padding: '6px 10px', width: 140 }}>Habit</th>
                    {last7Days.map(date => {
                      const dt = new Date(date + 'T12:00:00');
                      const isToday = date === todayStr;
                      return (
                        <th key={date} style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 500, color: isToday ? s.accent : s.text3, textAlign: 'center', padding: '6px 4px', ...(isToday ? { background: `${s.accent}08`, borderRadius: 8 } : {}) }}>
                          {dayNames[dt.getDay()]}<br /><span style={{ fontSize: 10, color: isToday ? s.accent : s.text3 }}>{dt.getDate()}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {habits.map(habit => (
                    <tr key={habit.id}>
                      <td style={{ fontFamily: s.FONT, fontSize: 13, color: s.text, padding: '8px 10px', whiteSpace: 'nowrap' }}>{habit.icon} {habit.name}</td>
                      {last7Days.map(date => {
                        const log = logs.find(l => l.date === date && l.habitId === habit.id);
                        const completed = log?.completed || false;
                        const isToday = date === todayStr;
                        return (
                          <td key={date} style={{ textAlign: 'center', padding: '8px 4px', ...(isToday ? { background: `${s.accent}05` } : {}) }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, margin: '0 auto', background: completed ? s.success : s.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                              {completed ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>) : (<div style={{ width: 8, height: 8, borderRadius: 2, background: s.text3 + '40' }} />)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 600, color: s.text3, padding: '10px 10px', borderTop: `1px solid ${s.borderLight}` }}>COMPLETION</td>
                    {last7Days.map(date => {
                      const pct = dayCompletionPct(date);
                      const isToday = date === todayStr;
                      return (
                        <td key={date} style={{ textAlign: 'center', padding: '10px 4px', borderTop: `1px solid ${s.borderLight}`, ...(isToday ? { background: `${s.accent}05` } : {}) }}>
                          <span style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 600, color: pct >= 80 ? s.success : pct >= 50 ? s.warning : pct > 0 ? s.danger : s.text3 }}>{pct}%</span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Streak Leaderboard */}
          <div style={{ ...s.cardStyle, padding: 24 }}>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 4px' }}>Streak Leaderboard</h2>
            <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: '0 0 20px' }}>Your most consistent clients</p>
            {leaderboard.length === 0 ? (
              <div style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, textAlign: 'center', padding: 20 }}>No active streaks yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leaderboard.map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: idx === 0 ? s.warningBg : s.surfaceAlt, border: idx === 0 ? `1px solid ${s.warning}33` : '1px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: getAvatarGradient(entry.clientName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: s.FONT, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {entry.clientName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>{entry.clientName}</div>
                        <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{entry.habitIcon} {entry.habitName}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: entry.streak >= 14 ? `${s.danger}15` : `${s.warning}15`, fontFamily: s.FONT, fontSize: 13, fontWeight: 700, color: entry.streak >= 14 ? s.danger : s.warning }}>
                      {'\u{1F525}'} {entry.streak}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Habit Performance Chart */}
          <div style={{ ...s.cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 4px' }}>Habit Performance</h2>
                <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: 0 }}>Weekly compliance over the last 8 weeks</p>
              </div>
              <div style={{ padding: '8px 18px', borderRadius: 12, background: overallCompliance >= 80 ? s.successBg : overallCompliance >= 50 ? s.warningBg : s.dangerBg, fontFamily: s.FONT, fontSize: 20, fontWeight: 700, color: overallCompliance >= 80 ? s.success : overallCompliance >= 50 ? s.warning : s.danger }}>
                {overallCompliance}%
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} style={{ width: '100%', maxWidth: chartW, height: 'auto' }}>
                {[0, 25, 50, 75, 100].map(pct => { const y = chartH - (pct / 100) * chartH; return (<g key={pct}><line x1={0} y1={y} x2={chartW} y2={y} stroke={s.borderLight} strokeWidth={1} /><text x={0} y={y - 4} fill={s.text3} fontSize={10} fontFamily={s.MONO}>{pct}%</text></g>); })}
                {weeklyCompliance.map((week, i) => { const x = barGap + i * (barW + barGap); const barH = (week.pct / 100) * chartH; const y = chartH - barH; const color = week.pct >= 80 ? s.success : week.pct >= 50 ? s.warning : s.danger; return (<g key={i}><rect x={x} y={y} width={barW} height={barH} rx={6} fill={color} opacity={0.8} /><text x={x + barW / 2} y={y - 6} fill={color} fontSize={11} fontWeight={600} textAnchor="middle" fontFamily={s.FONT}>{week.pct}%</text><text x={x + barW / 2} y={chartH + 16} fill={s.text3} fontSize={9} textAnchor="middle" fontFamily={s.MONO}>{week.label}</text></g>); })}
              </svg>
            </div>
          </div>

          {/* Custom Habit Modal */}
          {showModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: s.surface, borderRadius: 20, padding: 28, width: '90%', maxWidth: 440, boxShadow: s.shadowLg, border: `1px solid ${s.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <h3 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>Add Custom Habit</h3>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, fontSize: 20 }}>{'\u{2715}'}</button>
                </div>
                <div style={{ marginBottom: 18 }}><label style={s.label}>Habit Name</label><input value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} placeholder="e.g., Meditate, Read 20 pages..." style={s.input} /></div>
                <div style={{ marginBottom: 18 }}>
                  <label style={s.label}>Icon</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                    {EMOJI_OPTIONS.map(emoji => (<button key={emoji} onClick={() => setNewHabit({ ...newHabit, icon: emoji })} style={{ width: '100%', aspectRatio: '1', borderRadius: 10, border: newHabit.icon === emoji ? `2px solid ${s.accent}` : `1px solid ${s.borderLight}`, background: newHabit.icon === emoji ? `${s.accent}10` : 'transparent', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emoji}</button>))}
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={s.label}>Target Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ value: 'checkbox', label: 'Yes/No' }, { value: 'number', label: 'Number' }, { value: 'time', label: 'Time' }].map(opt => (<button key={opt.value} onClick={() => setNewHabit({ ...newHabit, targetType: opt.value })} style={{ ...(newHabit.targetType === opt.value ? s.pillAccent : s.pillOutline), flex: 1 }}>{opt.label}</button>))}
                  </div>
                </div>
                {newHabit.targetType === 'number' && (<div style={{ display: 'flex', gap: 12, marginBottom: 18 }}><div style={{ flex: 1 }}><label style={s.label}>Target</label><input type="number" value={newHabit.targetValue} onChange={e => setNewHabit({ ...newHabit, targetValue: e.target.value })} placeholder="8" style={s.input} /></div><div style={{ flex: 1 }}><label style={s.label}>Unit</label><input value={newHabit.unit} onChange={e => setNewHabit({ ...newHabit, unit: e.target.value })} placeholder="glasses, steps..." style={s.input} /></div></div>)}
                {newHabit.targetType === 'time' && (<div style={{ marginBottom: 18 }}><label style={s.label}>Before Time</label><input value={newHabit.targetValue} onChange={e => setNewHabit({ ...newHabit, targetValue: e.target.value })} placeholder="10:00 PM" style={s.input} /></div>)}
                <div style={{ marginBottom: 22 }}>
                  <label style={s.label}>Frequency</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[{ value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays' }, { value: 'custom', label: 'Specific Days' }].map(opt => (<button key={opt.value} onClick={() => setNewHabit({ ...newHabit, frequency: opt.value })} style={newHabit.frequency === opt.value ? s.pillAccent : s.pillOutline}>{opt.label}</button>))}
                  </div>
                  {newHabit.frequency === 'custom' && (<div style={{ display: 'flex', gap: 6, marginTop: 10 }}>{dayNames.map((day, i) => (<button key={day} onClick={() => { const days = newHabit.days.includes(i) ? newHabit.days.filter(d => d !== i) : [...newHabit.days, i]; setNewHabit({ ...newHabit, days }); }} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 11, fontWeight: 500, background: newHabit.days.includes(i) ? s.accent : s.borderLight, color: newHabit.days.includes(i) ? s.accentText : s.text3 }}>{day[0]}</button>))}</div>)}
                </div>
                <button onClick={addCustomHabit} style={{ ...s.pillAccent, width: '100%', padding: '13px 20px', fontSize: 14 }}>Save Habit</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
