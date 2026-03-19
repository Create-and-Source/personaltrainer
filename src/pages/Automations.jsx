import { useState } from 'react';
import { useStyles } from '../theme';

const TRIGGER_TYPES = ['Session Reminder', 'Post-Session', 'No-Show', 'Birthday', 'Inactivity', 'New Client', 'Payment', 'Scheduled'];
const ACTION_TYPES = ['Send Email', 'Send SMS', 'Create Alert', 'Send Push Notification'];
const DELAY_OPTIONS = ['Immediately', '1 hour', '2 hours', '24 hours', '48 hours', '1 week'];

const ICONS = {
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>,
  alertCircle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  gift: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="20,12 20,22 4,22 4,12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  userPlus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  creditCard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trendingDown: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  zap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

const INITIAL_AUTOMATIONS = [
  { id: 1, name: 'Session Reminder', icon: 'bell', trigger: '24 hours before session', action: 'Send SMS reminder to client', active: true, lastTriggered: 'Mar 17, 2026', triggeredCount: 142 },
  { id: 2, name: 'Post-Session Follow-up', icon: 'mail', trigger: 'Session completed', action: 'Send follow-up email after 2 hours', active: true, lastTriggered: 'Mar 17, 2026', triggeredCount: 89 },
  { id: 3, name: 'Missed Session Check-in', icon: 'alertCircle', trigger: 'Client no-shows', action: 'Send "We missed you" text', active: true, lastTriggered: 'Mar 14, 2026', triggeredCount: 12 },
  { id: 4, name: 'Birthday Message', icon: 'gift', trigger: 'Client birthday', action: 'Send birthday email with discount', active: true, lastTriggered: 'Mar 10, 2026', triggeredCount: 8 },
  { id: 5, name: '30-Day Inactive Alert', icon: 'trendingDown', trigger: 'No visit for 30 days', action: 'Create retention alert + send re-engagement email', active: true, lastTriggered: 'Mar 15, 2026', triggeredCount: 23 },
  { id: 6, name: 'New Client Welcome', icon: 'userPlus', trigger: 'Client created', action: 'Send welcome email + intake form', active: true, lastTriggered: 'Mar 16, 2026', triggeredCount: 30 },
  { id: 7, name: 'Payment Failed', icon: 'creditCard', trigger: 'Subscription payment fails', action: 'Send SMS + email notification', active: false, lastTriggered: null, triggeredCount: 0 },
  { id: 8, name: 'Weekly Progress Report', icon: 'clock', trigger: 'Every Sunday at 6pm', action: 'Send weekly summary to all active clients', active: true, lastTriggered: 'Mar 16, 2026', triggeredCount: 45 },
];

function Toggle({ on, onToggle, s }) {
  return (
    <button onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: on ? s.accent : '#D1D5DB', position: 'relative', flexShrink: 0, boxShadow: on ? `0 2px 8px ${s.accent}40` : 'none', transition: 'background 0.3s ease' }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: s.surface, position: 'absolute', top: 3, transform: on ? 'translateX(23px)' : 'translateX(3px)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'transform 0.3s ease' }} />
    </button>
  );
}

export default function Automations() {
  const s = useStyles();
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: TRIGGER_TYPES[0], action: ACTION_TYPES[0], delay: DELAY_OPTIONS[0], message: '', active: true });

  const toggleAutomation = (id) => setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));

  const handleSave = () => {
    if (!form.name.trim()) return;
    setAutomations(prev => [...prev, { id: Date.now(), name: form.name, icon: 'zap', trigger: form.trigger, action: `${form.action}${form.delay !== 'Immediately' ? ` after ${form.delay}` : ''}`, active: form.active, lastTriggered: null, triggeredCount: 0 }]);
    setForm({ name: '', trigger: TRIGGER_TYPES[0], action: ACTION_TYPES[0], delay: DELAY_OPTIONS[0], message: '', active: true });
    setShowModal(false);
  };

  const activeCount = automations.filter(a => a.active).length;
  const totalTriggered = automations.reduce((sum, a) => sum + a.triggeredCount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, margin: 0, letterSpacing: '-0.5px' }}>Automations</h1>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text3, margin: '6px 0 0' }}>Set it and forget it -- automated workflows that save you hours</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ ...s.pillAccent, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Automation
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[{ label: 'Active Automations', value: activeCount }, { label: 'Total Automations', value: automations.length }, { label: 'Total Triggers', value: totalTriggered.toLocaleString() }].map((stat, i) => (
          <div key={i} style={{ ...s.cardStyle, padding: '16px 24px', flex: '1 1 180px', minWidth: 160 }}>
            <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: s.text3, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: s.HEADING, fontSize: 24, fontWeight: 700, color: s.text, letterSpacing: '-0.5px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 4px' }}>Active Automations</h2>
        <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: 0 }}>{activeCount} of {automations.length} workflows running</p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 40 }}>
        {automations.map((auto) => (
          <div key={auto.id} style={{ ...s.cardStyle, padding: 0, overflow: 'hidden', borderLeft: `4px solid ${auto.active ? s.success : '#D1D5DB'}` }}>
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: auto.active ? s.accentLight : s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: auto.active ? s.accent : s.text3, transition: 'all 0.3s' }}>{ICONS[auto.icon] || ICONS.zap}</div>
                  <div style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text }}>{auto.name}</div>
                </div>
                <Toggle on={auto.active} onToggle={() => toggleAutomation(auto.id)} s={s} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontFamily: s.MONO, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: s.accent, background: s.accentLight, padding: '2px 8px', borderRadius: 4, flexShrink: 0, marginTop: 1 }}>When</span>
                  <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{auto.trigger}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontFamily: s.MONO, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#fff', background: s.accent, padding: '2px 8px', borderRadius: 4, flexShrink: 0, marginTop: 1 }}>Then</span>
                  <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{auto.action}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${s.borderLight}` }}>
                <span style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>{auto.lastTriggered ? `Last: ${auto.lastTriggered}` : 'Never triggered'}</span>
                {auto.triggeredCount > 0 && (<span style={{ fontFamily: s.MONO, fontSize: 11, fontWeight: 500, color: s.accent, background: s.accentLight, padding: '3px 10px', borderRadius: 100 }}>{auto.triggeredCount}x</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: s.surface, borderRadius: 20, boxShadow: s.shadowLg, overflow: 'hidden', margin: '0 16px', border: `1px solid ${s.border}` }}>
            <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${s.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: 0 }}>Create Automation</h3>
                <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: '4px 0 0' }}>Build a new automated workflow</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: s.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.text3 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div><label style={s.label}>Automation Name</label><input style={s.input} placeholder="e.g. Follow-up Reminder" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><label style={s.label}>Trigger Type</label><select style={{ ...s.input, cursor: 'pointer' }} value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })}>{TRIGGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label style={s.label}>Action Type</label><select style={{ ...s.input, cursor: 'pointer' }} value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>{ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={s.label}>Delay</label><select style={{ ...s.input, cursor: 'pointer' }} value={form.delay} onChange={e => setForm({ ...form, delay: e.target.value })}>{DELAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              <div><label style={s.label}>Message Template</label><textarea style={{ ...s.input, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }} placeholder="Hi {{client_name}}, ..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text }}>Enable Automation</div><div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>Start running immediately after save</div></div>
                <Toggle on={form.active} onToggle={() => setForm({ ...form, active: !form.active })} s={s} />
              </div>
            </div>
            <div style={{ padding: '16px 28px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSave} style={{ ...s.pillAccent, opacity: form.name.trim() ? 1 : 0.5 }}>Save Automation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
