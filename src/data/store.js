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
  const alreadyInit = localStorage.getItem('pt_initialized_v4');

  // Clear old legacy data if present
  if (!alreadyInit) {
    // Clear ALL old data for clean re-seed
    ['ms_patients','ms_appointments','ms_class_packages','ms_inventory','ms_providers','ms_services','ms_locations','ms_retention_alerts','ms_settings','ms_emails','ms_texts','ms_social_posts','ms_checkins','ms_social_connections','ms_prs','ms_initialized','pt_initialized_v1','pt_initialized_v2','pt_initialized_v3','ms_workouts','ms_workout_assignments','pt_inbox_inapp','pt_inbox_ig','pt_inbox_tt','ms_habits'].forEach(k => localStorage.removeItem(k));
    // Also clear progress / nutrition / habit data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ms_progress_') || key.startsWith('ms_measurements_') || key.startsWith('ms_nutrition_') || key.startsWith('ms_macro_targets_') || key.startsWith('ms_habit_logs_') || key.startsWith('ms_prs_') || key.startsWith('ms_body_scans_'))) {
        localStorage.removeItem(key);
        i--;
      }
    }
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

  // Clients (5) — complete demo data for each
  const patients = [
    { id: 'CLT-1000', firstName: 'James', lastName: 'Thompson', email: 'james.thompson@email.com', phone: '(480) 555-0100', dob: '1998-03-15', goals: 'Build muscle', notes: 'Cutting phase — tracking macros closely. Responds well to progressive overload.', membershipTier: '10-Session Pack', totalSpent: 420000, visitCount: 45, lastVisit: d(-1), favoriteClass: 'Strength Training', createdAt: d(-180) },
    { id: 'CLT-1001', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@email.com', phone: '(480) 555-0101', dob: '1994-07-22', goals: 'Lose weight', notes: 'Fat loss program — great consistency. Loves HIIT and group energy.', membershipTier: 'Unlimited Monthly', totalSpent: 380000, visitCount: 38, lastVisit: d(-2), favoriteClass: 'HIIT Session', createdAt: d(-150) },
    { id: 'CLT-1002', firstName: 'Marcus', lastName: 'Williams', email: 'marcus.williams@email.com', phone: '(480) 555-0102', dob: '2002-01-10', goals: 'Athletic performance', notes: 'Most active client. Former college athlete, training for competitive CrossFit.', membershipTier: 'Premium Monthly', totalSpent: 510000, visitCount: 52, lastVisit: d(0), favoriteClass: 'Athletic Performance', createdAt: d(-240) },
    { id: 'CLT-1003', firstName: 'Emily', lastName: 'Patel', email: 'emily.patel@email.com', phone: '(480) 555-0103', dob: '1996-11-05', goals: 'Prenatal fitness', notes: 'Prenatal program — currently month 6. Focus on core stability and safe movement.', membershipTier: 'Unlimited Monthly', totalSpent: 240000, visitCount: 20, lastVisit: d(-3), favoriteClass: 'Prenatal Fitness', createdAt: d(-120) },
    { id: 'CLT-1004', firstName: 'David', lastName: 'Garcia', email: 'david.garcia@email.com', phone: '(480) 555-0104', dob: '1991-05-28', goals: 'Post-rehab', notes: 'Recovering from ACL surgery (right knee). Cleared for barbell work. Building back strength.', membershipTier: '10-Session Pack', totalSpent: 280000, visitCount: 28, lastVisit: d(-2), favoriteClass: 'Functional Training', createdAt: d(-100) },
  ];
  set('ms_patients', patients);

  // Sessions (next 14 days + past 7 days) — 4-6 per day, all 5 clients appearing regularly
  const clientSvcMap = {
    'CLT-1000': ['SVC-4', 'SVC-1', 'SVC-9'],   // James: Strength, 1-on-1, Nutrition
    'CLT-1001': ['SVC-3', 'SVC-7', 'SVC-4'],    // Sarah: HIIT, Boot Camp, Strength
    'CLT-1002': ['SVC-11', 'SVC-5', 'SVC-4'],   // Marcus: Athletic Perf, Olympic, Strength
    'CLT-1003': ['SVC-15', 'SVC-8', 'SVC-10'],  // Emily: Prenatal, Mobility, Functional
    'CLT-1004': ['SVC-10', 'SVC-8', 'SVC-4'],   // David: Functional, Mobility, Strength
  };
  const timeSlots = [
    [6, 0], [7, 0], [8, 0], [9, 30], [11, 0], [12, 0], [14, 0], [15, 30], [17, 0], [18, 0],
  ];
  const appts = [];
  for (let dayOff = -7; dayOff <= 14; dayOff++) {
    // Pick 4-6 sessions per day, cycling through all 5 clients
    const numAppts = 4 + (Math.abs(dayOff * 7) % 3); // deterministic 4-6
    const dayClients = [...patients].sort((a, b) => {
      const ha = (a.id.charCodeAt(4) * 31 + dayOff * 17) % 100;
      const hb = (b.id.charCodeAt(4) * 31 + dayOff * 17) % 100;
      return ha - hb;
    });
    for (let j = 0; j < numAppts; j++) {
      const pat = dayClients[j % dayClients.length];
      const svcs = clientSvcMap[pat.id];
      const svc = svcs[(dayOff + j + 10) % svcs.length];
      const slot = timeSlots[(j * 2 + Math.abs(dayOff)) % timeSlots.length];
      const status = dayOff < 0 ? 'completed' : dayOff === 0 ? 'confirmed' : ['confirmed', 'confirmed', 'confirmed', 'pending'][j % 4];
      appts.push({
        id: `SES-${2000 + appts.length}`,
        patientId: pat.id,
        patientName: `${pat.firstName} ${pat.lastName}`,
        serviceId: svc,
        providerId: 'PRV-1',
        date: d(dayOff),
        time: t(slot[0], slot[1]),
        duration: [45, 60][j % 2],
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
    ], createdAt: d(-45), providerId: 'PRV-1' },
    { id: 'TP-2', patientId: 'CLT-1001', patientName: 'Sarah Chen', name: '8-Week Fat Loss Accelerator', sessions: [
      { serviceId: 'SVC-3', name: 'HIIT Circuit #1', status: 'completed', date: d(-28), notes: 'Great energy, hit all rounds' },
      { serviceId: 'SVC-4', name: 'Full Body Strength #1', status: 'completed', date: d(-25), notes: 'Progressive overload on all lifts' },
      { serviceId: 'SVC-3', name: 'HIIT Circuit #2', status: 'completed', date: d(-21), notes: 'Improved times on every station' },
      { serviceId: 'SVC-9', name: 'Nutrition Check-in #1', status: 'completed', date: d(-18), notes: 'Adjusted macros — more protein' },
      { serviceId: 'SVC-3', name: 'HIIT Circuit #3', status: 'upcoming', date: d(1), notes: '' },
      { serviceId: 'SVC-4', name: 'Full Body Strength #2', status: 'upcoming', date: d(4), notes: '' },
      { serviceId: 'SVC-3', name: 'HIIT Circuit #4', status: 'upcoming', date: d(8), notes: '' },
      { serviceId: 'SVC-9', name: 'Nutrition Check-in #2', status: 'upcoming', date: d(15), notes: '' },
    ], createdAt: d(-30), providerId: 'PRV-1' },
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
    ], createdAt: d(-60), providerId: 'PRV-1' },
    { id: 'TP-4', patientId: 'CLT-1004', patientName: 'David Garcia', name: 'Post-Rehab Return to Training', sessions: [
      { serviceId: 'SVC-8', name: 'Mobility Assessment', status: 'completed', date: d(-35), notes: 'Post-ACL surgery, limited ROM in right knee' },
      { serviceId: 'SVC-10', name: 'Functional Basics #1', status: 'completed', date: d(-28), notes: 'Bodyweight movements, no impact' },
      { serviceId: 'SVC-8', name: 'Mobility & Rehab #2', status: 'completed', date: d(-21), notes: 'ROM improving, added band work' },
      { serviceId: 'SVC-10', name: 'Functional Training #2', status: 'completed', date: d(-14), notes: 'Light goblet squats, TRX rows' },
      { serviceId: 'SVC-4', name: 'Intro to Barbell', status: 'in-progress', date: d(0), notes: 'Light squats with barbell, focus on form' },
      { serviceId: 'SVC-4', name: 'Strength Building #1', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-8', name: 'Mobility Check-in', status: 'upcoming', date: d(14), notes: '' },
      { serviceId: 'SVC-4', name: 'Strength Building #2', status: 'upcoming', date: d(28), notes: '' },
    ], createdAt: d(-40), providerId: 'PRV-1' },
    { id: 'TP-5', patientId: 'CLT-1002', patientName: 'Marcus Williams', name: 'Athletic Performance Block', sessions: [
      { serviceId: 'SVC-11', name: 'Speed & Agility #1', status: 'completed', date: d(-42), notes: 'Ladder drills, cone sprints — explosive' },
      { serviceId: 'SVC-5', name: 'Olympic Lifting — Clean', status: 'completed', date: d(-35), notes: 'Power cleans 185x3, technique improving' },
      { serviceId: 'SVC-4', name: 'Heavy Strength Day #1', status: 'completed', date: d(-28), notes: 'Squat 345x3, bench 235x5 — solid' },
      { serviceId: 'SVC-11', name: 'Speed & Agility #2', status: 'completed', date: d(-21), notes: '40-yard dash PR: 4.65s' },
      { serviceId: 'SVC-5', name: 'Olympic Lifting — Snatch', status: 'completed', date: d(-14), notes: 'Hang snatch 135x3, great hip extension' },
      { serviceId: 'SVC-4', name: 'Heavy Strength Day #2', status: 'in-progress', date: d(-2), notes: 'Testing new maxes this week' },
      { serviceId: 'SVC-11', name: 'Speed & Agility #3', status: 'upcoming', date: d(5), notes: '' },
      { serviceId: 'SVC-5', name: 'Olympic Lifting — Complex', status: 'upcoming', date: d(12), notes: '' },
      { serviceId: 'SVC-4', name: 'Heavy Strength Day #3', status: 'upcoming', date: d(19), notes: '' },
    ], createdAt: d(-45), providerId: 'PRV-1' },
  ];
  set('ms_class_packages', programs);

  // Retention Alerts — none! All 5 clients are active (visited within 7 days)
  set('ms_retention_alerts', []);

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

  localStorage.setItem('pt_initialized_v4', 'true');
}

// Seeds data for keys that are empty — runs every load to fill gaps
function seedIfEmpty(d, today) {
  if (!localStorage.getItem('ms_settings')) {
    set('ms_settings', { businessName: 'FORGE Performance Training', tagline: 'Train Hard. Train Smart. Get Results.', email: 'hello@forgetraining.com', phone: '(480) 555-0100', founded: '2020', founder: 'Marcus Cole' });
  }
  if (get('ms_emails', []).length > 0 && get('ms_texts', []).length > 0 && get('ms_social_posts', []).length > 0 && get('ms_checkins', []).length > 0) return;

  // Seed Sent Emails
  if (get('ms_emails', []).length === 0) set('ms_emails', [
    { id: 'EM-1', subject: 'March Newsletter — New Training Programs Dropping', body: 'Hey team, here is what is new this month at FORGE Performance Training...', audience: 'All Clients', status: 'Sent', recipientCount: 5, sentDate: d(-3) + 'T10:00:00Z' },
    { id: 'EM-2', subject: 'Bring a Friend Week — Free Guest Pass', body: 'Bring a friend to any session this week — on us. Let them experience the FORGE difference...', audience: 'Clients', status: 'Sent', recipientCount: 5, sentDate: d(-7) + 'T14:00:00Z' },
    { id: 'EM-3', subject: 'Your Session is Tomorrow!', body: 'Hi [Client], reminder about your upcoming training session with [Trainer]...', audience: 'Upcoming Sessions', status: 'Sent', recipientCount: 4, sentDate: d(-1) + 'T09:00:00Z' },
    { id: 'EM-4', subject: 'Spring Shred Promo — 6-Week Challenge', body: 'New 6-week challenge starting next Monday. Training + nutrition coaching included. Limited spots!', audience: 'All Clients', status: 'Sent', recipientCount: 5, sentDate: d(-14) + 'T11:00:00Z' },
    { id: 'EM-5', subject: 'Welcome to FORGE!', body: 'Welcome to the FORGE family. Here is what to expect at your first session and how to prep...', audience: 'New Clients', status: 'Sent', recipientCount: 1, sentDate: d(-21) + 'T16:00:00Z' },
  ]);

  // Seed Sent Text Messages
  if (get('ms_texts', []).length === 0) set('ms_texts', [
    { id: 'TXT-1', message: 'Hey! Reminder: your training session is tomorrow at 7am with Marcus. Reply C to confirm or R to reschedule.', audience: 'upcoming', recipientCount: 4, template: 'reminder', status: 'Sent', sentDate: d(-1) + 'T08:00:00Z' },
    { id: 'TXT-2', message: 'Great work crushing that HIIT session yesterday! Remember to stretch and refuel with protein within 30 min. Reply with any questions.', audience: 'all', recipientCount: 5, template: 'followup', status: 'Sent', sentDate: d(-2) + 'T10:00:00Z' },
    { id: 'TXT-3', message: 'New 6-Week Shred program launching Monday! Limited spots. First session FREE for current clients. Reply BOOK to reserve.', audience: 'all', recipientCount: 5, template: 'promo', status: 'Sent', sentDate: d(-5) + 'T12:00:00Z' },
    { id: 'TXT-4', message: 'Thanks for training with us! Love your FORGE experience? Leave us a quick Google review: [link]', audience: 'all', recipientCount: 5, template: 'review', status: 'Sent', sentDate: d(-3) + 'T15:00:00Z' },
    { id: 'TXT-5', message: 'Spring Shred starts next week! 6 weeks of training + nutrition coaching. Reply BOOK to lock in your spot.', audience: 'all', recipientCount: 5, template: 'promo', status: 'Sent', sentDate: d(-10) + 'T11:00:00Z' },
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
