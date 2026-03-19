import { useNavigate } from 'react-router-dom';
import { getSettings } from '../data/store';

export default function Home() {
  const nav = useNavigate();
  const settings = getSettings();
  const name = settings.businessName || 'FORGE Performance Training';

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 20, background: '#4ADE80',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, fontWeight: 800, color: '#0A0A0A',
        marginBottom: 24, boxShadow: '0 8px 32px rgba(74,222,128,0.25)',
      }}>
        F
      </div>

      {/* Brand */}
      <h1 style={{
        fontSize: 28, fontWeight: 700, color: '#F5F5F7',
        textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.5px',
      }}>
        {name}
      </h1>
      <p style={{
        fontSize: 15, fontWeight: 400, color: '#6B6B73',
        textAlign: 'center', margin: '0 0 48px', lineHeight: 1.5,
      }}>
        Train Hard. Train Smart. Get Results.
      </p>

      {/* Two buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
        <button onClick={() => nav('/admin')} style={{
          width: '100%', padding: '18px 24px', borderRadius: 16,
          background: '#4ADE80', color: '#0A0A0A', border: 'none',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(74,222,128,0.3)',
          transition: 'all 0.2s ease',
          letterSpacing: '0.3px',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(74,222,128,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(74,222,128,0.3)'; }}
        >
          Log In as Trainer
        </button>

        <button onClick={() => nav('/portal')} style={{
          width: '100%', padding: '18px 24px', borderRadius: 16,
          background: 'transparent', color: '#F5F5F7',
          border: '1.5px solid #2A2A2E',
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.3px',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE80'; e.currentTarget.style.color = '#4ADE80'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2E'; e.currentTarget.style.color = '#F5F5F7'; }}
        >
          Log In as Client
        </button>
      </div>

      {/* Subtle footer */}
      <div style={{
        position: 'absolute', bottom: 24,
        fontSize: 12, fontWeight: 400, color: '#3A3A3E',
        textAlign: 'center',
      }}>
        Powered by FORGE
      </div>
    </div>
  );
}
