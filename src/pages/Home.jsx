import { useNavigate } from 'react-router-dom';
import { useStyles } from '../theme';
import { getSettings } from '../data/store';

const FEATURES = [
  { icon: 'workout', label: 'Workout Builder', desc: 'Custom programs & exercise library' },
  { icon: 'progress', label: 'Progress Tracking', desc: 'Weight, body comp & PR history' },
  { icon: 'nutrition', label: 'Nutrition & Habits', desc: 'Meal plans & daily habit rings' },
  { icon: 'ai', label: 'AI Coaching', desc: 'Smart program adjustments' },
];

function FeatureIcon({ type, color }) {
  const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' };
  switch (type) {
    case 'workout': return <svg {...props}><path d="M6.5 6.5h11M6.5 17.5h11"/><rect x="2" y="6.5" width="4.5" height="11" rx="1"/><rect x="17.5" y="6.5" width="4.5" height="11" rx="1"/><line x1="12" y1="6.5" x2="12" y2="17.5"/></svg>;
    case 'progress': return <svg {...props}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
    case 'nutrition': return <svg {...props} strokeLinejoin="round"><path d="M11 20A7 7 0 019.8 6.9C15.5 4.9 17 3.5 17 3.5s1.5 2.5-.5 8.5c-1 3-3 5.5-5.5 8z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
    case 'ai': return <svg {...props} strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    default: return null;
  }
}

export default function Home() {
  const nav = useNavigate();
  const s = useStyles();
  const settings = getSettings();
  const name = settings.businessName || 'Stoa';
  const tagline = settings.tagline || 'Your whole wellness life. One app.';

  return (
    <div style={{
      minHeight: '100vh', background: s.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${s.accent}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', maxWidth: 440, width: '100%', position: 'relative',
        animation: 'homeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: 22,
          background: s.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: s.HEADING, fontSize: 34, fontWeight: 700, color: s.accentText,
          marginBottom: 28, boxShadow: s.shadowLg,
        }}>
          {name[0]}
        </div>

        <h1 style={{
          fontFamily: s.HEADING, fontSize: 32, fontWeight: 700, color: s.text,
          textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.5px',
        }}>
          {name}
        </h1>

        <p style={{
          fontFamily: s.FONT, fontSize: 16, fontWeight: 400, color: s.text2,
          textAlign: 'center', margin: '0 0 40px', lineHeight: 1.5,
        }}>
          {tagline}
        </p>

        {/* Feature pills */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          width: '100%', marginBottom: 40,
        }}>
          {FEATURES.map(f => (
            <div key={f.icon} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              background: s.surface, border: `1px solid ${s.border}`,
              boxShadow: s.shadow,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: s.accentLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FeatureIcon type={f.icon} color={s.accent} />
              </div>
              <div>
                <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 600, color: s.text, lineHeight: 1.2 }}>
                  {f.label}
                </div>
                <div style={{ fontFamily: s.FONT, fontSize: 11, fontWeight: 400, color: s.text3, marginTop: 2, lineHeight: 1.3 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <button onClick={() => nav('/admin')}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = s.shadowLg; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = s.shadowMd; }}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 112,
              background: s.accent, color: s.accentText, border: 'none',
              fontFamily: s.FONT, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              boxShadow: s.shadowMd, transition: 'all 0.2s ease',
            }}>
            Log In as Trainer
          </button>

          <button onClick={() => nav('/portal')}
            onMouseEnter={e => { e.currentTarget.style.background = s.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 112,
              background: 'transparent', color: s.accent,
              border: `1.5px solid ${s.accent}`,
              fontFamily: s.FONT, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}>
            Log In as Client
          </button>
        </div>

        {/* Social proof hint */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 28,
        }}>
          <div style={{ display: 'flex' }}>
            {['#D4C5B5', '#B5ADA5', '#C9B8A8'].map((c, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 14,
                background: `linear-gradient(135deg, ${c}, ${c}88)`,
                border: `2px solid ${s.bg}`,
                marginLeft: i > 0 ? -8 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: s.FONT, fontSize: 10, fontWeight: 600, color: '#62554A',
              }}>
                {['M', 'S', 'K'][i]}
              </div>
            ))}
          </div>
          <span style={{
            fontFamily: s.FONT, fontSize: 13, fontWeight: 400, color: s.text3,
          }}>
            Trusted by 200+ trainers
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '24px 0', width: '100%', textAlign: 'center',
        fontFamily: s.FONT, fontSize: 12, fontWeight: 400, color: s.text3,
        letterSpacing: '0.04em',
      }}>
        Powered by Stoa
      </div>

      <style>{`
        @keyframes homeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
