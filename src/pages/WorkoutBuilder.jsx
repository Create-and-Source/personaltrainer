import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStyles } from '../theme';
import { getPatients } from '../data/store';

/* ── inject keyframes ── */
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
    .wb-exercise-row:hover {
      background: rgba(0,0,0,0.015) !important;
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
    @keyframes wbPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.7; }
    }
    @keyframes wbSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(sheet);
}

/* ══════════════════════════════════════════════════════════════════
   LOCAL STORAGE — Workout Templates
   ══════════════════════════════════════════════════════════════════ */
const WK_KEY = 'ms_workouts';
const WK_ASSIGN_KEY = 'ms_workout_assignments';

function getWorkouts() {
  try { return JSON.parse(localStorage.getItem(WK_KEY)) || []; } catch { return []; }
}
function setWorkouts(data) { localStorage.setItem(WK_KEY, JSON.stringify(data)); }
function addWorkout(w) {
  const all = getWorkouts();
  w.id = `WK-${Date.now()}`;
  w.createdAt = new Date().toISOString();
  all.unshift(w);
  setWorkouts(all);
  return w;
}
function updateWorkout(id, updates) {
  setWorkouts(getWorkouts().map(w => w.id === id ? { ...w, ...updates } : w));
}
function deleteWorkout(id) {
  setWorkouts(getWorkouts().filter(w => w.id !== id));
}

function getAssignments() {
  try { return JSON.parse(localStorage.getItem(WK_ASSIGN_KEY)) || []; } catch { return []; }
}
function addAssignment(a) {
  const all = getAssignments();
  a.id = `WKA-${Date.now()}`;
  a.createdAt = new Date().toISOString();
  all.unshift(a);
  localStorage.setItem(WK_ASSIGN_KEY, JSON.stringify(all));
  return a;
}

/* ══════════════════════════════════════════════════════════════════
   EXERCISE LIBRARY — ~45 exercises
   ══════════════════════════════════════════════════════════════════ */
const EXERCISE_LIBRARY = [
  // Chest
  { name: 'Barbell Bench Press', bodyPart: 'Chest', equipment: 'Barbell', targetMuscle: 'Pectorals', secondaryMuscles: ['Triceps', 'Front Delts'] },
  { name: 'Incline Dumbbell Press', bodyPart: 'Chest', equipment: 'Dumbbell', targetMuscle: 'Upper Chest', secondaryMuscles: ['Triceps', 'Front Delts'] },
  { name: 'Cable Chest Fly', bodyPart: 'Chest', equipment: 'Cable', targetMuscle: 'Pectorals', secondaryMuscles: ['Front Delts'] },
  { name: 'Push-ups', bodyPart: 'Chest', equipment: 'Bodyweight', targetMuscle: 'Pectorals', secondaryMuscles: ['Triceps', 'Core'] },
  { name: 'Dumbbell Bench Press', bodyPart: 'Chest', equipment: 'Dumbbell', targetMuscle: 'Pectorals', secondaryMuscles: ['Triceps', 'Front Delts'] },
  // Back
  { name: 'Deadlift', bodyPart: 'Back', equipment: 'Barbell', targetMuscle: 'Erectors', secondaryMuscles: ['Glutes', 'Hamstrings', 'Traps'] },
  { name: 'Barbell Row', bodyPart: 'Back', equipment: 'Barbell', targetMuscle: 'Lats', secondaryMuscles: ['Biceps', 'Rhomboids'] },
  { name: 'Pull-ups', bodyPart: 'Back', equipment: 'Bodyweight', targetMuscle: 'Lats', secondaryMuscles: ['Biceps', 'Rear Delts'] },
  { name: 'Dumbbell Row', bodyPart: 'Back', equipment: 'Dumbbell', targetMuscle: 'Lats', secondaryMuscles: ['Biceps', 'Rhomboids'] },
  { name: 'Lat Pulldown', bodyPart: 'Back', equipment: 'Cable', targetMuscle: 'Lats', secondaryMuscles: ['Biceps'] },
  { name: 'Seated Cable Row', bodyPart: 'Back', equipment: 'Cable', targetMuscle: 'Rhomboids', secondaryMuscles: ['Lats', 'Biceps'] },
  { name: 'Face Pulls', bodyPart: 'Back', equipment: 'Cable', targetMuscle: 'Rear Delts', secondaryMuscles: ['Traps', 'Rhomboids'] },
  // Shoulders
  { name: 'Overhead Press', bodyPart: 'Shoulders', equipment: 'Barbell', targetMuscle: 'Front Delts', secondaryMuscles: ['Triceps', 'Traps'] },
  { name: 'Lateral Raises', bodyPart: 'Shoulders', equipment: 'Dumbbell', targetMuscle: 'Lateral Delts', secondaryMuscles: ['Traps'] },
  { name: 'Arnold Press', bodyPart: 'Shoulders', equipment: 'Dumbbell', targetMuscle: 'Deltoids', secondaryMuscles: ['Triceps'] },
  { name: 'Reverse Fly', bodyPart: 'Shoulders', equipment: 'Dumbbell', targetMuscle: 'Rear Delts', secondaryMuscles: ['Rhomboids'] },
  { name: 'Cable Lateral Raise', bodyPart: 'Shoulders', equipment: 'Cable', targetMuscle: 'Lateral Delts', secondaryMuscles: [] },
  // Arms
  { name: 'Barbell Curl', bodyPart: 'Arms', equipment: 'Barbell', targetMuscle: 'Biceps', secondaryMuscles: ['Forearms'] },
  { name: 'Tricep Pushdown', bodyPart: 'Arms', equipment: 'Cable', targetMuscle: 'Triceps', secondaryMuscles: [] },
  { name: 'Hammer Curl', bodyPart: 'Arms', equipment: 'Dumbbell', targetMuscle: 'Biceps', secondaryMuscles: ['Brachialis'] },
  { name: 'Skull Crushers', bodyPart: 'Arms', equipment: 'Barbell', targetMuscle: 'Triceps', secondaryMuscles: [] },
  { name: 'Concentration Curl', bodyPart: 'Arms', equipment: 'Dumbbell', targetMuscle: 'Biceps', secondaryMuscles: [] },
  { name: 'Overhead Tricep Extension', bodyPart: 'Arms', equipment: 'Dumbbell', targetMuscle: 'Triceps', secondaryMuscles: [] },
  // Legs
  { name: 'Back Squat', bodyPart: 'Legs', equipment: 'Barbell', targetMuscle: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'] },
  { name: 'Romanian Deadlift', bodyPart: 'Legs', equipment: 'Barbell', targetMuscle: 'Hamstrings', secondaryMuscles: ['Glutes', 'Erectors'] },
  { name: 'Leg Press', bodyPart: 'Legs', equipment: 'Machine', targetMuscle: 'Quadriceps', secondaryMuscles: ['Glutes'] },
  { name: 'Walking Lunges', bodyPart: 'Legs', equipment: 'Dumbbell', targetMuscle: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'] },
  { name: 'Calf Raises', bodyPart: 'Legs', equipment: 'Machine', targetMuscle: 'Calves', secondaryMuscles: [] },
  { name: 'Goblet Squat', bodyPart: 'Legs', equipment: 'Kettlebell', targetMuscle: 'Quadriceps', secondaryMuscles: ['Glutes', 'Core'] },
  { name: 'Step-ups', bodyPart: 'Legs', equipment: 'Bodyweight', targetMuscle: 'Quadriceps', secondaryMuscles: ['Glutes'] },
  { name: 'Bulgarian Split Squat', bodyPart: 'Legs', equipment: 'Dumbbell', targetMuscle: 'Quadriceps', secondaryMuscles: ['Glutes'] },
  { name: 'Hip Thrust', bodyPart: 'Legs', equipment: 'Barbell', targetMuscle: 'Glutes', secondaryMuscles: ['Hamstrings'] },
  // Core
  { name: 'Hanging Leg Raise', bodyPart: 'Core', equipment: 'Bodyweight', targetMuscle: 'Lower Abs', secondaryMuscles: ['Hip Flexors'] },
  { name: 'Ab Rollout', bodyPart: 'Core', equipment: 'Bodyweight', targetMuscle: 'Rectus Abdominis', secondaryMuscles: ['Obliques'] },
  { name: 'Pallof Press', bodyPart: 'Core', equipment: 'Band', targetMuscle: 'Obliques', secondaryMuscles: ['Transverse Abdominis'] },
  { name: 'Russian Twist', bodyPart: 'Core', equipment: 'Bodyweight', targetMuscle: 'Obliques', secondaryMuscles: ['Rectus Abdominis'] },
  { name: 'Dead Bug', bodyPart: 'Core', equipment: 'Bodyweight', targetMuscle: 'Transverse Abdominis', secondaryMuscles: ['Rectus Abdominis'] },
  { name: 'Plank', bodyPart: 'Core', equipment: 'Bodyweight', targetMuscle: 'Core', secondaryMuscles: ['Shoulders', 'Glutes'] },
  // Cardio
  { name: 'Burpees', bodyPart: 'Cardio', equipment: 'Bodyweight', targetMuscle: 'Full Body', secondaryMuscles: [] },
  { name: 'Kettlebell Swings', bodyPart: 'Cardio', equipment: 'Kettlebell', targetMuscle: 'Posterior Chain', secondaryMuscles: ['Core', 'Shoulders'] },
  { name: 'Box Jumps', bodyPart: 'Cardio', equipment: 'Bodyweight', targetMuscle: 'Quadriceps', secondaryMuscles: ['Glutes', 'Calves'] },
  { name: 'Battle Ropes', bodyPart: 'Cardio', equipment: 'Bodyweight', targetMuscle: 'Full Body', secondaryMuscles: ['Shoulders', 'Core'] },
  { name: 'Mountain Climbers', bodyPart: 'Cardio', equipment: 'Bodyweight', targetMuscle: 'Core', secondaryMuscles: ['Hip Flexors', 'Shoulders'] },
  { name: 'Jump Rope', bodyPart: 'Cardio', equipment: 'Bodyweight', targetMuscle: 'Calves', secondaryMuscles: ['Cardio Endurance'] },
  { name: 'Rowing Machine', bodyPart: 'Cardio', equipment: 'Machine', targetMuscle: 'Full Body', secondaryMuscles: ['Lats', 'Legs'] },
];

/* ══════════════════════════════════════════════════════════════════
   EXERCISEDB API
   ══════════════════════════════════════════════════════════════════ */
const API_BASE = 'https://exercisedb.dev/api/v1';
const API_PAGE_SIZE = 25;

function capitalize(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function mapApiExercise(ex) {
  return {
    exerciseId: ex.exerciseId,
    name: ex.name || '',
    gifUrl: ex.gifUrl || '',
    bodyPart: (ex.bodyParts && ex.bodyParts[0]) || '',
    bodyParts: ex.bodyParts || [],
    equipment: (ex.equipments && ex.equipments[0]) || '',
    equipments: ex.equipments || [],
    targetMuscle: (ex.targetMuscles && ex.targetMuscles[0]) || '',
    targetMuscles: ex.targetMuscles || [],
    secondaryMuscles: ex.secondaryMuscles || [],
    instructions: ex.instructions || [],
  };
}

/* ── Seed templates ── */
const SEED_TEMPLATES = [
  {
    id: 'WK-SEED-1', name: 'Push Day', targetAreas: ['Upper Body'], difficulty: 'Intermediate', estimatedMinutes: 60,
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '185 lbs', rest: '90s', notes: 'Warm up with 2 light sets first' },
      { name: 'Overhead Press', sets: 4, reps: 8, weight: '115 lbs', rest: '90s', notes: 'Strict form, no leg drive' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '60 lbs', rest: '60s', notes: '30-degree incline' },
      { name: 'Tricep Pushdown', sets: 3, reps: 12, weight: '50 lbs', rest: '45s', notes: 'Squeeze at the bottom' },
      { name: 'Lateral Raises', sets: 4, reps: 15, weight: '20 lbs', rest: '30s', notes: 'Controlled tempo, no swinging' },
    ],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'WK-SEED-2', name: 'Pull Day', targetAreas: ['Upper Body'], difficulty: 'Intermediate', estimatedMinutes: 55,
    exercises: [
      { name: 'Deadlift', sets: 4, reps: 5, weight: '275 lbs', rest: '120s', notes: 'Belt on working sets' },
      { name: 'Barbell Row', sets: 4, reps: 8, weight: '155 lbs', rest: '90s', notes: 'Pull to lower chest' },
      { name: 'Pull-ups', sets: 3, reps: 10, weight: 'Bodyweight', rest: '60s', notes: 'Full ROM, dead hang at bottom' },
      { name: 'Face Pulls', sets: 3, reps: 15, weight: '30 lbs', rest: '45s', notes: 'Rope attachment, external rotate' },
      { name: 'Barbell Curl', sets: 3, reps: 12, weight: '65 lbs', rest: '45s', notes: 'EZ bar variant OK' },
    ],
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'WK-SEED-3', name: 'Leg Day', targetAreas: ['Lower Body'], difficulty: 'Intermediate', estimatedMinutes: 65,
    exercises: [
      { name: 'Back Squat', sets: 5, reps: 5, weight: '225 lbs', rest: '120s', notes: 'Below parallel' },
      { name: 'Romanian Deadlift', sets: 4, reps: 8, weight: '185 lbs', rest: '90s', notes: 'Feel the hamstring stretch' },
      { name: 'Leg Press', sets: 3, reps: 12, weight: '360 lbs', rest: '60s', notes: 'Feet shoulder width' },
      { name: 'Walking Lunges', sets: 3, reps: 12, weight: '40 lbs', rest: '60s', notes: 'Per leg, DB in each hand' },
      { name: 'Calf Raises', sets: 4, reps: 15, weight: '180 lbs', rest: '30s', notes: 'Pause at top and bottom' },
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'WK-SEED-4', name: 'Full Body HIIT', targetAreas: ['Full Body', 'Cardio'], difficulty: 'Advanced', estimatedMinutes: 40,
    exercises: [
      { name: 'Burpees', sets: 4, reps: 15, weight: 'Bodyweight', rest: '30s', notes: 'Max intensity' },
      { name: 'Kettlebell Swings', sets: 4, reps: 20, weight: '53 lbs', rest: '30s', notes: 'Russian style, hip hinge' },
      { name: 'Box Jumps', sets: 4, reps: 12, weight: 'Bodyweight', rest: '30s', notes: '24-inch box, step down' },
      { name: 'Battle Ropes', sets: 4, reps: 30, weight: 'Bodyweight', rest: '30s', notes: '30 seconds per set' },
      { name: 'Mountain Climbers', sets: 4, reps: 30, weight: 'Bodyweight', rest: '30s', notes: 'Fast pace, core tight' },
    ],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'WK-SEED-5', name: 'Beginner Full Body', targetAreas: ['Full Body'], difficulty: 'Beginner', estimatedMinutes: 45,
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: 10, weight: '25 lbs', rest: '60s', notes: 'Hold KB at chest, sit back' },
      { name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: '25 lbs', rest: '60s', notes: 'Focus on control' },
      { name: 'Dumbbell Row', sets: 3, reps: 10, weight: '20 lbs', rest: '60s', notes: 'One arm at a time, bench support' },
      { name: 'Plank', sets: 3, reps: 30, weight: 'Bodyweight', rest: '45s', notes: '30 seconds hold per set' },
      { name: 'Step-ups', sets: 3, reps: 10, weight: 'Bodyweight', rest: '45s', notes: 'Per leg, use bench height' },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'WK-SEED-6', name: 'Core Crusher', targetAreas: ['Core'], difficulty: 'Intermediate', estimatedMinutes: 30,
    exercises: [
      { name: 'Hanging Leg Raise', sets: 3, reps: 12, weight: 'Bodyweight', rest: '45s', notes: 'Controlled, no swinging' },
      { name: 'Ab Rollout', sets: 3, reps: 10, weight: 'Bodyweight', rest: '45s', notes: 'Full extension, slow return' },
      { name: 'Pallof Press', sets: 3, reps: 12, weight: '20 lbs', rest: '45s', notes: 'Per side, resist rotation' },
      { name: 'Russian Twist', sets: 3, reps: 20, weight: '15 lbs', rest: '30s', notes: 'Feet elevated, touch floor each side' },
      { name: 'Dead Bug', sets: 3, reps: 12, weight: 'Bodyweight', rest: '30s', notes: 'Per side, keep lower back pressed down' },
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function ensureSeedData() {
  const existing = getWorkouts();
  if (existing.length === 0) {
    setWorkouts(SEED_TEMPLATES);
  }
}

/* ── Color mappings ── */
const BODY_PART_COLORS = {
  Chest: { bg: '#FEE2E2', text: '#B91C1C' },
  Back: { bg: '#DBEAFE', text: '#1D4ED8' },
  Shoulders: { bg: '#FDE68A', text: '#92400E' },
  Arms: { bg: '#E9D5FF', text: '#6D28D9' },
  Legs: { bg: '#D1FAE5', text: '#065F46' },
  Core: { bg: '#FFEDD5', text: '#C2410C' },
  Cardio: { bg: '#FCE7F3', text: '#9D174D' },
};

const BODY_PART_GRADIENTS = {
  Chest: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A24 100%)',
  Back: 'linear-gradient(135deg, #74B9FF 0%, #0984E3 100%)',
  Shoulders: 'linear-gradient(135deg, #FDCB6E 0%, #F39C12 100%)',
  Arms: 'linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%)',
  Legs: 'linear-gradient(135deg, #55E6C1 0%, #1ABC9C 100%)',
  Core: 'linear-gradient(135deg, #E17055 0%, #D63031 100%)',
  Cardio: 'linear-gradient(135deg, #FDA7DF 0%, #D980FA 100%)',
};

const BODY_PART_ICONS = {
  Chest: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 4C7 4 3 8 3 12c0 2 1 4 3 5l2-3h8l2 3c2-1 3-3 3-5 0-4-4-8-9-8z"/>
    </svg>
  ),
  Back: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2v20M8 6l4 2 4-2M8 10l4 2 4-2M8 14l4 2 4-2"/>
    </svg>
  ),
  Shoulders: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 16c0-6 4-10 8-10s8 4 8 10"/><circle cx="12" cy="8" r="2"/>
    </svg>
  ),
  Arms: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 20l3-8-3-6M17 20l-3-8 3-6"/>
    </svg>
  ),
  Legs: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <path d="M10 4v8l-3 8M14 4v8l3 8"/>
    </svg>
  ),
  Core: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <rect x="6" y="4" width="12" height="16" rx="2"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/><line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  Cardio: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
};

const TARGET_AREA_OPTIONS = ['Upper Body', 'Lower Body', 'Full Body', 'Core', 'Cardio'];
const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const REST_OPTIONS = ['30s', '45s', '60s', '90s', '120s'];
const BODY_PART_FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];
const EQUIPMENT_FILTERS = ['All', 'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Bodyweight', 'Machine', 'Band'];

const DIFFICULTY_COLORS = {
  Beginner: { bg: '#D1FAE5', text: '#065F46' },
  Intermediate: { bg: '#FEF3C7', text: '#92400E' },
  Advanced: { bg: '#FEE2E2', text: '#B91C1C' },
};

/* ══════════════════════════════════════════════════════════════════
   EXERCISE IMAGE — with loading skeleton + error fallback
   ══════════════════════════════════════════════════════════════════ */
function ExerciseImage({ gifUrl, gradient, icon }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div style={{
        height: 160, background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ opacity: 0.35, position: 'absolute', right: -8, bottom: -8, transform: 'scale(3)' }}>
          {icon}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: 160, borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#E5E7EB',
          animation: 'wbPulse 1.5s ease-in-out infinite',
        }} />
      )}
      <img
        src={gifUrl}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: '100%', height: 160, objectFit: 'cover',
          borderRadius: '12px 12px 0 0',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function WorkoutBuilder() {
  const s = useStyles();
  const [view, setView] = useState('templates'); // 'templates' | 'library'
  const [workouts, setWorkoutsState] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [showAssign, setShowAssign] = useState(null); // workoutId
  const [assignClient, setAssignClient] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Library state
  const [libSearch, setLibSearch] = useState('');
  const [libBodyPart, setLibBodyPart] = useState('All');
  const [libEquipment, setLibEquipment] = useState('All');

  // API state
  const [apiExercises, setApiExercises] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiPage, setApiPage] = useState(0);
  const [apiTotalExercises, setApiTotalExercises] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(0);
  const [apiBodyParts, setApiBodyParts] = useState([]);
  const [apiEquipments, setApiEquipments] = useState([]);
  const [detailExercise, setDetailExercise] = useState(null);
  const searchTimerRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Builder state
  const [bName, setBName] = useState('');
  const [bTargetAreas, setBTargetAreas] = useState([]);
  const [bDifficulty, setBDifficulty] = useState('Intermediate');
  const [bMinutes, setBMinutes] = useState(60);
  const [bExercises, setBExercises] = useState([]);

  useEffect(() => {
    ensureSeedData();
    setWorkoutsState(getWorkouts());
  }, []);

  const refresh = () => setWorkoutsState(getWorkouts());

  // Debounce search input (skip initial mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(libSearch);
      setApiPage(0);
      setApiExercises([]);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [libSearch]);

  // Reset pagination when filters change
  useEffect(() => {
    setApiPage(0);
    setApiExercises([]);
  }, [libBodyPart, libEquipment]);

  // Fetch body parts and equipment lists on mount
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const [bpRes, eqRes] = await Promise.all([
          fetch(`${API_BASE}/bodyparts`),
          fetch(`${API_BASE}/equipments`),
        ]);
        if (bpRes.ok) {
          const bpData = await bpRes.json();
          if (bpData.success && Array.isArray(bpData.data)) {
            setApiBodyParts(bpData.data);
          }
        }
        if (eqRes.ok) {
          const eqData = await eqRes.json();
          if (eqData.success && Array.isArray(eqData.data)) {
            setApiEquipments(eqData.data);
          }
        }
      } catch (err) {
        // Silently fail — we have hardcoded fallbacks
      }
    }
    fetchFilterOptions();
  }, []);

  // Fetch exercises from API
  const fetchExercises = useCallback(async (page, append = false) => {
    setApiLoading(true);
    setApiError(null);
    try {
      let url;
      const offset = page * API_PAGE_SIZE;

      if (debouncedSearch.trim()) {
        url = `${API_BASE}/exercises/search?q=${encodeURIComponent(debouncedSearch.trim())}&limit=${API_PAGE_SIZE}&offset=${offset}`;
      } else if (libBodyPart !== 'All' && libEquipment !== 'All') {
        // Both filters — use body part endpoint then client-side filter equipment
        url = `${API_BASE}/bodyparts/${encodeURIComponent(libBodyPart.toLowerCase())}/exercises?limit=100&offset=0`;
      } else if (libBodyPart !== 'All') {
        url = `${API_BASE}/bodyparts/${encodeURIComponent(libBodyPart.toLowerCase())}/exercises?limit=${API_PAGE_SIZE}&offset=${offset}`;
      } else if (libEquipment !== 'All') {
        url = `${API_BASE}/equipments/${encodeURIComponent(libEquipment.toLowerCase())}/exercises?limit=${API_PAGE_SIZE}&offset=${offset}`;
      } else {
        url = `${API_BASE}/exercises?limit=${API_PAGE_SIZE}&offset=${offset}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();

      if (!json.success) throw new Error('API returned unsuccessful response');

      let exercises = (json.data || []).map(mapApiExercise);

      // Client-side equipment filter when both filters are active
      if (libBodyPart !== 'All' && libEquipment !== 'All') {
        exercises = exercises.filter(ex =>
          ex.equipments.some(eq => eq.toLowerCase() === libEquipment.toLowerCase())
        );
      }

      const meta = json.metadata || {};
      setApiTotalExercises(meta.totalExercises || exercises.length);
      setApiTotalPages(meta.totalPages || 1);

      if (append) {
        setApiExercises(prev => [...prev, ...exercises]);
      } else {
        setApiExercises(exercises);
      }
    } catch (err) {
      setApiError(err.message);
      if (!append) setApiExercises([]);
    } finally {
      setApiLoading(false);
    }
  }, [debouncedSearch, libBodyPart, libEquipment]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchExercises(apiPage, apiPage > 0);
  }, [fetchExercises, apiPage]);

  const handleLoadMore = () => {
    setApiPage(prev => prev + 1);
  };

  const glass = {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
  };

  /* ── Builder helpers ── */
  const openBuilder = (workout = null) => {
    if (workout) {
      setEditingWorkout(workout);
      setBName(workout.name);
      setBTargetAreas([...workout.targetAreas]);
      setBDifficulty(workout.difficulty);
      setBMinutes(workout.estimatedMinutes);
      setBExercises(workout.exercises.map((e, i) => ({ ...e, _key: i })));
    } else {
      setEditingWorkout(null);
      setBName('');
      setBTargetAreas([]);
      setBDifficulty('Intermediate');
      setBMinutes(60);
      setBExercises([]);
    }
    setShowBuilder(true);
  };

  const addExerciseRow = (name = '') => {
    setBExercises(prev => [...prev, {
      _key: Date.now() + Math.random(),
      name: name,
      sets: 3,
      reps: 10,
      weight: '',
      rest: '60s',
      notes: '',
    }]);
  };

  const updateExerciseRow = (idx, field, value) => {
    setBExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const removeExerciseRow = (idx) => {
    setBExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const moveExercise = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= bExercises.length) return;
    setBExercises(prev => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const saveWorkout = () => {
    if (!bName.trim()) return;
    const data = {
      name: bName.trim(),
      targetAreas: bTargetAreas,
      difficulty: bDifficulty,
      estimatedMinutes: parseInt(bMinutes) || 60,
      exercises: bExercises.map(({ _key, ...rest }) => rest),
    };
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, data);
    } else {
      addWorkout(data);
    }
    setShowBuilder(false);
    refresh();
  };

  const handleDelete = (id) => {
    deleteWorkout(id);
    setExpandedId(null);
    refresh();
  };

  const handleAssign = () => {
    if (!assignClient || !showAssign) return;
    const clients = getPatients();
    const client = clients.find(c => c.id === assignClient);
    addAssignment({
      workoutId: showAssign,
      workoutName: workouts.find(w => w.id === showAssign)?.name || '',
      clientId: assignClient,
      clientName: client ? `${client.firstName} ${client.lastName}` : '',
      startDate: assignDate,
    });
    setAssignSuccess(true);
    setTimeout(() => {
      setShowAssign(null);
      setAssignClient('');
      setAssignSuccess(false);
    }, 1500);
  };

  /* ── Filtered library (API with local fallback) ── */
  const filteredLocalLibrary = useMemo(() => {
    return EXERCISE_LIBRARY.filter(ex => {
      if (libBodyPart !== 'All' && ex.bodyPart !== libBodyPart) return false;
      if (libEquipment !== 'All' && ex.equipment !== libEquipment) return false;
      if (libSearch && !ex.name.toLowerCase().includes(libSearch.toLowerCase()) && !ex.targetMuscle.toLowerCase().includes(libSearch.toLowerCase())) return false;
      return true;
    });
  }, [libSearch, libBodyPart, libEquipment]);

  // Use API data when available, fall back to local
  const displayExercises = apiExercises.length > 0 ? apiExercises : filteredLocalLibrary;

  // Dynamic filter lists (API with fallback)
  const bodyPartFilters = useMemo(() => {
    if (apiBodyParts.length > 0) return ['All', ...apiBodyParts.map(bp => capitalize(bp))];
    return BODY_PART_FILTERS;
  }, [apiBodyParts]);

  const equipmentFilters = useMemo(() => {
    if (apiEquipments.length > 0) return ['All', ...apiEquipments.map(eq => capitalize(eq))];
    return EQUIPMENT_FILTERS;
  }, [apiEquipments]);

  const clients = getPatients();

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ═══ HEADER ═══ */}
      <div style={{
        ...glass,
        padding: '28px 32px',
        marginBottom: 28,
        background: `linear-gradient(135deg, rgba(255,255,255,0.75) 0%, ${s.accentLight} 100%)`,
        borderLeft: `3px solid ${s.accent}`,
        animation: 'wbFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.3px', margin: 0 }}>
              Workout Builder
            </h1>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, margin: '4px 0 0' }}>
              Create and assign workout programs to your clients
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => openBuilder()} style={{ ...s.pillAccent }}>
              + Create Workout
            </button>
          </div>
        </div>
      </div>

      {/* ═══ VIEW TOGGLE ═══ */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24,
        animation: 'wbFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 80ms backwards',
      }}>
        {[
          { key: 'templates', label: 'Templates', count: workouts.length },
          { key: 'library', label: 'Exercise Library', count: apiTotalExercises || displayExercises.length || EXERCISE_LIBRARY.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{
            ...(view === tab.key ? s.pillAccent : s.pillGhost),
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tab.label}
            <span style={{
              padding: '1px 8px', borderRadius: 100, fontSize: 11,
              background: view === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
              color: view === tab.key ? s.accentText : s.text3,
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════ TEMPLATES VIEW ═══════════════════════ */}
      {view === 'templates' && (
        <div className="wb-template-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18,
        }}>
          {workouts.map((w, idx) => {
            const isExpanded = expandedId === w.id;
            return (
              <div key={w.id} className="wb-card-hover" style={{
                ...glass,
                padding: 0, overflow: 'hidden', cursor: 'pointer',
                animation: `wbFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${160 + idx * 60}ms backwards`,
                ...(isExpanded ? { gridColumn: '1 / -1' } : {}),
              }}>
                {/* Card header */}
                <div onClick={() => setExpandedId(isExpanded ? null : w.id)} style={{ padding: '22px 24px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, margin: 0, marginBottom: 8 }}>{w.name}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {w.targetAreas.map(area => (
                          <span key={area} style={{
                            padding: '3px 10px', borderRadius: 100,
                            font: `500 11px ${s.FONT}`,
                            background: area === 'Upper Body' ? '#DBEAFE' : area === 'Lower Body' ? '#D1FAE5' : area === 'Full Body' ? '#E9D5FF' : area === 'Core' ? '#FFEDD5' : '#FCE7F3',
                            color: area === 'Upper Body' ? '#1D4ED8' : area === 'Lower Body' ? '#065F46' : area === 'Full Body' ? '#6D28D9' : area === 'Core' ? '#C2410C' : '#9D174D',
                          }}>{area}</span>
                        ))}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 100,
                      font: `500 11px ${s.FONT}`,
                      background: DIFFICULTY_COLORS[w.difficulty]?.bg || '#F3F4F6',
                      color: DIFFICULTY_COLORS[w.difficulty]?.text || '#374151',
                    }}>{w.difficulty}</span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round">
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
                      </svg>
                      <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{w.exercises.length} exercises</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{w.estimatedMinutes} min</span>
                    </div>
                  </div>
                </div>

                {/* Expanded exercise list */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid rgba(0,0,0,0.04)',
                    animation: 'wbFadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)',
                  }}>
                    {/* Exercise header */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.6fr 1fr 0.6fr',
                      gap: 8, padding: '10px 24px',
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                    }}>
                      {['Exercise', 'Sets', 'Reps', 'Weight', 'Rest'].map(h => (
                        <span key={h} style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3 }}>{h}</span>
                      ))}
                    </div>
                    {w.exercises.map((ex, ei) => (
                      <div key={ei} className="wb-exercise-row" style={{
                        display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.6fr 1fr 0.6fr',
                        gap: 8, padding: '12px 24px',
                        borderBottom: ei < w.exercises.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none',
                        transition: 'background 0.15s',
                      }}>
                        <div>
                          <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{ex.name}</span>
                          {ex.notes && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{ex.notes}</div>}
                        </div>
                        <span style={{ font: `500 14px ${s.MONO}`, color: s.text }}>{ex.sets}</span>
                        <span style={{ font: `500 14px ${s.MONO}`, color: s.text }}>{ex.reps}</span>
                        <span style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>{ex.weight || '---'}</span>
                        <span style={{ font: `400 13px ${s.MONO}`, color: s.text2 }}>{ex.rest}</span>
                      </div>
                    ))}
                    {/* Actions */}
                    <div style={{
                      padding: '14px 24px', display: 'flex', gap: 10,
                      borderTop: '1px solid rgba(0,0,0,0.04)',
                      background: 'rgba(0,0,0,0.01)',
                    }}>
                      <button onClick={(e) => { e.stopPropagation(); setShowAssign(w.id); setAssignClient(''); }} style={s.pillAccent}>
                        Assign to Client
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openBuilder(w); }} style={s.pillOutline}>
                        Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(w.id); }} style={{
                        ...s.pillGhost, color: s.danger, borderColor: `${s.danger}30`,
                      }}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {workouts.length === 0 && (
            <div style={{ ...glass, padding: 60, textAlign: 'center', gridColumn: '1 / -1' }}>
              <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, marginBottom: 16 }}>No workout templates yet</div>
              <button onClick={() => openBuilder()} style={s.pillAccent}>Create Your First Workout</button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ EXERCISE LIBRARY VIEW ═══════════════════════ */}
      {view === 'library' && (
        <div>
          {/* Search + Filters */}
          <div style={{
            ...glass, padding: '20px 24px', marginBottom: 20,
            animation: 'wbFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 160ms backwards',
          }}>
            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text" placeholder="Search exercises..."
                value={libSearch} onChange={e => setLibSearch(e.target.value)}
                style={{ ...s.input, maxWidth: 400 }}
              />
            </div>
            {/* Body part filter */}
            <div style={{ marginBottom: 12 }}>
              <span style={s.label}>Body Part</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bodyPartFilters.map(bp => (
                  <button key={bp} onClick={() => setLibBodyPart(bp)} style={{
                    ...(libBodyPart === bp ? s.pillAccent : s.pillGhost),
                    padding: '6px 14px', fontSize: 12,
                  }}>{bp}</button>
                ))}
              </div>
            </div>
            {/* Equipment filter */}
            <div>
              <span style={s.label}>Equipment</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {equipmentFilters.map(eq => (
                  <button key={eq} onClick={() => setLibEquipment(eq)} style={{
                    ...(libEquipment === eq ? s.pillAccent : s.pillGhost),
                    padding: '6px 14px', fontSize: 12,
                  }}>{eq}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Results count + loading indicator */}
          <div style={{
            font: `400 13px ${s.FONT}`, color: s.text3, marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'wbFadeInUp 0.3s ease 200ms backwards',
          }}>
            {apiLoading && apiPage === 0 ? (
              <>
                <div style={{
                  width: 16, height: 16, border: `2px solid ${s.accent}30`, borderTopColor: s.accent,
                  borderRadius: '50%', animation: 'wbSpin 0.8s linear infinite',
                }} />
                Loading exercises...
              </>
            ) : (
              <>
                {apiError && <span style={{ color: '#D97706' }}>API unavailable — showing local exercises. </span>}
                {displayExercises.length} exercise{displayExercises.length !== 1 ? 's' : ''} found
                {apiTotalExercises > 0 && !apiError && ` of ${apiTotalExercises} total`}
              </>
            )}
          </div>

          {/* Exercise grid */}
          <div className="wb-library-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16,
          }}>
            {/* Loading skeletons */}
            {apiLoading && apiPage === 0 && displayExercises.length === 0 && (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={`skel-${idx}`} style={{
                  ...glass, overflow: 'hidden',
                  animation: `wbFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 40}ms backwards`,
                }}>
                  <div style={{
                    height: 160, background: '#E5E7EB',
                    animation: 'wbPulse 1.5s ease-in-out infinite',
                    borderRadius: '12px 12px 0 0',
                  }} />
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ height: 16, background: '#E5E7EB', borderRadius: 8, width: '70%', marginBottom: 10, animation: 'wbPulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '50%', marginBottom: 8, animation: 'wbPulse 1.5s ease-in-out infinite 200ms' }} />
                    <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, width: '40%', animation: 'wbPulse 1.5s ease-in-out infinite 400ms' }} />
                  </div>
                </div>
              ))
            )}

            {displayExercises.map((ex, idx) => {
              const bodyPartKey = capitalize(ex.bodyPart || '');
              const colors = BODY_PART_COLORS[bodyPartKey] || { bg: '#F3F4F6', text: '#374151' };
              const gradient = BODY_PART_GRADIENTS[bodyPartKey] || 'linear-gradient(135deg, #B2BEC3, #636E72)';
              const icon = BODY_PART_ICONS[bodyPartKey] || null;
              const hasGif = !!ex.gifUrl;
              return (
                <div key={ex.exerciseId || ex.name || idx} className="wb-lib-card" style={{
                  ...glass, overflow: 'hidden', cursor: 'pointer',
                  animation: `wbFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${240 + (idx % API_PAGE_SIZE) * 30}ms backwards`,
                }} onClick={() => setDetailExercise(ex)}>
                  {/* Image header with GIF or gradient fallback */}
                  {hasGif ? (
                    <ExerciseImage gifUrl={ex.gifUrl} gradient={gradient} icon={icon} />
                  ) : (
                    <div style={{
                      height: 160, background: gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                      borderRadius: '12px 12px 0 0',
                    }}>
                      <div style={{ opacity: 0.35, position: 'absolute', right: -8, bottom: -8, transform: 'scale(3)' }}>
                        {icon}
                      </div>
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        {icon}
                      </div>
                    </div>
                  )}
                  {/* Content */}
                  <div style={{ padding: '16px 18px' }}>
                    <h4 style={{ font: `600 15px ${s.FONT}`, color: s.text, margin: '0 0 8px' }}>{capitalize(ex.name)}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {ex.bodyPart && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 100,
                          font: `500 10px ${s.FONT}`, background: colors.bg, color: colors.text,
                        }}>{capitalize(ex.bodyPart)}</span>
                      )}
                      {(ex.bodyParts || []).slice(1).map(bp => (
                        <span key={bp} style={{
                          padding: '2px 8px', borderRadius: 100,
                          font: `500 10px ${s.FONT}`, background: BODY_PART_COLORS[capitalize(bp)]?.bg || '#F3F4F6', color: BODY_PART_COLORS[capitalize(bp)]?.text || '#374151',
                        }}>{capitalize(bp)}</span>
                      ))}
                      {ex.equipment && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 100,
                          font: `500 10px ${s.FONT}`, background: '#F3F4F6', color: '#374151',
                        }}>{capitalize(ex.equipment)}</span>
                      )}
                      {(ex.equipments || []).slice(1).map(eq => (
                        <span key={eq} style={{
                          padding: '2px 8px', borderRadius: 100,
                          font: `500 10px ${s.FONT}`, background: '#F3F4F6', color: '#374151',
                        }}>{capitalize(eq)}</span>
                      ))}
                    </div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginBottom: 4 }}>
                      Target: {capitalize(ex.targetMuscle)}
                    </div>
                    {ex.secondaryMuscles && ex.secondaryMuscles.length > 0 && (
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>
                        Secondary: {ex.secondaryMuscles.map(m => capitalize(m)).join(', ')}
                      </div>
                    )}
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const exName = capitalize(ex.name);
                      if (!showBuilder) {
                        openBuilder();
                        setTimeout(() => addExerciseRow(exName), 100);
                      } else {
                        addExerciseRow(exName);
                      }
                    }} style={{
                      ...s.pillOutline, width: '100%', marginTop: 12, padding: '8px 14px',
                      textAlign: 'center', fontSize: 12,
                    }}>
                      + Add to Workout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More button */}
          {!apiError && apiTotalExercises > 0 && displayExercises.length < apiTotalExercises && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={handleLoadMore} disabled={apiLoading} style={{
                ...s.pillOutline,
                padding: '12px 32px', fontSize: 14,
                display: 'inline-flex', alignItems: 'center', gap: 10,
                opacity: apiLoading ? 0.6 : 1,
              }}>
                {apiLoading && apiPage > 0 ? (
                  <>
                    <div style={{
                      width: 14, height: 14, border: `2px solid ${s.accent}30`, borderTopColor: s.accent,
                      borderRadius: '50%', animation: 'wbSpin 0.8s linear infinite',
                    }} />
                    Loading...
                  </>
                ) : (
                  `Load More (${displayExercises.length} of ${apiTotalExercises})`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ EXERCISE DETAIL MODAL ═══════════════════════ */}
      {detailExercise && (
        <div className="wb-modal-overlay" onClick={() => setDetailExercise(null)} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 20px', overflowY: 'auto',
        }}>
          <div className="wb-modal-content" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 560,
            background: '#fff', borderRadius: 20,
            boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            {/* GIF */}
            {detailExercise.gifUrl ? (
              <img
                src={detailExercise.gifUrl}
                alt={detailExercise.name}
                style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                }}
              />
            ) : null}
            <div style={{
              height: 300,
              background: BODY_PART_GRADIENTS[capitalize(detailExercise.bodyPart)] || 'linear-gradient(135deg, #B2BEC3, #636E72)',
              display: detailExercise.gifUrl ? 'none' : 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {BODY_PART_ICONS[capitalize(detailExercise.bodyPart)] || null}
            </div>

            {/* Content */}
            <div style={{ padding: '24px 28px' }}>
              {/* Close button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h2 style={{ font: `600 22px ${s.FONT}`, color: s.text, margin: 0 }}>
                  {capitalize(detailExercise.name)}
                </h2>
                <button onClick={() => setDetailExercise(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: s.text3, padding: 4,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Pills: target muscles, body parts, equipment */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {(detailExercise.targetMuscles || [detailExercise.targetMuscle]).filter(Boolean).map(m => (
                  <span key={m} style={{
                    padding: '4px 12px', borderRadius: 100,
                    font: `500 12px ${s.FONT}`, background: '#DBEAFE', color: '#1D4ED8',
                  }}>{capitalize(m)}</span>
                ))}
                {(detailExercise.bodyParts || [detailExercise.bodyPart]).filter(Boolean).map(bp => (
                  <span key={bp} style={{
                    padding: '4px 12px', borderRadius: 100,
                    font: `500 12px ${s.FONT}`,
                    background: BODY_PART_COLORS[capitalize(bp)]?.bg || '#F3F4F6',
                    color: BODY_PART_COLORS[capitalize(bp)]?.text || '#374151',
                  }}>{capitalize(bp)}</span>
                ))}
                {(detailExercise.equipments || [detailExercise.equipment]).filter(Boolean).map(eq => (
                  <span key={eq} style={{
                    padding: '4px 12px', borderRadius: 100,
                    font: `500 12px ${s.FONT}`, background: '#F3F4F6', color: '#374151',
                  }}>{capitalize(eq)}</span>
                ))}
              </div>

              {/* Secondary muscles */}
              {detailExercise.secondaryMuscles && detailExercise.secondaryMuscles.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ font: `500 12px ${s.FONT}`, color: s.text2 }}>Secondary Muscles: </span>
                  <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                    {detailExercise.secondaryMuscles.map(m => capitalize(m)).join(', ')}
                  </span>
                </div>
              )}

              {/* Instructions */}
              {detailExercise.instructions && detailExercise.instructions.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ font: `600 14px ${s.FONT}`, color: s.text, margin: '0 0 12px' }}>Instructions</h4>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {detailExercise.instructions.map((step, i) => (
                      <li key={i} style={{
                        font: `400 13px/1.6 ${s.FONT}`, color: s.text2,
                        marginBottom: 8,
                      }}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Add to Workout button */}
              <button onClick={() => {
                const exName = capitalize(detailExercise.name);
                setDetailExercise(null);
                if (!showBuilder) {
                  openBuilder();
                  setTimeout(() => addExerciseRow(exName), 100);
                } else {
                  addExerciseRow(exName);
                }
              }} style={{
                ...s.pillAccent, width: '100%', padding: '12px 20px',
                textAlign: 'center', fontSize: 14,
              }}>
                + Add to Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ BUILDER MODAL ═══════════════════════ */}
      {showBuilder && (
        <div className="wb-modal-overlay" onClick={() => setShowBuilder(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 20px', overflowY: 'auto',
        }}>
          <div className="wb-modal-content" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 820,
            background: '#fff', borderRadius: 20,
            boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: `linear-gradient(135deg, #fff 0%, ${s.accentLight} 100%)`,
            }}>
              <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, margin: 0 }}>
                {editingWorkout ? 'Edit Workout' : 'Create Workout'}
              </h2>
              <button onClick={() => setShowBuilder(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: s.text3,
                padding: 4,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: '24px 28px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {/* Workout name */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Workout Name</label>
                <input
                  type="text" placeholder="e.g. Push Day, Leg Burner, Full Body A..."
                  value={bName} onChange={e => setBName(e.target.value)}
                  style={s.input}
                />
              </div>

              {/* Target areas */}
              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Target Area</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TARGET_AREA_OPTIONS.map(area => {
                    const active = bTargetAreas.includes(area);
                    return (
                      <button key={area} onClick={() => {
                        setBTargetAreas(prev => active ? prev.filter(a => a !== area) : [...prev, area]);
                      }} style={{
                        ...(active ? s.pillAccent : s.pillGhost),
                      }}>{area}</button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty + Duration row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={s.label}>Difficulty</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {DIFFICULTY_OPTIONS.map(d => (
                      <button key={d} onClick={() => setBDifficulty(d)} style={{
                        ...(bDifficulty === d ? s.pillAccent : s.pillGhost),
                        fontSize: 12, padding: '7px 14px',
                      }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={s.label}>Est. Duration (minutes)</label>
                  <input
                    type="number" value={bMinutes} onChange={e => setBMinutes(e.target.value)}
                    style={{ ...s.input, maxWidth: 120 }}
                  />
                </div>
              </div>

              {/* Exercises */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ ...s.label, margin: 0 }}>Exercises</label>
                  <span style={{ font: `400 12px ${s.FONT}`, color: s.text3 }}>
                    {bExercises.length} exercise{bExercises.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {bExercises.length > 0 && (
                  <div style={{
                    border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.5)',
                  }}>
                    {bExercises.map((ex, idx) => (
                      <div key={ex._key} style={{
                        padding: '14px 16px',
                        borderBottom: idx < bExercises.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                      }}>
                        {/* Row 1: Name + order + delete */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: 8,
                            background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            font: `600 11px ${s.MONO}`, color: s.accent, flexShrink: 0,
                          }}>{idx + 1}</span>
                          <input
                            type="text" placeholder="Exercise name"
                            value={ex.name} onChange={e => updateExerciseRow(idx, 'name', e.target.value)}
                            style={{ ...s.input, flex: 1, padding: '8px 12px', fontSize: 14, fontWeight: 500 }}
                          />
                          <button onClick={() => moveExercise(idx, -1)} disabled={idx === 0} style={{
                            background: 'none', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8,
                            width: 28, height: 28, cursor: idx === 0 ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: idx === 0 ? 0.3 : 1, transition: 'opacity 0.15s',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.text2} strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                          </button>
                          <button onClick={() => moveExercise(idx, 1)} disabled={idx === bExercises.length - 1} style={{
                            background: 'none', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8,
                            width: 28, height: 28, cursor: idx === bExercises.length - 1 ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: idx === bExercises.length - 1 ? 0.3 : 1, transition: 'opacity 0.15s',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.text2} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <button onClick={() => removeExerciseRow(idx)} style={{
                            background: 'none', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8,
                            width: 28, height: 28, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.danger} strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                        {/* Row 2: Sets, Reps, Weight, Rest */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div>
                            <span style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, display: 'block', marginBottom: 4 }}>Sets</span>
                            <input type="number" value={ex.sets} onChange={e => updateExerciseRow(idx, 'sets', parseInt(e.target.value) || 0)}
                              style={{ ...s.input, padding: '6px 10px', fontSize: 13, textAlign: 'center' }} />
                          </div>
                          <div>
                            <span style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, display: 'block', marginBottom: 4 }}>Reps</span>
                            <input type="number" value={ex.reps} onChange={e => updateExerciseRow(idx, 'reps', parseInt(e.target.value) || 0)}
                              style={{ ...s.input, padding: '6px 10px', fontSize: 13, textAlign: 'center' }} />
                          </div>
                          <div>
                            <span style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, display: 'block', marginBottom: 4 }}>Weight</span>
                            <input type="text" placeholder="135 lbs" value={ex.weight} onChange={e => updateExerciseRow(idx, 'weight', e.target.value)}
                              style={{ ...s.input, padding: '6px 10px', fontSize: 13 }} />
                          </div>
                          <div>
                            <span style={{ font: `500 9px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, display: 'block', marginBottom: 4 }}>Rest</span>
                            <select value={ex.rest} onChange={e => updateExerciseRow(idx, 'rest', e.target.value)}
                              style={{ ...s.input, padding: '6px 10px', fontSize: 13, appearance: 'auto' }}>
                              {REST_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </div>
                        {/* Row 3: Notes */}
                        <input type="text" placeholder="Notes (optional)" value={ex.notes}
                          onChange={e => updateExerciseRow(idx, 'notes', e.target.value)}
                          style={{ ...s.input, padding: '6px 10px', fontSize: 12, color: s.text2 }} />
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => addExerciseRow()} style={{
                  ...s.pillOutline, marginTop: 12, width: '100%', textAlign: 'center',
                  padding: '12px 20px',
                }}>
                  + Add Exercise
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 28px', borderTop: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              background: 'rgba(0,0,0,0.015)',
            }}>
              <button onClick={() => setShowBuilder(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={saveWorkout} disabled={!bName.trim()} style={{
                ...s.pillAccent,
                opacity: bName.trim() ? 1 : 0.5,
                cursor: bName.trim() ? 'pointer' : 'default',
              }}>
                {editingWorkout ? 'Save Changes' : 'Save Workout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ ASSIGN MODAL ═══════════════════════ */}
      {showAssign && (
        <div className="wb-modal-overlay" onClick={() => { setShowAssign(null); setAssignSuccess(false); }} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div className="wb-modal-content" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 440,
            background: '#fff', borderRadius: 20,
            boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, margin: 0 }}>Assign to Client</h2>
              <button onClick={() => { setShowAssign(null); setAssignSuccess(false); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: s.text3,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {assignSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{ font: `600 16px ${s.FONT}`, color: s.text }}>Workout Assigned!</div>
                  <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginTop: 4 }}>The workout has been assigned successfully.</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 8, font: `500 13px ${s.FONT}`, color: s.text }}>
                    Assigning: <span style={{ color: s.accent }}>{workouts.find(w => w.id === showAssign)?.name}</span>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={s.label}>Client</label>
                    <select value={assignClient} onChange={e => setAssignClient(e.target.value)}
                      style={{ ...s.input, appearance: 'auto' }}>
                      <option value="">Select a client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={s.label}>Start Date</label>
                    <input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)}
                      style={s.input} />
                  </div>
                </>
              )}
            </div>

            {!assignSuccess && (
              <div style={{
                padding: '16px 28px', borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                background: 'rgba(0,0,0,0.015)',
              }}>
                <button onClick={() => setShowAssign(null)} style={s.pillGhost}>Cancel</button>
                <button onClick={handleAssign} disabled={!assignClient} style={{
                  ...s.pillAccent,
                  opacity: assignClient ? 1 : 0.5,
                  cursor: assignClient ? 'pointer' : 'default',
                }}>
                  Assign Workout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .wb-template-grid {
            grid-template-columns: 1fr !important;
          }
          .wb-library-grid {
            grid-template-columns: 1fr !important;
          }
          .wb-modal-content {
            max-width: 100% !important;
            width: 100% !important;
            min-height: 100vh;
            border-radius: 0 !important;
          }
          .wb-modal-overlay {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
