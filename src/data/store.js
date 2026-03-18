// Central localStorage store — all CRUD for the Personal Trainer platform
// No backend — everything persists in localStorage for demo purposes

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach(fn => fn()); }

function get(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function set(key, data) { localStorage.setItem(key, JSON.stringify(data)); notify(); }

// ── Clients ──
export function getPatients() { return get('ms_patients', []); }
export function addPatient(p) { const all = getPatients(); p.id = `CLT-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('ms_patients', all); return p; }
export function updatePatient(id, updates) { const all = getPatients().map(p => p.id === id ? { ...p, ...updates } : p); set('ms_patients', all); }
export function deletePatient(id) { set('ms_patients', getPatients().filter(p => p.id !== id)); }
export function getPatient(id) { return getPatients().find(p => p.id === id) || null; }

// ── Sessions (Appointments) ──
export function getAppointments() { return get('ms_appointments', []); }
export function addAppointment(a) { const all = getAppointments(); a.id = `SES-${Date.now()}`; a.createdAt = new Date().toISOString(); all.push(a); set('ms_appointments', all); return a; }
export function updateAppointment(id, updates) { set('ms_appointments', getAppointments().map(a => a.id === id ? { ...a, ...updates } : a)); }
export function deleteAppointment(id) { set('ms_appointments', getAppointments().filter(a => a.id !== id)); }

// ── Training Programs ──
export function getClassPackages() { return get('ms_class_packages', []); }
export function addClassPackage(t) { const all = getClassPackages(); t.id = `TP-${Date.now()}`; t.createdAt = new Date().toISOString(); all.unshift(t); set('ms_class_packages', all); return t; }
export function updateClassPackage(id, updates) { set('ms_class_packages', getClassPackages().map(t => t.id === id ? { ...t, ...updates } : t)); }
export function deleteClassPackage(id) { set('ms_class_packages', getClassPackages().filter(t => t.id !== id)); }

// ── Inventory ──
export function getInventory() { return get('ms_inventory', []); }
export function addInventoryItem(item) { const all = getInventory(); item.id = `INV-${Date.now()}`; item.createdAt = new Date().toISOString(); all.unshift(item); set('ms_inventory', all); return item; }
export function updateInventoryItem(id, updates) { set('ms_inventory', getInventory().map(i => i.id === id ? { ...i, ...updates } : i)); }
export function adjustStock(id, qty, reason) {
  const delta = parseFloat(qty) || 0;
  const all = getInventory().map(i => {
    if (i.id === id) {
      const log = i.adjustmentLog || [];
      log.push({ qty: delta, reason, date: new Date().toISOString() });
      return { ...i, quantity: Math.max(0, parseFloat(i.quantity) + delta), adjustmentLog: log };
    }
    return i;
  });
  set('ms_inventory', all);
}

// ── Emails ──
export function getEmails() { return get('ms_emails', []); }
export function addEmail(e) { const all = getEmails(); e.id = `EM-${Date.now()}`; e.sentDate = new Date().toISOString(); all.unshift(e); set('ms_emails', all); return e; }

// ── Text Messages (SMS) ──
export function getTextMessages() { return get('ms_texts', []); }
export function addTextMessage(t) { const all = getTextMessages(); t.id = `TXT-${Date.now()}`; t.sentDate = new Date().toISOString(); all.unshift(t); set('ms_texts', all); return t; }

// ── Social Media Posts ──
export function getSocialPosts() { return get('ms_social_posts', []); }
export function addSocialPost(p) { const all = getSocialPosts(); p.id = `SP-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('ms_social_posts', all); return p; }
export function updateSocialPost(id, updates) { set('ms_social_posts', getSocialPosts().map(p => p.id === id ? { ...p, ...updates } : p)); }
export function deleteSocialPost(id) { set('ms_social_posts', getSocialPosts().filter(p => p.id !== id)); }

// ── Retention Alerts ──
export function getRetentionAlerts() { return get('ms_retention_alerts', []); }
export function updateRetentionAlert(id, updates) { set('ms_retention_alerts', getRetentionAlerts().map(a => a.id === id ? { ...a, ...updates } : a)); }

// ── Services (Session Types) ──
export function getServices() { return get('ms_services', []); }
export function addService(s) { const all = getServices(); s.id = `SVC-${Date.now()}`; all.push(s); set('ms_services', all); return s; }
export function updateService(id, updates) { set('ms_services', getServices().map(s => s.id === id ? { ...s, ...updates } : s)); }
export function deleteService(id) { set('ms_services', getServices().filter(s => s.id !== id)); }

// ── Providers (Trainers) ──
export function getProviders() { return get('ms_providers', []); }
export function addProvider(p) { const all = getProviders(); p.id = `TRN-${Date.now()}`; all.push(p); set('ms_providers', all); return p; }
export function updateProvider(id, updates) { set('ms_providers', getProviders().map(p => p.id === id ? { ...p, ...updates } : p)); }

// ── Locations (deprecated — online-only platform) ──
export function getLocations() { return []; }
export function addLocation() { return {}; }

// ── Progress Photos ──
export function getPhotos() { return get('ms_photos', []); }
export function addPhoto(p) { const all = getPhotos(); p.id = `PHT-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('ms_photos', all); return p; }
export function deletePhoto(id) { set('ms_photos', getPhotos().filter(p => p.id !== id)); }

// ── Settings ──
export function getSettings() { return get('ms_settings', {}); }
export function updateSettings(updates) { set('ms_settings', { ...getSettings(), ...updates }); }

// ── Init seed data ──
export function initStore() {
  const alreadyInit = localStorage.getItem('pt_initialized_v1');

  // Clear old pilates data if present
  if (!alreadyInit && localStorage.getItem('ms_initialized')) {
    ['ms_patients','ms_appointments','ms_class_packages','ms_inventory','ms_providers','ms_services','ms_locations','ms_retention_alerts','ms_settings','ms_emails','ms_texts','ms_social_posts','ms_checkins','ms_social_connections','ms_prs'].forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('ms_initialized');
  }

  const today = new Date();
  const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };

  // Always seed missing keys (even if already initialized)
  seedIfEmpty(d, today);

  if (alreadyInit) return;
  const t = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  // Trainers
  set('ms_providers', [
    { id: 'PRV-1', name: 'Marcus Cole', title: 'Head Trainer / Owner', specialties: ['Strength & Conditioning', 'Olympic Lifting', 'Nutrition Coaching', 'Body Recomposition'], color: '#111', certifications: ['NASM-CPT', 'CSCS', 'Precision Nutrition L2'] },
    { id: 'PRV-2', name: 'Jess Rivera', title: 'Senior Trainer', specialties: ['HIIT', 'Fat Loss', 'Functional Training', 'Boxing'], color: '#DC2626', certifications: ['ACE-CPT', 'Kettlebell Specialist'] },
    { id: 'PRV-3', name: 'Derek Okafor', title: 'Strength Coach', specialties: ['Powerlifting', 'Hypertrophy', 'Athletic Performance', 'Olympic Lifting'], color: '#2563EB', certifications: ['NSCA-CSCS', 'USAW L1'] },
    { id: 'PRV-4', name: 'Alana Kim', title: 'Wellness & Mobility Coach', specialties: ['Mobility & Recovery', 'Yoga', 'Corrective Exercise', 'Post-Rehab'], color: '#059669', certifications: ['NASM-CES', 'RYT-200', 'FMS L2'] },
    { id: 'PRV-5', name: 'Trey Washington', title: 'Performance Trainer', specialties: ['Athletic Performance', 'Speed & Agility', 'Boot Camp', 'TRX'], color: '#D97706', certifications: ['ISSA-CPT', 'TRX Certified'] },
    { id: 'PRV-6', name: 'Sofia Reyes', title: 'Nutrition & Fitness Coach', specialties: ['Nutrition Coaching', 'Weight Management', 'Prenatal Fitness', 'Women\'s Strength'], color: '#7C3AED', certifications: ['NASM-CPT', 'Precision Nutrition L1', 'Pre/Postnatal Certified'] },
  ]);

  // Session Types (Services)
  set('ms_services', [
    { id: 'SVC-1', name: '1-on-1 Training', category: 'Private', duration: 60, price: 9500, unit: 'per session', description: 'Personalized one-on-one training session tailored to your goals with full trainer attention' },
    { id: 'SVC-2', name: 'Small Group Training', category: 'Group', duration: 60, price: 4500, unit: 'per person', description: 'Semi-private training in groups of 3-5 for motivation and accountability at a great price' },
    { id: 'SVC-3', name: 'HIIT Session', category: 'Cardio', duration: 45, price: 3500, unit: 'per session', description: 'High-intensity interval training — maximum calorie burn in minimum time' },
    { id: 'SVC-4', name: 'Strength Training', category: 'Strength', duration: 60, price: 9500, unit: 'per session', description: 'Focused barbell and dumbbell training for building muscle, strength, and power' },
    { id: 'SVC-5', name: 'Olympic Lifting', category: 'Strength', duration: 60, price: 10500, unit: 'per session', description: 'Learn the snatch, clean & jerk with proper technique coaching and progressive programming' },
    { id: 'SVC-6', name: 'Boxing & Conditioning', category: 'Cardio', duration: 45, price: 5500, unit: 'per session', description: 'Boxing technique, heavy bag work, and conditioning for total body fitness' },
    { id: 'SVC-7', name: 'Boot Camp', category: 'Group', duration: 45, price: 2500, unit: 'per person', description: 'High-energy group class combining strength, cardio, and bodyweight training' },
    { id: 'SVC-8', name: 'Mobility & Recovery', category: 'Wellness', duration: 45, price: 5500, unit: 'per session', description: 'Foam rolling, stretching, and mobility work to prevent injury and aid recovery' },
    { id: 'SVC-9', name: 'Nutrition Coaching', category: 'Wellness', duration: 45, price: 7500, unit: 'per session', description: 'Personalized nutrition planning, macro coaching, and meal prep guidance' },
    { id: 'SVC-10', name: 'Functional Training', category: 'Strength', duration: 60, price: 8500, unit: 'per session', description: 'Movement-based training to improve daily performance, balance, and core stability' },
    { id: 'SVC-11', name: 'Athletic Performance', category: 'Performance', duration: 60, price: 10500, unit: 'per session', description: 'Speed, agility, plyometrics, and sport-specific training for competitive athletes' },
    { id: 'SVC-12', name: 'Body Composition Assessment', category: 'Assessment', duration: 30, price: 0, unit: 'complimentary', description: 'Full body composition analysis, movement screen, and goal-setting consultation' },
    { id: 'SVC-13', name: 'Intro Session', category: 'Assessment', duration: 60, price: 4900, unit: 'new clients', description: 'First session — movement assessment, goal setting, and your first customized workout' },
    { id: 'SVC-14', name: 'Couples Training', category: 'Private', duration: 60, price: 14000, unit: 'per pair', description: 'Train together with your partner — custom programming for two with one dedicated trainer' },
    { id: 'SVC-15', name: 'Prenatal Fitness', category: 'Wellness', duration: 45, price: 8500, unit: 'per session', description: 'Safe, effective training for expecting mothers — strengthen, stabilize, and stay active' },
    { id: 'SVC-16', name: 'Youth Athletic Training', category: 'Performance', duration: 45, price: 6500, unit: 'per session', description: 'Age-appropriate strength, speed, and agility training for young athletes ages 12-17' },
  ]);

  // Clients (30) — mixed gender, diverse goals
  const firstNames = ['James', 'Sarah', 'Marcus', 'Emily', 'David', 'Priya', 'Chris', 'Maria', 'Tyler', 'Lauren', 'Jordan', 'Aisha', 'Ryan', 'Nicole', 'Brandon', 'Megan', 'Alex', 'Tiffany', 'Kevin', 'Ashley', 'Nathan', 'Rachel', 'Jake', 'Courtney', 'Andre', 'Samantha', 'Victor', 'Kelsey', 'Omar', 'Brittany'];
  const lastNames = ['Thompson', 'Chen', 'Williams', 'Patel', 'Garcia', 'Singh', 'Brooks', 'Martinez', 'Foster', 'Johnson', 'Rivera', 'Osei', 'Mitchell', 'Anderson', 'Clarke', 'Taylor', 'Morales', 'Kim', 'Hall', 'Davis', 'Santos', 'Lewis', 'Cooper', 'Wright', 'Diallo', 'Baker', 'Nguyen', 'Torres', 'Hassan', 'Moore'];
  const goals = ['Build muscle', 'Lose weight', 'Get stronger', 'Improve endurance', 'Athletic performance', 'Post-rehab', 'General fitness', 'Body recomposition', 'Train for marathon', 'Gain confidence'];
  const membershipTiers = ['Drop-in', 'Drop-in', '10-Session Pack', 'Unlimited Monthly', 'Premium Monthly'];
  const sessionNames = ['1-on-1 Training', 'Strength Training', 'HIIT Session', 'Boot Camp', 'Boxing & Conditioning', 'Functional Training', 'Small Group Training', 'Olympic Lifting', 'Mobility & Recovery', 'Athletic Performance'];
  const patients = firstNames.map((fn, i) => ({
    id: `CLT-${1000 + i}`,
    firstName: fn,
    lastName: lastNames[i],
    email: `${fn.toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
    phone: `(480) 555-${String(1000 + i).slice(1)}`,
    dob: `${1970 + Math.floor(Math.random() * 35)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    goals: goals[Math.floor(Math.random() * goals.length)],
    notes: '',
    membershipTier: membershipTiers[Math.floor(Math.random() * membershipTiers.length)],
    totalSpent: Math.floor(Math.random() * 80000),
    visitCount: Math.floor(1 + Math.random() * 80),
    lastVisit: d(-Math.floor(Math.random() * 120)),
    favoriteClass: sessionNames[Math.floor(Math.random() * sessionNames.length)],
    createdAt: d(-Math.floor(30 + Math.random() * 365)),
  }));
  set('ms_patients', patients);

  // Sessions (next 14 days + past 7 days)
  const svcIds = ['SVC-1', 'SVC-2', 'SVC-3', 'SVC-4', 'SVC-6', 'SVC-7', 'SVC-8', 'SVC-10', 'SVC-11'];
  const provIds = ['PRV-1', 'PRV-2', 'PRV-3', 'PRV-4', 'PRV-5', 'PRV-6'];
  const statuses = ['confirmed', 'confirmed', 'confirmed', 'pending', 'completed'];
  const appts = [];
  for (let dayOff = -7; dayOff <= 14; dayOff++) {
    const numAppts = 3 + Math.floor(Math.random() * 6);
    for (let j = 0; j < numAppts; j++) {
      const hour = 5 + Math.floor(Math.random() * 14);
      const min = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      const pat = patients[Math.floor(Math.random() * patients.length)];
      const svc = svcIds[Math.floor(Math.random() * svcIds.length)];
      const prov = provIds[Math.floor(Math.random() * provIds.length)];
      const status = dayOff < 0 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)];
      appts.push({
        id: `SES-${2000 + appts.length}`,
        patientId: pat.id,
        patientName: `${pat.firstName} ${pat.lastName}`,
        serviceId: svc,
        providerId: prov,
        date: d(dayOff),
        time: t(hour, min),
        duration: [45, 60][Math.floor(Math.random() * 2)],
        status,
        notes: '',
        createdAt: new Date().toISOString(),
      });
    }
  }
  set('ms_appointments', appts);

  // Training Programs
  const programs = [
    { id: 'TP-1', patientId: 'CLT-1000', patientName: 'James Thompson', name: '12-Week Muscle Builder', sessions: [
      { serviceId: 'SVC-4', name: 'Upper Body Push #1', status: 'completed', date: d(-42), notes: 'Bench 135x8, OHP 85x8 — strong start' },
      { serviceId: 'SVC-4', name: 'Lower Body #1', status: 'completed', date: d(-39), notes: 'Squat 185x8, RDL 155x8 — good form' },
      { serviceId: 'SVC-4', name: 'Upper Body Pull #1', status: 'completed', date: d(-35), notes: 'Deadlift 225x5, rows and pull-ups' },
      { serviceId: 'SVC-4', name: 'Upper Body Push #2', status: 'upcoming', date: d(3), notes: '' },
      { serviceId: 'SVC-4', name: 'Lower Body #2', status: 'upcoming', date: d(6), notes: '' },
      { serviceId: 'SVC-4', name: 'Upper Body Pull #2', status: 'upcoming', date: d(10), notes: '' },
    ], createdAt: d(-45), providerId: 'PRV-3' },
    { id: 'TP-2', patientId: 'CLT-1001', patientName: 'Sarah Chen', name: '8-Week Fat Loss Accelerator', sessions: [
      { serviceId: 'SVC-3', name: 'HIIT Circuit #1', status: 'completed', date: d(-28), notes: 'Great energy, hit all rounds' },
      { serviceId: 'SVC-4', name: 'Full Body Strength #1', status: 'completed', date: d(-25), notes: 'Progressive overload on all lifts' },
      { serviceId: 'SVC-3', name: 'HIIT Circuit #2', status: 'completed', date: d(-21), notes: 'Improved times on every station' },
      { serviceId: 'SVC-9', name: 'Nutrition Check-in #1', status: 'completed', date: d(-18), notes: 'Adjusted macros — more protein' },
      { serviceId: 'SVC-3', name: 'HIIT Circuit #3', status: 'upcoming', date: d(1), notes: '' },
      { serviceId: 'SVC-4', name: 'Full Body Strength #2', status: 'upcoming', date: d(4), notes: '' },
      { serviceId: 'SVC-3', name: 'HIIT Circuit #4', status: 'upcoming', date: d(8), notes: '' },
      { serviceId: 'SVC-9', name: 'Nutrition Check-in #2', status: 'upcoming', date: d(15), notes: '' },
    ], createdAt: d(-30), providerId: 'PRV-2' },
    { id: 'TP-3', patientId: 'CLT-1003', patientName: 'Emily Patel', name: 'Prenatal Fitness Program', sessions: [
      { serviceId: 'SVC-15', name: 'Prenatal Strength — Month 4', status: 'completed', date: d(-56), notes: 'Gentle intro, focus on core stability' },
      { serviceId: 'SVC-15', name: 'Prenatal Mobility — Month 4', status: 'completed', date: d(-49), notes: 'Hip mobility and pelvic floor work' },
      { serviceId: 'SVC-8', name: 'Recovery Session', status: 'completed', date: d(-42), notes: 'Foam rolling, gentle stretching' },
      { serviceId: 'SVC-15', name: 'Prenatal Strength — Month 5', status: 'completed', date: d(-35), notes: 'Modified exercises, feeling strong' },
      { serviceId: 'SVC-15', name: 'Prenatal Mobility — Month 5', status: 'completed', date: d(-28), notes: 'Great progress on hip openers' },
      { serviceId: 'SVC-8', name: 'Recovery Session #2', status: 'completed', date: d(-21), notes: 'Gentle flow' },
      { serviceId: 'SVC-15', name: 'Prenatal Strength — Month 6', status: 'in-progress', date: d(0), notes: '' },
      { serviceId: 'SVC-15', name: 'Prenatal Mobility — Month 6', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-8', name: 'Recovery Session #3', status: 'upcoming', date: d(14), notes: '' },
      { serviceId: 'SVC-15', name: 'Prenatal Strength — Month 7', status: 'upcoming', date: d(21), notes: '' },
      { serviceId: 'SVC-15', name: 'Prenatal Mobility — Month 7', status: 'upcoming', date: d(28), notes: '' },
      { serviceId: 'SVC-8', name: 'Recovery Session — Final', status: 'upcoming', date: d(35), notes: '' },
    ], createdAt: d(-60), providerId: 'PRV-6' },
    { id: 'TP-4', patientId: 'CLT-1004', patientName: 'David Garcia', name: 'Post-Rehab Return to Training', sessions: [
      { serviceId: 'SVC-8', name: 'Mobility Assessment', status: 'completed', date: d(-35), notes: 'Post-ACL surgery, limited ROM in right knee' },
      { serviceId: 'SVC-10', name: 'Functional Basics #1', status: 'completed', date: d(-28), notes: 'Bodyweight movements, no impact' },
      { serviceId: 'SVC-8', name: 'Mobility & Rehab #2', status: 'completed', date: d(-21), notes: 'ROM improving, added band work' },
      { serviceId: 'SVC-10', name: 'Functional Training #2', status: 'completed', date: d(-14), notes: 'Light goblet squats, TRX rows' },
      { serviceId: 'SVC-4', name: 'Intro to Barbell', status: 'in-progress', date: d(0), notes: 'Light squats with barbell, focus on form' },
      { serviceId: 'SVC-4', name: 'Strength Building #1', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-8', name: 'Mobility Check-in', status: 'upcoming', date: d(14), notes: '' },
      { serviceId: 'SVC-4', name: 'Strength Building #2', status: 'upcoming', date: d(28), notes: '' },
    ], createdAt: d(-40), providerId: 'PRV-4' },
    { id: 'TP-5', patientId: 'CLT-1005', patientName: 'Priya Singh', name: '30-Day Kickstart Challenge', sessions: [
      { serviceId: 'SVC-3', name: 'Day 1 — HIIT Intro', status: 'completed', date: d(-21), notes: 'Challenge kickoff! Great energy' },
      { serviceId: 'SVC-4', name: 'Day 3 — Upper Body', status: 'completed', date: d(-19), notes: 'First time with dumbbells over 15lbs' },
      { serviceId: 'SVC-7', name: 'Day 6 — Boot Camp', status: 'completed', date: d(-16), notes: 'Kept up with the whole class' },
      { serviceId: 'SVC-6', name: 'Day 9 — Boxing', status: 'completed', date: d(-13), notes: 'Loved the boxing — great stress relief' },
      { serviceId: 'SVC-8', name: 'Day 12 — Recovery', status: 'completed', date: d(-10), notes: 'Active recovery, foam rolling' },
      { serviceId: 'SVC-4', name: 'Day 15 — Lower Body', status: 'completed', date: d(-7), notes: 'Halfway point — squat PR!' },
      { serviceId: 'SVC-3', name: 'Day 18 — HIIT Advanced', status: 'in-progress', date: d(-4), notes: '' },
      { serviceId: 'SVC-10', name: 'Day 21 — Functional', status: 'upcoming', date: d(-1), notes: '' },
      { serviceId: 'SVC-4', name: 'Day 24 — Full Body', status: 'upcoming', date: d(2), notes: '' },
      { serviceId: 'SVC-11', name: 'Day 27 — Performance', status: 'upcoming', date: d(5), notes: '' },
      { serviceId: 'SVC-3', name: 'Day 30 — Final HIIT', status: 'upcoming', date: d(8), notes: '' },
    ], createdAt: d(-22), providerId: 'PRV-5' },
    { id: 'TP-6', patientId: 'CLT-1010', patientName: 'Lauren Johnson', name: 'Marathon Prep Program', sessions: [
      { serviceId: 'SVC-4', name: 'Strength for Runners #1', status: 'completed', date: d(-60), notes: 'Lower body emphasis, single-leg work' },
      { serviceId: 'SVC-11', name: 'Speed & Agility #1', status: 'completed', date: d(-45), notes: 'Ladder drills, sprint intervals' },
      { serviceId: 'SVC-8', name: 'Runner\'s Mobility', status: 'completed', date: d(-30), notes: 'Hip flexors and IT band focus' },
      { serviceId: 'SVC-4', name: 'Strength for Runners #2', status: 'in-progress', date: d(-7), notes: 'Added plyometrics, hill simulation' },
      { serviceId: 'SVC-11', name: 'Speed & Agility #2', status: 'upcoming', date: d(14), notes: '' },
      { serviceId: 'SVC-9', name: 'Race Day Nutrition Plan', status: 'upcoming', date: d(45), notes: '' },
    ], createdAt: d(-65), providerId: 'PRV-5' },
  ];
  set('ms_class_packages', programs);

  // Inventory (equipment and retail)
  set('ms_inventory', [
    { id: 'INV-1', name: 'Adjustable Dumbbell Set (5-90lb)', category: 'Equipment', sku: 'DB-ADJ', quantity: 20, reorderAt: 0, unitCost: 45000, adjustmentLog: [] },
    { id: 'INV-2', name: 'Olympic Barbell (45lb)', category: 'Equipment', sku: 'BAR-OLY', quantity: 8, reorderAt: 0, unitCost: 35000, adjustmentLog: [] },
    { id: 'INV-3', name: 'Bumper Plate Set (10-55lb)', category: 'Equipment', sku: 'PLT-BMP', quantity: 12, reorderAt: 0, unitCost: 28000, adjustmentLog: [] },
    { id: 'INV-4', name: 'Kettlebell Set (15-70lb)', category: 'Equipment', sku: 'KB-SET', quantity: 10, reorderAt: 2, unitCost: 22000, adjustmentLog: [] },
    { id: 'INV-5', name: 'Resistance Bands (Assorted)', category: 'Equipment', sku: 'RB-AST', quantity: 40, reorderAt: 15, unitCost: 1200, adjustmentLog: [] },
    { id: 'INV-6', name: 'TRX Suspension Trainer', category: 'Equipment', sku: 'TRX-PRO', quantity: 12, reorderAt: 4, unitCost: 15000, adjustmentLog: [] },
    { id: 'INV-7', name: 'Boxing Gloves (pair)', category: 'Equipment', sku: 'BOX-GL', quantity: 20, reorderAt: 8, unitCost: 4500, adjustmentLog: [] },
    { id: 'INV-8', name: 'Foam Roller', category: 'Equipment', sku: 'FR-36', quantity: 25, reorderAt: 10, unitCost: 1800, adjustmentLog: [] },
    { id: 'INV-9', name: 'Branded Shaker Bottle', category: 'Retail', sku: 'SB-BRD', quantity: 60, reorderAt: 20, unitCost: 500, adjustmentLog: [] },
    { id: 'INV-10', name: 'Lifting Belt', category: 'Retail', sku: 'LB-STD', quantity: 15, reorderAt: 5, unitCost: 3500, adjustmentLog: [] },
    { id: 'INV-11', name: 'Gym Towel', category: 'Supplies', sku: 'TW-STD', quantity: 80, reorderAt: 30, unitCost: 400, adjustmentLog: [] },
    { id: 'INV-12', name: 'Cable Machine', category: 'Equipment', sku: 'CM-01', quantity: 4, reorderAt: 0, unitCost: 250000, adjustmentLog: [] },
  ]);

  // Retention Alerts
  const alerts = [];
  patients.forEach((p, idx) => {
    const daysSince = Math.floor((today - new Date(p.lastVisit)) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      const sessions = ['1-on-1 Training', 'HIIT Session', 'Strength Training', 'Boot Camp', 'Boxing & Conditioning', 'Mobility & Recovery'];
      const sn = sessions[Math.floor(Math.random() * sessions.length)];
      const isHigh = daysSince > 90;
      const isMedium = daysSince > 60 && daysSince <= 90;
      const statusRoll = idx % 5;
      const contacted = statusRoll === 1 || statusRoll === 3;
      const dismissed = statusRoll === 4 && !isHigh;
      alerts.push({
        id: `RET-${alerts.length}`,
        patientId: p.id,
        patientName: `${p.firstName} ${p.lastName}`,
        lastVisit: p.lastVisit,
        daysSince,
        lastService: sn,
        suggestedAction: isHigh ? `${sn} follow-up overdue — send re-engagement offer` : isMedium ? `Time for ${sn} — invite back for a session` : `${sn} check-in — keep the momentum going`,
        priority: isHigh ? 'high' : isMedium ? 'medium' : 'low',
        status: dismissed ? 'dismissed' : contacted ? 'contacted' : 'pending',
        contacted,
        contactedAt: contacted ? d(-Math.floor(Math.random() * 10)) : null,
      });
    }
  });
  set('ms_retention_alerts', alerts);

  // Social media connections
  set('ms_social_connections', { instagram: true, facebook: true, x: false, linkedin: false, tiktok: true });

  // Settings
  set('ms_settings', {
    businessName: 'FORGE Performance Training',
    tagline: 'Train Hard. Train Smart. Get Results.',
    email: 'hello@forgetraining.com',
    phone: '(480) 555-0100',
    founded: '2020',
    founder: 'Marcus Cole',
  });

  localStorage.setItem('pt_initialized_v1', 'true');
}

// Seeds data for keys that are empty — runs every load to fill gaps
function seedIfEmpty(d, today) {
  if (!localStorage.getItem('ms_settings')) {
    set('ms_settings', { businessName: 'FORGE Performance Training', tagline: 'Train Hard. Train Smart. Get Results.', email: 'hello@forgetraining.com', phone: '(480) 555-0100', founded: '2020', founder: 'Marcus Cole' });
  }
  if (get('ms_emails', []).length > 0 && get('ms_texts', []).length > 0 && get('ms_social_posts', []).length > 0 && get('ms_checkins', []).length > 0) return;

  // Seed Sent Emails
  if (get('ms_emails', []).length === 0) set('ms_emails', [
    { id: 'EM-1', subject: 'March Newsletter — New Training Programs Dropping', body: 'Hey team, here is what is new this month at FORGE Performance Training...', audience: 'All Clients', status: 'Sent', recipientCount: 30, sentDate: d(-3) + 'T10:00:00Z' },
    { id: 'EM-2', subject: 'Bring a Friend Week — Free Guest Pass', body: 'Bring a friend to any session this week — on us. Let them experience the FORGE difference...', audience: 'Clients', status: 'Sent', recipientCount: 12, sentDate: d(-7) + 'T14:00:00Z' },
    { id: 'EM-3', subject: 'Your Session is Tomorrow!', body: 'Hi [Client], reminder about your upcoming training session with [Trainer]...', audience: 'Upcoming Sessions', status: 'Sent', recipientCount: 8, sentDate: d(-1) + 'T09:00:00Z' },
    { id: 'EM-4', subject: 'We Miss You — Come Back & Save 20%', body: 'It has been a while since your last session. Here is 20% off your next training package...', audience: 'Lapsed Clients', status: 'Sent', recipientCount: 15, sentDate: d(-14) + 'T11:00:00Z' },
    { id: 'EM-5', subject: 'Welcome to FORGE!', body: 'Welcome to the FORGE family. Here is what to expect at your first session and how to prep...', audience: 'New Clients', status: 'Sent', recipientCount: 3, sentDate: d(-21) + 'T16:00:00Z' },
  ]);

  // Seed Sent Text Messages
  if (get('ms_texts', []).length === 0) set('ms_texts', [
    { id: 'TXT-1', message: 'Hey! Reminder: your training session is tomorrow at 7am with Marcus. Reply C to confirm or R to reschedule.', audience: 'upcoming', recipientCount: 6, template: 'reminder', status: 'Sent', sentDate: d(-1) + 'T08:00:00Z' },
    { id: 'TXT-2', message: 'Great work crushing that HIIT session yesterday! Remember to stretch and refuel with protein within 30 min. Reply with any questions.', audience: 'all', recipientCount: 4, template: 'followup', status: 'Sent', sentDate: d(-2) + 'T10:00:00Z' },
    { id: 'TXT-3', message: 'New 6-Week Shred program launching Monday! Limited spots. First session FREE for current clients. Reply BOOK to reserve.', audience: 'all', recipientCount: 30, template: 'promo', status: 'Sent', sentDate: d(-5) + 'T12:00:00Z' },
    { id: 'TXT-4', message: 'Thanks for training with us! Love your FORGE experience? Leave us a quick Google review: [link]', audience: 'all', recipientCount: 8, template: 'review', status: 'Sent', sentDate: d(-3) + 'T15:00:00Z' },
    { id: 'TXT-5', message: 'Hey! It has been a while — we would love to get you back under the bar. Enjoy 20% off a 10-session pack. Reply BOOK to schedule.', audience: 'lapsed', recipientCount: 12, template: 'reactivation', status: 'Sent', sentDate: d(-10) + 'T11:00:00Z' },
  ]);

  // Seed Social Media Posts
  if (get('ms_social_posts', []).length === 0) set('ms_social_posts', [
    { id: 'SP-1', contentType: 'class', platforms: ['instagram', 'facebook'], posts: [{ platform: 'instagram', text: 'Your only limit is you.\n\n6am HIIT | 7am Strength | 12pm Boot Camp\nEvery single day.\n\nBook your session — link in bio\n\n#FORGETraining #PersonalTrainer #ScottsdaleFitness #TrainHard' }, { platform: 'facebook', text: 'Training sessions running all day at FORGE. All levels welcome — your intro session is just $49.' }], status: 'published', publishedAt: d(-2) + 'T10:00:00Z', createdAt: d(-2) + 'T09:00:00Z' },
    { id: 'SP-2', contentType: 'transformation', platforms: ['instagram'], posts: [{ platform: 'instagram', text: '12 weeks. Consistent training. Real results.\n\nOur client James came in with zero gym experience.\nNow he is deadlifting 315 and feeling unstoppable.\n\n#TransformationTuesday #FORGETraining #StrengthTraining #Results' }], status: 'published', publishedAt: d(-5) + 'T14:00:00Z', createdAt: d(-5) + 'T13:00:00Z' },
    { id: 'SP-3', contentType: 'promo', platforms: ['instagram', 'facebook', 'tiktok'], posts: [{ platform: 'instagram', text: 'SPRING SHRED STARTS NOW\n\n6-Week program | Nutrition + Training\nBring a friend FREE\n\nLink in bio\n\n#FORGETraining #SpringShred #PersonalTraining' }, { platform: 'facebook', text: 'Spring Shred program starting Monday — 6 weeks of training + nutrition coaching. Bring a friend free!' }, { platform: 'tiktok', text: 'POV: You just finished a FORGE boot camp and your legs are shaking but you feel ALIVE' }], status: 'scheduled', scheduledAt: d(2) + 'T10:00:00Z', createdAt: d(-1) + 'T16:00:00Z' },
    { id: 'SP-4', contentType: 'education', platforms: ['instagram', 'linkedin'], posts: [{ platform: 'instagram', text: 'TRAINER TIP\n\nYou don\'t need to train 7 days a week.\n3-4 quality sessions with progressive overload will outperform 7 junk sessions every time.\n\nRecovery is where growth happens.\n\n#FitnessTips #FORGETraining #TrainSmart' }, { platform: 'linkedin', text: 'Why corporate wellness programs should include personal training: reduced sick days, improved productivity, and healthier teams. FORGE offers corporate training packages.' }], status: 'draft', createdAt: d(0) + 'T08:00:00Z' },
    { id: 'SP-5', contentType: 'team', platforms: ['instagram'], posts: [{ platform: 'instagram', text: 'Meet Marcus Cole\n\nOur head trainer and FORGE founder brings 12+ years of training experience, CSCS certification, and a passion for helping people transform.\n\n#MeetTheTeam #FORGETraining #PersonalTrainer #Scottsdale' }], status: 'published', publishedAt: d(-8) + 'T11:00:00Z', createdAt: d(-8) + 'T10:00:00Z' },
  ]);

  // Seed Check-Ins (for today's sessions)
  if (get('ms_checkins', []).length > 0) return;
  const appts = get('ms_appointments', []);
  const todayAppts = appts.filter(a => a.date === today.toISOString().slice(0, 10));
  const checkins = [];
  todayAppts.slice(0, Math.min(5, todayAppts.length)).forEach((a, i) => {
    const checkInStatuses = ['checked-in', 'training', 'complete', 'checked-in', 'training'];
    const minutesAgo = [45, 30, 60, 15, 8];
    checkins.push({
      id: `CK-${3000 + i}`,
      appointmentId: a.id,
      patientId: a.patientId,
      patientName: a.patientName,
      checkedInAt: new Date(today - minutesAgo[i] * 60000).toISOString(),
      verifiedInfo: { phone: '(480) 555-0180', dob: '1990-01-01', emergencyContact: 'On file', injuries: 'None' },
      status: checkInStatuses[i],
    });
  });
  set('ms_checkins', checkins);
}
