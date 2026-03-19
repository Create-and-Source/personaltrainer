import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles } from '../theme';
import { getSettings } from '../data/store';
import { signIn, completeNewPassword } from '../services/auth';
import { useAuth } from '../services/AuthContext';
import { setUseRealApi } from '../services/api';

export default function Home() {
  const nav = useNavigate();
  const s = useStyles();
  const { setUser } = useAuth();
  const settings = getSettings();
  const name = settings.businessName || 'FORGE Performance Training';
  const tagline = settings.tagline || 'Train Hard. Train Smart. Get Results.';

  const [email, setEmail] = useState('marcus@forgetraining.com');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState(null); // for newPasswordRequired flow

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    background: s.surface, color: s.text,
    border: `1.5px solid ${s.border}`,
    fontFamily: s.FONT, fontSize: 14, fontWeight: 400,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.newPasswordRequired) {
        setPendingUser(result.user);
        setLoading(false);
        return;
      }
      // Success
      setUseRealApi(true);
      setUser({ email, token: result.token });
      nav('/admin');
    } catch (err) {
      setError(
        err.code === 'NotAuthorizedException' ? 'Incorrect email or password.' :
        err.code === 'UserNotFoundException' ? 'No account found with that email.' :
        err.message || 'Login failed. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const result = await completeNewPassword(pendingUser, newPassword);
      setUseRealApi(true);
      setUser({ email, token: result.token });
      nav('/admin');
    } catch (err) {
      setError(err.message || 'Failed to set new password.');
      setLoading(false);
    }
  };

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
        textAlign: 'center', margin: '0 0 36px', lineHeight: 1.5,
      }}>
        {tagline}
      </p>

      {/* Login Form or Set New Password Form */}
      <div style={{ width: '100%', maxWidth: 340 }}>
        {!pendingUser ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{
                fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.text2,
                display: 'block', marginBottom: 6, paddingLeft: 4,
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="trainer@example.com"
                required
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = s.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = s.border; }}
              />
            </div>

            <div>
              <label style={{
                fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.text2,
                display: 'block', marginBottom: 6, paddingLeft: 4,
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = s.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = s.border; }}
              />
            </div>

            {error && (
              <div style={{
                fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: '#E53935',
                background: 'rgba(229, 57, 53, 0.08)', padding: '10px 14px', borderRadius: 10,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px 24px', borderRadius: 112,
              background: loading ? s.text3 : s.accent,
              color: s.accentText, border: 'none',
              fontFamily: s.FONT, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              boxShadow: s.shadowMd,
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = s.shadowLg; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = s.shadowMd; }}
            >
              {loading ? 'Signing in...' : 'Log In as Trainer'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.accent,
              background: `${s.accent}14`, padding: '12px 14px', borderRadius: 10,
              textAlign: 'center', lineHeight: 1.5,
            }}>
              First login detected. Please set a permanent password.
            </div>

            <div>
              <label style={{
                fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.text2,
                display: 'block', marginBottom: 6, paddingLeft: 4,
              }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = s.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = s.border; }}
              />
            </div>

            <div>
              <label style={{
                fontFamily: s.FONT, fontSize: 12, fontWeight: 500, color: s.text2,
                display: 'block', marginBottom: 6, paddingLeft: 4,
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = s.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = s.border; }}
              />
            </div>

            {error && (
              <div style={{
                fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: '#E53935',
                background: 'rgba(229, 57, 53, 0.08)', padding: '10px 14px', borderRadius: 10,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px 24px', borderRadius: 112,
              background: loading ? s.text3 : s.accent,
              color: s.accentText, border: 'none',
              fontFamily: s.FONT, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              boxShadow: s.shadowMd,
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = s.shadowLg; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = s.shadowMd; }}
            >
              {loading ? 'Setting password...' : 'Set Password & Continue'}
            </button>

            <button type="button" onClick={() => { setPendingUser(null); setError(''); setNewPassword(''); setConfirmPassword(''); }} style={{
              width: '100%', padding: '12px 24px', borderRadius: 112,
              background: 'transparent', color: s.text3,
              border: 'none',
              fontFamily: s.FONT, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              Back to login
            </button>
          </form>
        )}

        {/* Client portal button */}
        {!pendingUser && (
          <button onClick={() => nav('/portal')} style={{
            width: '100%', padding: '16px 24px', borderRadius: 112,
            background: 'transparent', color: s.accent,
            border: `1.5px solid ${s.accent}`,
            fontFamily: s.FONT, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginTop: 14,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = s.accentLight; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Continue as Client
          </button>
        )}
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
