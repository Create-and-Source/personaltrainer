import { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'pt_theme_mode';

// ── Two Brand Themes ──
export const THEMES = {
  bold: {
    id: 'bold',
    name: 'Bold',
    bg: '#1A1A1E',
    surface: '#252529',
    surfaceHover: '#2E2E33',
    surfaceAlt: '#1F1F23',
    text: '#F5F5F7',
    text2: '#A0A0A8',
    text3: '#6B6B73',
    accent: '#0E7A82',
    accentLight: 'rgba(14,122,130,0.12)',
    accentText: '#FFFFFF',
    border: '#2A2A2E',
    borderLight: '#353539',
    success: '#22C55E',
    successBg: 'rgba(34,197,94,0.12)',
    warning: '#EAB308',
    warningBg: 'rgba(234,179,8,0.12)',
    danger: '#EF4444',
    dangerBg: 'rgba(239,68,68,0.12)',
    shadow: '0 2px 8px rgba(0,0,0,0.3)',
    shadowMd: '0 4px 16px rgba(0,0,0,0.35)',
    shadowLg: '0 8px 32px rgba(0,0,0,0.4)',
    dark: true,
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    bg: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceHover: '#F5F0EB',
    surfaceAlt: '#F3EFEA',
    text: '#2D2A26',
    text2: '#7A7268',
    text3: '#B5ADA5',
    accent: '#62554A',
    accentLight: '#F5F0EB',
    accentText: '#FFFFFF',
    border: '#E8E3DD',
    borderLight: '#F0EBE5',
    success: '#007A29',
    successBg: '#ECFDF5',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    danger: '#BD0F0F',
    dangerBg: '#FEF2F2',
    shadow: '0 2px 8px rgba(98,85,74,0.08)',
    shadowMd: '0 4px 16px rgba(98,85,74,0.12)',
    shadowLg: '0 8px 32px rgba(98,85,74,0.16)',
    dark: false,
  },
};

export const CTA_COLOR = '#0E7A82';

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

// Avatar gradients — warm earth tones
const AVATAR_PALETTES = [
  ['#E9D3BF', '#62554A'], ['#B5ADA5', '#7A7268'], ['#D4C5B5', '#8B7E73'],
  ['#C9B8A8', '#6B5E52'], ['#E0D0C0', '#93857A'], ['#D8C8B8', '#7D6E62'],
  ['#CFBFAF', '#857568'], ['#E5D5C5', '#9A8C80'], ['#DBC8B5', '#736558'],
  ['#D0C0B0', '#8A7C70'], ['#E2D2C2', '#6E6054'], ['#C5B5A5', '#786A5E'],
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
    HEADING: "'Poppins', 'Figtree', -apple-system, sans-serif",
    MONO: "'Source Code Pro', 'SF Mono', monospace",
    // CTA
    cta: CTA_COLOR,
    ctaText: '#FFFFFF',
    // Card
    cardStyle: {
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 16,
      boxShadow: t.shadow,
      transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    },
    // Buttons
    pill: {
      padding: '10px 24px', borderRadius: 112, border: 'none', cursor: 'pointer',
      font: "500 14px 'Figtree', sans-serif", transition: 'all 0.2s ease',
    },
    pillAccent: {
      padding: '10px 24px', borderRadius: 112, border: 'none', cursor: 'pointer',
      font: "500 14px 'Figtree', sans-serif", transition: 'all 0.2s ease',
      background: t.accent, color: t.accentText,
      boxShadow: t.dark ? '0 2px 8px rgba(14,122,130,0.3)' : '0 2px 8px rgba(98,85,74,0.2)',
    },
    pillCta: {
      padding: '12px 28px', borderRadius: 112, border: 'none', cursor: 'pointer',
      font: "600 15px 'Figtree', sans-serif", transition: 'all 0.2s ease',
      background: CTA_COLOR, color: '#FFFFFF',
      boxShadow: '0 4px 16px rgba(14,122,130,0.24)',
    },
    pillOutline: {
      padding: '10px 24px', borderRadius: 112, cursor: 'pointer',
      font: "500 14px 'Figtree', sans-serif", transition: 'all 0.2s ease',
      background: 'transparent', color: t.accent, border: `1.5px solid ${t.accent}`,
    },
    pillGhost: {
      padding: '10px 20px', borderRadius: 112, cursor: 'pointer',
      font: "400 13px 'Figtree', sans-serif", transition: 'all 0.2s ease',
      background: 'transparent', color: t.text2, border: `1px solid ${t.border}`,
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
