// Central localStorage store — all CRUD for the Remedy Pilates & Barre platform
// No backend — everything persists in localStorage for demo purposes

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { listeners.forEach(fn => fn()); }

function get(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function set(key, data) { localStorage.setItem(key, JSON.stringify(data)); notify(); }

// ── Members ──
export function getPatients() { return get('ms_patients', []); }
export function addPatient(p) { const all = getPatients(); p.id = `PAT-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('ms_patients', all); return p; }
export function updatePatient(id, updates) { const all = getPatients().map(p => p.id === id ? { ...p, ...updates } : p); set('ms_patients', all); }
export function deletePatient(id) { set('ms_patients', getPatients().filter(p => p.id !== id)); }
export function getPatient(id) { return getPatients().find(p => p.id === id) || null; }

// ── Appointments ──
export function getAppointments() { return get('ms_appointments', []); }
export function addAppointment(a) { const all = getAppointments(); a.id = `APT-${Date.now()}`; a.createdAt = new Date().toISOString(); all.push(a); set('ms_appointments', all); return a; }
export function updateAppointment(id, updates) { set('ms_appointments', getAppointments().map(a => a.id === id ? { ...a, ...updates } : a)); }
export function deleteAppointment(id) { set('ms_appointments', getAppointments().filter(a => a.id !== id)); }

// ── Class Packages ──
export function getClassPackages() { return get('ms_class_packages', []); }
export function addClassPackage(t) { const all = getClassPackages(); t.id = `CP-${Date.now()}`; t.createdAt = new Date().toISOString(); all.unshift(t); set('ms_class_packages', all); return t; }
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

// ── Services (Classes) ──
export function getServices() { return get('ms_services', []); }
export function addService(s) { const all = getServices(); s.id = `SVC-${Date.now()}`; all.push(s); set('ms_services', all); return s; }
export function updateService(id, updates) { set('ms_services', getServices().map(s => s.id === id ? { ...s, ...updates } : s)); }
export function deleteService(id) { set('ms_services', getServices().filter(s => s.id !== id)); }

// ── Providers (Instructors) ──
export function getProviders() { return get('ms_providers', []); }
export function addProvider(p) { const all = getProviders(); p.id = `PRV-${Date.now()}`; all.push(p); set('ms_providers', all); return p; }
export function updateProvider(id, updates) { set('ms_providers', getProviders().map(p => p.id === id ? { ...p, ...updates } : p)); }

// ── Locations ──
export function getLocations() { return get('ms_locations', []); }
export function addLocation(l) { const all = getLocations(); l.id = `LOC-${Date.now()}`; all.push(l); set('ms_locations', all); return l; }

// ── Progress Photos ──
export function getPhotos() { return get('ms_photos', []); }
export function addPhoto(p) { const all = getPhotos(); p.id = `PHT-${Date.now()}`; p.createdAt = new Date().toISOString(); all.unshift(p); set('ms_photos', all); return p; }
export function deletePhoto(id) { set('ms_photos', getPhotos().filter(p => p.id !== id)); }

// ── Settings ──
export function getSettings() { return get('ms_settings', {}); }
export function updateSettings(updates) { set('ms_settings', { ...getSettings(), ...updates }); }

// ── Init seed data ──
export function initStore() {
  const alreadyInit = localStorage.getItem('ms_initialized');

  const today = new Date();
  const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().slice(0, 10); };

  // Always seed missing keys (even if already initialized)
  seedIfEmpty(d, today);

  if (alreadyInit) return;
  const t = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  // Instructors (Remedy's real team)
  set('ms_providers', [
    { id: 'PRV-1', name: 'Kelly Snailum', title: 'Founder / Master Trainer', specialties: ['Reformer', 'Tower', 'Chair', 'Mat Pilates', 'Teacher Training'], color: '#111' },
    { id: 'PRV-2', name: 'Kaitlin Geiss', title: 'Barre & Pilates Instructor', specialties: ['Barre Sculpt', 'Barre Cardio', 'Barre + Pilates Fusion', 'Mat Pilates'], color: '#7C3AED' },
    { id: 'PRV-3', name: 'Jamie Tarkington', title: 'TRX & Pilates Instructor', specialties: ['TRX + Pilates', 'Pilates + HIIT', 'Power Reformer', 'Mat Pilates'], color: '#2563EB' },
    { id: 'PRV-4', name: 'Steve Mazich', title: 'Lead Instructor', specialties: ['Reformer', 'Tower', 'Chair', 'Mat Pilates', 'Private Sessions'], color: '#059669' },
    { id: 'PRV-5', name: 'Julie Valenzuela', title: 'PMA-Certified Instructor', specialties: ['Reformer', 'Mat Pilates', 'Prenatal Pilates', 'Balance + Stretch'], color: '#D97706' },
    { id: 'PRV-6', name: 'Hannah Reisman', title: 'Senior Instructor', specialties: ['Pilates + HIIT', 'Barre Sculpt', 'TRX + Pilates', 'Reformer'], color: '#DC2626' },
  ]);

  // Classes (Services) — Remedy's actual offerings
  set('ms_services', [
    { id: 'SVC-1', name: 'Mat Pilates', category: 'Pilates', duration: 55, price: 2800, unit: 'per class', description: 'Full-body mat work focusing on core strength, flexibility, and controlled movement' },
    { id: 'SVC-2', name: 'Reformer', category: 'Equipment', duration: 55, price: 3800, unit: 'per class', description: 'Spring-resistance reformer class for all levels — build strength and lengthen muscles' },
    { id: 'SVC-3', name: 'Tower', category: 'Equipment', duration: 55, price: 3800, unit: 'per class', description: 'Vertical spring tower class — deep core work with push-through bar and spring resistance' },
    { id: 'SVC-4', name: 'Chair', category: 'Equipment', duration: 55, price: 3800, unit: 'per class', description: 'Pilates chair (Wunda chair) class — balance, strength, and stability in a compact challenge' },
    { id: 'SVC-5', name: 'Barre Sculpt', category: 'Barre', duration: 55, price: 2800, unit: 'per class', description: 'Ballet, pilates, and yoga-inspired movements at the barre for a full-body sculpt' },
    { id: 'SVC-6', name: 'Barre Cardio', category: 'Barre', duration: 55, price: 2800, unit: 'per class', description: 'High-energy barre class blending cardio intervals with barre technique for maximum burn' },
    { id: 'SVC-7', name: 'Barre + Pilates Fusion', category: 'Barre', duration: 55, price: 3200, unit: 'per class', description: 'The best of both worlds — barre sculpting meets pilates core work in one powerful class' },
    { id: 'SVC-8', name: 'TRX', category: 'Strength', duration: 55, price: 3200, unit: 'per class', description: 'TRX suspension training for total-body strength, stability, and core conditioning' },
    { id: 'SVC-9', name: 'Pilates + TRX', category: 'Strength', duration: 55, price: 3200, unit: 'per class', description: 'Suspension training meets pilates — total body strength with core-focused movement' },
    { id: 'SVC-10', name: 'Pilates + HIIT', category: 'Strength', duration: 55, price: 3200, unit: 'per class', description: 'High-intensity intervals combined with pilates fundamentals for cardio and core conditioning' },
    { id: 'SVC-11', name: 'Balance + Stretch', category: 'Wellness', duration: 45, price: 2400, unit: 'per class', description: 'Gentle stretching, balance work, and myofascial release to improve flexibility and aid recovery' },
    { id: 'SVC-12', name: 'Private Session', category: 'Private', duration: 55, price: 8500, unit: 'per session', description: 'One-on-one session on any apparatus — tailored to your goals with personalized instruction' },
    { id: 'SVC-13', name: 'Semi-Private Session', category: 'Private', duration: 55, price: 5500, unit: 'per person', description: 'Small group of 2-3 on equipment — personalized attention at a shared price' },
    { id: 'SVC-14', name: 'Intro Private Session', category: 'Private', duration: 55, price: 3500, unit: 'new clients', description: 'New client intro private — learn the equipment, assess your goals, build your plan' },
    { id: 'SVC-15', name: 'Prenatal Pilates', category: 'Specialty', duration: 55, price: 3200, unit: 'per class', description: 'Safe, supportive pilates for expecting mothers — strengthen pelvic floor and maintain mobility' },
    { id: 'SVC-16', name: 'Youth Conditioning', category: 'Specialty', duration: 45, price: 2800, unit: 'per class', description: 'Age-appropriate pilates and conditioning for young athletes — build strength and prevent injury' },
    { id: 'SVC-17', name: 'Teacher Training', category: 'Training', duration: 120, price: 0, unit: 'program', description: 'Pilates Sports Center certified teacher training — become a certified pilates instructor at Remedy' },
  ]);

  // Locations (Remedy's 3 real studios)
  set('ms_locations', [
    { id: 'LOC-1', name: 'Scottsdale', address: '6949 E Shea Blvd, Ste 115, Scottsdale, AZ 85254', phone: '(480) 699-8160', rooms: ['Reformer Room', 'Tower Room', 'Mat Studio', 'Barre Studio', 'Private Studio'], hours: { 'Mon-Thu': '6:00 AM - 8:00 PM', 'Fri': '6:00 AM - 1:00 PM', 'Sat-Sun': '6:00 AM - 1:00 PM' } },
    { id: 'LOC-2', name: 'Arcadia', address: '3629 E Indian School Rd, Phoenix, AZ 85018', phone: '(602) 237-6489', rooms: ['Reformer Room', 'Mat Studio', 'Barre Studio', 'TRX Area'], hours: { 'Mon-Fri': '5:30 AM - 8:30 PM', 'Sat-Sun': '6:00 AM - 3:00 PM' } },
    { id: 'LOC-3', name: 'North Central', address: '5576 N 7th St, Suite 101, Phoenix, AZ 85014', phone: '(602) 535-6210', rooms: ['Reformer Room', 'Mat Studio', 'Barre Studio'], hours: { 'Mon-Fri': '6:00 AM - 8:00 PM', 'Sat-Sun': '7:00 AM - 1:00 PM' } },
  ]);

  // Members (30)
  const firstNames = ['Emma', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria', 'Riley', 'Aria', 'Lily', 'Aubrey', 'Zoe', 'Penelope', 'Layla', 'Nora', 'Camila', 'Hannah', 'Addison', 'Luna', 'Savannah', 'Brooklyn'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen'];
  const goals = ['Core strength', 'Flexibility', 'Post-rehab', 'Weight loss', 'General fitness', 'Prenatal', 'Toning'];
  const membershipTiers = ['Drop-in', 'Drop-in', '8-Class Pack', 'Unlimited Monthly', 'Annual Unlimited'];
  const classNames = ['Mat Pilates', 'Reformer', 'Tower', 'Chair', 'Barre Sculpt', 'Barre Cardio', 'TRX', 'Pilates + HIIT', 'Balance + Stretch', 'Pilates + TRX'];
  const patients = firstNames.map((fn, i) => ({
    id: `PAT-${1000 + i}`,
    firstName: fn,
    lastName: lastNames[i],
    email: `${fn.toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
    phone: `(480) 555-${String(1000 + i).slice(1)}`,
    dob: `${1970 + Math.floor(Math.random() * 30)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    goals: goals[Math.floor(Math.random() * goals.length)],
    notes: '',
    membershipTier: membershipTiers[Math.floor(Math.random() * membershipTiers.length)],
    totalSpent: Math.floor(Math.random() * 50000),
    visitCount: Math.floor(1 + Math.random() * 60),
    lastVisit: d(-Math.floor(Math.random() * 120)),
    favoriteClass: classNames[Math.floor(Math.random() * classNames.length)],
    createdAt: d(-Math.floor(30 + Math.random() * 365)),
    location: ['LOC-1', 'LOC-1', 'LOC-2', 'LOC-2', 'LOC-3'][Math.floor(Math.random() * 5)],
  }));
  set('ms_patients', patients);

  // Appointments (next 14 days + past 7 days)
  const svcIds = ['SVC-1', 'SVC-2', 'SVC-3', 'SVC-4', 'SVC-5', 'SVC-6', 'SVC-7', 'SVC-8', 'SVC-9', 'SVC-10', 'SVC-11'];
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
      const rooms = ['Studio A', 'Studio B', 'Reformer Room', 'Main Floor', 'Barre Studio'];
      appts.push({
        id: `APT-${2000 + appts.length}`,
        patientId: pat.id,
        patientName: `${pat.firstName} ${pat.lastName}`,
        serviceId: svc,
        providerId: prov,
        date: d(dayOff),
        time: t(hour, min),
        duration: [45, 55][Math.floor(Math.random() * 2)],
        status,
        location: ['LOC-1', 'LOC-1', 'LOC-2', 'LOC-2', 'LOC-3'][Math.floor(Math.random() * 5)],
        room: rooms[Math.floor(Math.random() * rooms.length)],
        notes: '',
        createdAt: new Date().toISOString(),
      });
    }
  }
  set('ms_appointments', appts);

  // Class Packages
  const packages = [
    { id: 'CP-1', patientId: 'PAT-1000', patientName: 'Emma Johnson', name: 'Equipment Foundations — 6 Pack', sessions: [
      { serviceId: 'SVC-2', name: 'Reformer Fundamentals #1', status: 'completed', date: d(-42), notes: 'Intro to springs and footwork' },
      { serviceId: 'SVC-3', name: 'Tower Fundamentals #1', status: 'completed', date: d(-35), notes: 'Push-through bar basics' },
      { serviceId: 'SVC-2', name: 'Reformer Fundamentals #2', status: 'completed', date: d(-28), notes: 'Full body flow — great progress' },
      { serviceId: 'SVC-4', name: 'Chair Intro', status: 'upcoming', date: d(3), notes: '' },
      { serviceId: 'SVC-3', name: 'Tower Fundamentals #2', status: 'upcoming', date: d(10), notes: '' },
      { serviceId: 'SVC-2', name: 'Reformer Fundamentals #3', status: 'upcoming', date: d(17), notes: '' },
    ], createdAt: d(-45), providerId: 'PRV-1' },
    { id: 'CP-2', patientId: 'PAT-1003', patientName: 'Ava Jones', name: 'Barre Body Sculpt Series', sessions: [
      { serviceId: 'SVC-5', name: 'Barre Sculpt #1', status: 'completed', date: d(-28), notes: 'Lower body focus — building endurance' },
      { serviceId: 'SVC-6', name: 'Barre Cardio #1', status: 'completed', date: d(-21), notes: 'Great energy, kept pace well' },
      { serviceId: 'SVC-5', name: 'Barre Sculpt #2', status: 'completed', date: d(-14), notes: 'Added heavier weights' },
      { serviceId: 'SVC-6', name: 'Barre Cardio #2', status: 'upcoming', date: d(1), notes: '' },
      { serviceId: 'SVC-5', name: 'Barre Sculpt #3', status: 'upcoming', date: d(8), notes: '' },
      { serviceId: 'SVC-7', name: 'Barre + Pilates Fusion #1', status: 'upcoming', date: d(15), notes: '' },
      { serviceId: 'SVC-5', name: 'Barre Sculpt #4', status: 'upcoming', date: d(22), notes: '' },
      { serviceId: 'SVC-7', name: 'Barre + Pilates Fusion #2', status: 'upcoming', date: d(29), notes: '' },
    ], createdAt: d(-30), providerId: 'PRV-2' },
    { id: 'CP-3', patientId: 'PAT-1007', patientName: 'Amelia Thompson', name: 'Prenatal Wellness Journey', sessions: [
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 4', status: 'completed', date: d(-56), notes: 'Gentle start, pelvic floor awareness' },
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 4 (2)', status: 'completed', date: d(-49), notes: 'Good form, feeling strong' },
      { serviceId: 'SVC-11', name: 'Balance + Stretch', status: 'completed', date: d(-42), notes: 'Recovery week — hip openers' },
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 5', status: 'completed', date: d(-35), notes: 'Modified inversions' },
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 5 (2)', status: 'completed', date: d(-28), notes: 'Feeling great' },
      { serviceId: 'SVC-11', name: 'Balance + Stretch', status: 'completed', date: d(-21), notes: 'Gentle flow' },
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 6', status: 'in-progress', date: d(0), notes: '' },
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 6 (2)', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-11', name: 'Balance + Stretch', status: 'upcoming', date: d(14), notes: '' },
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 7', status: 'upcoming', date: d(21), notes: '' },
      { serviceId: 'SVC-15', name: 'Prenatal Pilates — Month 7 (2)', status: 'upcoming', date: d(28), notes: '' },
      { serviceId: 'SVC-11', name: 'Balance + Stretch — Final', status: 'upcoming', date: d(35), notes: '' },
    ], createdAt: d(-60), providerId: 'PRV-5' },
    { id: 'CP-4', patientId: 'PAT-1004', patientName: 'Isabella Martinez', name: 'Post-Rehab Recovery Program', sessions: [
      { serviceId: 'SVC-11', name: 'Balance + Stretch — Assessment', status: 'completed', date: d(-35), notes: 'Post-knee surgery, limited range of motion' },
      { serviceId: 'SVC-1', name: 'Mat Pilates — Gentle', status: 'completed', date: d(-28), notes: 'Modified exercises, no deep squats' },
      { serviceId: 'SVC-11', name: 'Balance + Stretch #2', status: 'completed', date: d(-21), notes: 'ROM improving' },
      { serviceId: 'SVC-1', name: 'Mat Pilates — Building Strength', status: 'completed', date: d(-14), notes: 'Added resistance band work' },
      { serviceId: 'SVC-2', name: 'Reformer — Intro', status: 'in-progress', date: d(0), notes: 'Light springs, footwork and leg series' },
      { serviceId: 'SVC-2', name: 'Reformer — Progressive', status: 'upcoming', date: d(7), notes: '' },
      { serviceId: 'SVC-3', name: 'Tower — Core Focus', status: 'upcoming', date: d(14), notes: '' },
      { serviceId: 'SVC-2', name: 'Reformer — Full Class', status: 'upcoming', date: d(28), notes: '' },
    ], createdAt: d(-40), providerId: 'PRV-4' },
    { id: 'CP-5', patientId: 'PAT-1005', patientName: 'Mia Garcia', name: 'Pilates 30-Day Challenge', sessions: [
      { serviceId: 'SVC-1', name: 'Day 1 — Mat Pilates', status: 'completed', date: d(-21), notes: 'Challenge kickoff! Great energy' },
      { serviceId: 'SVC-2', name: 'Day 3 — Reformer', status: 'completed', date: d(-19), notes: 'First reformer class' },
      { serviceId: 'SVC-1', name: 'Day 6 — Mat Pilates', status: 'completed', date: d(-16), notes: 'Noticing core engagement improving' },
      { serviceId: 'SVC-3', name: 'Day 9 — Tower', status: 'completed', date: d(-13), notes: 'Loved the push-through bar' },
      { serviceId: 'SVC-11', name: 'Day 12 — Balance + Stretch', status: 'completed', date: d(-10), notes: 'Active recovery day' },
      { serviceId: 'SVC-2', name: 'Day 15 — Reformer', status: 'completed', date: d(-7), notes: 'Halfway there! Feeling stronger' },
      { serviceId: 'SVC-4', name: 'Day 18 — Chair', status: 'in-progress', date: d(-4), notes: '' },
      { serviceId: 'SVC-10', name: 'Day 21 — Pilates + HIIT', status: 'upcoming', date: d(-1), notes: '' },
      { serviceId: 'SVC-2', name: 'Day 24 — Reformer', status: 'upcoming', date: d(2), notes: '' },
      { serviceId: 'SVC-8', name: 'Day 27 — TRX', status: 'upcoming', date: d(5), notes: '' },
      { serviceId: 'SVC-1', name: 'Day 30 — Mat Pilates Finale', status: 'upcoming', date: d(8), notes: '' },
    ], createdAt: d(-22), providerId: 'PRV-3' },
    { id: 'CP-6', patientId: 'PAT-1010', patientName: 'Lily Lee', name: 'Teacher Training Practicum', sessions: [
      { serviceId: 'SVC-17', name: 'Module 1 — Mat Fundamentals', status: 'completed', date: d(-60), notes: 'Classical mat repertoire, cueing basics' },
      { serviceId: 'SVC-17', name: 'Module 2 — Reformer Essentials', status: 'completed', date: d(-45), notes: 'Spring settings, safety, progressions' },
      { serviceId: 'SVC-17', name: 'Module 3 — Tower & Chair', status: 'completed', date: d(-30), notes: 'Full apparatus training' },
      { serviceId: 'SVC-17', name: 'Module 4 — Teaching Practicum', status: 'in-progress', date: d(-7), notes: 'Observing and assisting Kelly\'s classes' },
      { serviceId: 'SVC-17', name: 'Module 5 — Student Teaching', status: 'upcoming', date: d(14), notes: '' },
      { serviceId: 'SVC-17', name: 'Final Exam & Certification', status: 'upcoming', date: d(45), notes: '' },
    ], createdAt: d(-65), providerId: 'PRV-1' },
  ];
  set('ms_class_packages', packages);

  // Inventory (studio equipment + retail across 3 locations)
  set('ms_inventory', [
    // Scottsdale
    { id: 'INV-1', name: 'Balanced Body Reformer', category: 'Equipment', sku: 'REF-BB1', quantity: 14, reorderAt: 0, unitCost: 450000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-2', name: 'Pilates Tower Unit', category: 'Equipment', sku: 'TWR-BB1', quantity: 8, reorderAt: 0, unitCost: 280000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-3', name: 'Wunda Chair', category: 'Equipment', sku: 'CHR-BB1', quantity: 6, reorderAt: 0, unitCost: 120000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-4', name: 'TRX Suspension Straps', category: 'Equipment', sku: 'TRX-PRO', quantity: 15, reorderAt: 5, unitCost: 15000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-5', name: 'Resistance Bands (Assorted)', category: 'Equipment', sku: 'RB-AST', quantity: 40, reorderAt: 15, unitCost: 1000, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-6', name: 'Pilates Ball (9 inch)', category: 'Equipment', sku: 'PB-9', quantity: 30, reorderAt: 10, unitCost: 600, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-7', name: 'Mat', category: 'Equipment', sku: 'YM-STD', quantity: 50, reorderAt: 20, unitCost: 2500, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-8', name: 'Foam Roller', category: 'Equipment', sku: 'FR-36', quantity: 25, reorderAt: 10, unitCost: 1800, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-9', name: 'Grip Socks', category: 'Retail', sku: 'GS-AST', quantity: 60, reorderAt: 20, unitCost: 500, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-10', name: 'Remedy Water Bottle', category: 'Retail', sku: 'WB-REM', quantity: 35, reorderAt: 10, unitCost: 1200, location: 'LOC-1', adjustmentLog: [] },
    { id: 'INV-11', name: 'Studio Towel', category: 'Supplies', sku: 'TW-STD', quantity: 80, reorderAt: 30, unitCost: 400, location: 'LOC-1', adjustmentLog: [] },
    // Arcadia
    { id: 'INV-12', name: 'Balanced Body Reformer', category: 'Equipment', sku: 'REF-BB2', quantity: 10, reorderAt: 0, unitCost: 450000, location: 'LOC-2', adjustmentLog: [] },
    { id: 'INV-13', name: 'Pilates Tower Unit', category: 'Equipment', sku: 'TWR-BB2', quantity: 6, reorderAt: 0, unitCost: 280000, location: 'LOC-2', adjustmentLog: [] },
    { id: 'INV-14', name: 'TRX Suspension Straps', category: 'Equipment', sku: 'TRX-ARC', quantity: 12, reorderAt: 4, unitCost: 15000, location: 'LOC-2', adjustmentLog: [] },
    { id: 'INV-15', name: 'Grip Socks', category: 'Retail', sku: 'GS-ARC', quantity: 40, reorderAt: 15, unitCost: 500, location: 'LOC-2', adjustmentLog: [] },
    { id: 'INV-16', name: 'Mat', category: 'Equipment', sku: 'YM-ARC', quantity: 30, reorderAt: 15, unitCost: 2500, location: 'LOC-2', adjustmentLog: [] },
    { id: 'INV-17', name: 'Remedy Water Bottle', category: 'Retail', sku: 'WB-ARC', quantity: 20, reorderAt: 8, unitCost: 1200, location: 'LOC-2', adjustmentLog: [] },
    // North Central
    { id: 'INV-18', name: 'Balanced Body Reformer', category: 'Equipment', sku: 'REF-NC', quantity: 8, reorderAt: 0, unitCost: 450000, location: 'LOC-3', adjustmentLog: [] },
    { id: 'INV-19', name: 'Grip Socks', category: 'Retail', sku: 'GS-NC', quantity: 30, reorderAt: 12, unitCost: 500, location: 'LOC-3', adjustmentLog: [] },
    { id: 'INV-20', name: 'Mat', category: 'Equipment', sku: 'YM-NC', quantity: 25, reorderAt: 10, unitCost: 2500, location: 'LOC-3', adjustmentLog: [] },
    { id: 'INV-21', name: 'Remedy Water Bottle', category: 'Retail', sku: 'WB-NC', quantity: 15, reorderAt: 5, unitCost: 1200, location: 'LOC-3', adjustmentLog: [] },
  ]);

  // Retention Alerts (auto-generated from member data — varied statuses)
  const alerts = [];
  patients.forEach((p, idx) => {
    const daysSince = Math.floor((today - new Date(p.lastVisit)) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      const classes = ['Mat Pilates', 'Reformer', 'Tower', 'Barre Sculpt', 'TRX', 'Balance + Stretch'];
      const cls = classes[Math.floor(Math.random() * classes.length)];
      const isHigh = daysSince > 90;
      const isMedium = daysSince > 60 && daysSince <= 90;
      // Vary statuses: some contacted, some dismissed, most pending
      const statusRoll = idx % 5;
      const contacted = statusRoll === 1 || statusRoll === 3;
      const dismissed = statusRoll === 4 && !isHigh;
      alerts.push({
        id: `RET-${alerts.length}`,
        patientId: p.id,
        patientName: `${p.firstName} ${p.lastName}`,
        lastVisit: p.lastVisit,
        daysSince,
        lastService: cls,
        suggestedAction: isHigh ? `${cls} follow-up overdue — send re-engagement offer` : isMedium ? `Time for ${cls} — invite back to class` : `${cls} check-in — keep the momentum going`,
        priority: isHigh ? 'high' : isMedium ? 'medium' : 'low',
        status: dismissed ? 'dismissed' : contacted ? 'contacted' : 'pending',
        contacted,
        contactedAt: contacted ? d(-Math.floor(Math.random() * 10)) : null,
      });
    }
  });
  set('ms_retention_alerts', alerts);

  // Social media connections
  set('ms_social_connections', { instagram: true, facebook: true, x: false, linkedin: false, tiktok: false });

  // Settings
  set('ms_settings', {
    businessName: 'Remedy Pilates & Barre',
    tagline: "If you're over the common workout, you've found the Remedy.",
    email: 'hello@remedypilates.com',
    phone: '(480) 699-8160',
    founded: '2008',
    founder: 'Kelly Snailum',
  });

  localStorage.setItem('ms_initialized', 'true');
}

// Seeds data for keys that are empty — runs every load to fill gaps
function seedIfEmpty(d, today) {
  // Ensure settings always exist
  if (!localStorage.getItem('ms_settings')) {
    set('ms_settings', { businessName: 'Remedy Pilates & Barre', tagline: "If you're over the common workout, you've found the Remedy.", email: 'hello@remedypilates.com', phone: '(480) 699-8160', founded: '2008', founder: 'Kelly Snailum' });
  }
  if (get('ms_emails', []).length > 0 && get('ms_texts', []).length > 0 && get('ms_social_posts', []).length > 0 && get('ms_checkins', []).length > 0) return;

  // Seed Sent Emails
  if (get('ms_emails', []).length === 0) set('ms_emails', [
    { id: 'EM-1', subject: 'March Newsletter — New Spring Class Schedule', body: 'Hi there, here is what is new this month at Remedy Pilates & Barre...', audience: 'All Members', status: 'Sent', recipientCount: 30, sentDate: d(-3) + 'T10:00:00Z' },
    { id: 'EM-2', subject: 'Exclusive: Free Guest Pass This Week Only', body: 'Bring a friend to any class this week — on us...', audience: 'Members', status: 'Sent', recipientCount: 12, sentDate: d(-7) + 'T14:00:00Z' },
    { id: 'EM-3', subject: 'Your Class is Tomorrow!', body: 'Hi [Member], reminder about your upcoming Reformer Pilates class...', audience: 'Upcoming Classes', status: 'Sent', recipientCount: 8, sentDate: d(-1) + 'T09:00:00Z' },
    { id: 'EM-4', subject: 'We Miss You — Come Back & Save 20%', body: 'It has been a while since your last class. Here is 20% off your next class pack...', audience: 'Lapsed Members', status: 'Sent', recipientCount: 15, sentDate: d(-14) + 'T11:00:00Z' },
    { id: 'EM-5', subject: 'Welcome to Remedy Pilates & Barre!', body: 'Thank you for joining our studio community. Here is what to expect at your first class...', audience: 'New Members', status: 'Sent', recipientCount: 3, sentDate: d(-21) + 'T16:00:00Z' },
  ]);

  // Seed Sent Text Messages
  if (get('ms_texts', []).length === 0) set('ms_texts', [
    { id: 'TXT-1', message: 'Hi! Reminder: your Reformer Pilates class is tomorrow at 9am. Reply C to confirm or R to reschedule.', audience: 'upcoming', recipientCount: 6, template: 'reminder', status: 'Sent', sentDate: d(-1) + 'T08:00:00Z' },
    { id: 'TXT-2', message: 'How are you feeling after yesterday\'s Barre Sculpt class? Remember to hydrate and stretch! Reply with any questions.', audience: 'all', recipientCount: 4, template: 'followup', status: 'Sent', sentDate: d(-2) + 'T10:00:00Z' },
    { id: 'TXT-3', message: 'Spring into strength! Try our new Hot Pilates class — first class FREE. Reply BOOK or call us to reserve your spot.', audience: 'all', recipientCount: 30, template: 'promo', status: 'Sent', sentDate: d(-5) + 'T12:00:00Z' },
    { id: 'TXT-4', message: 'Thanks for taking class with us! Love your Remedy experience? Leave us a quick review: [Google link]', audience: 'all', recipientCount: 8, template: 'review', status: 'Sent', sentDate: d(-3) + 'T15:00:00Z' },
    { id: 'TXT-5', message: 'Hi! It has been a while — we would love to see you back on the reformer. Enjoy 20% off a 5-class pack. Reply BOOK to schedule.', audience: 'lapsed', recipientCount: 12, template: 'reactivation', status: 'Sent', sentDate: d(-10) + 'T11:00:00Z' },
  ]);

  // Seed Social Media Posts
  if (get('ms_social_posts', []).length === 0) set('ms_social_posts', [
    { id: 'SP-1', contentType: 'class', platforms: ['instagram', 'facebook'], posts: [{ platform: 'instagram', text: 'Your body is capable of so much more than you think.\n\nReformer Pilates — every morning at 6am, 9am & 12pm.\n\nBook your spot — link in bio\n\n#RemedyPilates #Reformer #PilatesLife #ScottsdaleFitness' }, { platform: 'facebook', text: 'Reformer Pilates classes running daily at Remedy. All levels welcome — your first class is complimentary.' }], status: 'published', publishedAt: d(-2) + 'T10:00:00Z', createdAt: d(-2) + 'T09:00:00Z' },
    { id: 'SP-2', contentType: 'transformation', platforms: ['instagram'], posts: [{ platform: 'instagram', text: '8 weeks. Consistent practice. Real results.\n\nOur member Sarah started with zero pilates experience.\nNow she is crushing Power Reformer.\n\n#TransformationTuesday #RemedyPilates #PilatesResults' }], status: 'published', publishedAt: d(-5) + 'T14:00:00Z', createdAt: d(-5) + 'T13:00:00Z' },
    { id: 'SP-3', contentType: 'promo', platforms: ['instagram', 'facebook', 'tiktok'], posts: [{ platform: 'instagram', text: 'SPRING INTO STRENGTH\n\nBring a friend FREE all month\n\nLink in bio to book\n\n#RemedyPilates #BringAFriend #BarreLife' }, { platform: 'facebook', text: 'Spring special — bring a friend to any class FREE this month at Remedy Pilates & Barre!' }, { platform: 'tiktok', text: 'POV: You just finished a Barre Sculpt class and your legs are shaking (in the best way)' }], status: 'scheduled', scheduledAt: d(2) + 'T10:00:00Z', createdAt: d(-1) + 'T16:00:00Z' },
    { id: 'SP-4', contentType: 'education', platforms: ['instagram', 'linkedin'], posts: [{ platform: 'instagram', text: 'DID YOU KNOW?\n\nPilates was originally called "Contrology" by Joseph Pilates.\n\nIt is all about control, precision, and breath.\n\n#PilatesFacts #RemedyPilates #MindBodyConnection' }, { platform: 'linkedin', text: 'Why corporate wellness programs should include Pilates: improved posture, reduced back pain, and better focus. Remedy Pilates offers corporate class packages.' }], status: 'draft', createdAt: d(0) + 'T08:00:00Z' },
    { id: 'SP-5', contentType: 'team', platforms: ['instagram'], posts: [{ platform: 'instagram', text: 'Meet Kelly Snailum\n\nOur founder and PMA-Certified Master Trainer has been leading Remedy since 2008. Voted best Pilates in Arizona three years running.\n\n#MeetTheTeam #RemedyPilates #PilatesInstructor' }], status: 'published', publishedAt: d(-8) + 'T11:00:00Z', createdAt: d(-8) + 'T10:00:00Z' },
  ]);

  // Seed Check-Ins (for today's classes)
  if (get('ms_checkins', []).length > 0) return;
  const appts = get('ms_appointments', []);
  const todayAppts = appts.filter(a => a.date === today.toISOString().slice(0, 10));
  const checkins = [];
  todayAppts.slice(0, Math.min(5, todayAppts.length)).forEach((a, i) => {
    const checkInStatuses = ['checked-in', 'in-class', 'complete', 'checked-in', 'in-class'];
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
