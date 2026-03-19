// Messages Hub — In-App, Instagram DMs, TikTok DMs
// Solo personal trainer messaging page
import { useState, useEffect, useRef } from 'react';
import { useStyles, getAvatarGradient } from '../theme';

const MESSAGES_KEY = 'ms_messages';
const SOCIAL_KEY = 'ms_inbox';

// ── Seed Data ──

const SEED_INAPP = [
  {
    id: 'c1', name: 'Marcus Johnson', initials: 'MJ', unread: 2,
    messages: [
      { id: 'm1', from: 'client', text: 'Hey! Just finished the leg day workout you programmed. Those Bulgarian splits are no joke 😅', ts: '2026-03-17T09:14:00' },
      { id: 'm2', from: 'trainer', text: 'Haha love to hear it! How did the weight feel on the RDLs?', ts: '2026-03-17T09:22:00' },
      { id: 'm3', from: 'client', text: 'Good actually — hit 185 for 4x8 with solid form. Glutes were on fire', ts: '2026-03-17T09:30:00' },
      { id: 'm4', from: 'trainer', text: 'That\'s a PR! We\'re bumping you to 195 next week. Recovery day tomorrow — foam roll and stretch.', ts: '2026-03-17T09:35:00' },
      { id: 'm5', from: 'client', text: 'Sounds good, also wanted to ask about adding a Saturday session?', ts: '2026-03-18T08:10:00' },
    ],
  },
  {
    id: 'c2', name: 'Alyssa Chen', initials: 'AC', unread: 1,
    messages: [
      { id: 'm1', from: 'trainer', text: 'Hey Alyssa! Just checking in — how\'s the meal prep going this week?', ts: '2026-03-16T14:00:00' },
      { id: 'm2', from: 'client', text: 'Going great! I actually enjoyed that turkey meatball recipe you shared', ts: '2026-03-16T14:20:00' },
      { id: 'm3', from: 'trainer', text: 'Awesome! Your consistency is showing — the progress pics from last week were 🔥', ts: '2026-03-16T14:25:00' },
      { id: 'm4', from: 'client', text: 'Thank you!! Can we move Wednesday\'s session to Thursday this week? I have a work thing', ts: '2026-03-18T10:05:00' },
    ],
  },
  {
    id: 'c3', name: 'Derek Williams', initials: 'DW', unread: 0,
    messages: [
      { id: 'm1', from: 'client', text: 'Quick question — should I still take creatine on rest days?', ts: '2026-03-15T16:40:00' },
      { id: 'm2', from: 'trainer', text: 'Yes! Creatine works through saturation so you want to take it daily, even rest days. 5g with plenty of water.', ts: '2026-03-15T17:00:00' },
      { id: 'm3', from: 'client', text: 'Got it, thanks coach! See you Thursday', ts: '2026-03-15T17:05:00' },
    ],
  },
  {
    id: 'c4', name: 'Priya Patel', initials: 'PP', unread: 3,
    messages: [
      { id: 'm1', from: 'client', text: 'I just hit a 225 deadlift!!! 🎉🎉🎉', ts: '2026-03-17T17:30:00' },
      { id: 'm2', from: 'trainer', text: 'LET\'S GOOO!! That\'s your 2-plate milestone! I knew you had it in you! 💪', ts: '2026-03-17T17:35:00' },
      { id: 'm3', from: 'client', text: 'I literally screamed in the gym lol. Everyone was staring', ts: '2026-03-17T17:37:00' },
      { id: 'm4', from: 'client', text: 'Also I took a video — can I post it and tag you?', ts: '2026-03-17T17:38:00' },
      { id: 'm5', from: 'trainer', text: 'Absolutely! Tag me and I\'ll repost. So proud of you!', ts: '2026-03-17T17:40:00' },
    ],
  },
  {
    id: 'c5', name: 'Tyler Brooks', initials: 'TB', unread: 0,
    messages: [
      { id: 'm1', from: 'trainer', text: 'Tyler — your updated program is in the app. We\'re shifting to a PPL split starting next week.', ts: '2026-03-14T11:00:00' },
      { id: 'm2', from: 'client', text: 'Just looked at it — looks intense! What\'s the deal with the tempo work on bench?', ts: '2026-03-14T12:15:00' },
      { id: 'm3', from: 'trainer', text: '3-second eccentric to build time under tension. Your sticking point is off the chest so this will help a lot.', ts: '2026-03-14T12:20:00' },
      { id: 'm4', from: 'client', text: 'Makes sense. I\'m in — let\'s get this bench to 275', ts: '2026-03-14T12:25:00' },
    ],
  },
];

const SEED_INSTAGRAM = [
  {
    id: 'ig1', handle: '@fit_maria_23', name: 'Maria', initials: 'M', unread: 2,
    messages: [
      { id: 'm1', from: 'client', text: 'Hey! I saw your client transformation post — those results are insane. Do you take new clients?', ts: '2026-03-17T20:00:00' },
      { id: 'm2', from: 'trainer', text: 'Hey Maria! Thanks so much 🙏 Yes I have a couple spots open right now. Are you local or looking for online coaching?', ts: '2026-03-17T20:30:00' },
      { id: 'm3', from: 'client', text: 'I\'m local! Would love in-person sessions. What are your rates?', ts: '2026-03-18T09:00:00' },
      { id: 'm4', from: 'client', text: 'Also do you do nutrition coaching too or just training?', ts: '2026-03-18T09:02:00' },
    ],
  },
  {
    id: 'ig2', handle: '@jake_lifts', name: 'Jake', initials: 'J', unread: 1,
    messages: [
      { id: 'm1', from: 'client', text: 'Yo your reel on fixing anterior pelvic tilt was so helpful. I\'ve been dealing with that for years', ts: '2026-03-16T15:00:00' },
      { id: 'm2', from: 'trainer', text: 'Glad it helped! That\'s one of the most common issues I see. Are you doing the hip flexor stretches consistently?', ts: '2026-03-16T15:45:00' },
      { id: 'm3', from: 'client', text: 'Started this week — already feeling a difference. Do you offer online programming?', ts: '2026-03-18T07:30:00' },
    ],
  },
  {
    id: 'ig3', handle: '@samantha.wellness', name: 'Samantha', initials: 'S', unread: 0,
    messages: [
      { id: 'm1', from: 'client', text: 'Hi! I\'m getting married in 6 months and want to get in the best shape of my life. Can you help?', ts: '2026-03-14T10:00:00' },
      { id: 'm2', from: 'trainer', text: 'Congrats on the engagement! 6 months is a great timeline. I\'d love to help — let me send you my consultation link', ts: '2026-03-14T10:30:00' },
      { id: 'm3', from: 'client', text: 'Just booked! See you next Tuesday 😊', ts: '2026-03-14T11:00:00' },
    ],
  },
  {
    id: 'ig4', handle: '@run.with.nina', name: 'Nina', initials: 'N', unread: 0,
    messages: [
      { id: 'm1', from: 'client', text: 'Do you work with runners? I want to add strength training but don\'t know where to start', ts: '2026-03-13T18:00:00' },
      { id: 'm2', from: 'trainer', text: 'Absolutely! Strength training is a game changer for runners — injury prevention, speed, everything. I have a specific program for endurance athletes.', ts: '2026-03-13T19:00:00' },
      { id: 'm3', from: 'client', text: 'That sounds perfect. I\'ll think about it and get back to you!', ts: '2026-03-13T19:15:00' },
    ],
  },
];

const SEED_TIKTOK = [
  {
    id: 'tt1', handle: '@gains_or_nothing', name: 'Chris', initials: 'C', unread: 1,
    messages: [
      { id: 'm1', from: 'client', text: 'bro your "mistakes killing your gains" video just hit 500k 🔥 you weren\'t lying about the ego lifting part', ts: '2026-03-17T22:00:00' },
      { id: 'm2', from: 'trainer', text: 'Haha appreciate that! Most people don\'t want to hear it but lighter weight + proper form = way more growth', ts: '2026-03-17T22:20:00' },
      { id: 'm3', from: 'client', text: 'Facts. Do you do online coaching? I need someone to fix my programming', ts: '2026-03-18T08:00:00' },
    ],
  },
  {
    id: 'tt2', handle: '@prettyliftsheavy', name: 'Destiny', initials: 'D', unread: 2,
    messages: [
      { id: 'm1', from: 'client', text: 'Just saw your glute workout video — I\'ve been doing hip thrusts wrong this whole time 😭', ts: '2026-03-16T20:00:00' },
      { id: 'm2', from: 'trainer', text: 'It\'s SO common! The pause at the top makes all the difference. Try it next session and let me know', ts: '2026-03-16T20:30:00' },
      { id: 'm3', from: 'client', text: 'Tried it today and WOW. Completely different exercise. How much for 1-on-1 coaching?', ts: '2026-03-18T11:00:00' },
      { id: 'm4', from: 'client', text: 'I\'m in Phoenix btw so in-person would work!', ts: '2026-03-18T11:02:00' },
    ],
  },
  {
    id: 'tt3', handle: '@newbie_lifter_2026', name: 'Alex', initials: 'A', unread: 0,
    messages: [
      { id: 'm1', from: 'client', text: 'I\'m brand new to the gym and your beginner series actually made me feel like I can do this', ts: '2026-03-12T14:00:00' },
      { id: 'm2', from: 'trainer', text: 'That means the world! Everyone starts somewhere. What does your current routine look like?', ts: '2026-03-12T15:00:00' },
      { id: 'm3', from: 'client', text: 'Honestly just random machines lol. I have no plan', ts: '2026-03-12T15:10:00' },
      { id: 'm4', from: 'trainer', text: 'That\'s okay! Check my link in bio — I have a free 4-week beginner program. Start there and DM me if you have any questions along the way 💪', ts: '2026-03-12T15:15:00' },
    ],
  },
];

function loadData(key, seed) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && saved.length) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatChatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ── Icons ──

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E1306C" strokeWidth="2"/>
    <circle cx="12" cy="12" r="5" stroke="#E1306C" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.5" fill="#E1306C"/>
  </svg>
);

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 12a4 4 0 1 0 4 4V4c.5 2.5 3 4 5 4" stroke="#EE1D52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChatIcon = ({ size = 18, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const SendIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

// ── Tab config ──

const TABS = [
  { id: 'inapp', label: 'In-App', color: null, icon: 'chat' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', icon: 'ig' },
  { id: 'tiktok', label: 'TikTok', color: '#EE1D52', icon: 'tt' },
];

// ── Main Component ──

export default function Inbox() {
  const s = useStyles();
  const [tab, setTab] = useState('inapp');
  const [inapp, setInapp] = useState(() => loadData(MESSAGES_KEY, SEED_INAPP));
  const [instagram, setInstagram] = useState(() => loadData(SOCIAL_KEY + '_ig', SEED_INSTAGRAM));
  const [tiktok, setTiktok] = useState(() => loadData(SOCIAL_KEY + '_tt', SEED_TIKTOK));
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persist changes
  useEffect(() => { localStorage.setItem(MESSAGES_KEY, JSON.stringify(inapp)); }, [inapp]);
  useEffect(() => { localStorage.setItem(SOCIAL_KEY + '_ig', JSON.stringify(instagram)); }, [instagram]);
  useEffect(() => { localStorage.setItem(SOCIAL_KEY + '_tt', JSON.stringify(tiktok)); }, [tiktok]);

  // Scroll to bottom on conversation change or new message
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, inapp, instagram, tiktok]);

  const conversations = tab === 'inapp' ? inapp : tab === 'instagram' ? instagram : tiktok;
  const setConversations = tab === 'inapp' ? setInapp : tab === 'instagram' ? setInstagram : setTiktok;
  const selected = conversations.find(c => c.id === selectedId) || null;
  const tabAccent = tab === 'instagram' ? '#E1306C' : tab === 'tiktok' ? '#EE1D52' : s.accent;

  const unreadCounts = {
    inapp: inapp.reduce((sum, c) => sum + (c.unread || 0), 0),
    instagram: instagram.reduce((sum, c) => sum + (c.unread || 0), 0),
    tiktok: tiktok.reduce((sum, c) => sum + (c.unread || 0), 0),
  };

  function selectConversation(id) {
    setSelectedId(id);
    setDraft('');
    // Mark as read
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
  }

  function sendMessage() {
    if (!draft.trim() || !selectedId) return;
    const msg = { id: `m${Date.now()}`, from: 'trainer', text: draft.trim(), ts: new Date().toISOString() };
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, messages: [...c.messages, msg] } : c));
    setDraft('');
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 50);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  // ── Conversation List ──
  function renderList() {
    return (
      <div style={{
        width: isMobile ? '100%' : 360,
        minWidth: isMobile ? undefined : 360,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: isMobile ? 'none' : `1px solid ${s.border}`,
        overflow: 'hidden',
      }}>
        {/* Search placeholder */}
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{
            ...s.input,
            padding: '10px 14px',
            fontSize: 13,
            borderRadius: 10,
            color: s.text3,
            cursor: 'default',
          }}>
            Search messages...
          </div>
        </div>

        {/* Conversation rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map(conv => {
            const last = conv.messages[conv.messages.length - 1];
            const isActive = conv.id === selectedId;
            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: isActive ? (s.dark ? '#252529' : `${tabAccent}08`) : 'transparent',
                  borderLeft: isActive ? `3px solid ${tabAccent}` : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = s.dark ? '#1F1F23' : '#F8F8FA'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: getAvatarGradient(conv.name || conv.handle),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: s.FONT,
                  flexShrink: 0,
                  position: 'relative',
                }}>
                  {conv.initials}
                  {/* Platform badge for social */}
                  {tab !== 'inapp' && (
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: s.dark ? '#1A1A1E' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1.5px solid ${s.dark ? '#2A2A2E' : '#E5E5E5'}`,
                    }}>
                      {tab === 'instagram' ? <InstagramIcon size={10} /> : <TikTokIcon size={10} />}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{
                      fontWeight: conv.unread ? 700 : 500,
                      fontSize: 14,
                      color: s.text,
                      fontFamily: s.FONT,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {tab === 'inapp' ? conv.name : conv.handle}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: s.text3,
                      fontFamily: s.FONT,
                      flexShrink: 0,
                      marginLeft: 8,
                    }}>
                      {formatTime(last.ts)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 13,
                      color: conv.unread ? s.text : s.text3,
                      fontWeight: conv.unread ? 500 : 400,
                      fontFamily: s.FONT,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}>
                      {last.from === 'trainer' ? 'You: ' : ''}{last.text}
                    </span>
                    {conv.unread > 0 && (
                      <span style={{
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        background: tabAccent,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: s.FONT,
                        padding: '0 6px',
                        flexShrink: 0,
                      }}>
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Chat View ──
  function renderChat() {
    if (!selected) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: s.text3,
          fontFamily: s.FONT,
          gap: 12,
        }}>
          <ChatIcon size={48} color={s.text3} />
          <span style={{ fontSize: 15 }}>Select a conversation</span>
        </div>
      );
    }

    const trainerBubble = tabAccent;
    const clientBubble = s.dark ? '#252529' : '#F0F0F2';

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}>
        {/* Chat header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: `1px solid ${s.border}`,
          background: s.dark ? '#1A1A1E' : 'rgba(255,255,255,0.8)',
          backdropFilter: s.dark ? 'none' : 'blur(12px)',
          flexShrink: 0,
        }}>
          {isMobile && (
            <button
              onClick={() => setSelectedId(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: s.text,
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <BackIcon />
            </button>
          )}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: getAvatarGradient(selected.name || selected.handle),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            fontFamily: s.FONT,
            flexShrink: 0,
          }}>
            {selected.initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: s.text, fontFamily: s.FONT }}>
              {tab === 'inapp' ? selected.name : selected.handle}
            </div>
            {tab !== 'inapp' && (
              <div style={{ fontSize: 12, color: s.text3, fontFamily: s.FONT }}>
                {tab === 'instagram' ? 'Instagram DM' : 'TikTok DM'}
              </div>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {selected.messages.map((msg, i) => {
            const isTrainer = msg.from === 'trainer';
            const showTime = i === 0 || new Date(msg.ts).getTime() - new Date(selected.messages[i - 1].ts).getTime() > 3600000;

            return (
              <div key={msg.id}>
                {showTime && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: s.text3,
                    fontFamily: s.FONT,
                    margin: '12px 0 8px',
                  }}>
                    {formatTime(msg.ts)} {formatChatTime(msg.ts)}
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: isTrainer ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: isTrainer ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isTrainer ? trainerBubble : clientBubble,
                    color: isTrainer ? '#FFFFFF' : s.text,
                    fontSize: 14,
                    lineHeight: 1.45,
                    fontFamily: s.FONT,
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Message input */}
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${s.border}`,
          background: s.dark ? '#1A1A1E' : 'rgba(255,255,255,0.8)',
          backdropFilter: s.dark ? 'none' : 'blur(12px)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            style={{
              ...s.input,
              resize: 'none',
              minHeight: 42,
              maxHeight: 120,
              padding: '11px 16px',
              borderRadius: 22,
              fontSize: 14,
              lineHeight: 1.4,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!draft.trim()}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: 'none',
              background: draft.trim() ? tabAccent : (s.dark ? '#252529' : '#E8E8EA'),
              cursor: draft.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <SendIcon color={draft.trim() ? '#fff' : s.text3} />
          </button>
        </div>
      </div>
    );
  }

  // ── Mobile: show list or chat ──
  const showChatOnMobile = isMobile && selectedId && selected;

  return (
    <div style={{ padding: isMobile ? 0 : '0 24px 24px', fontFamily: s.FONT }}>
      {/* Header — hidden when viewing chat on mobile */}
      {!(isMobile && showChatOnMobile) && (
        <div style={{ padding: isMobile ? '16px 16px 0' : '0 0 16px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: s.text, margin: '0 0 16px', fontFamily: s.FONT }}>
            Messages
          </h1>

          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const isActive = tab === t.id;
              const tColor = t.color || s.accent;
              const count = unreadCounts[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSelectedId(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 16px',
                    borderRadius: 100,
                    border: isActive ? `1.5px solid ${tColor}` : `1px solid ${s.dark ? '#2A2A2E' : 'rgba(0,0,0,0.06)'}`,
                    background: isActive ? (s.dark ? `${tColor}20` : `${tColor}0A`) : (s.dark ? '#1A1A1E' : 'rgba(255,255,255,0.5)'),
                    color: isActive ? tColor : s.text2,
                    cursor: 'pointer',
                    fontFamily: s.FONT,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t.icon === 'chat' && <ChatIcon size={14} color={isActive ? tColor : s.text3} />}
                  {t.icon === 'ig' && <InstagramIcon size={14} />}
                  {t.icon === 'tt' && <TikTokIcon size={14} />}
                  {t.label}
                  {count > 0 && (
                    <span style={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      background: tColor,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 5px',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{
        ...s.cardStyle,
        display: 'flex',
        height: isMobile ? (showChatOnMobile ? 'calc(100vh - 70px)' : 'calc(100vh - 200px)') : 'calc(100vh - 200px)',
        overflow: 'hidden',
        borderRadius: isMobile && showChatOnMobile ? 0 : 16,
      }}>
        {/* On mobile: show list OR chat. On desktop: show both side by side */}
        {isMobile ? (
          showChatOnMobile ? renderChat() : renderList()
        ) : (
          <>
            {renderList()}
            {renderChat()}
          </>
        )}
      </div>
    </div>
  );
}
