// Home — the "cover" page. Shows the brand then lets you explore the platform
import { useNavigate } from 'react-router-dom';
import { useStyles, useTheme } from '../theme';
import { getSettings, getPatients, getAppointments, getServices, getInventory, getRetentionAlerts } from '../data/store';

const fmt = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export default function Home() {
  const s = useStyles();
  const { theme } = useTheme();
  const nav = useNavigate();
  const settings = getSettings();
  const name = settings.businessName || 'Remedy Pilates & Barre';
  const tagline = settings.tagline || "If you're over the common workout, you've found the Remedy.";

  // Pull real data for the dashboard preview
  const patients = getPatients();
  const appointments = getAppointments();
  const services = getServices();
  const inventory = getInventory();
  const alerts = getRetentionAlerts();

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.date === today);
  const thisMonth = today.slice(0, 7);
  const monthAppts = appointments.filter(a => a.date?.startsWith(thisMonth) && a.status === 'completed');
  const monthRevenue = monthAppts.reduce((sum, a) => {
    const svc = services.find(sv => sv.id === a.serviceId);
    return sum + (svc?.price || 0);
  }, 0);
  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.accent}12 0%, transparent 60%)`,
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      {/* Nav — fixed at top */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: theme.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `700 14px ${s.FONT}`, color: theme.accentText,
          }}>
            {name[0]}
          </div>
          <span style={{ font: `600 16px ${s.FONT}`, color: '#fff' }}>{name}</span>
          <span style={{ font: `400 10px ${s.MONO}`, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>Est. 2008</span>
        </div>
        <div className="home-nav-btns" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => nav('/book')} style={{
            padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', color: 'rgba(255,255,255,0.7)', font: `400 13px ${s.FONT}`, cursor: 'pointer',
          }}>Book</button>
          <button onClick={() => nav('/portal')} style={{
            padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent', color: 'rgba(255,255,255,0.7)', font: `400 13px ${s.FONT}`, cursor: 'pointer',
          }}>Portal</button>
          <button onClick={() => nav('/admin')} style={{
            padding: '8px 20px', borderRadius: 100, border: 'none',
            background: theme.accent, color: theme.accentText, font: `500 13px ${s.FONT}`, cursor: 'pointer',
            boxShadow: `0 2px 16px ${theme.accent}40`,
          }}>Open Dashboard</button>
        </div>
      </nav>

      {/* Hero — compact, elegant */}
      <div className="home-hero-section" style={{
        textAlign: 'center', padding: '100px 24px 40px', position: 'relative', zIndex: 10,
      }}>
        <div style={{
          font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3,
          color: theme.accent, marginBottom: 16,
        }}>{tagline}</div>
        <h1 style={{
          font: `300 48px ${s.FONT}`, color: '#fff', marginBottom: 12,
          letterSpacing: '-1px', lineHeight: 1.1,
        }}>
          The platform that runs your <span style={{ fontWeight: 600 }}>studio</span>
        </h1>
        <p style={{
          font: `300 16px ${s.FONT}`, color: 'rgba(255,255,255,0.4)',
          maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6,
        }}>
          Three Arizona studios. Reformer, Tower, Chair, Barre, TRX — all in one beautiful platform.
        </p>
        <button onClick={() => nav('/admin')} style={{
          padding: '14px 40px', borderRadius: 100, border: 'none',
          background: theme.accent, color: theme.accentText,
          font: `600 15px ${s.FONT}`, cursor: 'pointer',
          boxShadow: `0 4px 24px ${theme.accent}40`,
          transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >Explore the Dashboard</button>
      </div>

      {/* Live Dashboard Preview — real data from localStorage */}
      <div className="home-preview-section" style={{
        maxWidth: 1000, margin: '0 auto', padding: '0 24px 60px',
        position: 'relative', zIndex: 10,
      }}>
        {/* Fake browser chrome */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: '16px 16px 0 0',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
          </div>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '5px 14px',
            font: `400 11px ${s.MONO}`, color: 'rgba(255,255,255,0.3)', textAlign: 'center',
          }}>remedypilates.com/admin</div>
        </div>

        {/* Dashboard content */}
        <div onClick={() => nav('/admin')} style={{
          background: '#F5F3F0', borderRadius: '0 0 16px 16px', padding: '24px 28px',
          cursor: 'pointer', transition: 'all 0.3s',
          boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 30px 100px rgba(0,0,0,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 80px rgba(0,0,0,0.4)'; }}
        >
          {/* Mini dashboard header */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ font: `600 18px ${s.FONT}`, color: '#111', marginBottom: 2 }}>Dashboard</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: '#999' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} overview
            </div>
          </div>

          {/* KPI cards */}
          <div className="home-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: "Today's Appts", value: todayAppts.length },
              { label: 'Monthly Revenue', value: fmt(monthRevenue) },
              { label: 'Active Members', value: patients.length },
              { label: 'Retention Alerts', value: pendingAlerts },
            ].map(k => (
              <div key={k.label} style={{
                padding: '14px 12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <div style={{ font: `500 8px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.2, color: '#999', marginBottom: 4 }}>{k.label}</div>
                <div style={{ font: `600 20px ${s.FONT}`, color: '#111' }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Mini appointment list */}
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.6)',
          }}>
            <div style={{ font: `600 11px ${s.FONT}`, color: '#111', marginBottom: 8 }}>Upcoming</div>
            {appointments.filter(a => a.date >= today && a.status !== 'completed').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 3).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ font: `400 11px ${s.FONT}`, color: '#555' }}>{a.patientName}</span>
                <span style={{ font: `500 10px ${s.MONO}`, color: '#999' }}>{a.time}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, font: `500 12px ${s.FONT}`, color: theme.accent }}>
            Click anywhere to explore the full dashboard →
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
        padding: '0 24px 40px', position: 'relative', zIndex: 10,
      }}>
        {['3 Locations', 'Reformer · Tower · Chair', 'Barre & TRX', 'Member Portal', 'Class Packages', 'Online Booking', 'Memberships', 'Teacher Training', 'White-Label Branding'].map(f => (
          <span key={f} style={{
            padding: '6px 14px', borderRadius: 100, font: `400 11px ${s.FONT}`,
            color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)',
          }}>{f}</span>
        ))}
      </div>

      {/* New Client Offers */}
      <div style={{
        display: 'flex', gap: 16, justifyContent: 'center', padding: '0 24px 40px',
        position: 'relative', zIndex: 10, flexWrap: 'wrap',
      }}>
        {[
          { label: '$49', sub: 'Unlimited First Month', desc: 'Try every class, every day, any location' },
          { label: '$35', sub: 'Intro Private Session', desc: 'One-on-one with a certified instructor' },
        ].map(offer => (
          <div key={offer.sub} onClick={() => nav('/book')} style={{
            padding: '24px 32px', borderRadius: 16, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center', minWidth: 220, transition: 'all 0.25s',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = `${theme.accent}40`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <div style={{ font: `700 32px ${s.FONT}`, color: theme.accent, marginBottom: 4 }}>{offer.label}</div>
            <div style={{ font: `600 14px ${s.FONT}`, color: '#fff', marginBottom: 6 }}>{offer.sub}</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: 'rgba(255,255,255,0.4)' }}>{offer.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center', padding: '20px 24px 40px',
        position: 'relative', zIndex: 10,
      }}>
        {[
          { label: 'Admin Dashboard', path: '/admin' },
          { label: 'Member Portal', path: '/portal' },
          { label: 'Online Booking', path: '/book' },
        ].map(l => (
          <button key={l.label} onClick={() => nav(l.path)} style={{
            padding: '12px 28px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            font: `500 13px ${s.FONT}`, color: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = `${theme.accent}30`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >{l.label}</button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .home-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .home-nav-btns {
            gap: 6px !important;
          }
          .home-nav-btns button {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }
          .home-hero-section {
            padding: 80px 18px 24px !important;
          }
          .home-hero-section h1 {
            font-size: 30px !important;
          }
          .home-hero-section p {
            font-size: 14px !important;
          }
          .home-hero-section .home-hero-btns {
            flex-direction: column !important;
            width: 100% !important;
          }
          .home-hero-section .home-hero-btns button {
            width: 100% !important;
          }
          .home-preview-section {
            padding: 0 14px 40px !important;
          }
          .home-features-pills {
            padding: 0 14px 30px !important;
          }
          .home-quick-links {
            flex-direction: column !important;
            padding: 10px 14px 30px !important;
          }
          .home-quick-links button {
            width: 100% !important;
          }
          .home-services-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            padding: 0 14px !important;
          }
          nav {
            padding: 12px 14px !important;
          }
        }
        @media (max-width: 380px) {
          .home-nav-btns button:not(:last-child) {
            display: none !important;
          }
          .home-hero-section h1 {
            font-size: 26px !important;
          }
        }
      `}</style>
    </div>
  );
}
