import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles, getAvatarGradient } from '../theme';

const UPCOMING_SESSIONS = [
  { id: 1, client: 'Sarah Chen', date: '2026-03-19', time: '9:00 AM', type: 'Strength Training' },
  { id: 2, client: 'James Thompson', date: '2026-03-19', time: '11:30 AM', type: 'HIIT Session' },
  { id: 3, client: 'Priya Singh', date: '2026-03-20', time: '8:00 AM', type: 'Yoga Flow' },
  { id: 4, client: 'David Garcia', date: '2026-03-20', time: '2:00 PM', type: 'Rehab Training' },
  { id: 5, client: 'Emily Watson', date: '2026-03-21', time: '10:00 AM', type: 'Full Body' },
];

const PAST_SESSIONS = [
  { id: 101, client: 'Sarah Chen', date: '2026-03-17', duration: 52 },
  { id: 102, client: 'James Thompson', date: '2026-03-17', duration: 45 },
  { id: 103, client: 'Priya Singh', date: '2026-03-16', duration: 50 },
  { id: 104, client: 'David Garcia', date: '2026-03-16', duration: 40 },
  { id: 105, client: 'Emily Watson', date: '2026-03-15', duration: 48 },
  { id: 106, client: 'Marcus Lee', date: '2026-03-14', duration: 55 },
  { id: 107, client: 'Olivia Brown', date: '2026-03-13', duration: 42 },
  { id: 108, client: 'Ryan Mitchell', date: '2026-03-12', duration: 44 },
];

function Avatar({ name, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: getAvatarGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: size * 0.36, fontWeight: 600, flexShrink: 0 }}>
      {name.split(' ').map(n => n[0]).join('')}
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (<div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '14px 28px', borderRadius: 100, fontFamily: "'Figtree', sans-serif", fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>{message}</div>);
}

export default function VirtualSessions() {
  const s = useStyles();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const clients = [...new Set([...UPCOMING_SESSIONS, ...PAST_SESSIONS].map(s => s.client))];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, margin: 0, letterSpacing: '-0.5px' }}>Virtual Sessions</h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text3, margin: '6px 0 0' }}>Train clients anywhere with video calls</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[{ label: 'Virtual This Month', value: '18', sub: 'sessions' }, { label: 'Avg Duration', value: '47', sub: 'min' }, { label: 'Client Satisfaction', value: '4.8', sub: '/5' }].map((stat, i) => (
          <div key={i} style={{ ...s.cardStyle, padding: '20px 24px' }}>
            <div style={{ ...s.label, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, letterSpacing: '-1px' }}>{stat.value}</span>
              <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3 }}>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <button onClick={() => setShowClientPicker(true)} style={{ ...s.pillAccent, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          Start Instant Call
        </button>
        <button onClick={() => navigate('/admin/schedule')} style={{ ...s.pillOutline, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Schedule Virtual Session
        </button>
      </div>

      {/* Client Picker Modal */}
      {showClientPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowClientPicker(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: s.surface, borderRadius: 20, padding: 28, width: 360, boxShadow: s.shadowLg, border: `1px solid ${s.border}` }}>
            <h3 style={{ fontFamily: s.HEADING, fontSize: 17, fontWeight: 600, color: s.text, margin: '0 0 16px' }}>Select Client</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clients.map(name => (
                <button key={name} onClick={() => { setShowClientPicker(false); showToast(`Connecting to video call with ${name}...`); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'transparent', border: `1px solid ${s.borderLight}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: s.FONT, fontSize: 14, color: s.text, transition: 'all 0.15s' }}>
                  <Avatar name={name} size={32} />{name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowClientPicker(false)} style={{ ...s.pillGhost, width: '100%', marginTop: 14, textAlign: 'center' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
        {/* Upcoming */}
        <div style={{ ...s.cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${s.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            <span style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text }}>Upcoming Sessions</span>
          </div>
          {UPCOMING_SESSIONS.map((session, i) => (
            <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < UPCOMING_SESSIONS.length - 1 ? `1px solid ${s.borderLight}` : 'none' }}>
              <Avatar name={session.client} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>{session.client}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{formatDate(session.date)} at {session.time} &middot; {session.type}</div>
              </div>
              <button onClick={() => showToast(`Connecting to video call with ${session.client}...`)} style={{ ...s.pillAccent, padding: '8px 18px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Join Call
              </button>
            </div>
          ))}
        </div>

        {/* History */}
        <div style={{ ...s.cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${s.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text }}>Session History</span>
          </div>
          {PAST_SESSIONS.map((session, i) => (
            <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < PAST_SESSIONS.length - 1 ? `1px solid ${s.borderLight}` : 'none' }}>
              <Avatar name={session.client} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>{session.client}</div>
                <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{formatDate(session.date)} &middot; {session.duration} min</div>
              </div>
              <button onClick={() => showToast('Recordings coming soon')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.accent, padding: '6px 0' }}>View Recording</button>
            </div>
          ))}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
