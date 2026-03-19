import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles, getAvatarGradient } from '../theme';

/* --- inject keyframes once --- */
const ANIM_ID = 'virtual-sessions-anims';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes vsFadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .vs-card-hover:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03) !important;
    }
    .vs-join-btn:hover {
      filter: brightness(1.1) !important;
      box-shadow: 0 4px 16px rgba(var(--accent-rgb), 0.3) !important;
    }
  `;
  document.head.appendChild(sheet);
}

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
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarGradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', font: `600 ${size * 0.36}px 'Inter', sans-serif`,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: '#111', color: '#fff', padding: '14px 28px', borderRadius: 100,
      font: "500 14px 'Inter', sans-serif", zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      animation: 'vsFadeInUp 0.3s ease',
    }}>
      {message}
    </div>
  );
}

export default function VirtualSessions() {
  const s = useStyles();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const clients = [...new Set([...UPCOMING_SESSIONS, ...PAST_SESSIONS].map(s => s.client))];

  return (
    <div style={{ animation: 'vsFadeInUp 0.5s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ font: "700 28px 'Inter', sans-serif", color: s.text, margin: 0, letterSpacing: '-0.5px' }}>
          Virtual Sessions
        </h1>
        <p style={{ font: "400 15px 'Inter', sans-serif", color: s.text3, margin: '6px 0 0' }}>
          Train clients anywhere with video calls
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Virtual This Month', value: '18', sub: 'sessions' },
          { label: 'Avg Duration', value: '47', sub: 'min' },
          { label: 'Client Satisfaction', value: '4.8', sub: '/5' },
        ].map((stat, i) => (
          <div key={i} className="vs-card-hover" style={{
            ...s.cardStyle, padding: '20px 24px',
            animation: `vsFadeInUp 0.5s ease ${i * 0.08}s both`,
          }}>
            <div style={{ ...s.label, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ font: "700 28px 'Inter', sans-serif", color: s.text, letterSpacing: '-1px' }}>
                {stat.value}
              </span>
              <span style={{ font: "400 13px 'Inter', sans-serif", color: s.text3 }}>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowClientPicker(true)}
          style={{ ...s.pillAccent, padding: '11px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 5.18 2 2 0 015.11 3h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 11.91a16 16 0 006 6l2.27-2.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
          </svg>
          Start Instant Call
        </button>
        <button
          onClick={() => navigate('/admin/schedule')}
          style={{ ...s.pillOutline, padding: '11px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Schedule Virtual Session
        </button>
      </div>

      {/* Client Picker Modal */}
      {showClientPicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowClientPicker(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: s.cardSolid, borderRadius: 20, padding: 28, width: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            animation: 'vsFadeInUp 0.3s ease',
          }}>
            <h3 style={{ font: "600 17px 'Inter', sans-serif", color: s.text, margin: '0 0 16px' }}>
              Select Client
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clients.map(name => (
                <button key={name} onClick={() => {
                  setShowClientPicker(false);
                  showToast(`Connecting to video call with ${name}...`);
                }} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: 'transparent', border: `1px solid ${s.borderLight}`,
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  font: "400 14px 'Inter', sans-serif", color: s.text,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = s.dark ? '#252529' : '#F5F3F0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar name={name} size={32} />
                  {name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowClientPicker(false)} style={{
              ...s.pillGhost, width: '100%', marginTop: 14, textAlign: 'center',
            }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upcoming Sessions */}
        <div style={{ ...s.cardStyle, padding: 0, overflow: 'hidden', animation: 'vsFadeInUp 0.5s ease 0.1s both' }}>
          <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${s.borderLight}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              <span style={{ font: "600 15px 'Inter', sans-serif", color: s.text }}>Upcoming Sessions</span>
            </div>
          </div>
          <div>
            {UPCOMING_SESSIONS.map((session, i) => (
              <div key={session.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
                borderBottom: i < UPCOMING_SESSIONS.length - 1 ? `1px solid ${s.borderLight}` : 'none',
              }}>
                <Avatar name={session.client} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "500 14px 'Inter', sans-serif", color: s.text }}>{session.client}</div>
                  <div style={{ font: "400 12px 'Inter', sans-serif", color: s.text3 }}>
                    {formatDate(session.date)} at {session.time} &middot; {session.type}
                  </div>
                </div>
                <button
                  className="vs-join-btn"
                  onClick={() => showToast(`Connecting to video call with ${session.client}...`)}
                  style={{
                    ...s.pillAccent, padding: '8px 18px', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                  Join Call
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Session History */}
        <div style={{ ...s.cardStyle, padding: 0, overflow: 'hidden', animation: 'vsFadeInUp 0.5s ease 0.2s both' }}>
          <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${s.borderLight}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ font: "600 15px 'Inter', sans-serif", color: s.text }}>Session History</span>
            </div>
          </div>
          <div>
            {PAST_SESSIONS.map((session, i) => (
              <div key={session.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
                borderBottom: i < PAST_SESSIONS.length - 1 ? `1px solid ${s.borderLight}` : 'none',
              }}>
                <Avatar name={session.client} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "500 14px 'Inter', sans-serif", color: s.text }}>{session.client}</div>
                  <div style={{ font: "400 12px 'Inter', sans-serif", color: s.text3 }}>
                    {formatDate(session.date)} &middot; {session.duration} min
                  </div>
                </div>
                <button
                  onClick={() => showToast('Recordings coming soon')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    font: "500 12px 'Inter', sans-serif", color: s.accent,
                    padding: '6px 0', transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  View Recording
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast message={toast} />

      <style>{`
        @media (max-width: 860px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
