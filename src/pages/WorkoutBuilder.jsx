import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStyles } from '../theme';
import { getPatients } from '../data/store';

/* ── Keyframes ── */
const ANIM_ID = 'workout-builder-anims';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes wbFadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .wb-card-hover:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03) !important;
    }
    .wb-lib-card:hover {
      transform: translateY(-4px) scale(1.01) !important;
      box-shadow: 0 16px 48px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04) !important;
    }
    .wb-modal-overlay {
      animation: wbOverlayIn 0.25s ease;
    }
    @keyframes wbOverlayIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .wb-modal-content {
      animation: wbModalSlideUp 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes wbModalSlideUp {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes wbSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes wbPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Capitalize helper — fixes [object Object] from API arrays ── */
function capitalize(val) {
  if (!val) return '';
  if (Array.isArray(val)) val = val[0];
  if (typeof val === 'object' && val !== null) val = val.name || val.label || String(val);
  if (typeof val !== 'string') return String(val);
  return val.replace(/\b\w/g, c => c.toUpperCase());
}

/* ── SVG Icons ── */
const ICO = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  chev: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>,
  dumbbell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

/* ── Hardcoded Fallback Exercise Library ── */
const FALLBACK_EXERCISES = [
  { id: 'fb-1', name: 'Barbell Bench Press', bodyPart: 'Chest', equipment: 'Barbell', target: 'Pectorals', gifUrl: '', instructions: ['Lie flat on bench with feet on floor.','Grip bar slightly wider than shoulder width.','Lower bar to mid-chest.','Press bar up until arms are extended.','Repeat for desired reps.'] },
  { id: 'fb-2', name: 'Barbell Back Squat', bodyPart: 'Upper Legs', equipment: 'Barbell', target: 'Quads', gifUrl: '', instructions: ['Position bar on upper traps.','Stand with feet shoulder-width apart.','Bend knees and hips to lower.','Descend until thighs are parallel.','Drive through heels to stand.'] },
  { id: 'fb-3', name: 'Conventional Deadlift', bodyPart: 'Back', equipment: 'Barbell', target: 'Glutes', gifUrl: '', instructions: ['Stand with feet hip-width, bar over mid-foot.','Hinge at hips, grip bar outside knees.','Brace core, drive through floor.','Lock out hips and knees at top.','Lower with control.'] },
  { id: 'fb-4', name: 'Overhead Press', bodyPart: 'Shoulders', equipment: 'Barbell', target: 'Deltoids', gifUrl: '', instructions: ['Stand with bar at collarbone height.','Grip slightly wider than shoulders.','Press bar overhead.','Lock out at top.','Lower with control.'] },
  { id: 'fb-5', name: 'Pull-up', bodyPart: 'Back', equipment: 'Body Weight', target: 'Lats', gifUrl: '', instructions: ['Hang from bar with overhand grip.','Pull body up until chin clears bar.','Squeeze shoulder blades together.','Lower with control.','Repeat.'] },
  { id: 'fb-6', name: 'Dumbbell Curl', bodyPart: 'Upper Arms', equipment: 'Dumbbell', target: 'Biceps', gifUrl: '', instructions: ['Stand holding dumbbells at sides.','Curl weights to shoulders.','Squeeze at top.','Lower with control.','Alternate or curl both.'] },
  { id: 'fb-7', name: 'Tricep Dip', bodyPart: 'Upper Arms', equipment: 'Body Weight', target: 'Triceps', gifUrl: '', instructions: ['Grip parallel bars, arms straight.','Lower body by bending elbows.','Descend until upper arms are parallel.','Press back up.','Keep core tight throughout.'] },
  { id: 'fb-8', name: 'Leg Press', bodyPart: 'Upper Legs', equipment: 'Machine', target: 'Quads', gifUrl: '', instructions: ['Sit in leg press machine.','Place feet shoulder-width on platform.','Release safety, lower platform.','Press through heels to extend.','Do not lock knees fully.'] },
  { id: 'fb-9', name: 'Lat Pulldown', bodyPart: 'Back', equipment: 'Cable', target: 'Lats', gifUrl: '', instructions: ['Sit at lat pulldown station.','Grip bar wider than shoulders.','Pull bar to upper chest.','Squeeze lats at bottom.','Release slowly.'] },
  { id: 'fb-10', name: 'Dumbbell Lateral Raise', bodyPart: 'Shoulders', equipment: 'Dumbbell', target: 'Deltoids', gifUrl: '', instructions: ['Stand with dumbbells at sides.','Raise arms to shoulder height.','Keep slight bend in elbows.','Lower with control.','Avoid swinging.'] },
  { id: 'fb-11', name: 'Romanian Deadlift', bodyPart: 'Upper Legs', equipment: 'Barbell', target: 'Hamstrings', gifUrl: '', instructions: ['Stand holding barbell at hips.','Hinge at hips, slight knee bend.','Lower bar along legs.','Feel hamstring stretch.','Drive hips forward to stand.'] },
  { id: 'fb-12', name: 'Cable Fly', bodyPart: 'Chest', equipment: 'Cable', target: 'Pectorals', gifUrl: '', instructions: ['Stand between cable stations.','Grip handles, step forward.','Bring hands together in arc.','Squeeze chest at center.','Return slowly.'] },
  { id: 'fb-13', name: 'Plank', bodyPart: 'Waist', equipment: 'Body Weight', target: 'Abs', gifUrl: '', instructions: ['Start in forearm position.','Keep body in straight line.','Engage core, squeeze glutes.','Hold for desired time.','Breathe steadily.'] },
  { id: 'fb-14', name: 'Incline Dumbbell Press', bodyPart: 'Chest', equipment: 'Dumbbell', target: 'Upper Chest', gifUrl: '', instructions: ['Set bench to 30-45 degrees.','Hold dumbbells at chest level.','Press up until arms extended.','Lower with control.','Keep shoulders back.'] },
  { id: 'fb-15', name: 'Bulgarian Split Squat', bodyPart: 'Upper Legs', equipment: 'Dumbbell', target: 'Quads', gifUrl: '', instructions: ['Place rear foot on bench.','Hold dumbbells at sides.','Lower until front thigh parallel.','Drive through front heel.','Complete all reps, switch legs.'] },
  { id: 'fb-16', name: 'Face Pull', bodyPart: 'Shoulders', equipment: 'Cable', target: 'Rear Deltoids', gifUrl: '', instructions: ['Set cable at face height.','Use rope attachment.','Pull toward face, elbows high.','Squeeze shoulder blades.','Return slowly.'] },
  { id: 'fb-17', name: 'Hanging Leg Raise', bodyPart: 'Waist', equipment: 'Body Weight', target: 'Abs', gifUrl: '', instructions: ['Hang from pull-up bar.','Raise legs to parallel or higher.','Control the movement.','Lower slowly.','Avoid swinging.'] },
  { id: 'fb-18', name: 'Barbell Row', bodyPart: 'Back', equipment: 'Barbell', target: 'Mid Back', gifUrl: '', instructions: ['Hinge forward holding barbell.','Pull bar to lower chest.','Squeeze shoulder blades.','Lower with control.','Keep back flat.'] },
  { id: 'fb-19', name: 'Calf Raise', bodyPart: 'Lower Legs', equipment: 'Machine', target: 'Calves', gifUrl: '', instructions: ['Stand on calf raise platform.','Rise onto toes.','Squeeze at top.','Lower heels below platform.','Repeat.'] },
  { id: 'fb-20', name: 'Hip Thrust', bodyPart: 'Upper Legs', equipment: 'Barbell', target: 'Glutes', gifUrl: '', instructions: ['Sit with upper back on bench.','Place barbell across hips.','Drive hips up, squeeze glutes.','Hold at top briefly.','Lower with control.'] },
];

/* ── Seed Templates ── */
function getSeedTemplates() {
  return [
    {
      id: 'TPL-1', name: 'Push Day', category: 'Hypertrophy', difficulty: 'Intermediate', duration: '55 min',
      description: 'Chest, shoulders, and triceps focus with progressive overload.',
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: '8-10', weight: '135 lbs', rest: '90s' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: '50 lbs', rest: '75s' },
        { name: 'Overhead Press', sets: 4, reps: '6-8', weight: '95 lbs', rest: '90s' },
        { name: 'Dumbbell Lateral Raise', sets: 3, reps: '12-15', weight: '20 lbs', rest: '60s' },
        { name: 'Cable Fly', sets: 3, reps: '12-15', weight: '30 lbs', rest: '60s' },
        { name: 'Tricep Dip', sets: 3, reps: '10-12', weight: 'BW', rest: '60s' },
      ]
    },
    {
      id: 'TPL-2', name: 'Pull Day', category: 'Hypertrophy', difficulty: 'Intermediate', duration: '55 min',
      description: 'Back and biceps with heavy compounds and isolation finishers.',
      exercises: [
        { name: 'Conventional Deadlift', sets: 4, reps: '5', weight: '225 lbs', rest: '120s' },
        { name: 'Pull-up', sets: 4, reps: '8-10', weight: 'BW', rest: '90s' },
        { name: 'Barbell Row', sets: 4, reps: '8-10', weight: '135 lbs', rest: '90s' },
        { name: 'Lat Pulldown', sets: 3, reps: '10-12', weight: '120 lbs', rest: '75s' },
        { name: 'Face Pull', sets: 3, reps: '15-20', weight: '40 lbs', rest: '60s' },
        { name: 'Dumbbell Curl', sets: 3, reps: '10-12', weight: '30 lbs', rest: '60s' },
      ]
    },
    {
      id: 'TPL-3', name: 'Leg Day', category: 'Strength', difficulty: 'Advanced', duration: '60 min',
      description: 'Heavy squats and hip hinges with accessory work for complete leg development.',
      exercises: [
        { name: 'Barbell Back Squat', sets: 5, reps: '5', weight: '225 lbs', rest: '180s' },
        { name: 'Romanian Deadlift', sets: 4, reps: '8-10', weight: '185 lbs', rest: '90s' },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '10/leg', weight: '40 lbs', rest: '75s' },
        { name: 'Leg Press', sets: 3, reps: '12-15', weight: '360 lbs', rest: '90s' },
        { name: 'Hip Thrust', sets: 3, reps: '10-12', weight: '185 lbs', rest: '75s' },
        { name: 'Calf Raise', sets: 4, reps: '15-20', weight: '90 lbs', rest: '45s' },
      ]
    },
    {
      id: 'TPL-4', name: 'Upper Body Power', category: 'Strength', difficulty: 'Advanced', duration: '50 min',
      description: 'Low rep, heavy compound lifts for maximal upper body strength.',
      exercises: [
        { name: 'Barbell Bench Press', sets: 5, reps: '3-5', weight: '185 lbs', rest: '180s' },
        { name: 'Overhead Press', sets: 5, reps: '3-5', weight: '115 lbs', rest: '180s' },
        { name: 'Barbell Row', sets: 4, reps: '5-6', weight: '165 lbs', rest: '120s' },
        { name: 'Pull-up', sets: 4, reps: '6-8', weight: '+25 lbs', rest: '120s' },
        { name: 'Dumbbell Curl', sets: 2, reps: '8-10', weight: '35 lbs', rest: '60s' },
        { name: 'Tricep Dip', sets: 2, reps: '8-10', weight: '+25 lbs', rest: '60s' },
      ]
    },
    {
      id: 'TPL-5', name: 'Full Body HIIT', category: 'Conditioning', difficulty: 'Beginner', duration: '35 min',
      description: 'Fast-paced bodyweight circuit for cardiovascular endurance and calorie burn.',
      exercises: [
        { name: 'Barbell Back Squat', sets: 3, reps: '15', weight: '95 lbs', rest: '30s' },
        { name: 'Plank', sets: 3, reps: '45s hold', weight: 'BW', rest: '15s' },
        { name: 'Pull-up', sets: 3, reps: 'AMRAP', weight: 'BW', rest: '30s' },
        { name: 'Hanging Leg Raise', sets: 3, reps: '12', weight: 'BW', rest: '30s' },
        { name: 'Calf Raise', sets: 3, reps: '20', weight: 'BW', rest: '15s' },
        { name: 'Dumbbell Lateral Raise', sets: 3, reps: '12', weight: '10 lbs', rest: '30s' },
      ]
    },
    {
      id: 'TPL-6', name: 'Core & Stability', category: 'Rehab', difficulty: 'Beginner', duration: '30 min',
      description: 'Core-focused session for stability, posture, and injury prevention.',
      exercises: [
        { name: 'Plank', sets: 4, reps: '60s hold', weight: 'BW', rest: '30s' },
        { name: 'Hanging Leg Raise', sets: 3, reps: '10-12', weight: 'BW', rest: '45s' },
        { name: 'Hip Thrust', sets: 3, reps: '15', weight: '95 lbs', rest: '60s' },
        { name: 'Face Pull', sets: 3, reps: '15', weight: '25 lbs', rest: '45s' },
        { name: 'Bulgarian Split Squat', sets: 2, reps: '12/leg', weight: 'BW', rest: '45s' },
        { name: 'Calf Raise', sets: 3, reps: '20', weight: 'BW', rest: '30s' },
      ]
    },
  ];
}

/* ── Persist helpers ── */
function loadWorkouts() {
  try { return JSON.parse(localStorage.getItem('ms_workouts')) || getSeedTemplates(); } catch { return getSeedTemplates(); }
}
function saveWorkouts(w) { localStorage.setItem('ms_workouts', JSON.stringify(w)); }

const EXERCISE_API = 'https://exercisedb.dev/api/v1/exercises';
const BODYPARTS_API = 'https://exercisedb.dev/api/v1/bodyparts';
const EQUIPMENT_API = 'https://exercisedb.dev/api/v1/equipments';

/* ── Difficulty badge color ── */
function diffColor(diff, s) {
  if (diff === 'Advanced') return { bg: s.dangerBg, color: s.danger };
  if (diff === 'Intermediate') return { bg: s.warningBg, color: s.warning };
  return { bg: s.successBg, color: s.success };
}

/* ═══════════════════════════════════════════ */
export default function WorkoutBuilder() {
  const s = useStyles();
  const [tab, setTab] = useState('templates');
  const [workouts, setWorkouts] = useState(loadWorkouts);
  const [expandedTpl, setExpandedTpl] = useState(null);
  const [editModal, setEditModal] = useState(null); // null | 'new' | workout obj
  const [assignModal, setAssignModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null); // exercise detail

  // Exercise Library state
  const [libExercises, setLibExercises] = useState([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libError, setLibError] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [libBodyPart, setLibBodyPart] = useState('all');
  const [libEquipment, setLibEquipment] = useState('all');
  const [bodyParts, setBodyParts] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [libPage, setLibPage] = useState(0);
  const [libTotal, setLibTotal] = useState(0);
  const debounceRef = useRef(null);

  // My Exercises state
  const [myExercises, setMyExercises] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ms_my_exercises')) || []; } catch { return []; }
  });
  const [myModal, setMyModal] = useState(null);

  const clients = useMemo(() => getPatients(), []);

  // Persist
  useEffect(() => { saveWorkouts(workouts); }, [workouts]);
  useEffect(() => { localStorage.setItem('ms_my_exercises', JSON.stringify(myExercises)); }, [myExercises]);

  // Seed workouts if empty
  useEffect(() => {
    if (workouts.length === 0) {
      const seed = getSeedTemplates();
      setWorkouts(seed);
    }
  }, []);

  /* ── Fetch body parts + equipment lists ── */
  useEffect(() => {
    (async () => {
      try {
        const [bpRes, eqRes] = await Promise.all([
          fetch(BODYPARTS_API).then(r => r.ok ? r.json() : null),
          fetch(EQUIPMENT_API).then(r => r.ok ? r.json() : null),
        ]);
        if (bpRes) setBodyParts((Array.isArray(bpRes) ? bpRes : bpRes.data || []).map(v => capitalize(v)));
        if (eqRes) setEquipments((Array.isArray(eqRes) ? eqRes : eqRes.data || []).map(v => capitalize(v)));
      } catch {}
    })();
  }, []);

  /* ── Fetch exercises ── */
  const fetchExercises = useCallback(async (search, bodyPart, equipment, page) => {
    setLibLoading(true);
    setLibError(false);
    try {
      let url = `${EXERCISE_API}?limit=20&offset=${page * 20}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (bodyPart && bodyPart !== 'all') url += `&bodyPart=${encodeURIComponent(bodyPart.toLowerCase())}`;
      if (equipment && equipment !== 'all') url += `&equipment=${encodeURIComponent(equipment.toLowerCase())}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data || [];
      const total = json.total || data.length;
      setLibTotal(total);

      if (page === 0) {
        setLibExercises(data);
      } else {
        setLibExercises(prev => [...prev, ...data]);
      }
    } catch {
      setLibError(true);
      if (page === 0) {
        // Fallback
        let filtered = FALLBACK_EXERCISES;
        if (search) filtered = filtered.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
        if (bodyPart && bodyPart !== 'all') filtered = filtered.filter(e => e.bodyPart.toLowerCase() === bodyPart.toLowerCase());
        if (equipment && equipment !== 'all') filtered = filtered.filter(e => e.equipment.toLowerCase() === equipment.toLowerCase());
        setLibExercises(filtered);
        setLibTotal(filtered.length);
      }
    }
    setLibLoading(false);
  }, []);

  /* ── Debounced search ── */
  useEffect(() => {
    if (tab !== 'library') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLibPage(0);
      fetchExercises(libSearch, libBodyPart, libEquipment, 0);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [libSearch, libBodyPart, libEquipment, tab, fetchExercises]);

  const loadMore = () => {
    const next = libPage + 1;
    setLibPage(next);
    fetchExercises(libSearch, libBodyPart, libEquipment, next);
  };

  /* ── Template CRUD ── */
  const saveTemplate = (tpl) => {
    if (tpl.id) {
      setWorkouts(prev => prev.map(w => w.id === tpl.id ? tpl : w));
    } else {
      tpl.id = `TPL-${Date.now()}`;
      setWorkouts(prev => [tpl, ...prev]);
    }
    setEditModal(null);
  };

  const deleteTemplate = (id) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
    setExpandedTpl(null);
  };

  const duplicateTemplate = (tpl) => {
    const dup = { ...tpl, id: `TPL-${Date.now()}`, name: tpl.name + ' (Copy)', exercises: tpl.exercises.map(e => ({ ...e })) };
    setWorkouts(prev => [dup, ...prev]);
  };

  /* ── Tabs ── */
  const tabs = [
    { key: 'templates', label: 'Templates' },
    { key: 'library', label: 'Exercise Library' },
    { key: 'my', label: 'My Exercises' },
  ];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, margin: 0 }}>
            Workout Builder
          </h1>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: '4px 0 0' }}>
            Create, customize, and assign workout programs
          </p>
        </div>
        {tab === 'templates' && (
          <button
            style={{ ...s.pillCta, display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setEditModal('new')}
          >
            {ICO.plus} New Template
          </button>
        )}
        {tab === 'my' && (
          <button
            style={{ ...s.pillCta, display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setMyModal({ name: '', bodyPart: '', equipment: '', instructions: '', mediaUrl: '' })}
          >
            {ICO.plus} New Exercise
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: s.surfaceAlt, borderRadius: 12, padding: 4, marginBottom: 28, width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...s.pill,
              background: tab === t.key ? s.surface : 'transparent',
              color: tab === t.key ? s.text : s.text3,
              fontWeight: tab === t.key ? 600 : 400,
              boxShadow: tab === t.key ? s.shadow : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TEMPLATES TAB ═══ */}
      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {workouts.map((w, i) => (
            <div
              key={w.id}
              className="wb-card-hover"
              style={{
                ...s.cardStyle,
                padding: 0,
                cursor: 'pointer',
                animation: `wbFadeInUp 0.4s ease ${i * 0.05}s both`,
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div
                style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${s.border}` }}
                onClick={() => setExpandedTpl(expandedTpl === w.id ? null : w.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: s.HEADING, fontSize: 17, fontWeight: 600, color: s.text, margin: 0 }}>{w.name}</h3>
                  <span style={{
                    ...diffColor(w.difficulty, s),
                    fontFamily: s.FONT,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 100,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    {w.difficulty || 'General'}
                  </span>
                </div>
                <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, margin: '0 0 12px', lineHeight: 1.5 }}>
                  {w.description || 'Custom workout template'}
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3 }}>
                    {w.exercises?.length || 0} exercises
                  </span>
                  {w.category && (
                    <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.accent }}>{w.category}</span>
                  )}
                  {w.duration && (
                    <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3 }}>{w.duration}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, transform: expandedTpl === w.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s ease', color: s.text3 }}>
                  {ICO.chev}
                </div>
              </div>

              {/* Expanded exercises */}
              {expandedTpl === w.id && (
                <div style={{ animation: 'wbFadeInUp 0.3s ease' }}>
                  <div style={{ padding: '0 20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                          {['Exercise', 'Sets', 'Reps', 'Weight', 'Rest'].map(h => (
                            <th key={h} style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: s.text3, padding: '10px 4px', textAlign: 'left' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(w.exercises || []).map((ex, j) => (
                          <tr key={j} style={{ borderBottom: j < w.exercises.length - 1 ? `1px solid ${s.borderLight}` : 'none' }}>
                            <td style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text, padding: '10px 4px' }}>{ex.name}</td>
                            <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.accent, padding: '10px 4px' }}>{ex.sets}</td>
                            <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.text2, padding: '10px 4px' }}>{ex.reps}</td>
                            <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.text2, padding: '10px 4px' }}>{ex.weight}</td>
                            <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.text3, padding: '10px 4px' }}>{ex.rest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, padding: '16px 20px', borderTop: `1px solid ${s.border}`, flexWrap: 'wrap' }}>
                    <button style={{ ...s.pillAccent, padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setAssignModal(w)}>
                      {ICO.user} Assign to Client
                    </button>
                    <button style={{ ...s.pillOutline, padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setEditModal(w)}>
                      {ICO.edit} Edit
                    </button>
                    <button style={{ ...s.pillGhost, padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => duplicateTemplate(w)}>
                      {ICO.copy} Duplicate
                    </button>
                    <button style={{ ...s.pillGhost, padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: s.danger, borderColor: s.danger }} onClick={() => deleteTemplate(w.id)}>
                      {ICO.trash} Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ EXERCISE LIBRARY TAB ═══ */}
      {tab === 'library' && (
        <div>
          {/* Search + Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: s.text3 }}>{ICO.search}</span>
              <input
                style={{ ...s.input, paddingLeft: 40 }}
                placeholder="Search exercises..."
                value={libSearch}
                onChange={e => setLibSearch(e.target.value)}
              />
            </div>
            <select
              style={{ ...s.input, width: 'auto', minWidth: 160, cursor: 'pointer' }}
              value={libBodyPart}
              onChange={e => setLibBodyPart(e.target.value)}
            >
              <option value="all">All Body Parts</option>
              {bodyParts.map(bp => <option key={bp} value={bp}>{bp}</option>)}
            </select>
            <select
              style={{ ...s.input, width: 'auto', minWidth: 160, cursor: 'pointer' }}
              value={libEquipment}
              onChange={e => setLibEquipment(e.target.value)}
            >
              <option value="all">All Equipment</option>
              {equipments.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>

          {/* Results count */}
          {!libLoading && (
            <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: '0 0 16px' }}>
              Showing {libExercises.length} of {libTotal} exercises
              {libError && <span style={{ color: s.warning, marginLeft: 8 }}>(Using offline library)</span>}
            </p>
          )}

          {/* Loading */}
          {libLoading && libExercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${s.border}`, borderTopColor: s.accent, borderRadius: '50%', animation: 'wbSpin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>Loading exercises...</p>
            </div>
          )}

          {/* Exercise Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {libExercises.map((ex, i) => {
              const bp = capitalize(ex.bodyPart);
              const eq = capitalize(ex.equipment);
              const tgt = capitalize(ex.target);
              return (
                <div
                  key={ex.id || i}
                  className="wb-lib-card"
                  onClick={() => setDetailModal(ex)}
                  style={{
                    ...s.cardStyle,
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    animation: `wbFadeInUp 0.35s ease ${(i % 20) * 0.03}s both`,
                  }}
                >
                  {/* GIF */}
                  <div style={{
                    height: 180,
                    background: s.surfaceAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {ex.gifUrl ? (
                      <img src={ex.gifUrl} alt={capitalize(ex.name)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div style={{ color: s.text3, opacity: 0.4 }}>{ICO.dumbbell}</div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <h4 style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text, margin: '0 0 8px', lineHeight: 1.3 }}>
                      {capitalize(ex.name)}
                    </h4>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{
                        fontFamily: s.FONT, fontSize: 11, fontWeight: 500,
                        background: s.accentLight, color: s.accent,
                        padding: '2px 8px', borderRadius: 100,
                      }}>{bp}</span>
                      <span style={{
                        fontFamily: s.FONT, fontSize: 11, fontWeight: 500,
                        background: s.surfaceAlt, color: s.text2,
                        padding: '2px 8px', borderRadius: 100,
                      }}>{eq}</span>
                    </div>
                    <p style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, margin: 0 }}>
                      Target: {tgt}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {libExercises.length < libTotal && !libLoading && (
            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button style={s.pillAccent} onClick={loadMore}>
                Load More
              </button>
            </div>
          )}
          {libLoading && libExercises.length > 0 && (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <div style={{ width: 24, height: 24, border: `3px solid ${s.border}`, borderTopColor: s.accent, borderRadius: '50%', animation: 'wbSpin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          )}
        </div>
      )}

      {/* ═══ MY EXERCISES TAB ═══ */}
      {tab === 'my' && (
        <div>
          {myExercises.length === 0 ? (
            <div style={{ ...s.cardStyle, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3, color: s.text3 }}>{ICO.dumbbell}</div>
              <h3 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 8px' }}>No custom exercises yet</h3>
              <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, margin: '0 0 20px' }}>Create your own exercises with custom videos and instructions.</p>
              <button style={s.pillCta} onClick={() => setMyModal({ name: '', bodyPart: '', equipment: '', instructions: '', mediaUrl: '' })}>
                Create First Exercise
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {myExercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="wb-card-hover"
                  style={{ ...s.cardStyle, padding: 0, overflow: 'hidden', animation: `wbFadeInUp 0.35s ease ${i * 0.05}s both` }}
                >
                  {/* Media preview */}
                  <div style={{ height: 160, background: s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {ex.mediaUrl ? (
                      ex.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={ex.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop autoPlay playsInline />
                      ) : (
                        <img src={ex.mediaUrl} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )
                    ) : (
                      <div style={{ color: s.text3, opacity: 0.3 }}>{ICO.upload}</div>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <h4 style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text, margin: '0 0 6px' }}>{ex.name}</h4>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {ex.bodyPart && <span style={{ fontFamily: s.FONT, fontSize: 11, background: s.accentLight, color: s.accent, padding: '2px 8px', borderRadius: 100 }}>{ex.bodyPart}</span>}
                      {ex.equipment && <span style={{ fontFamily: s.FONT, fontSize: 11, background: s.surfaceAlt, color: s.text2, padding: '2px 8px', borderRadius: 100 }}>{ex.equipment}</span>}
                    </div>
                    {ex.instructions && <p style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, margin: 0, lineHeight: 1.5 }}>{ex.instructions.slice(0, 80)}{ex.instructions.length > 80 ? '...' : ''}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button style={{ ...s.pillGhost, padding: '6px 12px', fontSize: 11 }} onClick={() => setMyModal(ex)}>
                        {ICO.edit} Edit
                      </button>
                      <button style={{ ...s.pillGhost, padding: '6px 12px', fontSize: 11, color: s.danger, borderColor: s.danger }} onClick={() => setMyExercises(prev => prev.filter(e => e.id !== ex.id))}>
                        {ICO.trash}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ EXERCISE DETAIL MODAL ═══ */}
      {detailModal && (
        <ModalOverlay onClose={() => setDetailModal(null)}>
          <div style={{ maxWidth: 600, width: '90vw' }}>
            {/* Large GIF */}
            {detailModal.gifUrl && (
              <div style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden', height: 300, background: s.surfaceAlt }}>
                <img src={detailModal.gifUrl} alt={capitalize(detailModal.name)} style={{ width: '100%', height: '100%', objectFit: 'contain', background: s.surfaceAlt }} />
              </div>
            )}
            <div style={{ padding: 24 }}>
              <h2 style={{ fontFamily: s.HEADING, fontSize: 22, fontWeight: 700, color: s.text, margin: '0 0 12px' }}>
                {capitalize(detailModal.name)}
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 500, background: s.accentLight, color: s.accent, padding: '4px 12px', borderRadius: 100 }}>
                  {capitalize(detailModal.bodyPart)}
                </span>
                <span style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 500, background: s.surfaceAlt, color: s.text2, padding: '4px 12px', borderRadius: 100 }}>
                  {capitalize(detailModal.equipment)}
                </span>
                <span style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 500, background: s.successBg, color: s.success, padding: '4px 12px', borderRadius: 100 }}>
                  Target: {capitalize(detailModal.target)}
                </span>
              </div>

              {/* Secondary muscles */}
              {detailModal.secondaryMuscles && detailModal.secondaryMuscles.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ ...s.label }}>Secondary Muscles</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {detailModal.secondaryMuscles.map((m, i) => (
                      <span key={i} style={{ fontFamily: s.FONT, fontSize: 11, background: s.surfaceAlt, color: s.text2, padding: '3px 10px', borderRadius: 100 }}>
                        {capitalize(m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {detailModal.instructions && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ ...s.label }}>Instructions</span>
                  <ol style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                    {(Array.isArray(detailModal.instructions) ? detailModal.instructions : [detailModal.instructions]).map((inst, i) => (
                      <li key={i}>{typeof inst === 'string' ? inst : capitalize(inst)}</li>
                    ))}
                  </ol>
                </div>
              )}

              <button
                style={{ ...s.pillCta, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => {
                  // Add to workout builder (copy to clipboard-like behavior: create a My Exercise)
                  const newEx = {
                    id: `MY-${Date.now()}`,
                    name: capitalize(detailModal.name),
                    bodyPart: capitalize(detailModal.bodyPart),
                    equipment: capitalize(detailModal.equipment),
                    instructions: Array.isArray(detailModal.instructions) ? detailModal.instructions.join('\n') : (detailModal.instructions || ''),
                    mediaUrl: detailModal.gifUrl || '',
                  };
                  setMyExercises(prev => [newEx, ...prev]);
                  setDetailModal(null);
                }}
              >
                {ICO.plus} Add to My Exercises
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══ EDIT / CREATE TEMPLATE MODAL ═══ */}
      {editModal && (
        <TemplateEditModal
          s={s}
          initial={editModal === 'new' ? null : editModal}
          onSave={saveTemplate}
          onClose={() => setEditModal(null)}
          allExercises={[...FALLBACK_EXERCISES, ...myExercises.map(e => ({ ...e, bodyPart: e.bodyPart, equipment: e.equipment }))]}
        />
      )}

      {/* ═══ ASSIGN MODAL ═══ */}
      {assignModal && (
        <AssignModal
          s={s}
          workout={assignModal}
          clients={clients}
          onClose={() => setAssignModal(null)}
        />
      )}

      {/* ═══ MY EXERCISE EDIT MODAL ═══ */}
      {myModal && (
        <MyExerciseModal
          s={s}
          initial={myModal}
          onSave={(ex) => {
            if (ex.id) {
              setMyExercises(prev => prev.map(e => e.id === ex.id ? ex : e));
            } else {
              ex.id = `MY-${Date.now()}`;
              setMyExercises(prev => [ex, ...prev]);
            }
            setMyModal(null);
          }}
          onClose={() => setMyModal(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════ Modal Overlay ═══════════════════ */
function ModalOverlay({ children, onClose }) {
  const s = useStyles();
  return (
    <div
      className="wb-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        className="wb-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: s.surface,
          borderRadius: 20,
          border: `1px solid ${s.border}`,
          boxShadow: s.shadowLg,
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            background: s.surfaceAlt, border: `1px solid ${s.border}`, borderRadius: 10,
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: s.text2,
          }}
        >
          {ICO.x}
        </button>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════ Template Edit Modal ═══════════════════ */
function TemplateEditModal({ s, initial, onSave, onClose, allExercises }) {
  const [form, setForm] = useState(initial ? { ...initial, exercises: initial.exercises.map(e => ({ ...e })) } : {
    name: '', category: 'Hypertrophy', difficulty: 'Intermediate', duration: '', description: '', exercises: [],
  });

  const updateField = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const updateExercise = (idx, field, val) => {
    const exs = [...form.exercises];
    exs[idx] = { ...exs[idx], [field]: val };
    setForm(prev => ({ ...prev, exercises: exs }));
  };
  const removeExercise = (idx) => setForm(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== idx) }));
  const addExercise = () => setForm(prev => ({
    ...prev,
    exercises: [...prev.exercises, { name: '', sets: 3, reps: '10', weight: '', rest: '60s' }],
  }));

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '90vw', maxWidth: 680, padding: 28 }}>
        <h2 style={{ fontFamily: s.HEADING, fontSize: 22, fontWeight: 700, color: s.text, margin: '0 0 24px' }}>
          {initial ? 'Edit Template' : 'New Workout Template'}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={s.label}>Template Name</label>
            <input style={s.input} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Push Day" />
          </div>
          <div>
            <label style={s.label}>Category</label>
            <select style={{ ...s.input, cursor: 'pointer' }} value={form.category} onChange={e => updateField('category', e.target.value)}>
              {['Hypertrophy', 'Strength', 'Conditioning', 'Rehab', 'Mobility', 'Sport'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Difficulty</label>
            <select style={{ ...s.input, cursor: 'pointer' }} value={form.difficulty} onChange={e => updateField('difficulty', e.target.value)}>
              {['Beginner', 'Intermediate', 'Advanced'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Duration</label>
            <input style={s.input} value={form.duration} onChange={e => updateField('duration', e.target.value)} placeholder="e.g. 55 min" />
          </div>
          <div>
            <label style={s.label}>Description</label>
            <input style={s.input} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Brief description" />
          </div>
        </div>

        {/* Exercises list */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={s.label}>Exercises</span>
            <button style={{ ...s.pillGhost, padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} onClick={addExercise}>
              {ICO.plus} Add Exercise
            </button>
          </div>
          {form.exercises.map((ex, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input style={{ ...s.input, padding: '10px 12px', fontSize: 13 }} value={ex.name} onChange={e => updateExercise(idx, 'name', e.target.value)} placeholder="Exercise name" list="ex-suggestions" />
              <input style={{ ...s.input, padding: '10px 12px', fontSize: 13 }} value={ex.sets} onChange={e => updateExercise(idx, 'sets', e.target.value)} placeholder="Sets" />
              <input style={{ ...s.input, padding: '10px 12px', fontSize: 13 }} value={ex.reps} onChange={e => updateExercise(idx, 'reps', e.target.value)} placeholder="Reps" />
              <input style={{ ...s.input, padding: '10px 12px', fontSize: 13 }} value={ex.weight} onChange={e => updateExercise(idx, 'weight', e.target.value)} placeholder="Weight" />
              <input style={{ ...s.input, padding: '10px 12px', fontSize: 13 }} value={ex.rest} onChange={e => updateExercise(idx, 'rest', e.target.value)} placeholder="Rest" />
              <button onClick={() => removeExercise(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.danger, padding: 4 }}>
                {ICO.trash}
              </button>
            </div>
          ))}
          <datalist id="ex-suggestions">
            {allExercises.map((e, i) => <option key={i} value={e.name} />)}
          </datalist>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button style={s.pillGhost} onClick={onClose}>Cancel</button>
          <button
            style={{ ...s.pillCta, opacity: form.name ? 1 : 0.5 }}
            disabled={!form.name}
            onClick={() => onSave(form)}
          >
            {initial ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ═══════════════════ Assign Modal ═══════════════════ */
function AssignModal({ s, workout, clients, onClose }) {
  const [selected, setSelected] = useState('');
  const [assigned, setAssigned] = useState(false);

  const handleAssign = () => {
    if (!selected) return;
    const existing = JSON.parse(localStorage.getItem('ms_workout_assignments') || '[]');
    existing.push({
      id: `WA-${Date.now()}`,
      workoutId: workout.id,
      workoutName: workout.name,
      clientId: selected,
      clientName: clients.find(c => c.id === selected)?.firstName + ' ' + clients.find(c => c.id === selected)?.lastName,
      assignedAt: new Date().toISOString(),
    });
    localStorage.setItem('ms_workout_assignments', JSON.stringify(existing));
    setAssigned(true);
    setTimeout(onClose, 1200);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '90vw', maxWidth: 440, padding: 28 }}>
        <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 700, color: s.text, margin: '0 0 8px' }}>
          Assign Workout
        </h2>
        <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: '0 0 20px' }}>
          Assign <strong>{workout.name}</strong> to a client
        </p>

        {assigned ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: s.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s.success} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <p style={{ fontFamily: s.FONT, fontSize: 15, fontWeight: 600, color: s.success }}>Workout Assigned!</p>
          </div>
        ) : (
          <>
            <label style={s.label}>Select Client</label>
            <select style={{ ...s.input, cursor: 'pointer', marginBottom: 20 }} value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Choose a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={s.pillGhost} onClick={onClose}>Cancel</button>
              <button style={{ ...s.pillCta, opacity: selected ? 1 : 0.5 }} disabled={!selected} onClick={handleAssign}>
                Assign
              </button>
            </div>
          </>
        )}
      </div>
    </ModalOverlay>
  );
}

/* ═══════════════════ My Exercise Modal ═══════════════════ */
function MyExerciseModal({ s, initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial });
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, mediaUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '90vw', maxWidth: 520, padding: 28 }}>
        <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 700, color: s.text, margin: '0 0 24px' }}>
          {initial.id ? 'Edit Exercise' : 'Create Exercise'}
        </h2>

        <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={s.label}>Exercise Name</label>
            <input style={s.input} value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Landmine Press" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={s.label}>Body Part</label>
              <input style={s.input} value={form.bodyPart} onChange={e => setForm(prev => ({ ...prev, bodyPart: e.target.value }))} placeholder="e.g. Shoulders" />
            </div>
            <div>
              <label style={s.label}>Equipment</label>
              <input style={s.input} value={form.equipment} onChange={e => setForm(prev => ({ ...prev, equipment: e.target.value }))} placeholder="e.g. Barbell" />
            </div>
          </div>
          <div>
            <label style={s.label}>Instructions</label>
            <textarea
              style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
              value={form.instructions}
              onChange={e => setForm(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Step by step instructions..."
            />
          </div>
          <div>
            <label style={s.label}>Video / Image</label>
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFile} />
            {form.mediaUrl ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${s.border}`, height: 180 }}>
                {form.mediaUrl.match(/^data:video/) ? (
                  <video src={form.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop autoPlay playsInline />
                ) : (
                  <img src={form.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                )}
                <button
                  onClick={() => setForm(prev => ({ ...prev, mediaUrl: '' }))}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                >
                  {ICO.x}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  ...s.input,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  height: 100, cursor: 'pointer', color: s.text3,
                  border: `2px dashed ${s.border}`,
                }}
              >
                {ICO.upload} Upload Video or Image
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button style={s.pillGhost} onClick={onClose}>Cancel</button>
          <button
            style={{ ...s.pillCta, opacity: form.name ? 1 : 0.5 }}
            disabled={!form.name}
            onClick={() => onSave(form)}
          >
            {initial.id ? 'Save Changes' : 'Create Exercise'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
