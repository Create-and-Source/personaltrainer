import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const THEME_KEY = 'ms_theme';

export const PRESETS = [
  { id: 'default', name: 'Monochrome', accent: '#111111', accentLight: '#F5F5F5', accentText: '#FFFFFF' },
  { id: 'gold', name: 'Gold', accent: '#B8960C', accentLight: '#FBF7EC', accentText: '#FFFFFF' },
  { id: 'rose', name: 'Rose', accent: '#BE185D', accentLight: '#FDF2F8', accentText: '#FFFFFF' },
  { id: 'ocean', name: 'Ocean', accent: '#0369A1', accentLight: '#F0F9FF', accentText: '#FFFFFF' },
  { id: 'sage', name: 'Sage', accent: '#4D7C56', accentLight: '#F0FDF4', accentText: '#FFFFFF' },
  { id: 'plum', name: 'Plum', accent: '#7C3AED', accentLight: '#F5F3FF', accentText: '#FFFFFF' },
  { id: 'coral', name: 'Coral', accent: '#DC6843', accentLight: '#FFF7ED', accentText: '#FFFFFF' },
  { id: 'slate', name: 'Slate', accent: '#475569', accentLight: '#F8FAFC', accentText: '#FFFFFF' },
];

function loadTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY));
    if (saved) return saved;
  } catch {}
  return PRESETS[0];
}

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(loadTheme);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ms_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.innerWidth <= 860; // default dark on mobile
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      localStorage.setItem('ms_dark_mode', String(!prev));
      return !prev;
    });
  };

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, JSON.stringify(t));
  };

  const setCustomColor = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setTheme({
      id: 'custom',
      name: 'Custom',
      accent: hex,
      accentLight: `rgba(${r},${g},${b},0.06)`,
      accentText: (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#111111' : '#FFFFFF',
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setCustomColor, darkMode, toggleDarkMode, PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Generate a unique gradient for patient avatars based on their name
const AVATAR_PALETTES = [
  ['#FF6B6B', '#EE5A24'], ['#A29BFE', '#6C5CE7'], ['#55E6C1', '#1ABC9C'],
  ['#FDA7DF', '#D980FA'], ['#74B9FF', '#0984E3'], ['#FDCB6E', '#F39C12'],
  ['#E17055', '#D63031'], ['#00CEC9', '#00B894'], ['#B2BEC3', '#636E72'],
  ['#FAB1A0', '#E17055'], ['#81ECEC', '#00CEC9'], ['#DFE6E9', '#B2BEC3'],
];

export function getAvatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % AVATAR_PALETTES.length;
  const [c1, c2] = AVATAR_PALETTES[idx];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

// Shared style helpers that use current theme
export function useStyles() {
  const { theme, darkMode } = useTheme();
  const A = theme.accent;
  const AL = darkMode ? `${A}18` : theme.accentLight;
  const AT = theme.accentText;
  const dk = darkMode;

  // Set CSS variables for accent color (used by global CSS animations)
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', A);
    const r = parseInt(A.slice(1, 3), 16) || 0;
    const g = parseInt(A.slice(3, 5), 16) || 0;
    const b = parseInt(A.slice(5, 7), 16) || 0;
    document.documentElement.style.setProperty('--accent-rgb', `${r},${g},${b}`);
  }, [A]);

  return {
    accent: A,
    accentLight: AL,
    accentText: AT,
    dark: dk,
    // Typography
    FONT: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    MONO: "'JetBrains Mono', 'SF Mono', monospace",
    // Colors — dark-mode aware
    bg: dk ? '#0D0D0F' : '#F5F3F0',
    card: dk ? '#1A1A1E' : 'rgba(255,255,255,0.72)',
    cardSolid: dk ? '#1A1A1E' : '#FFFFFF',
    border: dk ? '#2A2A2E' : 'rgba(255,255,255,0.6)',
    borderLight: dk ? '#2A2A2E' : 'rgba(0,0,0,0.04)',
    text: dk ? '#F5F5F7' : '#111111',
    text2: dk ? '#A0A0A8' : '#555555',
    text3: dk ? '#6B6B73' : '#999999',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    // Shadows
    shadow: dk ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    shadowMd: dk ? '0 4px 16px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.03)',
    shadowLg: dk ? '0 8px 32px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04)',
    // Common styles — premium pill buttons
    pill: {
      padding: '9px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
      font: "500 13px 'Inter', sans-serif", transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    },
    pillAccent: {
      padding: '9px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
      font: "500 13px 'Inter', sans-serif", transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      background: A, color: AT,
      boxShadow: `0 2px 12px ${A}33`,
    },
    pillOutline: {
      padding: '9px 20px', borderRadius: 100, cursor: 'pointer',
      font: "500 13px 'Inter', sans-serif", transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      background: dk ? '#252529' : 'rgba(255,255,255,0.5)', color: A, border: `1.5px solid ${A}40`,
      backdropFilter: dk ? 'none' : 'blur(8px)',
    },
    pillGhost: {
      padding: '9px 20px', borderRadius: 100, cursor: 'pointer',
      font: "500 13px 'Inter', sans-serif", transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      background: dk ? '#252529' : 'rgba(255,255,255,0.4)',
      color: dk ? '#A0A0A8' : '#555',
      border: `1px solid ${dk ? '#2A2A2E' : 'rgba(0,0,0,0.06)'}`,
      backdropFilter: dk ? 'none' : 'blur(8px)',
    },
    input: {
      width: '100%', padding: '12px 16px',
      background: dk ? '#1A1A1E' : 'rgba(255,255,255,0.7)',
      border: `1px solid ${dk ? '#2A2A2E' : 'rgba(0,0,0,0.06)'}`, borderRadius: 12,
      font: "400 14px 'Inter', sans-serif", color: dk ? '#F5F5F7' : '#111', outline: 'none',
      transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', boxSizing: 'border-box',
      backdropFilter: dk ? 'none' : 'blur(8px)',
    },
    label: {
      display: 'block', fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
      color: dk ? '#6B6B73' : '#999', marginBottom: 8, fontWeight: 500,
    },
    cardStyle: {
      background: dk ? '#1A1A1E' : 'rgba(255,255,255,0.72)',
      backdropFilter: dk ? 'none' : 'blur(20px)', WebkitBackdropFilter: dk ? 'none' : 'blur(20px)',
      border: `1px solid ${dk ? '#2A2A2E' : 'rgba(255,255,255,0.6)'}`,
      borderRadius: 16,
      boxShadow: dk ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    },
    tableWrap: {
      background: dk ? '#1A1A1E' : 'rgba(255,255,255,0.72)',
      backdropFilter: dk ? 'none' : 'blur(20px)', WebkitBackdropFilter: dk ? 'none' : 'blur(20px)',
      border: `1px solid ${dk ? '#2A2A2E' : 'rgba(255,255,255,0.6)'}`,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: dk ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    },
  };
}
