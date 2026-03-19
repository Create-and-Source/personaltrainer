import { useNavigate } from 'react-router-dom';
import { useStyles } from '../theme';
import { getSettings } from '../data/store';

export default function Home() {
  const nav = useNavigate();
  const s = useStyles();
  const settings = getSettings();
  const name = settings.businessName || 'FORGE Performance Training';
  const tagline = settings.tagline || 'Train Hard. Train Smart. Get Results.';

  return (
    <div style={{
      minHeight: '100vh', background: s.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative',
    }}>
      {/* Logo mark */}
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: s.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: s.HEADING, fontSize: 30, fontWeight: 700, color: s.accentText,
        marginBottom: 28,
        boxShadow: s.shadowMd,
      }}>
        {name[0]}
      </div>

      {/* Business name */}
      <h1 style={{
        fontFamily: s.HEADING, fontSize: 28, fontWeight: 600, color: s.text,
        textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.3px',
      }}>
        {name}
      </h1>

      {/* Tagline */}
      <p style={{
        fontFamily: s.FONT, fontSize: 15, fontWeight: 400, color: s.text3,
        textAlign: 'center', margin: '0 0 48px', lineHeight: 1.5,
      }}>
        {tagline}
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        <button onClick={() => nav('/admin')} style={{
          width: '100%', padding: '16px 24px', borderRadius: 112,
          background: s.accent, color: s.accentText, border: 'none',
          fontFamily: s.FONT, fontSize: 15, fontWeight: 600, cursor: 'pointer',
          boxShadow: s.shadowMd,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = s.shadowLg; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = s.shadowMd; }}
        >
          Log In as Trainer
        </button>

        <button onClick={() => nav('/portal')} style={{
          width: '100%', padding: '16px 24px', borderRadius: 112,
          background: 'transparent', color: s.accent,
          border: `1.5px solid ${s.accent}`,
          fontFamily: s.FONT, fontSize: 15, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = s.accentLight; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          Log In as Client
        </button>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 28,
        fontFamily: s.FONT, fontSize: 12, fontWeight: 400, color: s.text3,
        textAlign: 'center', letterSpacing: '0.04em',
      }}>
        Powered by FORGE
      </div>
    </div>
  );
}
