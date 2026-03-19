import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { subscribe, getSettings } from '../data/store';

const STORE_KEY = 'ms_reviews';

function getReviews() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } }
function setReviews(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

function seedReviews() {
  const isCurrentVersion = localStorage.getItem('ms_reviews_version') === 'v2';
  if (getReviews().length > 0 && isCurrentVersion) return;
  localStorage.setItem('ms_reviews_version', 'v2');
  const now = new Date();
  const d = (offset) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt.toISOString(); };
  const names = ['Emma Johnson', 'Olivia Williams', 'Sophia Brown', 'Ava Jones', 'Isabella Garcia', 'Mia Miller', 'Charlotte Davis', 'Amelia Thompson', 'Harper White', 'Evelyn Lopez', 'Abigail Taylor', 'Ella Thomas', 'Scarlett Hernandez', 'Grace Moore', 'Chloe Martin', 'Victoria Jackson', 'Riley Clark', 'Aria Lewis'];
  const services = ['Strength Training', 'HIIT Circuit', 'Functional Training', 'Power Lifting', 'Recovery + Stretch', 'Athletic Performance', 'Metabolic Conditioning', 'Private Session'];
  const platforms = ['Google', 'Google', 'Google', 'Yelp', 'Google', 'Yelp'];
  const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'pending', 'completed', 'completed', 'completed', 'pending'];
  const comments = ['Amazing sessions! The trainers are incredible.', 'Best training gym around.', 'Super professional team.', 'Great experience! Highly recommend!', 'The trainers made me feel so comfortable.', 'Incredible transformation. Worth every penny.', 'The HIIT sessions are so challenging and fun.', 'Five stars is not enough!', 'Clean facility, friendly staff.', 'I was nervous but the trainers put me at ease.', 'Been coming here for 2 years.', 'The strength training was life-changing.', 'Professional, knowledgeable, and results speak for themselves.', 'My friends keep asking what I have been doing differently.', 'Top-notch training.'];
  const seed = names.map((name, i) => {
    const isCompleted = statuses[i % statuses.length] === 'completed';
    return { id: `REV-${1000 + i}`, patientId: `PAT-${1000 + i}`, patientName: name, service: services[i % services.length], platform: platforms[i % platforms.length], status: isCompleted ? 'completed' : 'pending', rating: isCompleted ? 5 : null, comment: isCompleted ? comments[i % comments.length] : null, requestSentAt: d(-Math.floor(3 + Math.random() * 45)), completedAt: isCompleted ? d(-Math.floor(1 + Math.random() * 30)) : null, appointmentDate: d(-Math.floor(5 + Math.random() * 50)) };
  });
  setReviews(seed);
}

export default function Reviews() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { seedReviews(); setTick(t => t + 1); }, []);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const settings = getSettings();
  const businessName = settings.businessName || 'FORGE Performance Training';
  const reviews = getReviews();

  const completed = reviews.filter(r => r.status === 'completed');
  const pending = reviews.filter(r => r.status === 'pending');
  const totalReviews = completed.length;
  const avgRating = completed.length > 0 ? (completed.reduce((sum, r) => sum + (r.rating || 0), 0) / completed.length).toFixed(1) : '\u2014';
  const now = new Date();
  const thisMonth = completed.filter(r => { const d = new Date(r.completedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const responseRate = reviews.length > 0 ? Math.round((completed.length / reviews.length) * 100) : 0;

  const filtered = reviews.filter(r => {
    if (filter === 'pending' && r.status !== 'pending') return false;
    if (filter === 'completed' && r.status !== 'completed') return false;
    if (filter === 'google' && r.platform !== 'Google') return false;
    if (filter === 'yelp' && r.platform !== 'Yelp') return false;
    if (search) { const q = search.toLowerCase(); return r.patientName?.toLowerCase().includes(q) || r.service?.toLowerCase().includes(q); }
    return true;
  });

  const sendRequest = (id) => { setReviews(getReviews().map(r => r.id === id ? { ...r, status: 'pending', requestSentAt: new Date().toISOString() } : r)); const rev = getReviews().find(r => r.id === id); setToast(`Review request sent to ${rev?.patientName}`); setTimeout(() => setToast(null), 3000); setTick(t => t + 1); };
  const simulateComplete = (id) => { const c = ['Great experience!', 'Love my results!', 'Professional team!', 'Best gym ever.']; setReviews(getReviews().map(r => r.id === id ? { ...r, status: 'completed', rating: 5, comment: c[Math.floor(Math.random() * c.length)], completedAt: new Date().toISOString() } : r)); setToast('Review received!'); setTimeout(() => setToast(null), 3000); setTick(t => t + 1); };

  const Stars = ({ rating, size = 16 }) => (<span style={{ display: 'inline-flex', gap: 1 }}>{[1, 2, 3, 4, 5].map(i => (<span key={i} style={{ fontSize: size, color: i <= rating ? '#F59E0B' : s.borderLight, lineHeight: 1 }}>{'\u2605'}</span>))}</span>);

  const smsTemplate = `Thanks for visiting ${businessName}! Love your results? Leave us a quick review: https://g.page/${businessName.replace(/\s/g, '').toLowerCase()}/review`;

  return (
    <div>
      {toast && (<div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, ...s.cardStyle, padding: '12px 20px', background: s.accent, color: s.accentText, fontFamily: s.FONT, fontSize: 13, fontWeight: 500, borderRadius: 10, boxShadow: s.shadowLg }}>{toast}</div>)}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: s.HEADING, fontSize: 26, fontWeight: 600, color: s.text, marginBottom: 4 }}>Reviews</h1>
        <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2 }}>Track review requests, ratings, and response rates across platforms</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Reviews', value: totalReviews, color: s.text },
          { label: 'Average Rating', value: avgRating, color: Number(avgRating) >= 4.5 ? s.success : Number(avgRating) >= 3.5 ? s.warning : s.danger, extra: completed.length > 0 ? <Stars rating={Math.round(Number(avgRating))} size={12} /> : null },
          { label: 'Reviews This Month', value: thisMonth, color: s.accent },
          { label: 'Response Rate', value: `${responseRate}%`, color: responseRate >= 70 ? s.success : responseRate >= 40 ? s.warning : s.danger },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: s.HEADING, fontSize: 24, fontWeight: 600, color: k.color }}>{k.value}</div>
            {k.extra && <div style={{ marginTop: 4 }}>{k.extra}</div>}
          </div>
        ))}
      </div>

      {/* SMS Template */}
      <div style={{ ...s.cardStyle, padding: '16px 20px', marginBottom: 24 }}>
        <div style={s.label}>Review Request Template (SMS)</div>
        <div style={{ padding: '12px 16px', background: s.accentLight, borderRadius: 8, fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.6, border: `1px dashed ${s.border}` }}>{smsTemplate}</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients or sessions..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['all', 'All'], ['pending', 'Pending'], ['completed', 'Completed'], ['google', 'Google'], ['yelp', 'Yelp']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ ...s.pill, padding: '7px 14px', fontSize: 12, background: filter === id ? s.accent : 'transparent', color: filter === id ? s.accentText : s.text2, border: filter === id ? `1px solid ${s.accent}` : `1px solid ${s.borderLight}` }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(rev => (
          <div key={rev.id} style={{
            ...s.cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
            borderLeftWidth: 3, borderLeftStyle: 'solid',
            borderLeftColor: rev.status === 'completed' ? (rev.rating >= 4 ? s.success : rev.rating >= 3 ? s.warning : s.danger) : s.text3,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: rev.status === 'completed' ? s.successBg : s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: rev.status === 'completed' ? s.success : s.text2 }}>
              {rev.patientName?.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>{rev.patientName}</span>
                <span style={{ padding: '2px 8px', borderRadius: 100, fontFamily: s.FONT, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', background: rev.platform === 'Google' ? (s.dark ? 'rgba(37,99,235,0.12)' : '#EFF6FF') : s.dangerBg, color: rev.platform === 'Google' ? '#2563EB' : s.danger }}>{rev.platform}</span>
                <span style={{ padding: '2px 8px', borderRadius: 100, fontFamily: s.FONT, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', background: rev.status === 'completed' ? s.successBg : s.warningBg, color: rev.status === 'completed' ? s.success : s.warning }}>{rev.status}</span>
              </div>
              <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{rev.service}</div>
              {rev.status === 'completed' && (
                <div style={{ marginTop: 4 }}>
                  <Stars rating={rev.rating} size={14} />
                  {rev.comment && <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3, marginTop: 2, fontStyle: 'italic' }}>"{rev.comment}"</div>}
                </div>
              )}
              <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, marginTop: 2 }}>
                Requested: {rev.requestSentAt ? new Date(rev.requestSentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                {rev.completedAt && ` -- Reviewed: ${new Date(rev.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              {rev.status === 'pending' && (<><button onClick={() => sendRequest(rev.id)} style={{ ...s.pillAccent, padding: '6px 12px', fontSize: 11 }}>Send Review Request</button><button onClick={() => simulateComplete(rev.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Simulate Review</button></>)}
              {rev.status === 'completed' && rev.rating && (<div style={{ fontFamily: s.MONO, fontSize: 18, fontWeight: 600, color: rev.rating >= 4 ? s.success : rev.rating >= 3 ? s.warning : s.danger, textAlign: 'right' }}>{rev.rating}.0</div>)}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (<div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>{filter === 'all' ? 'No reviews yet' : 'No reviews match this filter'}</div>)}
      </div>
    </div>
  );
}
