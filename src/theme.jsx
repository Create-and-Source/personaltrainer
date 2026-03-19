import { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'pt_theme_mode';

// ── Two Brand Themes ──
// SKIMS-inspired: soft, warm whites, glowing shadows, premium minimal
export const THEMES = {
  bold: {
    id: 'bold',
    name: 'Night',
    bg: '#0D0D0D',
    surface: '#171717',
    surfaceHover: '#1E1E1E',
    surfaceAlt: '#131313',
    surfacePressed: '#0A0A0A',
    text: '#F5F2EF',
    text2: '#9A958F',
    text3: '#5C5751',
    accent: '#C9A96E',
    accentLight: 'rgba(201,169,110,0.10)',
    accentText: '#0D0D0D',
    border: '#222222',
    borderLight: '#2A2A2A',
    glow: '0 0 40px rgba(201,169,110,0.06)',
    glowAccent: '0 0 24px rgba(201,169,110,0.15)',
    success: '#5CB85C',
    successBg: 'rgba(92,184,92,0.10)',
    warning: '#D4A843',
    warningBg: 'rgba(212,168,67,0.10)',
    danger: '#D45B5B',
    dangerBg: 'rgba(212,91,91,0.10)',
    shadow: '0 2px 12px rgba(0,0,0,0.5)',
    shadowMd: '0 4px 20px rgba(0,0,0,0.5)',
    shadowLg: '0 12px 40px rgba(0,0,0,0.6)',
    dark: true,
  },
  warm: {
    id: 'warm',
    name: 'Light',
    bg: '#FAF9F7',
    surface: '#FFFFFF',
    surfaceHover: '#F7F5F2',
    surfaceAlt: '#F5F3F0',
    surfacePressed: '#F0EDEA',
    text: '#1A1816',
    text2: '#6B6560',
    text3: '#A8A29E',
    accent: '#C9A96E',
    accentLight: 'rgba(201,169,110,0.08)',
    accentText: '#FFFFFF',
    border: '#EDEBE8',
    borderLight: '#F2F0ED',
    glow: '0 0 60px rgba(201,169,110,0.06)',
    glowAccent: '0 0 30px rgba(201,169,110,0.12)',
    success: '#3D8B40',
    successBg: '#F0F9F0',
    warning: '#B8923A',
    warningBg: '#FDF8EF',
    danger: '#C04040',
    dangerBg: '#FDF0F0',
    shadow: '0 1px 3px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.03)',
    shadowMd: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
    shadowLg: '0 4px 12px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.06)',
    dark: false,
  },
};

// CTA uses theme accent — no separate blue/teal
export const CTA_COLOR = null; // deprecated, use s.accent instead

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && THEMES[saved]) return THEMES[saved];
  } catch {}
  return THEMES.warm;
}

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(loadTheme);

  const setTheme = (mode) => {
    const t = THEMES[mode] || THEMES.warm;
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t.id);
  };

  const toggleTheme = () => {
    setTheme(theme.id === 'bold' ? 'warm' : 'bold');
  };

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
    document.body.style.fontFamily = "'Figtree', -apple-system, BlinkMacSystemFont, sans-serif";
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Avatar gradients — SKIMS nude tones
const AVATAR_PALETTES = [
  ['#E8DDD4', '#C9A96E'], ['#D9CFC5', '#B89860'], ['#E5D8CC', '#A08050'],
  ['#DDD2C8', '#C4A470'], ['#E2D5C8', '#B09060'], ['#D6CCC2', '#C0A068'],
  ['#E0D4C8', '#A89060'], ['#DDD0C2', '#C8AA70'], ['#E4D8CC', '#B49858'],
  ['#D8CEC4', '#BCA268'], ['#E6DAD0', '#AA9058'], ['#DAD0C6', '#C4A870'],
];

export function getAvatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % AVATAR_PALETTES.length;
  const [c1, c2] = AVATAR_PALETTES[idx];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

// ── Style hook — every page uses this ──
export function useStyles() {
  const { theme } = useTheme();
  const t = theme;

  return {
    ...t,
    // Fonts
    FONT: "'Figtree', -apple-system, BlinkMacSystemFont, sans-serif",
    HEADING: "'Playfair Display', Georgia, serif",
    MONO: "'Source Code Pro', 'SF Mono', monospace",
    // CTA
    cta: t.accent,
    ctaText: t.accentText,
    // Card — SKIMS: soft, glowing, barely-there borders
    cardStyle: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 20,
      boxShadow: `${t.shadow}, ${t.glow || '0 0 0 transparent'}`,
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    },
    // Buttons — soft, rounded, text-forward
    pill: {
      padding: '11px 26px', borderRadius: 112, border: 'none', cursor: 'pointer',
      font: "500 14px 'Figtree', sans-serif", transition: 'all 0.25s ease',
      letterSpacing: '0.01em',
    },
    pillAccent: {
      padding: '11px 26px', borderRadius: 112, border: 'none', cursor: 'pointer',
      font: "500 14px 'Figtree', sans-serif", transition: 'all 0.25s ease',
      background: t.accent, color: t.accentText, letterSpacing: '0.01em',
      boxShadow: t.glowAccent || '0 2px 12px rgba(201,169,110,0.2)',
    },
    pillCta: {
      padding: '14px 32px', borderRadius: 112, border: 'none', cursor: 'pointer',
      font: "600 15px 'Figtree', sans-serif", transition: 'all 0.25s ease',
      background: t.accent, color: t.accentText, letterSpacing: '0.02em',
      boxShadow: `${t.glowAccent || '0 4px 20px rgba(201,169,110,0.2)'}`,
    },
    pillOutline: {
      padding: '11px 26px', borderRadius: 112, cursor: 'pointer',
      font: "500 14px 'Figtree', sans-serif", transition: 'all 0.25s ease',
      background: 'transparent', color: t.accent, border: `1.5px solid ${t.accent}`,
      letterSpacing: '0.01em',
    },
    pillGhost: {
      padding: '11px 22px', borderRadius: 112, cursor: 'pointer',
      font: "400 13px 'Figtree', sans-serif", transition: 'all 0.25s ease',
      background: 'transparent', color: t.text2, border: `1px solid ${t.border}`,
      letterSpacing: '0.01em',
    },
    // Inputs
    input: {
      width: '100%', padding: '14px 16px',
      background: t.dark ? t.surfaceAlt : t.surface,
      border: `1px solid ${t.border}`, borderRadius: 12,
      font: "400 15px 'Figtree', sans-serif", color: t.text, outline: 'none',
      transition: 'all 0.2s ease', boxSizing: 'border-box',
    },
    label: {
      display: 'block', fontFamily: "'Figtree', sans-serif",
      fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
      color: t.text3, marginBottom: 8, fontWeight: 500,
    },
    // Table
    tableWrap: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: t.shadow,
    },
    // Compat aliases (old pages reference these)
    card: t.surface,
    cardSolid: t.surface,
    bg: t.bg,
  };
}
