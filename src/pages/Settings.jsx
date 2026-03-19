// Settings — General, Branding, Services, Integrations
import { useState, useEffect } from 'react';
import { useTheme, useStyles, THEMES } from '../theme';
import { getSettings, updateSettings, getServices, addService, updateService, deleteService, subscribe } from '../data/store';

export default function Settings() {
  const s = useStyles();
  const { theme, setTheme } = useTheme();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [tab, setTab] = useState('general');
  const [settings, setSettingsLocal] = useState(getSettings());
  const [saved, setSaved] = useState(false);

  // Service form
  const [showSvcForm, setShowSvcForm] = useState(false);
  const [editSvc, setEditSvc] = useState(null);
  const [svcForm, setSvcForm] = useState({ name: '', category: 'Training', duration: 60, price: 0, unit: 'per session', description: '' });

  // Integrations state
  const [integrations, setIntegrations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pt_integrations')) || { stripe: true, instagram: true, openfoodfacts: true }; } catch { return { stripe: true, instagram: true, openfoodfacts: true }; }
  });

  const services = getServices();

  const handleSaveSettings = () => {
    updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveService = () => {
    if (!svcForm.name.trim()) return;
    if (editSvc) {
      updateService(editSvc.id, svcForm);
    } else {
      addService(svcForm);
    }
    setShowSvcForm(false);
    setEditSvc(null);
  };

  const toggleIntegration = (id) => {
    const next = { ...integrations, [id]: !integrations[id] };
    setIntegrations(next);
    localStorage.setItem('pt_integrations', JSON.stringify(next));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Branding' },
    { id: 'services', label: 'Services' },
    { id: 'integrations', label: 'Integrations' },
  ];

  // Toggle switch component
  const Toggle = ({ on, onToggle }) => (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 100, cursor: 'pointer',
        background: on ? s.accent : (s.dark ? '#3A3A3E' : '#D1D5DB'),
        position: 'relative', transition: 'background 0.25s ease',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        transition: 'left 0.25s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </div>
  );

  return (
    <div style={{ fontFamily: s.FONT }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ font: `700 26px ${s.HEADING}`, color: s.text, marginBottom: 4 }}>Settings</h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Configure your training platform</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28,
        background: s.dark ? s.surfaceAlt : s.surfaceAlt,
        borderRadius: 10, overflow: 'hidden', width: 'fit-content',
        border: `1px solid ${s.border}`,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 22px',
            background: tab === t.id ? s.surface : 'transparent',
            border: 'none',
            font: `${tab === t.id ? 600 : 500} 13px ${s.FONT}`,
            color: tab === t.id ? s.text : s.text3,
            cursor: 'pointer',
            borderRadius: tab === t.id ? 8 : 0,
            boxShadow: tab === t.id ? s.shadow : 'none',
            transition: 'all 0.2s ease',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── General Tab ── */}
      {tab === 'general' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ ...s.cardStyle, padding: 28 }}>
            <div style={{ font: `600 16px ${s.HEADING}`, color: s.text, marginBottom: 20 }}>Business Info</div>
            {[
              { key: 'businessName', label: 'Business Name', placeholder: 'FORGE Performance Training' },
              { key: 'tagline', label: 'Tagline', placeholder: 'Train Hard. Train Smart. Get Results.' },
              { key: 'email', label: 'Email', placeholder: 'hello@forgetraining.com' },
              { key: 'phone', label: 'Phone', placeholder: '(480) 555-0100' },
              { key: 'founder', label: 'Founder / Head Trainer', placeholder: 'Marcus Cole' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 18 }}>
                <label style={s.label}>{f.label}</label>
                <input
                  value={settings[f.key] || ''}
                  onChange={e => setSettingsLocal({ ...settings, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={s.input}
                />
              </div>
            ))}
            <button onClick={handleSaveSettings} style={s.pillAccent}>
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>

          {/* Operating Hours */}
          <div style={{ ...s.cardStyle, padding: 28, marginTop: 20 }}>
            <div style={{ font: `600 16px ${s.HEADING}`, color: s.text, marginBottom: 16 }}>Operating Hours</div>
            <div style={{ display: 'grid', gap: 0 }}>
              {[
                { day: 'Monday', hours: '6:00 AM - 7:30 PM' },
                { day: 'Tuesday', hours: '6:00 AM - 7:30 PM' },
                { day: 'Wednesday', hours: '6:00 AM - 7:30 PM' },
                { day: 'Thursday', hours: '6:00 AM - 7:30 PM' },
                { day: 'Friday', hours: '6:00 AM - 6:00 PM' },
                { day: 'Saturday', hours: '7:00 AM - 12:00 PM' },
                { day: 'Sunday', hours: 'Closed' },
              ].map(h => (
                <div key={h.day} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: `1px solid ${s.borderLight}`,
                }}>
                  <span style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{h.day}</span>
                  <span style={{
                    font: `400 13px ${s.MONO}`,
                    color: h.hours === 'Closed' ? s.text3 : s.text2,
                  }}>{h.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => {
                if (confirm('This will clear ALL data and reset to demo defaults. Are you sure?')) {
                  const keys = Object.keys(localStorage).filter(k => k.startsWith('ms_') || k.startsWith('pt_'));
                  keys.forEach(k => localStorage.removeItem(k));
                  window.location.reload();
                }
              }}
              style={{ ...s.pillGhost, color: s.danger, borderColor: s.danger }}
            >
              Reset All Demo Data
            </button>
            <p style={{ font: `400 11px ${s.FONT}`, color: s.text3, marginTop: 8 }}>
              Clears all data and reloads with fresh demo defaults.
            </p>
          </div>
        </div>
      )}

      {/* ── Branding Tab ── */}
      {tab === 'branding' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ font: `600 16px ${s.HEADING}`, color: s.text, marginBottom: 4 }}>Theme</div>
          <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>
            Choose your platform look. Click a theme card to switch instantly.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            {/* Bold card */}
            <div
              onClick={() => setTheme('bold')}
              style={{
                ...s.cardStyle,
                padding: 0, overflow: 'hidden', cursor: 'pointer',
                border: theme.id === 'bold' ? `2.5px solid ${THEMES.bold.accent}` : `1px solid ${s.border}`,
                transition: 'all 0.25s ease',
              }}
            >
              {/* Preview header */}
              <div style={{
                background: THEMES.bold.bg,
                padding: '20px 20px 16px',
                borderBottom: `1px solid ${THEMES.bold.border}`,
              }}>
                <div style={{ font: `700 16px ${s.HEADING}`, color: THEMES.bold.text, marginBottom: 8 }}>Bold</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: THEMES.bold.text2, marginBottom: 12 }}>
                  Dark mode with teal accents
                </div>
                {/* Mini preview elements */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: THEMES.bold.accent, color: '#fff',
                    font: `500 11px ${s.FONT}`,
                  }}>Button</div>
                  <div style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: THEMES.bold.surface,
                    border: `1px solid ${THEMES.bold.border}`,
                    color: THEMES.bold.text2,
                    font: `500 11px ${s.FONT}`,
                  }}>Tag</div>
                </div>
              </div>
              {/* Color swatches */}
              <div style={{
                padding: '14px 20px',
                background: THEMES.bold.surface,
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                {[THEMES.bold.bg, THEMES.bold.surface, THEMES.bold.accent, THEMES.bold.text].map((c, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: c,
                    border: `1px solid ${THEMES.bold.borderLight}`,
                  }} />
                ))}
                {theme.id === 'bold' && (
                  <span style={{
                    marginLeft: 'auto',
                    font: `600 11px ${s.FONT}`,
                    color: THEMES.bold.accent,
                  }}>Active</span>
                )}
              </div>
            </div>

            {/* Warm card */}
            <div
              onClick={() => setTheme('warm')}
              style={{
                ...s.cardStyle,
                padding: 0, overflow: 'hidden', cursor: 'pointer',
                border: theme.id === 'warm' ? `2.5px solid ${THEMES.warm.accent}` : `1px solid ${s.border}`,
                transition: 'all 0.25s ease',
              }}
            >
              <div style={{
                background: THEMES.warm.bg,
                padding: '20px 20px 16px',
                borderBottom: `1px solid ${THEMES.warm.border}`,
              }}>
                <div style={{ font: `700 16px ${s.HEADING}`, color: THEMES.warm.text, marginBottom: 8 }}>Warm</div>
                <div style={{ font: `400 12px ${s.FONT}`, color: THEMES.warm.text2, marginBottom: 12 }}>
                  Light mode with earthy tones
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: THEMES.warm.accent, color: '#fff',
                    font: `500 11px ${s.FONT}`,
                  }}>Button</div>
                  <div style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: THEMES.warm.surface,
                    border: `1px solid ${THEMES.warm.border}`,
                    color: THEMES.warm.text2,
                    font: `500 11px ${s.FONT}`,
                  }}>Tag</div>
                </div>
              </div>
              <div style={{
                padding: '14px 20px',
                background: THEMES.warm.surface,
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                {[THEMES.warm.bg, THEMES.warm.surface, THEMES.warm.accent, THEMES.warm.text].map((c, i) => (
                  <div key={i} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: c,
                    border: `1px solid ${THEMES.warm.border}`,
                  }} />
                ))}
                {theme.id === 'warm' && (
                  <span style={{
                    marginLeft: 'auto',
                    font: `600 11px ${s.FONT}`,
                    color: THEMES.warm.accent,
                  }}>Active</span>
                )}
              </div>
            </div>
          </div>

          {/* Button preview */}
          <div style={{ ...s.cardStyle, padding: 24 }}>
            <div style={{ font: `600 14px ${s.HEADING}`, color: s.text, marginBottom: 14 }}>Live Preview</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <button style={s.pillAccent}>Primary</button>
              <button style={s.pillCta}>CTA</button>
              <button style={s.pillOutline}>Outline</button>
              <button style={s.pillGhost}>Ghost</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 100,
                background: s.accentLight, color: s.accent,
                font: `500 11px ${s.FONT}`,
              }}>Active Tag</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.success }} />
              <span style={{ font: `400 12px ${s.FONT}`, color: s.success }}>Connected</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.warning }} />
              <span style={{ font: `400 12px ${s.FONT}`, color: s.warning }}>Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Services Tab ── */}
      {tab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{services.length} services</span>
            <button
              onClick={() => {
                setEditSvc(null);
                setSvcForm({ name: '', category: 'Training', duration: 60, price: 0, unit: 'per session', description: '' });
                setShowSvcForm(true);
              }}
              style={s.pillAccent}
            >+ Add Service</button>
          </div>

          <div style={s.tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                  {['Service', 'Category', 'Duration', 'Price', ''].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      font: `500 11px ${s.MONO}`,
                      textTransform: 'uppercase', letterSpacing: 1,
                      color: s.text3, textAlign: 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(svc => (
                  <tr key={svc.id} style={{ borderBottom: `1px solid ${s.borderLight}` }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{svc.name}</div>
                      {svc.description && (
                        <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{svc.description}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 100,
                        background: s.accentLight,
                        font: `500 11px ${s.FONT}`, color: s.accent,
                      }}>{svc.category}</span>
                    </td>
                    <td style={{ padding: '14px 16px', font: `400 13px ${s.MONO}`, color: s.text2 }}>
                      {svc.duration}min
                    </td>
                    <td style={{ padding: '14px 16px', font: `500 13px ${s.MONO}`, color: s.text }}>
                      ${(svc.price / 100).toFixed(0)} <span style={{ color: s.text3, fontWeight: 400 }}>{svc.unit}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setEditSvc(svc);
                            setSvcForm({
                              name: svc.name, category: svc.category,
                              duration: svc.duration, price: svc.price,
                              unit: svc.unit || 'per session',
                              description: svc.description || '',
                            });
                            setShowSvcForm(true);
                          }}
                          style={{ ...s.pillGhost, padding: '5px 12px', fontSize: 11 }}
                        >Edit</button>
                        <button
                          onClick={() => { if (confirm('Delete this service?')) deleteService(svc.id); }}
                          style={{ ...s.pillGhost, padding: '5px 12px', fontSize: 11, color: s.danger, borderColor: s.danger }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Integrations Tab ── */}
      {tab === 'integrations' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ font: `600 16px ${s.HEADING}`, color: s.text, marginBottom: 4 }}>Connected Apps</div>
            <p style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>
              Manage integrations with external services. Toggle connections on or off.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {[
              { id: 'applehealth', name: 'Apple Health', desc: 'Import workout, step, and heart rate data', color: '#FF2D55', letter: 'AH' },
              { id: 'fitbit', name: 'Fitbit', desc: 'Sync heart rate, sleep, and daily activity', color: '#00B0B9', letter: 'Fb' },
              { id: 'stripe', name: 'Stripe', desc: 'Accept payments and manage subscriptions', color: '#635BFF', letter: 'St' },
              { id: 'zoom', name: 'Zoom', desc: 'Virtual training sessions and consultations', color: '#2D8CFF', letter: 'Zm' },
              { id: 'instagram', name: 'Instagram', desc: 'DM management and content scheduling', color: '#E1306C', letter: 'Ig' },
              { id: 'garmin', name: 'Garmin', desc: 'Sync training data from Garmin watches', color: '#007DC3', letter: 'Gn' },
              { id: 'inbody', name: 'InBody', desc: 'Import body composition scans and skeletal muscle data', color: '#1B365D', letter: 'IB' },
              { id: 'styku', name: 'Styku', desc: '3D body scanning with circumference measurements', color: '#00B4D8', letter: 'Sk' },
              { id: 'openfoodfacts', name: 'Open Food Facts', desc: 'Food database with barcode scanning for nutrition tracking', color: '#FF6F00', letter: 'OF' },
            ].map(intg => {
              const isOn = !!integrations[intg.id];
              return (
                <div key={intg.id} style={{
                  ...s.cardStyle,
                  padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `${intg.color}14`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ font: `700 13px ${s.FONT}`, color: intg.color }}>{intg.letter}</span>
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
                    <Toggle on={isOn} onToggle={() => toggleIntegration(intg.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Service Form Modal ── */}
      {showSvcForm && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300,
          }}
          onClick={() => setShowSvcForm(false)}
        >
          <div
            style={{
              background: s.surface,
              borderRadius: 16, padding: 32,
              maxWidth: 500, width: '90%',
              boxShadow: s.shadowLg,
              border: `1px solid ${s.border}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ font: `600 18px ${s.HEADING}`, color: s.text, marginBottom: 24 }}>
              {editSvc ? 'Edit Service' : 'Add Service'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Service Name</label>
                <input value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })} style={s.input} placeholder="1-on-1 Training" />
              </div>
              <div>
                <label style={s.label}>Category</label>
                <select value={svcForm.category} onChange={e => setSvcForm({ ...svcForm, category: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                  <option>Training</option><option>Strength</option><option>Cardio</option>
                  <option>Group</option><option>Wellness</option><option>Private</option>
                  <option>Performance</option><option>Assessment</option>
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
                <input value={svcForm.unit} onChange={e => setSvcForm({ ...svcForm, unit: e.target.value })} style={s.input} placeholder="per session" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Description</label>
                <textarea
                  value={svcForm.description}
                  onChange={e => setSvcForm({ ...svcForm, description: e.target.value })}
                  style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                  placeholder="Brief description of this service..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowSvcForm(false); setEditSvc(null); }} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSaveService} style={s.pillAccent}>
                {editSvc ? 'Update' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
