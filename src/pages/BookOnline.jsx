import { useState, useEffect, useMemo, useRef } from 'react';
import { useStyles } from '../theme';
import { getServices, getProviders, getAppointments, addAppointment, getSettings, subscribe } from '../data/store';

const fmt = (cents) => cents === 0 ? 'Complimentary' : `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const DISPLAY_CATEGORIES = [
  { label: 'All', match: () => true },
  { label: 'Strength', match: (c) => c === 'Strength' },
  { label: 'HIIT', match: (c) => c === 'HIIT' },
  { label: 'Boxing', match: (c) => c === 'Boxing' },
  { label: 'Nutrition', match: (c) => c === 'Nutrition' },
  { label: 'Private', match: (c) => c === 'Private' },
  { label: 'Specialty', match: (c) => c === 'Specialty' || c === 'Group' || c === 'Training' },
];

export default function BookOnline() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [booked, setBooked] = useState(null);
  const containerRef = useRef(null);

  const services = getServices();
  const providers = getProviders();
  const settings = getSettings();
  const appointments = getAppointments();
  const businessName = settings.businessName || 'Stoa';

  const days = useMemo(() => {
    const arr = []; const now = new Date();
    for (let i = 0; i < 14; i++) { const d = new Date(now); d.setDate(d.getDate() + i); arr.push({ date: d.toISOString().slice(0, 10), dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: d.getDate(), monthName: d.toLocaleDateString('en-US', { month: 'short' }), isToday: i === 0 }); }
    return arr;
  }, []);

  const filteredServices = useMemo(() => {
    let list = services;
    if (activeCategory !== 'All') { const cat = DISPLAY_CATEGORIES.find(c => c.label === activeCategory); if (cat) list = list.filter(svc => cat.match(svc.category)); }
    if (searchTerm.trim()) { const q = searchTerm.toLowerCase(); list = list.filter(svc => svc.name.toLowerCase().includes(q) || (svc.description || '').toLowerCase().includes(q) || (svc.category || '').toLowerCase().includes(q)); }
    return list;
  }, [services, activeCategory, searchTerm]);

  const activeCategories = useMemo(() => DISPLAY_CATEGORIES.filter(dc => dc.label === 'All' || services.some(svc => dc.match(svc.category))), [services]);

  const displayProviders = useMemo(() => {
    if (!selectedService) return [];
    const eligible = providers.filter(p => { if (!p.specialties || p.specialties.length === 0) return true; return p.specialties.some(sp => selectedService.name.toLowerCase().includes(sp.toLowerCase()) || sp.toLowerCase().includes(selectedService.name.toLowerCase()) || (selectedService.category || '').toLowerCase().includes(sp.toLowerCase())); });
    return eligible.length > 0 ? eligible : providers;
  }, [selectedService, providers]);

  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedProvider) return [];
    const slots = [];
    for (let h = 9; h < 18; h++) for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const conflict = appointments.some(a => a.date === selectedDate && a.providerId === selectedProvider.id && a.time === time && a.status !== 'cancelled');
      slots.push({ time, label: formatTime(time), available: !conflict });
    }
    return slots;
  }, [selectedDate, selectedProvider, appointments]);

  function formatTime(t) { const [h, m] = t.split(':').map(Number); return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }
  function goToStep(n) { setStep(n); containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }

  function handleBook() {
    const errors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.email.trim() || !form.email.includes('@')) errors.email = true;
    if (!form.phone.trim()) errors.phone = true;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    const apt = addAppointment({ memberName: form.name, memberEmail: form.email, memberPhone: form.phone, serviceId: selectedService.id, serviceName: selectedService.name, providerId: selectedProvider.id, providerName: selectedProvider.name, date: selectedDate, time: selectedTime, duration: selectedService.duration || 30, status: 'pending', notes: form.notes, source: 'online-booking' });
    setBooked(apt);
  }

  function generateICS() {
    if (!booked) return;
    const dateStr = booked.date.replace(/-/g, ''); const [h, m] = booked.time.split(':');
    const dur = selectedService?.duration || 30; const endH = parseInt(h) + Math.floor((parseInt(m) + dur) / 60); const endM = (parseInt(m) + dur) % 60;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${dateStr}T${h}${m}00`, `DTEND:${dateStr}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`, `SUMMARY:${selectedService?.name} at ${businessName}`, `DESCRIPTION:Trainer: ${selectedProvider?.name}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `booking-${booked.id}.ics`; a.click(); URL.revokeObjectURL(url);
  }

  function resetBooking() { setStep(1); setSelectedService(null); setSelectedProvider(null); setSelectedDate(null); setSelectedTime(null); setForm({ name: '', email: '', phone: '', notes: '' }); setFormErrors({}); setBooked(null); }

  const fmtDateLong = (d) => { if (!d) return ''; return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); };

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: s.bg, fontFamily: s.FONT, position: 'relative', overflow: 'hidden' }}>
      <button onClick={() => window.location.href = '/'} style={{ position: 'fixed', top: 16, left: 16, zIndex: 100, padding: '6px 16px', borderRadius: 100, border: `1px solid ${s.borderLight}`, background: s.surface, fontFamily: s.FONT, fontSize: 12, color: s.text3, cursor: 'pointer' }}>&larr; Home</button>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 60px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: s.accent, marginBottom: 12, fontWeight: 600 }}>Book Your Session</div>
          <h1 style={{ fontFamily: s.HEADING, fontSize: 32, fontWeight: 300, color: s.text, margin: 0, letterSpacing: -0.5 }}>{businessName}</h1>
        </div>

        {/* Step indicator */}
        {!booked && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div onClick={() => { if (n < step) goToStep(n); }} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: s.MONO, fontSize: 13, fontWeight: 600, cursor: n < step ? 'pointer' : 'default', background: n === step ? s.accent : n < step ? s.accentLight : s.surface, color: n === step ? s.accentText : n < step ? s.accent : s.text3, border: n === step ? 'none' : `1.5px solid ${n < step ? s.accent + '30' : s.borderLight}`, boxShadow: n === step ? `0 4px 16px ${s.accent}40` : 'none', transition: 'all 0.35s ease' }}>
                  {n < step ? '\u2713' : n}
                </div>
                {n < 3 && <div style={{ width: 40, height: 2, background: n < step ? s.accent + '30' : s.borderLight, borderRadius: 1 }} />}
              </div>
            ))}
          </div>
        )}

        {!booked && (
          <div style={{ textAlign: 'center', marginBottom: 28, fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, fontWeight: 500 }}>
            {step === 1 && 'Choose Your Session'}{step === 2 && 'Select Trainer & Time'}{step === 3 && 'Confirm Your Booking'}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && !booked && (
          <div>
            {/* New Client Offers */}
            <div style={{ textAlign: 'center', marginBottom: 16, fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text }}>New Client?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[{ price: '$49', title: 'Intro Session', desc: 'Movement assessment, goal setting, and your first custom workout' }, { price: '$99', title: '10-Session Starter Pack', desc: 'Ten sessions at our best new-client rate' }].map((offer, i) => (
                <div key={i} style={{ ...s.cardStyle, padding: '28px 24px 24px', cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', top: 12, left: 12, fontFamily: s.MONO, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, background: s.accent, color: s.accentText, padding: '3px 10px', borderRadius: 100 }}>New Client</span>
                  <div style={{ fontFamily: s.HEADING, fontSize: 36, fontWeight: 700, color: s.accent, marginTop: 8, marginBottom: 4 }}>{offer.price}</div>
                  <div style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text, marginBottom: 8 }}>{offer.title}</div>
                  <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.5, marginBottom: 16 }}>{offer.desc}</div>
                  <div style={{ display: 'inline-block', padding: '10px 28px', borderRadius: 100, background: s.accent, color: s.accentText, fontFamily: s.FONT, fontSize: 13, fontWeight: 600 }}>Book Now</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input type="text" placeholder="Search sessions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...s.input, paddingLeft: 44, borderRadius: 100, fontSize: 14 }} />
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.35, pointerEvents: 'none' }}>{'\u2315'}</span>
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, scrollbarWidth: 'none' }}>
              {activeCategories.map(cat => (<button key={cat.label} onClick={() => setActiveCategory(cat.label)} style={{ ...s.pill, flexShrink: 0, background: activeCategory === cat.label ? s.accent : s.surface, color: activeCategory === cat.label ? s.accentText : s.text2, border: activeCategory === cat.label ? 'none' : `1px solid ${s.borderLight}` }}>{cat.label}</button>))}
            </div>

            {/* Service cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredServices.length === 0 && (<div style={{ ...s.cardStyle, padding: 40, textAlign: 'center', color: s.text3, fontSize: 14 }}>No sessions found.</div>)}
              {filteredServices.map((svc) => {
                const selected = selectedService?.id === svc.id;
                return (
                  <div key={svc.id} onClick={() => setSelectedService(selected ? null : svc)} style={{ ...s.cardStyle, padding: '20px 24px', cursor: 'pointer', border: selected ? `2px solid ${s.accent}` : `1px solid ${s.border}`, background: selected ? `${s.accent}08` : s.surface, position: 'relative' }}>
                    {selected && (<div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: '50%', background: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: s.accentText, fontSize: 13, fontWeight: 700 }}>{'\u2713'}</span></div>)}
                    <div style={{ fontFamily: s.HEADING, fontSize: 16, fontWeight: 600, color: s.text, marginBottom: 4 }}>{svc.name}</div>
                    <div style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{svc.category}</div>
                    {svc.description && <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.5 }}>{svc.description}</div>}
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center' }}>
                      <span style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.accent }}>{fmt(svc.price)}</span>
                      <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, background: s.surfaceAlt, padding: '3px 10px', borderRadius: 100 }}>{svc.duration} min</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedService && (<div style={{ marginTop: 28, textAlign: 'center' }}><button onClick={() => goToStep(2)} style={{ ...s.pillAccent, padding: '14px 48px', fontSize: 15, fontWeight: 600 }}>Continue</button></div>)}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && !booked && (
          <div>
            <div style={{ ...s.cardStyle, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><span style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text }}>{selectedService?.name}</span><span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, marginLeft: 12 }}>{selectedService?.duration} min &middot; {fmt(selectedService?.price || 0)}</span></div>
              <button onClick={() => goToStep(1)} style={{ ...s.pillGhost, padding: '6px 14px', fontSize: 12 }}>Change</button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={s.label}>Choose Trainer</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                {displayProviders.map(prov => {
                  const sel = selectedProvider?.id === prov.id;
                  return (
                    <div key={prov.id} onClick={() => { setSelectedProvider(sel ? null : prov); setSelectedTime(null); }} style={{ ...s.cardStyle, padding: '16px 20px', cursor: 'pointer', flex: '1 1 200px', minWidth: 180, border: sel ? `2px solid ${s.accent}` : `1px solid ${s.border}`, background: sel ? `${s.accent}08` : s.surface }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: sel ? s.accent : s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontFamily: s.FONT, fontSize: 16, color: sel ? s.accentText : s.accent, fontWeight: 600 }}>{prov.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                      <div style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text }}>{prov.name}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, marginTop: 2 }}>{prov.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProvider && (
              <div style={{ marginBottom: 24 }}>
                <div style={s.label}>Select Date</div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginTop: 8 }}>
                  {days.map(day => { const sel = selectedDate === day.date; return (
                    <div key={day.date} onClick={() => { setSelectedDate(day.date); setSelectedTime(null); }} style={{ flexShrink: 0, width: 64, padding: '12px 0', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: sel ? s.accent : s.surface, border: sel ? 'none' : `1px solid ${s.borderLight}`, boxShadow: sel ? `0 4px 16px ${s.accent}35` : 'none', transition: 'all 0.25s ease' }}>
                      <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: sel ? s.accentText : s.text3, marginBottom: 4, fontWeight: 500 }}>{day.dayName}</div>
                      <div style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: sel ? s.accentText : s.text }}>{day.dayNum}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 10, color: sel ? `${s.accentText}BB` : s.text3, marginTop: 2 }}>{day.monthName}</div>
                    </div>
                  ); })}
                </div>
              </div>
            )}

            {selectedDate && selectedProvider && (
              <div style={{ marginBottom: 24 }}>
                <div style={s.label}>Available Times</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginTop: 8 }}>
                  {timeSlots.map(slot => { const sel = selectedTime === slot.time; return (
                    <button key={slot.time} disabled={!slot.available} onClick={() => setSelectedTime(slot.time)} style={{ padding: '10px 0', borderRadius: 12, border: sel ? `2px solid ${s.accent}` : `1px solid ${s.borderLight}`, background: sel ? s.accentLight : slot.available ? s.surface : s.surfaceAlt, color: sel ? s.accent : slot.available ? s.text : s.text3, fontFamily: s.FONT, fontSize: 13, fontWeight: sel ? 600 : 500, cursor: slot.available ? 'pointer' : 'not-allowed', opacity: slot.available ? 1 : 0.4, transition: 'all 0.2s ease', textDecoration: slot.available ? 'none' : 'line-through' }}>{slot.label}</button>
                  ); })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'center' }}>
              <button onClick={() => goToStep(1)} style={{ ...s.pillGhost, padding: '12px 28px', fontSize: 14 }}>Back</button>
              {selectedProvider && selectedDate && selectedTime && (<button onClick={() => goToStep(3)} style={{ ...s.pillAccent, padding: '14px 48px', fontSize: 15, fontWeight: 600 }}>Continue</button>)}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && !booked && (
          <div>
            <div style={{ ...s.cardStyle, padding: 24, marginBottom: 28 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 16, fontWeight: 500 }}>Booking Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['Session', selectedService?.name], ['Trainer', selectedProvider?.name], ['Date', fmtDateLong(selectedDate)], ['Time', formatTime(selectedTime)], ['Duration', `${selectedService?.duration} min`], ['Price', fmt(selectedService?.price || 0)]].map(([label, value], i) => (
                  <div key={label}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3 }}>{label}</span><span style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: label === 'Price' ? 700 : 500, color: label === 'Price' ? s.accent : s.text }}>{value}</span></div>{i < 5 && <div style={{ height: 1, background: s.borderLight, marginTop: 14 }} />}</div>
                ))}
              </div>
            </div>

            <div style={{ ...s.cardStyle, padding: 24, marginBottom: 28 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: s.text3, marginBottom: 20, fontWeight: 500 }}>Your Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={s.label}>Full Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" style={{ ...s.input, ...(formErrors.name ? { borderColor: s.danger } : {}) }} /></div>
                <div><label style={s.label}>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@email.com" style={{ ...s.input, ...(formErrors.email ? { borderColor: s.danger } : {}) }} /></div>
                <div><label style={s.label}>Phone *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(480) 555-0100" style={{ ...s.input, ...(formErrors.phone ? { borderColor: s.danger } : {}) }} /></div>
                <div><label style={s.label}>Notes (optional)</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any injuries, concerns, or special requests..." rows={3} style={{ ...s.input, resize: 'vertical', minHeight: 80 }} /></div>
              </div>
              {Object.keys(formErrors).length > 0 && (<div style={{ marginTop: 12, fontFamily: s.FONT, fontSize: 12, color: s.danger, background: s.dangerBg, padding: '8px 14px', borderRadius: 10 }}>Please fill in all required fields.</div>)}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => goToStep(2)} style={{ ...s.pillGhost, padding: '12px 28px', fontSize: 14 }}>Back</button>
              <button onClick={handleBook} style={{ ...s.pillAccent, padding: '14px 48px', fontSize: 15, fontWeight: 600 }}>Book Session</button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {booked && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke={s.accent} strokeWidth="2" opacity="0.3" /><path d="M11 18 L16 23 L25 13" fill="none" stroke={s.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 26, fontWeight: 300, color: s.text, margin: 0 }}>You're All Set</h2>
            <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, marginTop: 8, marginBottom: 32 }}>Your booking has been requested. We'll confirm shortly.</p>

            <div style={{ ...s.cardStyle, padding: 28, textAlign: 'left', marginBottom: 28 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: s.accent, marginBottom: 20, fontWeight: 600 }}>Confirmation #{booked.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[['Session', selectedService?.name], ['Trainer', selectedProvider?.name], ['Date', fmtDateLong(booked.date)], ['Time', formatTime(booked.time)], ['Duration', `${selectedService?.duration || 30} minutes`], ['Price', fmt(selectedService?.price || 0)]].map(([label, value], i) => (
                  <div key={label}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3 }}>{label}</span><span style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: label === 'Price' ? 700 : 500, color: label === 'Price' ? s.accent : s.text }}>{value}</span></div>{i < 5 && <div style={{ height: 1, background: s.borderLight, marginTop: 16 }} />}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <button onClick={generateICS} style={{ ...s.pillAccent, padding: '14px 40px', fontSize: 14, fontWeight: 600, width: '100%', maxWidth: 320 }}>Add to Calendar</button>
              <a href="/portal" style={{ ...s.pillOutline, padding: '12px 40px', fontSize: 14, width: '100%', maxWidth: 320, textAlign: 'center', textDecoration: 'none', display: 'block', boxSizing: 'border-box' }}>Create Account</a>
              <button onClick={resetBooking} style={{ ...s.pillGhost, padding: '12px 40px', fontSize: 14, width: '100%', maxWidth: 320 }}>Book Another Session</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 48, fontFamily: s.MONO, fontSize: 11, color: s.text3, letterSpacing: 0.5 }}>
          {settings.phone && <div>{settings.phone}</div>}
        </div>
      </div>
    </div>
  );
}
