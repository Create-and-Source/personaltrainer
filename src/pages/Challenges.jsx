import { useState, useEffect, useMemo } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, subscribe } from '../data/store';

/* ── Keyframes ── */
const CHALLENGES_ANIM_ID = 'challenges-premium-anims';
if (!document.getElementById(CHALLENGES_ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = CHALLENGES_ANIM_ID;
  sheet.textContent = `
    @keyframes challengeFadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes badgeGlow {
      0%, 100% { box-shadow: 0 0 8px 2px rgba(234,179,8,0.25); }
      50%      { box-shadow: 0 0 20px 6px rgba(234,179,8,0.45); }
    }
    @keyframes badgeUnlock {
      0%   { transform: scale(0.7) rotate(-10deg); opacity: 0; }
      60%  { transform: scale(1.1) rotate(3deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .challenge-card-hover:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 16px 48px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04) !important;
    }
    .badge-unlocked {
      animation: badgeGlow 2.5s ease-in-out infinite;
    }
    .badge-card-hover:hover {
      transform: translateY(-3px) scale(1.02) !important;
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Helpers ── */
const STORAGE_KEY_CHALLENGES = 'ms_challenges';
const STORAGE_KEY_BADGES = 'ms_badges';

const today = new Date();
const dateStr = (offset) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
};
const todayStr = dateStr(0);

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const SAMPLE_NAMES = [
  'Alex Rivera', 'Jordan Smith', 'Casey Williams', 'Morgan Chen', 'Taylor Brooks',
  'Sam Patel', 'Riley Johnson', 'Avery Davis', 'Quinn Martinez', 'Jamie Thompson',
  'Drew Wilson', 'Cameron Lee', 'Peyton Garcia', 'Blake Anderson', 'Reese Thomas',
  'Dakota Brown', 'Hayden White', 'Emery Harris', 'Finley Clark', 'Parker Lewis',
];

const CHALLENGE_TYPES = ['Competition', 'Threshold', 'Streak'];

const TYPE_COLORS = {
  Competition: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  Threshold: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  Streak: { bg: '#FCE7F3', text: '#9D174D', border: '#F9A8D4' },
};

function getInitialChallenges() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_CHALLENGES));
    if (saved && saved.length) return saved;
  } catch {}

  return [
    {
      id: 'ch-1', name: 'March Shred Challenge', description: 'Lose the most body fat % in 30 days. Weekly weigh-ins required.',
      type: 'Competition', startDate: dateStr(-12), endDate: dateStr(18), duration: 30,
      participants: SAMPLE_NAMES.slice(0, 12).map((n, i) => ({
        name: n, progress: Math.floor(Math.random() * 80) + 10, score: (Math.random() * 4 + 0.5).toFixed(1) + '%',
      })),
      status: 'active', goal: 'Lose the most body fat percentage',
    },
    {
      id: 'ch-2', name: '10K Steps Daily', description: 'Hit 10,000 steps every single day for 14 days straight.',
      type: 'Threshold', startDate: dateStr(-5), endDate: dateStr(9), duration: 14,
      participants: SAMPLE_NAMES.slice(2, 10).map((n, i) => ({
        name: n, progress: Math.floor(Math.random() * 60) + 30, score: Math.floor(Math.random() * 8 + 3) + ' days',
      })),
      status: 'active', goal: '10,000 steps per day',
    },
    {
      id: 'ch-3', name: 'Protein Goal Streak', description: 'Hit your daily protein target every day. How long can you keep the streak going?',
      type: 'Streak', startDate: dateStr(-8), endDate: dateStr(22), duration: 30,
      participants: SAMPLE_NAMES.slice(1, 16).map((n, i) => ({
        name: n, progress: Math.floor(Math.random() * 70) + 15, score: Math.floor(Math.random() * 20 + 1) + ' days',
      })),
      status: 'active', goal: 'Daily protein target',
    },
    {
      id: 'ch-4', name: '100 Workout Club', description: 'Complete 100 training sessions total. No time limit — just dedication.',
      type: 'Threshold', startDate: dateStr(-30), endDate: dateStr(60), duration: 90,
      participants: SAMPLE_NAMES.slice(0, 20).map((n, i) => ({
        name: n, progress: Math.floor(Math.random() * 50) + 5, score: Math.floor(Math.random() * 60 + 10) + ' sessions',
      })),
      status: 'active', goal: '100 training sessions',
    },
    {
      id: 'ch-5', name: 'New Year Transformation', description: '8-week body transformation challenge with weekly check-ins.',
      type: 'Competition', startDate: '2026-01-06', endDate: '2026-03-02', duration: 56,
      participants: SAMPLE_NAMES.slice(0, 10).map((n, i) => ({
        name: n, progress: 100, score: (Math.random() * 6 + 1).toFixed(1) + '%',
      })),
      status: 'completed', goal: 'Most body fat lost',
      winner: SAMPLE_NAMES[3],
    },
    {
      id: 'ch-6', name: 'February Fitness Bingo', description: 'Complete all squares on the fitness bingo card.',
      type: 'Threshold', startDate: '2026-02-01', endDate: '2026-02-28', duration: 28,
      participants: SAMPLE_NAMES.slice(4, 12).map((n, i) => ({
        name: n, progress: 100, score: Math.floor(Math.random() * 5 + 20) + '/25 squares',
      })),
      status: 'completed', goal: 'Complete fitness bingo card',
      winner: SAMPLE_NAMES[6],
    },
  ];
}

function getInitialBadges() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_BADGES));
    if (saved && saved.length) return saved;
  } catch {}

  return [
    { id: 'b-1', emoji: '\uD83D\uDD25', name: 'On Fire', description: '7-day workout streak', earnedBy: 14, unlocked: true },
    { id: 'b-2', emoji: '\uD83D\uDCAA', name: 'Iron Will', description: '30-day workout streak', earnedBy: 4, unlocked: true },
    { id: 'b-3', emoji: '\uD83C\uDFC6', name: 'Challenge Champion', description: 'Win a challenge', earnedBy: 6, unlocked: true },
    { id: 'b-4', emoji: '\u2B50', name: 'First Session', description: 'Complete first training session', earnedBy: 28, unlocked: true },
    { id: 'b-5', emoji: '\uD83D\uDCC8', name: 'PR Crusher', description: 'Set 5 personal records', earnedBy: 9, unlocked: false },
    { id: 'b-6', emoji: '\uD83E\uDD57', name: 'Nutrition Pro', description: 'Log meals for 14 days straight', earnedBy: 7, unlocked: true },
    { id: 'b-7', emoji: '\uD83C\uDFAF', name: 'Goal Getter', description: 'Hit all weekly targets', earnedBy: 11, unlocked: false },
    { id: 'b-8', emoji: '\uD83D\uDC8E', name: 'Diamond Client', description: '100 sessions completed', earnedBy: 3, unlocked: false },
    { id: 'b-9', emoji: '\uD83C\uDF1F', name: 'Early Bird', description: '20 sessions before 7am', earnedBy: 5, unlocked: true },
    { id: 'b-10', emoji: '\uD83D\uDD04', name: 'Comeback Kid', description: 'Return after 30+ day break', earnedBy: 8, unlocked: false },
  ];
}

/* ── Avatar component ── */
function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarGradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', font: `600 ${Math.round(size * 0.38)}px 'Inter', sans-serif`,
      flexShrink: 0, border: '2px solid rgba(255,255,255,0.8)',
    }}>
      {initials}
    </div>
  );
}

/* ── Main Component ── */
export default function Challenges() {
  const s = useStyles();
  const [tab, setTab] = useState('active');
  const [challenges, setChallenges] = useState(getInitialChallenges);
  const [badges, setBadges] = useState(getInitialBadges);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState(getPatients());

  // Form state
  const [form, setForm] = useState({ name: '', type: 'Competition', duration: 30, goal: '', participants: [] });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHALLENGES, JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BADGES, JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    const unsub = subscribe(() => setClients(getPatients()));
    return unsub;
  }, []);

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  const getDaysElapsed = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const now = new Date();
    const total = Math.max(1, (e - s) / (1000 * 60 * 60 * 24));
    const elapsed = Math.max(0, (now - s) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.round((elapsed / total) * 100));
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const newChallenge = {
      id: `ch-${Date.now()}`,
      name: form.name,
      description: form.goal,
      type: form.type,
      startDate: todayStr,
      endDate: dateStr(form.duration),
      duration: form.duration,
      participants: form.participants.map(n => ({ name: n, progress: 0, score: '0' })),
      status: 'active',
      goal: form.goal,
    };
    setChallenges(prev => [newChallenge, ...prev]);
    setForm({ name: '', type: 'Competition', duration: 30, goal: '', participants: [] });
    setShowModal(false);
  };

  const toggleParticipant = (name) => {
    setForm(prev => ({
      ...prev,
      participants: prev.participants.includes(name)
        ? prev.participants.filter(n => n !== name)
        : [...prev.participants, name],
    }));
  };

  const TABS = [
    { id: 'active', label: 'Active', count: activeChallenges.length },
    { id: 'completed', label: 'Completed', count: completedChallenges.length },
    { id: 'badges', label: 'Badges', count: badges.length },
  ];

  return (
    <div style={{ animation: 'challengeFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ font: `700 28px ${s.FONT}`, color: s.text, margin: 0, letterSpacing: '-0.5px' }}>
            Challenges
          </h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text3, margin: '6px 0 0' }}>
            Motivate clients with competitions, streaks, and rewards
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ ...s.pillAccent, padding: '11px 24px', fontSize: 14, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${s.accent}44`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 2px 12px ${s.accent}33`; }}
        >
          + Create Challenge
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: s.dark ? '#252529' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            font: `500 13px ${s.FONT}`, transition: 'all 0.2s',
            background: tab === t.id ? s.cardSolid : 'transparent',
            color: tab === t.id ? s.text : s.text3,
            boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}>
            {t.label}
            <span style={{
              marginLeft: 6, padding: '2px 8px', borderRadius: 100, fontSize: 11,
              background: tab === t.id ? s.accent + '15' : 'rgba(0,0,0,0.05)',
              color: tab === t.id ? s.accent : s.text3,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Challenges */}
      {tab === 'active' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {activeChallenges.map((ch, idx) => {
            const pct = getDaysElapsed(ch.startDate, ch.endDate);
            const top3 = [...ch.participants].sort((a, b) => parseFloat(b.score) - parseFloat(a.score)).slice(0, 3);
            const typeStyle = TYPE_COLORS[ch.type] || TYPE_COLORS.Competition;
            return (
              <div key={ch.id} className="challenge-card-hover" style={{
                ...s.cardStyle, padding: 0, overflow: 'hidden',
                animation: `challengeFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 0.08}s both`,
              }}>
                {/* Type banner */}
                <div style={{
                  padding: '16px 24px', borderBottom: `1px solid ${s.borderLight}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                    fontFamily: s.MONO, letterSpacing: 0.5,
                    background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}`,
                  }}>
                    {ch.type.toUpperCase()}
                  </span>
                  <span style={{ font: `400 12px ${s.MONO}`, color: s.text3 }}>
                    {ch.participants.length} participants
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '20px 24px' }}>
                  <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                    {ch.name}
                  </h3>
                  <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, margin: '0 0 16px', lineHeight: 1.5 }}>
                    {ch.description}
                  </p>

                  {/* Dates */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>
                      {formatDate(ch.startDate)}
                    </span>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>
                      {formatDate(ch.endDate)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.05)', marginBottom: 20, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${s.accent}, ${s.accent}CC)`,
                      transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>

                  {/* Leaderboard top 3 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
                      Leaderboard
                    </div>
                    {top3.map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                        borderBottom: i < 2 ? `1px solid ${s.borderLight}` : 'none',
                      }}>
                        <span style={{
                          width: 20, font: `600 12px ${s.MONO}`,
                          color: i === 0 ? '#D97706' : i === 1 ? '#6B7280' : '#B45309',
                        }}>
                          {i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : '\uD83E\uDD49'}
                        </span>
                        <Avatar name={p.name} size={26} />
                        <span style={{ flex: 1, font: `400 13px ${s.FONT}`, color: s.text }}>{p.name}</span>
                        <span style={{ font: `500 12px ${s.MONO}`, color: s.accent }}>{p.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* Participant avatars stack */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex' }}>
                      {ch.participants.slice(0, 5).map((p, i) => (
                        <div key={i} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i }}>
                          <Avatar name={p.name} size={28} />
                        </div>
                      ))}
                      {ch.participants.length > 5 && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: s.borderLight,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          font: `500 10px ${s.FONT}`, color: s.text3, marginLeft: -8,
                          border: '2px solid rgba(255,255,255,0.8)',
                        }}>
                          +{ch.participants.length - 5}
                        </div>
                      )}
                    </div>
                    <button style={{
                      ...s.pillOutline, padding: '7px 16px', fontSize: 12,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = s.accent; e.currentTarget.style.color = s.accentText; }}
                    onMouseLeave={e => { e.currentTarget.style.background = s.card; e.currentTarget.style.color = s.accent; }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {activeChallenges.length === 0 && (
            <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{'\uD83C\uDFC6'}</div>
              <div style={{ font: `500 16px ${s.FONT}`, color: s.text2, marginBottom: 6 }}>No active challenges</div>
              <div style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>Create one to get your clients fired up!</div>
            </div>
          )}
        </div>
      )}

      {/* Completed Challenges */}
      {tab === 'completed' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
          {completedChallenges.map((ch, idx) => {
            const typeStyle = TYPE_COLORS[ch.type] || TYPE_COLORS.Competition;
            const sortedP = [...ch.participants].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
            return (
              <div key={ch.id} className="challenge-card-hover" style={{
                ...s.cardStyle, padding: 0, overflow: 'hidden', opacity: 0.92,
                animation: `challengeFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 0.08}s both`,
              }}>
                {/* Header */}
                <div style={{
                  padding: '16px 24px', borderBottom: `1px solid ${s.borderLight}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                      fontFamily: s.MONO, letterSpacing: 0.5,
                      background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}`,
                    }}>
                      {ch.type.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                      fontFamily: s.MONO, background: s.dark ? 'rgba(74,222,128,0.12)' : '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                    }}>
                      COMPLETED
                    </span>
                  </div>
                  <span style={{ font: `400 12px ${s.MONO}`, color: s.text3 }}>
                    {ch.participants.length} participants
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '20px 24px' }}>
                  <h3 style={{ font: `600 18px ${s.FONT}`, color: s.text, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                    {ch.name}
                  </h3>
                  <p style={{ font: `400 13px ${s.FONT}`, color: s.text2, margin: '0 0 16px', lineHeight: 1.5 }}>
                    {ch.description}
                  </p>

                  {/* Dates */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>
                      {formatDate(ch.startDate)} - {formatDate(ch.endDate)}
                    </span>
                  </div>

                  {/* Winner */}
                  {ch.winner && (
                    <div style={{
                      padding: 16, borderRadius: 12,
                      background: 'linear-gradient(135deg, #FEF3C7, #FDE68A33)',
                      border: '1px solid #FCD34D44', marginBottom: 16,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ fontSize: 24 }}>{'\uD83C\uDFC6'}</span>
                      <div>
                        <div style={{ font: `500 10px ${s.MONO}`, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>
                          Winner
                        </div>
                        <div style={{ font: `600 15px ${s.FONT}`, color: '#78350F' }}>{ch.winner}</div>
                      </div>
                    </div>
                  )}

                  {/* Top results */}
                  <div>
                    <div style={{ font: `500 10px ${s.MONO}`, color: s.text3, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                      Final Results
                    </div>
                    {sortedP.slice(0, 5).map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0',
                        borderBottom: i < 4 ? `1px solid ${s.borderLight}` : 'none',
                      }}>
                        <span style={{ width: 18, font: `600 11px ${s.MONO}`, color: s.text3 }}>
                          {i + 1}.
                        </span>
                        <Avatar name={p.name} size={24} />
                        <span style={{ flex: 1, font: `400 13px ${s.FONT}`, color: s.text }}>{p.name}</span>
                        <span style={{ font: `500 12px ${s.MONO}`, color: s.text2 }}>{p.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {completedChallenges.length === 0 && (
            <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{'\u2705'}</div>
              <div style={{ font: `500 16px ${s.FONT}`, color: s.text2 }}>No completed challenges yet</div>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {tab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {badges.map((badge, idx) => (
            <div key={badge.id}
              className={`badge-card-hover ${badge.unlocked ? 'badge-unlocked' : ''}`}
              style={{
                ...s.cardStyle, padding: 24, textAlign: 'center', position: 'relative',
                animation: `challengeFadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 0.05}s both`,
                ...(badge.unlocked ? {} : { opacity: 0.5, filter: 'grayscale(0.6)' }),
              }}
            >
              {/* Lock overlay for locked badges */}
              {!badge.unlocked && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  font: `500 16px ${s.FONT}`, opacity: 0.6,
                }}>
                  {'\uD83D\uDD12'}
                </div>
              )}

              {/* Emoji */}
              <div style={{
                fontSize: 44, marginBottom: 12, lineHeight: 1,
                ...(badge.unlocked ? { animation: 'badgeUnlock 0.6s cubic-bezier(0.16,1,0.3,1)' } : {}),
              }}>
                {badge.emoji}
              </div>

              {/* Name */}
              <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 4, letterSpacing: '-0.2px' }}>
                {badge.name}
              </div>

              {/* Description */}
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 14, lineHeight: 1.4 }}>
                {badge.description}
              </div>

              {/* Earned count */}
              <div style={{
                padding: '5px 12px', borderRadius: 100, display: 'inline-block',
                background: badge.unlocked ? s.accent + '12' : s.borderLight,
                font: `500 11px ${s.MONO}`, letterSpacing: 0.5,
                color: badge.unlocked ? s.accent : s.text3,
              }}>
                {badge.earnedBy} clients earned
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Challenge Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'challengeFadeInUp 0.2s ease',
        }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 520, maxHeight: '95vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            background: s.cardSolid, borderRadius: 20, padding: 32,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, margin: 0 }}>Create Challenge</h2>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: s.text3, fontSize: 20,
              }}>{'\u2715'}</button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Challenge Name</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. April Shred Challenge"
                style={s.input}
                onFocus={e => { e.target.style.borderColor = s.accent + '60'; e.target.style.boxShadow = `0 0 0 3px ${s.accent}15`; }}
                onBlur={e => { e.target.style.borderColor = s.borderLight; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Type */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Challenge Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {CHALLENGE_TYPES.map(t => {
                  const tStyle = TYPE_COLORS[t];
                  const selected = form.type === t;
                  return (
                    <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))} style={{
                      padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                      font: `500 13px ${s.FONT}`, transition: 'all 0.2s',
                      background: selected ? tStyle.bg : (s.dark ? '#252529' : 'rgba(0,0,0,0.03)'),
                      color: selected ? tStyle.text : s.text3,
                      border: selected ? `1.5px solid ${tStyle.border}` : '1.5px solid transparent',
                    }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Duration (days)</label>
              <input
                type="number"
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 1 }))}
                style={{ ...s.input, width: 120 }}
                onFocus={e => { e.target.style.borderColor = s.accent + '60'; e.target.style.boxShadow = `0 0 0 3px ${s.accent}15`; }}
                onBlur={e => { e.target.style.borderColor = s.borderLight; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Goal */}
            <div style={{ marginBottom: 18 }}>
              <label style={s.label}>Goal Description</label>
              <textarea
                value={form.goal}
                onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
                placeholder="Describe the challenge goal..."
                rows={3}
                style={{ ...s.input, resize: 'vertical' }}
                onFocus={e => { e.target.style.borderColor = s.accent + '60'; e.target.style.boxShadow = `0 0 0 3px ${s.accent}15`; }}
                onBlur={e => { e.target.style.borderColor = s.borderLight; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Participants */}
            <div style={{ marginBottom: 24 }}>
              <label style={s.label}>Select Participants ({form.participants.length} selected)</label>
              <div style={{
                maxHeight: 180, overflowY: 'auto', borderRadius: 12,
                border: `1px solid ${s.borderLight}`, padding: 8,
              }}>
                {(clients.length > 0 ? clients.map(c => c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()) : SAMPLE_NAMES).map(name => (
                  <button key={name} onClick={() => toggleParticipant(name)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    font: `400 13px ${s.FONT}`, textAlign: 'left',
                    background: form.participants.includes(name) ? s.accent + '12' : 'transparent',
                    color: form.participants.includes(name) ? s.accent : s.text2,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${form.participants.includes(name) ? s.accent : '#DDD'}`,
                      background: form.participants.includes(name) ? s.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 11, transition: 'all 0.15s',
                    }}>
                      {form.participants.includes(name) && '\u2713'}
                    </div>
                    <Avatar name={name} size={24} />
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleCreate} style={{ ...s.pillAccent, opacity: form.name.trim() ? 1 : 0.5 }}>
                Create Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
