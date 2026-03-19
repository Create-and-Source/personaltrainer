import { useState } from 'react';
import { useStyles, getAvatarGradient } from '../theme';

const FEED_ITEMS = [
  { id: 1, type: 'trainer', author: 'Coach Mike', content: '"The only bad workout is the one that didn\'t happen." Start your week strong.', time: '2 hours ago', likes: 12, comments: 3 },
  { id: 2, type: 'achievement', author: 'James Thompson', content: 'Hit a new Deadlift PR: 385 lbs!', time: '4 hours ago', likes: 8, comments: 5 },
  { id: 3, type: 'trainer', author: 'Coach Mike', content: 'Nutrition tip: Prep your protein for the week on Sundays. 30 minutes saves hours of decision fatigue.', time: '6 hours ago', likes: 6, comments: 2 },
  { id: 4, type: 'achievement', author: 'Sarah Chen', content: 'Completed the 8-Week Fat Loss program! Down 14 lbs and feeling stronger than ever.', time: '8 hours ago', likes: 15, comments: 7 },
  { id: 5, type: 'trainer', author: 'Coach Mike', content: 'WOD: 5x5 Back Squats, 4x8 Romanian Deadlifts, 3x12 Walking Lunges, 3x15 Leg Curls. Tag me when done!', time: '12 hours ago', likes: 9, comments: 4 },
  { id: 6, type: 'achievement', author: 'Priya Singh', content: 'Earned the "On Fire" badge! 30 consecutive training days', time: '1 day ago', likes: 7, comments: 2 },
  { id: 7, type: 'trainer', author: 'Coach Mike', content: 'Rest day reminder: Recovery is where the gains happen. Stretch, hydrate, and get 8 hours tonight.', time: '1 day ago', likes: 4, comments: 1 },
  { id: 8, type: 'achievement', author: 'David Garcia', content: 'Returned to training after rehab! Feeling great and ready to build back stronger', time: '2 days ago', likes: 11, comments: 6 },
];

const GROUPS = [
  { id: 1, name: 'Morning Crew', members: 8, desc: 'For early morning clients', lastActivity: '2 hours ago', avatars: ['Sarah Chen', 'James Thompson', 'Emily Watson'] },
  { id: 2, name: 'Shred Squad', members: 12, desc: 'Fat loss focused', lastActivity: '4 hours ago', avatars: ['Priya Singh', 'Marcus Lee', 'Olivia Brown'] },
  { id: 3, name: 'Strength Club', members: 10, desc: 'Powerlifting focused', lastActivity: '1 day ago', avatars: ['James Thompson', 'David Garcia', 'Ryan Mitchell'] },
  { id: 4, name: 'New Clients', members: 6, desc: 'Onboarding group', lastActivity: '3 hours ago', avatars: ['Emily Watson', 'Olivia Brown'] },
];

const ANNOUNCEMENTS_SEED = [
  { id: 1, title: 'Holiday Schedule', content: 'The gym will have modified hours March 28-31 for the holiday weekend. Virtual sessions will still run on normal schedule.', date: '2026-03-15' },
  { id: 2, title: 'New Pricing Effective April 1', content: 'Starting April 1, we\'re introducing a new tiered membership system. Current members are locked in at their existing rate for 6 months.', date: '2026-03-12' },
  { id: 3, title: 'Spring Shred Challenge Starts April 7!', content: '6-week transformation challenge with weekly check-ins, nutrition coaching, and prizes for most improved.', date: '2026-03-10' },
];

function Avatar({ name, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: getAvatarGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: size * 0.36, fontWeight: 600, flexShrink: 0 }}>
      {name.split(' ').map(n => n[0]).join('')}
    </div>
  );
}

function AvatarStack({ names, size = 28 }) {
  return (
    <div style={{ display: 'flex' }}>
      {names.slice(0, 4).map((name, i) => (
        <div key={name} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: names.length - i, width: size, height: size, borderRadius: '50%', background: getAvatarGradient(name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: size * 0.35, fontWeight: 600, border: '2px solid #fff', flexShrink: 0 }}>
          {name.split(' ').map(n => n[0]).join('')}
        </div>
      ))}
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (<div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '14px 28px', borderRadius: 100, fontFamily: "'Figtree', sans-serif", fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>{message}</div>);
}

export default function Community() {
  const s = useStyles();
  const [activeTab, setActiveTab] = useState('feed');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [joinedGroups, setJoinedGroups] = useState(new Set([1]));
  const [toast, setToast] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_SEED);
  const [feedLikes, setFeedLikes] = useState(Object.fromEntries(FEED_ITEMS.map(item => [item.id, item.likes])));

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const toggleLike = (id) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setFeedLikes(l => ({ ...l, [id]: l[id] - 1 })); }
      else { next.add(id); setFeedLikes(l => ({ ...l, [id]: l[id] + 1 })); }
      return next;
    });
  };

  const toggleGroup = (id) => {
    setJoinedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); showToast('Left group'); }
      else { next.add(id); showToast('Joined group!'); }
      return next;
    });
  };

  const postAnnouncement = () => {
    if (!announcementText.trim()) return;
    setAnnouncements([{ id: Date.now(), title: 'New Announcement', content: announcementText.trim(), date: new Date().toISOString().split('T')[0] }, ...announcements]);
    setAnnouncementText(''); showToast('Announcement posted!');
  };

  const tabs = [{ id: 'feed', label: 'Feed' }, { id: 'groups', label: 'Groups' }, { id: 'announcements', label: 'Announcements' }];
  const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, margin: 0, letterSpacing: '-0.5px' }}>Community</h1>
        <p style={{ fontFamily: s.FONT, fontSize: 15, color: s.text3, margin: '6px 0 0' }}>Build engagement with groups, posts, and social features</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: s.surfaceAlt, borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: s.FONT, fontSize: 13, fontWeight: 500,
            background: activeTab === tab.id ? s.surface : 'transparent',
            color: activeTab === tab.id ? s.text : s.text3,
            boxShadow: activeTab === tab.id ? s.shadow : 'none', transition: 'all 0.2s ease',
          }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'feed' && (
        <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FEED_ITEMS.map((item) => (
            <div key={item.id} style={{ ...s.cardStyle, padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <Avatar name={item.author} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: s.text }}>{item.author}</span>
                    {item.type === 'trainer' && (<span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, background: s.accentLight, color: s.accent, fontFamily: s.FONT, fontWeight: 600, letterSpacing: 0.5 }}>TRAINER</span>)}
                    {item.type === 'achievement' && (<span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, background: s.successBg, color: s.success, fontFamily: s.FONT, fontWeight: 600, letterSpacing: 0.5 }}>ACHIEVEMENT</span>)}
                    <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, marginLeft: 'auto' }}>{item.time}</span>
                  </div>
                  <p style={{ fontFamily: s.FONT, fontSize: 14, lineHeight: 1.6, color: s.text2, margin: '8px 0 14px' }}>{item.content}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => toggleLike(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: likedPosts.has(item.id) ? '#DC2626' : s.text3, padding: 0, transition: 'all 0.2s' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={likedPosts.has(item.id) ? '#DC2626' : 'none'} stroke={likedPosts.has(item.id) ? '#DC2626' : '#999'} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      {feedLikes[item.id]}
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text3, padding: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {item.comments}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'groups' && (
        <div>
          <div style={{ marginBottom: 20 }}>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {GROUPS.map((group) => (
              <div key={group.id} style={{ ...s.cardStyle, padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontFamily: s.HEADING, fontSize: 16, fontWeight: 600, color: s.text, margin: '0 0 4px' }}>{group.name}</h3>
                  <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: 0 }}>{group.desc}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <AvatarStack names={group.avatars} size={26} />
                  <span style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.text2 }}>{group.members} members</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>Active {group.lastActivity}</span>
                  <button onClick={() => toggleGroup(group.id)} style={joinedGroups.has(group.id) ? { ...s.pillGhost, padding: '7px 16px', fontSize: 12 } : { ...s.pillAccent, padding: '7px 16px', fontSize: 12 }}>
                    {joinedGroups.has(group.id) ? 'Leave' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ ...s.cardStyle, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ ...s.label, marginBottom: 10 }}>New Announcement</div>
            <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Write an announcement for your clients..." style={{ ...s.input, minHeight: 80, resize: 'vertical' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={postAnnouncement} style={{ ...s.pillAccent, padding: '10px 22px', fontSize: 13, opacity: announcementText.trim() ? 1 : 0.5 }} disabled={!announcementText.trim()}>Post Announcement</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {announcements.map((ann) => (
              <div key={ann.id} style={{ ...s.cardStyle, padding: '20px 24px', borderLeft: `3px solid ${s.accent}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 100, background: s.accentLight, color: s.accent, fontFamily: s.FONT, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Pinned</span>
                  <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, marginLeft: 'auto' }}>{formatDate(ann.date)}</span>
                </div>
                <h3 style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text, margin: '0 0 6px' }}>{ann.title}</h3>
                <p style={{ fontFamily: s.FONT, fontSize: 14, lineHeight: 1.6, color: s.text2, margin: 0 }}>{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
