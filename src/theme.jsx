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
    <ThemeContext.Provider value={{ theme, setTheme, setCustomColor, PRESETS }}>
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
  const { theme } = useTheme();
  const A = theme.accent;
  const AL = theme.accentLight;
  const AT = theme.accentText;

  // Set CSS variables for accent color (used by global CSS animations)
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', A);
    // Parse hex to RGB for rgba() usage in CSS
    const r = parseInt(A.slice(1, 3), 16) || 0;
    const g = parseInt(A.slice(3, 5), 16) || 0;
    const b = parseInt(A.slice(5, 7), 16) || 0;
    document.documentElement.style.setProperty('--accent-rgb', `${r},${g},${b}`);
  }, [A]);

  return {
    accent: A,
    accentLight: AL,
    accentText: AT,
    // Typography
    FONT: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    MONO: "'JetBrains Mono', 'SF Mono', monospace",
    // Colors
    bg: '#F5F3F0',
    card: 'rgba(255,255,255,0.72)',
    cardSolid: '#FFFFFF',
    border: 'rgba(255,255,255,0.6)',
    borderLight: 'rgba(0,0,0,0.04)',
    text: '#111111',
    text2: '#555555',
    text3: '#999999',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    // Shadows — softer, more depth
    shadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    shadowMd: '0 8px 40px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.03)',
    shadowLg: '0 20px 60px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04)',
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
      background: 'rgba(255,255,255,0.5)', color: A, border: `1.5px solid ${A}40`,
      backdropFilter: 'blur(8px)',
    },
    pillGhost: {
      padding: '9px 20px', borderRadius: 100, cursor: 'pointer',
      font: "500 13px 'Inter', sans-serif", transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      background: 'rgba(255,255,255,0.4)', color: '#555', border: '1px solid rgba(0,0,0,0.06)',
      backdropFilter: 'blur(8px)',
    },
    input: {
      width: '100%', padding: '12px 16px',
      background: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12,
      font: "400 14px 'Inter', sans-serif", color: '#111', outline: 'none',
      transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', boxSizing: 'border-box',
      backdropFilter: 'blur(8px)',
    },
    label: {
      display: 'block', fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
      color: '#999', marginBottom: 8, fontWeight: 500,
    },
    cardStyle: {
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.6)',
      borderRadius: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    },
    tableWrap: {
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.6)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    },
  };
}
