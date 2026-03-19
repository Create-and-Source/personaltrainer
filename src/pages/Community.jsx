import { useState } from 'react';
import { useStyles, getAvatarGradient } from '../theme';

/* --- inject keyframes once --- */
const ANIM_ID = 'community-anims';
if (!document.getElementById(ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = ANIM_ID;
  sheet.textContent = `
    @keyframes cmFadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .cm-card-hover:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03) !important;
    }
    .cm-like-btn:hover {
      transform: scale(1.12) !important;
    }
  `;
  document.head.appendChild(sheet);
}

const FEED_ITEMS = [
  {
    id: 1, type: 'trainer', author: 'Coach Mike',
    content: '"The only bad workout is the one that didn\'t happen." Start your week strong — show up for yourself today.',
    time: '2 hours ago', likes: 12, comments: 3,
  },
  {
    id: 2, type: 'achievement', author: 'James Thompson',
    content: 'Hit a new Deadlift PR: 385 lbs! \u{1F389}',
    time: '4 hours ago', likes: 8, comments: 5,
  },
  {
    id: 3, type: 'trainer', author: 'Coach Mike',
    content: 'Nutrition tip: Try prepping your protein for the week on Sundays. 30 minutes of prep saves hours of decision fatigue.',
    time: '6 hours ago', likes: 6, comments: 2,
  },
  {
    id: 4, type: 'achievement', author: 'Sarah Chen',
    content: 'Completed the 8-Week Fat Loss program! Down 14 lbs and feeling stronger than ever.',
    time: '8 hours ago', likes: 15, comments: 7,
  },
  {
    id: 5, type: 'trainer', author: 'Coach Mike',
    content: 'Workout of the Day: 5x5 Back Squats, 4x8 Romanian Deadlifts, 3x12 Walking Lunges, 3x15 Leg Curls. Tag me when you finish!',
    time: '12 hours ago', likes: 9, comments: 4,
  },
  {
    id: 6, type: 'achievement', author: 'Priya Singh',
    content: 'Earned the "On Fire" badge! 30 consecutive training days \u{1F525}',
    time: '1 day ago', likes: 7, comments: 2,
  },
  {
    id: 7, type: 'trainer', author: 'Coach Mike',
    content: 'Rest day reminder: Recovery is where the gains happen. Stretch, hydrate, and get 8 hours tonight.',
    time: '1 day ago', likes: 4, comments: 1,
  },
  {
    id: 8, type: 'achievement', author: 'David Garcia',
    content: 'Returned to training after rehab! Feeling great and ready to build back stronger \u{1F4AA}',
    time: '2 days ago', likes: 11, comments: 6,
  },
];

const GROUPS = [
  { id: 1, name: 'Morning Crew', members: 8, desc: 'For early morning clients', lastActivity: '2 hours ago', avatars: ['Sarah Chen', 'James Thompson', 'Emily Watson'] },
  { id: 2, name: 'Shred Squad', members: 12, desc: 'Fat loss focused', lastActivity: '4 hours ago', avatars: ['Priya Singh', 'Marcus Lee', 'Olivia Brown'] },
  { id: 3, name: 'Strength Club', members: 10, desc: 'Powerlifting focused', lastActivity: '1 day ago', avatars: ['James Thompson', 'David Garcia', 'Ryan Mitchell'] },
  { id: 4, name: 'New Clients', members: 6, desc: 'Onboarding group', lastActivity: '3 hours ago', avatars: ['Emily Watson', 'Olivia Brown'] },
];

const ANNOUNCEMENTS_SEED = [
  {
    id: 1, title: 'Holiday Schedule',
    content: 'The gym will have modified hours March 28-31 for the holiday weekend. Virtual sessions will still run on normal schedule. Check the calendar for updated time slots.',
    date: '2026-03-15',
  },
  {
    id: 2, title: 'New Pricing Effective April 1',
    content: 'Starting April 1, we\'re introducing a new tiered membership system with more flexibility. Current members are locked in at their existing rate for 6 months. Details in your email.',
    date: '2026-03-12',
  },
  {
    id: 3, title: 'Spring Shred Challenge Starts April 7!',
    content: '6-week transformation challenge with weekly check-ins, nutrition coaching, and prizes for most improved. Sign up through the app or ask at your next session.',
    date: '2026-03-10',
  },
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

function AvatarStack({ names, size = 28 }) {
  return (
    <div style={{ display: 'flex' }}>
      {names.slice(0, 4).map((name, i) => (
        <div key={name} style={{
          marginLeft: i > 0 ? -8 : 0, zIndex: names.length - i,
          width: size, height: size, borderRadius: '50%',
          background: getAvatarGradient(name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', font: `600 ${size * 0.35}px 'Inter', sans-serif`,
          border: '2px solid #fff', flexShrink: 0,
        }}>
          {name.split(' ').map(n => n[0]).join('')}
        </div>
      ))}
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: '#111', color: '#fff', padding: '14px 28px', borderRadius: 100,
      font: "500 14px 'Inter', sans-serif", zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      animation: 'cmFadeInUp 0.3s ease',
    }}>
      {message}
    </div>
  );
}

export default function Community() {
  const s = useStyles();
  const [activeTab, setActiveTab] = useState('feed');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [joinedGroups, setJoinedGroups] = useState(new Set([1])); // Morning Crew joined by default
  const [toast, setToast] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_SEED);
  const [feedLikes, setFeedLikes] = useState(
    Object.fromEntries(FEED_ITEMS.map(item => [item.id, item.likes]))
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleLike = (id) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setFeedLikes(l => ({ ...l, [id]: l[id] - 1 }));
      } else {
        next.add(id);
        setFeedLikes(l => ({ ...l, [id]: l[id] + 1 }));
      }
      return next;
    });
  };

  const toggleGroup = (id) => {
    setJoinedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Left group');
      } else {
        next.add(id);
        showToast('Joined group!');
      }
      return next;
    });
  };

  const postAnnouncement = () => {
    if (!announcementText.trim()) return;
    const newAnn = {
      id: Date.now(),
      title: 'New Announcement',
      content: announcementText.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    setAnnouncements([newAnn, ...announcements]);
    setAnnouncementText('');
    showToast('Announcement posted!');
  };

  const tabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'groups', label: 'Groups' },
    { id: 'announcements', label: 'Announcements' },
  ];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const HeartIcon = ({ filled, color }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  );

  return (
    <div style={{ animation: 'cmFadeInUp 0.5s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ font: "700 28px 'Inter', sans-serif", color: s.text, margin: 0, letterSpacing: '-0.5px' }}>
          Community
        </h1>
        <p style={{ font: "400 15px 'Inter', sans-serif", color: s.text3, margin: '6px 0 0' }}>
          Build engagement with groups, posts, and social features
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 28,
        background: s.dark ? '#252529' : 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 4, width: 'fit-content',
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
            font: "500 13px 'Inter', sans-serif",
            background: activeTab === tab.id ? s.cardSolid : 'transparent',
            color: activeTab === tab.id ? s.text : s.text3,
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FEED_ITEMS.map((item, i) => (
            <div key={item.id} className="cm-card-hover" style={{
              ...s.cardStyle, padding: '20px 24px',
              animation: `cmFadeInUp 0.4s ease ${i * 0.05}s both`,
            }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <Avatar name={item.author} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ font: "600 14px 'Inter', sans-serif", color: s.text }}>
                      {item.author}
                    </span>
                    {item.type === 'trainer' && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 100, fontSize: 10,
                        background: s.accent + '18', color: s.accent,
                        font: "600 10px 'Inter', sans-serif", letterSpacing: 0.5,
                      }}>TRAINER</span>
                    )}
                    {item.type === 'achievement' && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 100, fontSize: 10,
                        background: '#16A34A18', color: '#16A34A',
                        font: "600 10px 'Inter', sans-serif", letterSpacing: 0.5,
                      }}>ACHIEVEMENT</span>
                    )}
                    <span style={{ font: "400 12px 'Inter', sans-serif", color: s.text3, marginLeft: 'auto' }}>
                      {item.time}
                    </span>
                  </div>
                  <p style={{ font: "400 14px/1.6 'Inter', sans-serif", color: s.text2, margin: '8px 0 14px' }}>
                    {item.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button
                      className="cm-like-btn"
                      onClick={() => toggleLike(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        font: "500 13px 'Inter', sans-serif",
                        color: likedPosts.has(item.id) ? '#DC2626' : s.text3,
                        transition: 'all 0.2s ease', padding: 0,
                      }}
                    >
                      <HeartIcon filled={likedPosts.has(item.id)} color={likedPosts.has(item.id) ? '#DC2626' : '#999'} />
                      {feedLikes[item.id]}
                    </button>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'none', border: 'none', cursor: 'pointer',
                      font: "500 13px 'Inter', sans-serif", color: s.text3, padding: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      {item.comments}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => showToast('Group creation coming soon!')} style={{
              ...s.pillAccent, padding: '11px 24px', fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Group
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {GROUPS.map((group, i) => (
              <div key={group.id} className="cm-card-hover" style={{
                ...s.cardStyle, padding: '24px',
                animation: `cmFadeInUp 0.4s ease ${i * 0.08}s both`,
              }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ font: "600 16px 'Inter', sans-serif", color: s.text, margin: '0 0 4px' }}>
                    {group.name}
                  </h3>
                  <p style={{ font: "400 13px 'Inter', sans-serif", color: s.text3, margin: 0 }}>
                    {group.desc}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <AvatarStack names={group.avatars} size={26} />
                  <span style={{ font: "500 12px 'Inter', sans-serif", color: s.text2 }}>
                    {group.members} members
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ font: "400 12px 'Inter', sans-serif", color: s.text3 }}>
                    Active {group.lastActivity}
                  </span>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    style={joinedGroups.has(group.id) ? {
                      ...s.pillGhost, padding: '7px 16px', fontSize: 12,
                    } : {
                      ...s.pillAccent, padding: '7px 16px', fontSize: 12,
                    }}
                  >
                    {joinedGroups.has(group.id) ? 'Leave' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div style={{ maxWidth: 640 }}>
          {/* New Announcement */}
          <div style={{ ...s.cardStyle, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ ...s.label, marginBottom: 10 }}>New Announcement</div>
            <textarea
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
              placeholder="Write an announcement for your clients..."
              style={{
                ...s.input, minHeight: 80, resize: 'vertical',
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                onClick={postAnnouncement}
                style={{ ...s.pillAccent, padding: '10px 22px', fontSize: 13, opacity: announcementText.trim() ? 1 : 0.5 }}
                disabled={!announcementText.trim()}
              >
                Post Announcement
              </button>
            </div>
          </div>

          {/* Announcements List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {announcements.map((ann, i) => (
              <div key={ann.id} className="cm-card-hover" style={{
                ...s.cardStyle, padding: '20px 24px',
                borderLeft: `3px solid ${s.accent}`,
                animation: `cmFadeInUp 0.4s ease ${i * 0.06}s both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={s.accent} stroke="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span style={{
                    padding: '2px 8px', borderRadius: 100,
                    background: s.accent + '18', color: s.accent,
                    font: "600 10px 'Inter', sans-serif", letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}>Pinned</span>
                  <span style={{ font: "400 12px 'Inter', sans-serif", color: s.text3, marginLeft: 'auto' }}>
                    {formatDate(ann.date)}
                  </span>
                </div>
                <h3 style={{ font: "600 15px 'Inter', sans-serif", color: s.text, margin: '0 0 6px' }}>
                  {ann.title}
                </h3>
                <p style={{ font: "400 14px/1.6 'Inter', sans-serif", color: s.text2, margin: 0 }}>
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
