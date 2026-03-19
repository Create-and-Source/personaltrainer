import { useState, useEffect } from 'react';
import { useTheme, useStyles, THEMES } from '../theme';
import { getSettings, updateSettings, getProviders, addProvider, updateProvider, getServices, addService, updateService, deleteService, subscribe } from '../data/store';

export default function Settings() {
  const s = useStyles();
  const { theme, setTheme, setCustomColor } = useTheme();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [tab, setTab] = useState('general');
  const [settings, setSettingsLocal] = useState(getSettings());
  const [saved, setSaved] = useState(false);

  // Service form
  const [showSvcForm, setShowSvcForm] = useState(false);
  const [editSvc, setEditSvc] = useState(null);
  const [svcForm, setSvcForm] = useState({ name: '', category: 'Training', duration: 50, price: 0, unit: 'per session', description: '' });

  // Provider form
  const [showProvForm, setShowProvForm] = useState(false);
  const [editProv, setEditProv] = useState(null);
  const [provForm, setProvForm] = useState({ name: '', title: '', specialties: '', color: '#111' });

  const providers = getProviders();
  const services = getServices();

  const handleSaveSettings = () => {
    updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveService = () => {
    if (!svcForm.name.trim()) return;
    if (editSvc) {
      updateService(editSvc.id, { ...svcForm, specialties: typeof svcForm.specialties === 'string' ? svcForm.specialties.split(',').map(s => s.trim()) : svcForm.specialties });
    } else {
      addService(svcForm);
    }
    setShowSvcForm(false);
  };

  const handleSaveProvider = () => {
    if (!provForm.name.trim()) return;
    const data = { ...provForm, specialties: typeof provForm.specialties === 'string' ? provForm.specialties.split(',').map(s => s.trim()) : provForm.specialties };
    if (editProv) {
      updateProvider(editProv.id, data);
    } else {
      addProvider(data);
    }
    setShowProvForm(false);
  };

  const handleResetDemo = () => {
    if (confirm('This will clear ALL data and reset to demo defaults. Are you sure?')) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('ms_'));
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('ms_initialized');
      window.location.reload();
    }
  };

  // Payment connections state
  const [payments, setPayments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ms_payment_connections')) || {}; } catch { return {}; }
  });
  const togglePayment = (provider) => {
    const next = { ...payments, [provider]: !payments[provider] };
    setPayments(next);
    localStorage.setItem('ms_payment_connections', JSON.stringify(next));
  };

  // Social connections state
  const [socials, setSocials] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ms_social_connections')) || { instagram: true, facebook: true, tiktok: false, x: false, linkedin: false }; } catch { return {}; }
  });
  const toggleSocial = (platform) => {
    const next = { ...socials, [platform]: !socials[platform] };
    setSocials(next);
    localStorage.setItem('ms_social_connections', JSON.stringify(next));
  };

  // Integrations state
  const [integrations, setIntegrations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ms_integrations')) || { stripe: true, instagram: true }; } catch { return { stripe: true, instagram: true }; }
  });
  const toggleIntegration = (id, defaultConnected) => {
    const current = integrations[id] !== undefined ? integrations[id] : defaultConnected;
    const next = { ...integrations, [id]: !current };
    setIntegrations(next);
    localStorage.setItem('ms_integrations', JSON.stringify(next));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Branding' },
    { id: 'payments', label: 'Payments' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'services', label: 'Services' },

  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Settings</h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Configure your gym platform — brand it for any client demo</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: s.dark ? '#252529' : '#F0F0F0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 20px', background: tab === t.id ? s.cardSolid : 'transparent', border: 'none',
            font: `500 13px ${s.FONT}`, color: tab === t.id ? s.text : s.text3, cursor: 'pointer',
            borderRadius: tab === t.id ? 8 : 0, boxShadow: tab === t.id ? s.shadow : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* General */}
      {tab === 'general' && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ ...s.cardStyle, padding: 24 }}>
            {[
              { key: 'businessName', label: 'Business Name', placeholder: 'FORGE Performance Training' },
              { key: 'tagline', label: 'Tagline', placeholder: 'Build Strength. Build Confidence.' },
              { key: 'email', label: 'Email', placeholder: 'info@forgeperformance.com' },
              { key: 'phone', label: 'Phone', placeholder: '(480) 555-0100' },
              { key: 'website', label: 'Website', placeholder: 'forgeperformance.com' },
              { key: 'founded', label: 'Founded', placeholder: '2018' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={s.label}>{f.label}</label>
                <input value={settings[f.key] || ''} onChange={e => setSettingsLocal({ ...settings, [f.key]: e.target.value })} placeholder={f.placeholder} style={s.input} />
              </div>
            ))}
            <button onClick={handleSaveSettings} style={s.pillAccent}>
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>

          <div style={{ ...s.cardStyle, padding: 24, marginTop: 20 }}>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Operating Hours</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { day: 'Monday', hours: '6:00 AM – 7:30 PM' },
                { day: 'Tuesday', hours: '6:00 AM – 7:30 PM' },
                { day: 'Wednesday', hours: '6:00 AM – 7:30 PM' },
                { day: 'Thursday', hours: '6:00 AM – 7:30 PM' },
                { day: 'Friday', hours: '6:00 AM – 6:00 PM' },
                { day: 'Saturday', hours: '7:00 AM – 12:00 PM' },
                { day: 'Sunday', hours: 'Closed' },
              ].map(h => (
                <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${s.borderLight}` }}>
                  <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{h.day}</span>
                  <span style={{ font: `400 13px ${s.MONO}`, color: h.hours === 'Closed' ? s.text3 : s.text2 }}>{h.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button onClick={handleResetDemo} style={{ ...s.pillGhost, color: s.danger, borderColor: s.danger }}>
              Reset All Demo Data
            </button>
            <p style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 8 }}>
              Clears all localStorage data and reloads with fresh demo data. Use this between client demos.
            </p>
          </div>
        </div>
      )}

      {/* Branding */}
      {tab === 'branding' && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ ...s.cardStyle, padding: 24 }}>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Brand Color</div>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>
              Pick the gym's brand color. This changes the entire platform accent instantly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => setTheme(p)} style={{
                  padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                  background: s.cardSolid, border: theme.id === p.id ? `2.5px solid ${p.accent}` : `1.5px solid ${s.borderLight}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.accent }} />
                  <span style={{ font: `500 11px ${s.FONT}`, color: theme.id === p.id ? p.accent : s.text2 }}>{p.name}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: s.dark ? '#252529' : '#FAFAFA', borderRadius: 10 }}>
              <label style={{ font: `500 13px ${s.FONT}`, color: s.text }}>Custom Color</label>
              <input type="color" value={theme.accent} onChange={e => setCustomColor(e.target.value)} style={{ width: 40, height: 40, border: `1px solid ${s.borderLight}`, borderRadius: 10, cursor: 'pointer', padding: 2 }} />
              <span style={{ font: `400 12px ${s.MONO}`, color: s.text3 }}>{theme.accent}</span>
            </div>

            {/* Preview */}
            <div style={{ marginTop: 24, padding: 20, background: s.dark ? '#252529' : '#FAFAFA', borderRadius: 12, border: `1px solid ${s.borderLight}` }}>
              <div style={{ font: `600 13px ${s.FONT}`, color: s.text, marginBottom: 12 }}>Preview</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={s.pillAccent}>Primary Button</button>
                <button style={s.pillOutline}>Outline Button</button>
                <button style={s.pillGhost}>Ghost Button</button>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 100, background: s.accentLight, color: s.accent, font: `500 11px ${s.FONT}` }}>Active Tag</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent }} />
                <span style={{ font: `400 12px ${s.FONT}`, color: s.accent }}>Accent text</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments */}
      {tab === 'payments' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ ...s.cardStyle, padding: 24, marginBottom: 20 }}>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Payment Processing</div>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text3, marginBottom: 20 }}>
              Connect your existing payment processor. Your clients pay through your account — we never touch the money.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { id: 'square', name: 'Square', desc: 'POS terminals, card readers, invoicing', fee: '2.6% + $0.10 in-person', color: '#006AFF', badge: null },
                { id: 'stripe', name: 'Stripe', desc: 'Online payments, subscriptions, invoicing', fee: '2.7% + $0.05 in-person', color: '#635BFF', badge: null },
                { id: 'clover', name: 'Clover', desc: 'POS system, card terminals, reporting', fee: '2.3% + $0.10 in-person', color: '#43B02A', badge: null },
              ].map(p => (
                <div key={p.id} style={{ ...s.cardStyle, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ font: `700 16px ${s.FONT}`, color: p.color }}>{p.name[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{p.name}</span>
                      {p.badge && <span style={{ padding: '2px 8px', borderRadius: 100, background: s.dark ? 'rgba(74,222,128,0.12)' : '#F0FDF4', color: s.success, font: `500 9px ${s.FONT}` }}>{p.badge}</span>}
                    </div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{p.desc}</div>
                    <div style={{ font: `400 11px ${s.MONO}`, color: s.text3, marginTop: 2 }}>{p.fee}</div>
                  </div>
                  {payments[p.id] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.success }} />
                      <span style={{ font: `500 12px ${s.FONT}`, color: s.success }}>Connected</span>
                      <button onClick={() => togglePayment(p.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Disconnect</button>
                    </div>
                  ) : (
                    <button onClick={() => togglePayment(p.id)} style={{ ...s.pillAccent, padding: '8px 16px', fontSize: 12 }}>Connect</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.cardStyle, padding: 24 }}>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Membership Packages</div>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text3, marginBottom: 20 }}>
              Offer flexible payment options for session packages and memberships.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { id: 'afterpay', name: 'Afterpay', desc: 'Buy now, pay in 4 interest-free installments. Great for session packages.', color: '#B2FCE4' },
                { id: 'klarna', name: 'Klarna', desc: 'Flexible pay-over-time for memberships and private sessions.', color: '#FFB3C7' },
                { id: 'affirm', name: 'Affirm', desc: 'Monthly payment plans for premium memberships and training programs.', color: '#4A4AF4' },
              ].map(p => (
                <div key={p.id} style={{ ...s.cardStyle, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ font: `700 16px ${s.FONT}`, color: p.color }}>{p.name[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{p.desc}</div>
                  </div>
                  {payments[p.id] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.success }} />
                      <span style={{ font: `500 12px ${s.FONT}`, color: s.success }}>Active</span>
                      <button onClick={() => togglePayment(p.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Remove</button>
                    </div>
                  ) : (
                    <button onClick={() => togglePayment(p.id)} style={{ ...s.pillOutline, padding: '8px 16px', fontSize: 12 }}>Set Up</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Connected Apps & Services</div>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>
              Manage all your integrations in one place. Toggle connections on or off.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {[
              { id: 'openfoods', name: 'Open Food Facts', desc: 'Food database with barcode scanning', color: '#FF6F00', accent: '#FF6F00', connected: true, letter: 'OF' },
              { id: 'applehealth', name: 'Apple Health', desc: 'Import workout and activity data', color: '#111', accent: '#111', connected: false, letter: 'AH' },
              { id: 'fitbit', name: 'Fitbit', desc: 'Sync heart rate, sleep, and activity', color: '#00B0B9', accent: '#00B0B9', connected: false, letter: 'Fb' },
              { id: 'googlefit', name: 'Google Fit', desc: 'Sync workouts and steps', color: '#4285F4', accent: '#4285F4', connected: false, letter: 'GF' },
              { id: 'stripe', name: 'Stripe', desc: 'Accept payments and manage subscriptions', color: '#635BFF', accent: '#635BFF', connected: true, letter: 'St' },
              { id: 'zoom', name: 'Zoom', desc: 'Virtual training sessions', color: '#2D8CFF', accent: '#2D8CFF', connected: false, letter: 'Zm' },
              { id: 'instagram', name: 'Instagram', desc: 'DM management and content scheduling', color: '#E1306C', accent: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)', connected: true, letter: 'Ig' },
              { id: 'garmin', name: 'Garmin', desc: 'Sync training data from Garmin watches', color: '#111', accent: '#111', connected: false, letter: 'Gn' },
            ].map(intg => {
              const isOn = intg.connected ? (integrations[intg.id] !== false) : (integrations[intg.id] === true);
              return (
                <div key={intg.id} style={{
                  ...s.cardStyle, padding: '20px',
                  background: s.card, backdropFilter: s.dark ? 'none' : 'blur(20px)', WebkitBackdropFilter: s.dark ? 'none' : 'blur(20px)',
                  border: `1px solid ${s.border}`, borderRadius: 16,
                  boxShadow: s.shadow,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: intg.accent.startsWith?.('linear') ? intg.accent : `${intg.color}14`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ font: `700 13px ${s.FONT}`, color: intg.accent.startsWith?.('linear') ? '#fff' : intg.color }}>{intg.letter}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{intg.name}</div>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text2, marginTop: 2 }}>{intg.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {isOn ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.success }} />
                        <span style={{ font: `500 11px ${s.FONT}`, color: s.success }}>Connected</span>
                      </div>
                    ) : (
                      <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Not connected</span>
                    )}
                    <div
                      onClick={() => toggleIntegration(intg.id, intg.connected)}
                      style={{
                        width: 44, height: 24, borderRadius: 100, cursor: 'pointer',
                        background: isOn ? s.accent : '#D1D5DB',
                        position: 'relative', transition: 'background 0.25s ease',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: s.cardSolid,
                        position: 'absolute', top: 3,
                        left: isOn ? 23 : 3,
                        transition: 'left 0.25s cubic-bezier(0.16,1,0.3,1)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Services */}
      {tab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{services.length} services</span>
            <button onClick={() => { setEditSvc(null); setSvcForm({ name: '', category: 'Training', duration: 50, price: 0, unit: 'per session', description: '' }); setShowSvcForm(true); }} style={s.pillAccent}>+ Add Service</button>
          </div>
          <div style={s.tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                  {['Service', 'Category', 'Duration', 'Price', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(svc => (
                  <tr key={svc.id} style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{svc.name}</div>
                      {svc.description && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{svc.description}</div>}
                    </td>
                    <td style={{ padding: '12px 14px' }}><span style={{ padding: '3px 10px', borderRadius: 100, background: s.dark ? '#252529' : '#F5F5F5', font: `500 11px ${s.FONT}`, color: s.text2 }}>{svc.category}</span></td>
                    <td style={{ padding: '12px 14px', font: `400 13px ${s.MONO}`, color: s.text2 }}>{svc.duration}min</td>
                    <td style={{ padding: '12px 14px', font: `500 13px ${s.MONO}`, color: s.text }}>${(svc.price / 100).toFixed(0)} {svc.unit}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditSvc(svc); setSvcForm({ name: svc.name, category: svc.category, duration: svc.duration, price: svc.price, unit: svc.unit || 'per session', description: svc.description || '' }); setShowSvcForm(true); }} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 10 }}>Edit</button>
                        <button onClick={() => { if (confirm('Delete?')) deleteService(svc.id); }} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 10, color: s.danger }}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Providers */}
      {tab === 'providers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{providers.length} trainers</span>
            <button onClick={() => { setEditProv(null); setProvForm({ name: '', title: '', specialties: '', color: '#111' }); setShowProvForm(true); }} style={s.pillAccent}>+ Add Trainer</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {providers.map(p => (
              <div key={p.id} style={{ ...s.cardStyle, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 14px ${s.FONT}`, color: s.accent }}>
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{p.name}</div>
                    <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{p.title}</div>
                  </div>
                </div>
                {p.specialties && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {(Array.isArray(p.specialties) ? p.specialties : [p.specialties]).map(sp => (
                      <span key={sp} style={{ padding: '2px 8px', borderRadius: 100, background: s.dark ? '#252529' : '#F5F5F5', font: `400 10px ${s.FONT}`, color: s.text2 }}>{sp}</span>
                    ))}
                  </div>
                )}
                <button onClick={() => { setEditProv(p); setProvForm({ name: p.name, title: p.title, specialties: Array.isArray(p.specialties) ? p.specialties.join(', ') : p.specialties || '', color: p.color || '#111' }); setShowProvForm(true); }} style={{ ...s.pillOutline, padding: '5px 12px', fontSize: 11 }}>Edit</button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Service Form Modal */}
      {showSvcForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowSvcForm(false)}>
          <div style={{ background: s.cardSolid, borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 20 }}>{editSvc ? 'Edit Service' : 'Add Service'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Name</label>
                <input value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Category</label>
                <select value={svcForm.category} onChange={e => setSvcForm({ ...svcForm, category: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option>Training</option><option>Strength</option><option>HIIT</option><option>Conditioning</option><option>Wellness</option><option>Private</option><option>Specialty</option><option>Recovery</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Duration (min)</label>
                <input type="number" value={svcForm.duration} onChange={e => setSvcForm({ ...svcForm, duration: parseInt(e.target.value) || 30 })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Price (cents)</label>
                <input type="number" value={svcForm.price} onChange={e => setSvcForm({ ...svcForm, price: parseInt(e.target.value) || 0 })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Unit</label>
                <input value={svcForm.unit} onChange={e => setSvcForm({ ...svcForm, unit: e.target.value })} style={s.input} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Description</label>
                <input value={svcForm.description} onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} style={s.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSvcForm(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSaveService} style={s.pillAccent}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Form Modal */}
      {showProvForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowProvForm(false)}>
          <div style={{ background: s.cardSolid, borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 20 }}>{editProv ? 'Edit Trainer' : 'Add Trainer'}</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={s.label}>Full Name</label>
                <input value={provForm.name} onChange={e => setProvForm({ ...provForm, name: e.target.value })} style={s.input} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={s.label}>Title</label>
                <input value={provForm.title} onChange={e => setProvForm({ ...provForm, title: e.target.value })} style={s.input} placeholder="Lead Trainer" />
              </div>
              <div>
                <label style={s.label}>Specialties (comma separated)</label>
                <input value={provForm.specialties} onChange={e => setProvForm({ ...provForm, specialties: e.target.value })} style={s.input} placeholder="Strength, HIIT, Mobility" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowProvForm(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSaveProvider} style={s.pillAccent}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
