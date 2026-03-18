import { useState, useEffect, useRef, useCallback } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, subscribe } from '../data/store';

/* ─── Inject keyframes once ─── */
const NUTR_ANIM_ID = 'nutrition-premium-anims';
if (!document.getElementById(NUTR_ANIM_ID)) {
  const sheet = document.createElement('style');
  sheet.id = NUTR_ANIM_ID;
  sheet.textContent = `
    @keyframes nutrFadeInUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes nutrRingDraw {
      from { stroke-dasharray: 0 283; }
    }
    @keyframes nutrPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }
    @keyframes nutrSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes nutrShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes nutrBarGrow {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }
    @keyframes nutrScanLine {
      0% { top: 0; }
      50% { top: calc(100% - 3px); }
      100% { top: 0; }
    }
    @keyframes nutrScanPulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    .nutr-card-hover:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03) !important;
    }
    .nutr-ring-hover:hover {
      filter: brightness(1.05);
    }
    .nutr-meal-row:hover {
      background: rgba(0,0,0,0.015) !important;
    }
    @media (max-width: 860px) {
      .nutr-macros-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .nutr-templates-grid { grid-template-columns: 1fr !important; }
      .nutr-weekly-chart { min-height: 200px !important; }
    }
  `;
  document.head.appendChild(sheet);
}

/* ─── Macro color config ─── */
const MACRO_COLORS = {
  calories: null, // uses accent
  protein: '#3B82F6',
  carbs: '#F59E0B',
  fat: '#FBBF24',
};

/* ─── Seed data generator ─── */
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const JAMES_MEALS = {
  [getTodayStr()]: {
    breakfast: { items: [
      { name: 'Egg Whites (6)', serving: '6 large', cal: 102, p: 22, c: 1, f: 0 },
      { name: 'Oatmeal', serving: '1 cup', cal: 307, p: 11, c: 55, f: 5 },
      { name: 'Banana', serving: '1 medium', cal: 105, p: 1, c: 27, f: 0 },
      { name: 'Black Coffee', serving: '12 oz', cal: 5, p: 0, c: 1, f: 0 },
    ]},
    lunch: { items: [
      { name: 'Grilled Chicken Breast', serving: '8 oz', cal: 370, p: 56, c: 0, f: 8 },
      { name: 'Brown Rice', serving: '1 cup', cal: 216, p: 5, c: 45, f: 2 },
      { name: 'Steamed Broccoli', serving: '2 cups', cal: 62, p: 5, c: 12, f: 1 },
    ]},
    dinner: { items: [
      { name: 'Salmon Fillet', serving: '6 oz', cal: 354, p: 38, c: 0, f: 22 },
      { name: 'Sweet Potato', serving: '1 large', cal: 162, p: 4, c: 37, f: 0 },
      { name: 'Mixed Greens Salad', serving: '2 cups', cal: 30, p: 2, c: 5, f: 0 },
    ]},
    snacks: { items: [
      { name: 'Protein Shake', serving: '1 scoop + water', cal: 120, p: 24, c: 3, f: 1 },
      { name: 'Almonds', serving: '1 oz', cal: 164, p: 6, c: 6, f: 14 },
    ]},
  },
  [daysAgo(1)]: {
    breakfast: { items: [
      { name: 'Greek Yogurt', serving: '1 cup', cal: 130, p: 22, c: 8, f: 0 },
      { name: 'Granola', serving: '0.5 cup', cal: 210, p: 5, c: 36, f: 6 },
      { name: 'Blueberries', serving: '0.5 cup', cal: 42, p: 1, c: 11, f: 0 },
    ]},
    lunch: { items: [
      { name: 'Turkey Breast', serving: '6 oz', cal: 186, p: 40, c: 0, f: 2 },
      { name: 'Quinoa', serving: '1 cup', cal: 222, p: 8, c: 39, f: 4 },
      { name: 'Avocado', serving: '0.5 medium', cal: 120, p: 2, c: 6, f: 11 },
    ]},
    dinner: { items: [
      { name: 'Lean Ground Beef (93%)', serving: '6 oz', cal: 290, p: 38, c: 0, f: 14 },
      { name: 'Whole Wheat Pasta', serving: '1.5 cups', cal: 262, p: 9, c: 52, f: 2 },
      { name: 'Marinara Sauce', serving: '0.5 cup', cal: 66, p: 2, c: 10, f: 2 },
    ]},
    snacks: { items: [
      { name: 'Protein Bar', serving: '1 bar', cal: 210, p: 20, c: 24, f: 7 },
      { name: 'Apple', serving: '1 medium', cal: 95, p: 0, c: 25, f: 0 },
    ]},
  },
  [daysAgo(2)]: {
    breakfast: { items: [
      { name: 'Whole Eggs', serving: '3 large', cal: 234, p: 18, c: 2, f: 15 },
      { name: 'Whole Wheat Toast', serving: '2 slices', cal: 160, p: 8, c: 26, f: 2 },
    ]},
    lunch: { items: [
      { name: 'Chicken Thigh', serving: '6 oz', cal: 318, p: 36, c: 0, f: 18 },
      { name: 'White Rice', serving: '1 cup', cal: 206, p: 4, c: 45, f: 0 },
      { name: 'Stir-fry Vegetables', serving: '1.5 cups', cal: 85, p: 3, c: 14, f: 2 },
    ]},
    dinner: { items: [
      { name: 'Tilapia', serving: '8 oz', cal: 218, p: 44, c: 0, f: 4 },
      { name: 'Jasmine Rice', serving: '1 cup', cal: 206, p: 4, c: 45, f: 0 },
      { name: 'Asparagus', serving: '1 cup', cal: 27, p: 3, c: 5, f: 0 },
    ]},
    snacks: { items: [
      { name: 'Cottage Cheese', serving: '1 cup', cal: 206, p: 28, c: 6, f: 9 },
    ]},
  },
};

const SARAH_MEALS = {
  [getTodayStr()]: {
    breakfast: { items: [
      { name: 'Greek Yogurt (non-fat)', serving: '1 cup', cal: 100, p: 18, c: 6, f: 0 },
      { name: 'Chia Seeds', serving: '1 tbsp', cal: 58, p: 2, c: 5, f: 3 },
      { name: 'Strawberries', serving: '1 cup', cal: 49, p: 1, c: 12, f: 0 },
    ]},
    lunch: { items: [
      { name: 'Grilled Chicken Salad', serving: '1 bowl', cal: 320, p: 38, c: 18, f: 12 },
      { name: 'Balsamic Vinaigrette', serving: '2 tbsp', cal: 45, p: 0, c: 5, f: 3 },
    ]},
    dinner: { items: [
      { name: 'Shrimp', serving: '6 oz', cal: 168, p: 36, c: 2, f: 2 },
      { name: 'Zucchini Noodles', serving: '2 cups', cal: 40, p: 3, c: 7, f: 0 },
      { name: 'Pesto Sauce', serving: '1 tbsp', cal: 80, p: 2, c: 1, f: 8 },
    ]},
    snacks: { items: [
      { name: 'Protein Shake', serving: '1 scoop + almond milk', cal: 150, p: 26, c: 4, f: 3 },
      { name: 'Rice Cakes', serving: '2 cakes', cal: 70, p: 1, c: 15, f: 0 },
    ]},
  },
  [daysAgo(1)]: {
    breakfast: { items: [
      { name: 'Egg White Omelette', serving: '4 whites + veggies', cal: 130, p: 18, c: 6, f: 2 },
      { name: 'Whole Wheat Toast', serving: '1 slice', cal: 80, p: 4, c: 13, f: 1 },
    ]},
    lunch: { items: [
      { name: 'Turkey Wrap', serving: '1 wrap', cal: 310, p: 28, c: 30, f: 8 },
      { name: 'Side Salad', serving: '1 cup', cal: 45, p: 2, c: 6, f: 2 },
    ]},
    dinner: { items: [
      { name: 'Cod Fillet', serving: '6 oz', cal: 140, p: 30, c: 0, f: 1 },
      { name: 'Roasted Vegetables', serving: '1.5 cups', cal: 120, p: 3, c: 18, f: 5 },
      { name: 'Couscous', serving: '0.5 cup', cal: 88, p: 3, c: 18, f: 0 },
    ]},
    snacks: { items: [
      { name: 'Celery + PB', serving: '2 stalks + 1 tbsp', cal: 108, p: 4, c: 5, f: 8 },
    ]},
  },
  [daysAgo(2)]: {
    breakfast: { items: [
      { name: 'Smoothie Bowl', serving: '1 bowl', cal: 220, p: 15, c: 35, f: 4 },
    ]},
    lunch: { items: [
      { name: 'Tuna Salad', serving: '1 can + veggies', cal: 280, p: 40, c: 8, f: 10 },
      { name: 'Crackers', serving: '6 crackers', cal: 78, p: 2, c: 13, f: 2 },
    ]},
    dinner: { items: [
      { name: 'Chicken Stir-fry', serving: '1 bowl', cal: 350, p: 32, c: 28, f: 12 },
    ]},
    snacks: { items: [
      { name: 'Protein Bar', serving: '1 bar', cal: 170, p: 15, c: 20, f: 6 },
    ]},
  },
};

const TARGETS = {
  'CLT-1000': { calories: 2200, protein: 180, carbs: 220, fat: 65 },
  'CLT-1001': { calories: 1600, protein: 130, carbs: 160, fat: 45 },
};

const MEAL_PLAN_TEMPLATES = [
  { id: 'hpc', name: 'High Protein Cut', cal: 2200, p: 220, c: 180, f: 65, gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', desc: 'Aggressive protein for maximum muscle retention during a cut' },
  { id: 'lb', name: 'Lean Bulk', cal: 2800, p: 190, c: 320, f: 85, gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', desc: 'Caloric surplus with controlled fat gain' },
  { id: 'bm', name: 'Balanced Maintenance', cal: 2400, p: 160, c: 260, f: 75, gradient: 'linear-gradient(135deg, #10B981, #059669)', desc: 'Sustainable macros for long-term consistency' },
  { id: 'keto', name: 'Keto', cal: 1800, p: 130, c: 30, f: 130, gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', desc: 'Very low carb, high fat for ketosis' },
];

/* ─── localStorage helpers ─── */
function getMealLog(clientId) {
  try { return JSON.parse(localStorage.getItem(`ms_nutrition_${clientId}`)) || null; } catch { return null; }
}
function setMealLog(clientId, data) {
  localStorage.setItem(`ms_nutrition_${clientId}`, JSON.stringify(data));
}
function getMacroTargets(clientId) {
  try { return JSON.parse(localStorage.getItem(`ms_macro_targets_${clientId}`)) || null; } catch { return null; }
}
function setMacroTargets(clientId, data) {
  localStorage.setItem(`ms_macro_targets_${clientId}`, JSON.stringify(data));
}

/* ─── Init seed data ─── */
function ensureSeedData() {
  if (!getMealLog('CLT-1000')) setMealLog('CLT-1000', JAMES_MEALS);
  if (!getMealLog('CLT-1001')) setMealLog('CLT-1001', SARAH_MEALS);
  if (!getMacroTargets('CLT-1000')) setMacroTargets('CLT-1000', TARGETS['CLT-1000']);
  if (!getMacroTargets('CLT-1001')) setMacroTargets('CLT-1001', TARGETS['CLT-1001']);
}

/* ─── Donut Ring Component ─── */
function MacroRing({ value, max, label, color, unit, size = 120, strokeW = 8, delay = 0 }) {
  const s = useStyles();
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const remaining = max - value;

  return (
    <div className="nutr-ring-hover" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      animation: `nutrFadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={strokeW} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
            strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            strokeLinecap="round"
            style={{ animation: `nutrRingDraw 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}s both`, filter: `drop-shadow(0 0 6px ${color}44)` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ font: `700 ${size > 100 ? 22 : 18}px ${s.FONT}`, color: s.text, lineHeight: 1 }}>
            {value.toLocaleString()}
          </span>
          {unit && <span style={{ font: `400 11px ${s.MONO}`, color: s.text3, marginTop: 2 }}>{unit}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ font: `600 13px ${s.FONT}`, color: s.text, textTransform: 'capitalize' }}>{label}</div>
        <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>
          {remaining > 0 ? `${remaining.toLocaleString()}${unit ? unit.replace(/[^a-zA-Z]/g, '') : ''} remaining` : 'Target reached'}
        </div>
      </div>
    </div>
  );
}

/* ─── Meal Section Component ─── */
function MealSection({ title, mealData, onAddFood, onScanBarcode, delay = 0, icon }) {
  const s = useStyles();
  const [expanded, setExpanded] = useState(title === 'Breakfast');
  const items = mealData?.items || [];
  const totalCal = items.reduce((sum, i) => sum + i.cal, 0);
  const totalP = items.reduce((sum, i) => sum + i.p, 0);
  const totalC = items.reduce((sum, i) => sum + i.c, 0);
  const totalF = items.reduce((sum, i) => sum + i.f, 0);

  return (
    <div style={{
      ...s.cardStyle, padding: 0, overflow: 'hidden', marginBottom: 12,
      animation: `nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
    }} className="nutr-card-hover">
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ font: `600 15px ${s.FONT}`, color: s.text }}>{title}</div>
            <div style={{ font: `400 12px ${s.MONO}`, color: s.text3, marginTop: 2 }}>
              {items.length} item{items.length !== 1 ? 's' : ''} — {totalP}P / {totalC}C / {totalF}F
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ font: `600 15px ${s.MONO}`, color: s.text }}>{totalCal} cal</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.text3} strokeWidth="1.5" strokeLinecap="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          {items.map((item, i) => (
            <div key={i} className="nutr-meal-row" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px 12px 56px', borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none',
              transition: 'background 0.15s',
            }}>
              <div>
                <div style={{ font: `500 14px ${s.FONT}`, color: s.text }}>{item.name}</div>
                <div style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>{item.serving}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <span style={{ font: `500 12px ${s.MONO}`, color: MACRO_COLORS.protein, minWidth: 36, textAlign: 'right' }}>{item.p}P</span>
                <span style={{ font: `500 12px ${s.MONO}`, color: MACRO_COLORS.carbs, minWidth: 36, textAlign: 'right' }}>{item.c}C</span>
                <span style={{ font: `500 12px ${s.MONO}`, color: '#D97706', minWidth: 36, textAlign: 'right' }}>{item.f}F</span>
                <span style={{ font: `600 13px ${s.MONO}`, color: s.text, minWidth: 50, textAlign: 'right' }}>{item.cal}</span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, margin: '12px 20px 16px 56px', flexWrap: 'wrap' }}>
            <button onClick={onAddFood} style={{
              ...s.pillOutline, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, margin: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Food
            </button>
            <button onClick={onScanBarcode} style={{
              ...s.pillOutline, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, margin: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="7" y1="7" x2="7" y2="17" /><line x1="10" y1="7" x2="10" y2="17" />
                <line x1="13" y1="7" x2="13" y2="17" /><line x1="16" y1="7" x2="16" y2="13" />
                <line x1="16" y1="15" x2="16" y2="17" />
              </svg>
              Scan Barcode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Food Search Modal ─── */
function FoodSearchModal({ open, onClose, onAdd, mealName, onSwitchToBarcode }) {
  const s = useStyles();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [servingMult, setServingMult] = useState({});
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(q)}&pageSize=15`);
      const data = await res.json();
      const foods = (data.foods || []).map(f => {
        const nuts = f.foodNutrients || [];
        const get = (id) => nuts.find(n => n.nutrientId === id)?.value || 0;
        return {
          fdcId: f.fdcId,
          name: f.description || f.lowercaseDescription || 'Unknown',
          brand: f.brandName || f.brandOwner || null,
          cal: Math.round(get(1008)),
          p: Math.round(get(1003)),
          c: Math.round(get(1005)),
          f: Math.round(get(1004)),
          servingSize: f.servingSize ? `${f.servingSize}${f.servingSizeUnit || 'g'}` : '100g',
        };
      });
      setResults(foods);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); setServingMult({}); }
  }, [open]);

  if (!open) return null;

  const handleAdd = (food) => {
    const mult = servingMult[food.fdcId] || 1;
    onAdd({
      name: food.name + (food.brand ? ` (${food.brand})` : ''),
      serving: `${mult}x ${food.servingSize}`,
      cal: Math.round(food.cal * mult),
      p: Math.round(food.p * mult),
      c: Math.round(food.c * mult),
      f: Math.round(food.f * mult),
    });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'nutrFadeInUp 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '90%', maxWidth: 580, maxHeight: '80vh',
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: `600 17px ${s.FONT}`, color: s.text }}>Add Food</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>to {mealName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Search */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search foods (e.g. chicken breast, banana...)"
              autoFocus
              style={{ ...s.input, paddingLeft: 40, paddingRight: 44, background: '#F8F8F8', border: '1px solid #eee' }}
            />
            {onSwitchToBarcode && (
              <button onClick={() => { onClose(); onSwitchToBarcode(); }} title="Scan barcode" style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#333'}
              onMouseLeave={e => e.currentTarget.style.color = '#999'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="7" y1="7" x2="7" y2="17" /><line x1="10" y1="7" x2="10" y2="17" />
                  <line x1="13" y1="7" x2="13" y2="17" /><line x1="16" y1="7" x2="16" y2="13" />
                  <line x1="16" y1="15" x2="16" y2="17" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${s.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'nutrSpin 0.6s linear infinite', margin: '0 auto' }} />
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 10 }}>Searching USDA database...</div>
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: s.text3, font: `400 13px ${s.FONT}` }}>
              No results found. Try a different search term.
            </div>
          )}
          {!loading && results.map(food => {
            const mult = servingMult[food.fdcId] || 1;
            return (
              <div key={food.fdcId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ font: `500 13px ${s.FONT}`, color: s.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {food.name}
                  </div>
                  {food.brand && <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{food.brand}</div>}
                  <div style={{ font: `400 11px ${s.MONO}`, color: s.text3, marginTop: 2 }}>
                    per {food.servingSize}: {food.cal} cal — {food.p}P / {food.c}C / {food.f}F
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <select value={mult} onChange={e => setServingMult(prev => ({ ...prev, [food.fdcId]: parseFloat(e.target.value) }))}
                    style={{ ...s.input, width: 64, padding: '6px 8px', fontSize: 12, textAlign: 'center' }}>
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                  </select>
                  <button onClick={() => handleAdd(food)} style={{ ...s.pillAccent, padding: '6px 14px', fontSize: 12 }}>
                    Add
                  </button>
                </div>
              </div>
            );
          })}
          {!loading && query.length < 2 && (
            <div style={{ textAlign: 'center', padding: 40, color: s.text3 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" style={{ opacity: 0.3, marginBottom: 12 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div style={{ font: `400 13px ${s.FONT}` }}>Type to search the USDA FoodData Central database</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Barcode Scanner Modal ─── */
function BarcodeScannerModal({ open, onClose, onAdd, mealName }) {
  const s = useStyles();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [servingMult, setServingMult] = useState(1);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);

  // Check for BarcodeDetector support
  useEffect(() => {
    setCameraSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  // Clean up on close
  useEffect(() => {
    if (!open) {
      setBarcode(''); setProduct(null); setError(''); setLoading(false); setServingMult(1);
      stopCamera();
    }
  }, [open]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!cameraSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      detectorRef.current = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });
      scanningRef.current = true;
      scanFrames();
    } catch (err) {
      setError('Could not access camera. Check permissions.');
    }
  }, [cameraSupported]);

  const scanFrames = useCallback(async () => {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) return;
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const detected = barcodes[0].rawValue;
        setBarcode(detected);
        stopCamera();
        lookupBarcode(detected);
        return;
      }
    } catch {}
    if (scanningRef.current) requestAnimationFrame(scanFrames);
  }, [stopCamera]);

  const lookupBarcode = async (code) => {
    if (!code) return;
    setLoading(true); setProduct(null); setError(''); setServingMult(1);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
      const data = await res.json();
      if (data.status === 0 || !data.product) {
        setError('Product not found. Try a different barcode.');
        setLoading(false);
        return;
      }
      const p = data.product;
      const n = p.nutriments || {};
      setProduct({
        name: p.product_name || 'Unknown Product',
        brand: p.brands || '',
        image: p.image_url || p.image_front_url || '',
        cal: Math.round(n.energy_kcal_100g || n['energy-kcal_100g'] || 0),
        protein: Math.round(n.proteins_100g || 0),
        carbs: Math.round(n.carbohydrates_100g || 0),
        fat: Math.round(n.fat_100g || 0),
        fiber: Math.round(n.fiber_100g || 0),
        sugar: Math.round(n.sugars_100g || 0),
        nutriScore: p.nutrition_grades || null,
        servingSize: p.serving_size || '100g',
      });
    } catch {
      setError('Failed to look up product. Check your connection.');
    }
    setLoading(false);
  };

  const handleAddToMeal = () => {
    if (!product) return;
    const mult = servingMult;
    onAdd({
      name: product.name + (product.brand ? ` (${product.brand})` : ''),
      serving: `${mult}x ${product.servingSize}`,
      cal: Math.round(product.cal * mult),
      p: Math.round(product.protein * mult),
      c: Math.round(product.carbs * mult),
      f: Math.round(product.fat * mult),
    });
    onClose();
  };

  const NUTRI_COLORS = { a: '#1E8F4E', b: '#60AC0E', c: '#EEAE0E', d: '#E6771E', e: '#DF3318' };

  if (!open) return null;

  return (
    <div onClick={() => { stopCamera(); onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'nutrFadeInUp 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '90%', maxWidth: 520, maxHeight: '85vh',
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: `600 17px ${s.FONT}`, color: s.text }}>Scan Barcode</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>Add to {mealName}</div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          {/* Camera Scanner */}
          {cameraSupported && !product && (
            <div style={{ marginBottom: 16 }}>
              {!cameraActive ? (
                <button onClick={startCamera} style={{
                  ...s.pillAccent, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 20px', fontSize: 14,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  Open Camera Scanner
                </button>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: 250, borderRadius: 16, overflow: 'hidden', background: '#111' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Scan line animation */}
                  <div style={{
                    position: 'absolute', left: '10%', right: '10%', height: 3,
                    background: 'linear-gradient(90deg, transparent, #FF3B30, transparent)',
                    borderRadius: 2, boxShadow: '0 0 12px rgba(255,59,48,0.6)',
                    animation: 'nutrScanLine 2s ease-in-out infinite',
                  }} />
                  {/* Corner markers */}
                  {[{ top: 20, left: 20 }, { top: 20, right: 20 }, { bottom: 20, left: 20 }, { bottom: 20, right: 20 }].map((pos, i) => (
                    <div key={i} style={{
                      position: 'absolute', ...pos, width: 24, height: 24,
                      borderColor: '#fff', borderStyle: 'solid', borderWidth: 0,
                      ...(pos.top !== undefined && pos.left !== undefined ? { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 } : {}),
                      ...(pos.top !== undefined && pos.right !== undefined ? { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 } : {}),
                      ...(pos.bottom !== undefined && pos.left !== undefined ? { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 } : {}),
                      ...(pos.bottom !== undefined && pos.right !== undefined ? { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 } : {}),
                      opacity: 0.8, animation: 'nutrScanPulse 2s ease-in-out infinite',
                    }} />
                  ))}
                  <button onClick={stopCamera} style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 20,
                    color: '#fff', padding: '6px 14px', font: `500 12px ${s.FONT}`, cursor: 'pointer',
                  }}>Stop</button>
                </div>
              )}
            </div>
          )}

          {!cameraSupported && !product && (
            <div style={{
              background: '#FFF8E1', borderRadius: 12, padding: '12px 16px', marginBottom: 16,
              font: `400 12px ${s.FONT}`, color: '#795548', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Camera scanning requires Chrome or Edge. Use manual entry below.
            </div>
          )}

          {/* Manual Entry */}
          {!product && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="7" y1="7" x2="7" y2="17" /><line x1="10" y1="7" x2="10" y2="17" />
                  <line x1="13" y1="7" x2="13" y2="17" /><line x1="16" y1="7" x2="16" y2="13" />
                  <line x1="16" y1="15" x2="16" y2="17" />
                </svg>
                <input
                  value={barcode} onChange={e => setBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  onKeyDown={e => e.key === 'Enter' && lookupBarcode(barcode)}
                  style={{ ...s.input, paddingLeft: 40, background: '#F8F8F8', border: '1px solid #eee' }}
                />
              </div>
              <button onClick={() => lookupBarcode(barcode)} disabled={!barcode || loading} style={{
                ...s.pillAccent, padding: '10px 20px', opacity: (!barcode || loading) ? 0.6 : 1,
              }}>
                {loading ? (
                  <div style={{ width: 16, height: 16, border: `2px solid ${s.accentText}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'nutrSpin 0.6s linear infinite' }} />
                ) : 'Look Up'}
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${s.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'nutrSpin 0.6s linear infinite', margin: '0 auto' }} />
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 10 }}>Looking up product...</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#FFF0F0', borderRadius: 12, padding: '14px 18px', marginBottom: 16,
              font: `400 13px ${s.FONT}`, color: '#C62828', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
              <button onClick={() => { setError(''); setProduct(null); }} style={{
                marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                font: `500 12px ${s.FONT}`, color: '#C62828', textDecoration: 'underline',
              }}>Try Again</button>
            </div>
          )}

          {/* Product Result */}
          {product && !loading && (
            <div style={{ animation: 'nutrFadeInUp 0.3s ease' }}>
              <div style={{
                display: 'flex', gap: 16, marginBottom: 20,
                background: 'rgba(0,0,0,0.02)', borderRadius: 16, padding: 16,
              }}>
                {product.image && (
                  <img src={product.image} alt={product.name} style={{
                    width: 90, height: 90, borderRadius: 12, objectFit: 'cover',
                    background: '#f5f5f5', flexShrink: 0,
                  }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{product.name}</div>
                  {product.brand && <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 8 }}>{product.brand}</div>}
                  {product.nutriScore && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: NUTRI_COLORS[product.nutriScore.toLowerCase()] || '#999',
                        color: '#fff', font: `700 14px ${s.FONT}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${NUTRI_COLORS[product.nutriScore.toLowerCase()] || '#999'}44`,
                      }}>{product.nutriScore.toUpperCase()}</div>
                      <span style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>Nutri-Score</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nutrition per 100g */}
              <div style={{ font: `600 13px ${s.FONT}`, color: s.text, marginBottom: 10 }}>Nutrition per 100g</div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16,
              }}>
                {[
                  { label: 'Calories', value: product.cal, unit: 'kcal', color: s.accent },
                  { label: 'Protein', value: product.protein, unit: 'g', color: MACRO_COLORS.protein },
                  { label: 'Carbs', value: product.carbs, unit: 'g', color: MACRO_COLORS.carbs },
                  { label: 'Fat', value: product.fat, unit: 'g', color: '#D97706' },
                  { label: 'Fiber', value: product.fiber, unit: 'g', color: '#10B981' },
                  { label: 'Sugar', value: product.sugar, unit: 'g', color: '#EF4444' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                  }}>
                    <div style={{ font: `700 16px ${s.MONO}`, color: item.color }}>{item.value}{item.unit === 'kcal' ? '' : item.unit}</div>
                    <div style={{ font: `400 10px ${s.FONT}`, color: s.text3, marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Serving size & add */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ font: `500 12px ${s.FONT}`, color: s.text3, marginBottom: 4, display: 'block' }}>Servings</label>
                  <select value={servingMult} onChange={e => setServingMult(parseFloat(e.target.value))}
                    style={{ ...s.input, width: '100%', cursor: 'pointer' }}>
                    <option value={0.5}>0.5x ({product.servingSize})</option>
                    <option value={1}>1x ({product.servingSize})</option>
                    <option value={1.5}>1.5x ({product.servingSize})</option>
                    <option value={2}>2x ({product.servingSize})</option>
                    <option value={3}>3x ({product.servingSize})</option>
                  </select>
                </div>
                <div style={{ flex: 1, paddingTop: 18 }}>
                  <button onClick={handleAddToMeal} style={{
                    ...s.pillAccent, width: '100%', padding: '12px 20px', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add to {mealName}
                  </button>
                </div>
              </div>

              {/* Scan another */}
              <button onClick={() => { setProduct(null); setBarcode(''); setError(''); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center',
                font: `400 13px ${s.FONT}`, color: s.accent, marginTop: 14, padding: 8, textDecoration: 'underline',
              }}>Scan another barcode</button>
            </div>
          )}

          {/* Empty state */}
          {!product && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: s.text3 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" style={{ opacity: 0.25, marginBottom: 10 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="7" y1="7" x2="7" y2="17" /><line x1="9.5" y1="7" x2="9.5" y2="17" />
                <line x1="12" y1="7" x2="12" y2="17" /><line x1="14.5" y1="7" x2="14.5" y2="17" />
                <line x1="17" y1="7" x2="17" y2="13" /><line x1="17" y1="15" x2="17" y2="17" />
              </svg>
              <div style={{ font: `400 13px ${s.FONT}` }}>
                {cameraSupported ? 'Use camera or enter a barcode to look up nutrition info' : 'Enter a barcode number to look up nutrition info'}
              </div>
              <div style={{ font: `400 11px ${s.FONT}`, marginTop: 4, opacity: 0.6 }}>Powered by Open Food Facts</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Macro Distribution Bar ─── */
function MacroBar({ p, c, f }) {
  const total = p + c + f;
  if (!total) return null;
  const pPct = (p / total) * 100;
  const cPct = (c / total) * 100;
  const fPct = (f / total) * 100;
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${pPct}%`, background: MACRO_COLORS.protein, transition: 'width 0.5s ease' }} />
      <div style={{ width: `${cPct}%`, background: MACRO_COLORS.carbs, transition: 'width 0.5s ease' }} />
      <div style={{ width: `${fPct}%`, background: MACRO_COLORS.fat, transition: 'width 0.5s ease' }} />
    </div>
  );
}

/* ─── Weekly Overview Chart ─── */
function WeeklyChart({ mealLogs, targets }) {
  const s = useStyles();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayMeals = mealLogs?.[dateStr];
    let p = 0, c = 0, f = 0;
    if (dayMeals) {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(m => {
        (dayMeals[m]?.items || []).forEach(item => { p += item.p * 4; c += item.c * 4; f += item.f * 9; });
      });
    }
    const total = p + c + f;
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      pCal: p, cCal: c, fCal: f,
      total,
    });
  }

  const maxCal = Math.max(targets.calories * 1.2, ...days.map(d => d.total));
  const chartH = 180;
  const barW = 32;

  return (
    <div style={{
      ...s.cardStyle, padding: 24,
      animation: 'nutrFadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both',
    }} className="nutr-card-hover nutr-weekly-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ font: `600 17px ${s.FONT}`, color: s.text }}>Weekly Overview</div>
          <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginTop: 2 }}>Daily calorie intake vs target</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: MACRO_COLORS.protein }} />
            <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>Protein</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: MACRO_COLORS.carbs }} />
            <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>Carbs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: MACRO_COLORS.fat }} />
            <span style={{ font: `400 11px ${s.MONO}`, color: s.text3 }}>Fat</span>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', height: chartH + 40 }}>
        {/* Target line */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: chartH - (targets.calories / maxCal) * chartH,
          borderTop: `2px dashed ${s.accent}55`,
          zIndex: 1,
        }}>
          <span style={{
            position: 'absolute', right: 0, top: -18,
            font: `500 10px ${s.MONO}`, color: s.accent,
            background: s.bg, padding: '1px 6px', borderRadius: 4,
          }}>{targets.calories.toLocaleString()} cal target</span>
        </div>
        {/* Bars */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: chartH, paddingTop: 20 }}>
          {days.map((day, i) => {
            const pH = day.total > 0 ? (day.pCal / maxCal) * chartH : 0;
            const cH = day.total > 0 ? (day.cCal / maxCal) * chartH : 0;
            const fH = day.total > 0 ? (day.fCal / maxCal) * chartH : 0;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ font: `500 10px ${s.MONO}`, color: s.text3 }}>
                  {day.total > 0 ? day.total.toLocaleString() : '—'}
                </div>
                <div style={{
                  width: barW, display: 'flex', flexDirection: 'column', borderRadius: '4px 4px 0 0', overflow: 'hidden',
                  transformOrigin: 'bottom', animation: `nutrBarGrow 0.8s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.08}s both`,
                }}>
                  {day.total > 0 ? (
                    <>
                      <div style={{ height: fH, background: MACRO_COLORS.fat, minHeight: fH > 0 ? 2 : 0 }} />
                      <div style={{ height: cH, background: MACRO_COLORS.carbs, minHeight: cH > 0 ? 2 : 0 }} />
                      <div style={{ height: pH, background: MACRO_COLORS.protein, minHeight: pH > 0 ? 2 : 0 }} />
                    </>
                  ) : (
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 2, width: barW }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Day labels */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
          {days.map((day, i) => (
            <div key={i} style={{ textAlign: 'center', width: barW }}>
              <div style={{ font: `500 11px ${s.FONT}`, color: i === 6 ? s.text : s.text3 }}>{day.label}</div>
              <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>{day.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MAIN NUTRITION PAGE
   ═════════════════════════════════════════════════════════════════ */
export default function Nutrition() {
  const s = useStyles();
  ensureSeedData();

  const [patients, setPatients] = useState(getPatients());
  const [selectedClient, setSelectedClient] = useState('');
  const [mealLogs, setMealLogs] = useState(null);
  const [targets, setTargets] = useState(null);
  const [mfpSyncing, setMfpSyncing] = useState(false);
  const [mfpSynced, setMfpSynced] = useState(false);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [foodModalMeal, setFoodModalMeal] = useState('');
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeModalMeal, setBarcodeModalMeal] = useState('');
  const [assignToast, setAssignToast] = useState('');

  useEffect(() => {
    const unsub = subscribe(() => setPatients(getPatients()));
    return unsub;
  }, []);

  // Load data when client is selected
  useEffect(() => {
    if (!selectedClient) { setMealLogs(null); setTargets(null); return; }
    const ml = getMealLog(selectedClient);
    const mt = getMacroTargets(selectedClient);
    setMealLogs(ml || {});
    setTargets(mt || { calories: 2000, protein: 150, carbs: 200, fat: 65 });
    setMfpSynced(false);
  }, [selectedClient]);

  // Calculate today's totals
  const todayStr = getTodayStr();
  const todayMeals = mealLogs?.[todayStr] || {};
  let todayTotals = { cal: 0, p: 0, c: 0, f: 0 };
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(m => {
    (todayMeals[m]?.items || []).forEach(item => {
      todayTotals.cal += item.cal;
      todayTotals.p += item.p;
      todayTotals.c += item.c;
      todayTotals.f += item.f;
    });
  });

  const handleSync = () => {
    setMfpSyncing(true);
    setMfpSynced(false);
    setTimeout(() => { setMfpSyncing(false); setMfpSynced(true); }, 1200);
  };

  const handleAddFood = (mealType) => {
    setFoodModalMeal(mealType);
    setFoodModalOpen(true);
  };

  const handleScanBarcode = (mealType) => {
    setBarcodeModalMeal(mealType);
    setBarcodeModalOpen(true);
  };

  const handleFoodAdded = (food) => {
    const updated = { ...mealLogs };
    if (!updated[todayStr]) updated[todayStr] = {};
    if (!updated[todayStr][foodModalMeal]) updated[todayStr][foodModalMeal] = { items: [] };
    updated[todayStr][foodModalMeal].items.push(food);
    setMealLogs(updated);
    setMealLog(selectedClient, updated);
  };

  const handleBarcodeFoodAdded = (food) => {
    const updated = { ...mealLogs };
    if (!updated[todayStr]) updated[todayStr] = {};
    if (!updated[todayStr][barcodeModalMeal]) updated[todayStr][barcodeModalMeal] = { items: [] };
    updated[todayStr][barcodeModalMeal].items.push(food);
    setMealLogs(updated);
    setMealLog(selectedClient, updated);
  };

  const handleAssignTemplate = (template) => {
    const newTargets = { calories: template.cal, protein: template.p, carbs: template.c, fat: template.f };
    setTargets(newTargets);
    setMacroTargets(selectedClient, newTargets);
    setAssignToast(`${template.name} assigned!`);
    setTimeout(() => setAssignToast(''), 2500);
  };

  const clientObj = patients.find(p => p.id === selectedClient);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
        <h1 style={{ font: `700 30px ${s.FONT}`, color: s.text, margin: 0, letterSpacing: '-0.5px' }}>
          Nutrition & Meal Plans
        </h1>
        <p style={{ font: `400 14px ${s.FONT}`, color: s.text3, margin: '6px 0 0', lineHeight: 1.5 }}>
          Track macros, plan meals, and coach your clients' nutrition
        </p>
      </div>

      {/* Client Selector */}
      <div style={{
        ...s.cardStyle, padding: 20, marginBottom: 24,
        animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
      }}>
        <label style={s.label}>Select Client</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          style={{ ...s.input, maxWidth: 400, cursor: 'pointer' }}>
          <option value="">Choose a client...</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </select>
      </div>

      {/* All content below requires a client selection */}
      {selectedClient && targets && (
        <>
          {/* ═══ Today's Macros ═══ */}
          <div style={{
            ...s.cardStyle, padding: 28, marginBottom: 24,
            animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both',
          }}>
            <div style={{ font: `600 17px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Today's Macros</div>
            <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 24 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="nutr-macros-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, justifyItems: 'center' }}>
              <MacroRing value={todayTotals.cal} max={targets.calories} label="Calories" color={s.accent} unit=" cal" delay={0.2} />
              <MacroRing value={todayTotals.p} max={targets.protein} label="Protein" color={MACRO_COLORS.protein} unit="g" delay={0.3} />
              <MacroRing value={todayTotals.c} max={targets.carbs} label="Carbs" color={MACRO_COLORS.carbs} unit="g" delay={0.4} />
              <MacroRing value={todayTotals.f} max={targets.fat} label="Fat" color={MACRO_COLORS.fat} unit="g" delay={0.5} />
            </div>
          </div>

          {/* ═══ Section 3: Meal Log ═══ */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              font: `600 17px ${s.FONT}`, color: s.text, marginBottom: 4,
              animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both',
            }}>Meal Log</div>
            <div style={{
              font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 16,
              animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both',
            }}>
              {todayTotals.cal.toLocaleString()} of {targets.calories.toLocaleString()} calories consumed
            </div>
            <MealSection title="Breakfast" icon={"\u2600\uFE0F"} mealData={todayMeals.breakfast} onAddFood={() => handleAddFood('breakfast')} onScanBarcode={() => handleScanBarcode('breakfast')} delay={0.25} />
            <MealSection title="Lunch" icon={"\uD83C\uDF1E"} mealData={todayMeals.lunch} onAddFood={() => handleAddFood('lunch')} onScanBarcode={() => handleScanBarcode('lunch')} delay={0.3} />
            <MealSection title="Dinner" icon={"\uD83C\uDF19"} mealData={todayMeals.dinner} onAddFood={() => handleAddFood('dinner')} onScanBarcode={() => handleScanBarcode('dinner')} delay={0.35} />
            <MealSection title="Snacks" icon={"\uD83C\uDF4E"} mealData={todayMeals.snacks} onAddFood={() => handleAddFood('snacks')} onScanBarcode={() => handleScanBarcode('snacks')} delay={0.4} />
          </div>

          {/* ═══ Section 5: Meal Plan Templates ═══ */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              font: `600 17px ${s.FONT}`, color: s.text, marginBottom: 4,
              animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both',
            }}>Meal Plan Templates</div>
            <div style={{
              font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 16,
              animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both',
            }}>Assign a pre-built macro plan to {clientObj?.name || 'this client'}</div>
            <div className="nutr-templates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {MEAL_PLAN_TEMPLATES.map((tpl, i) => {
                const isActive = targets.calories === tpl.cal && targets.protein === tpl.p;
                return (
                  <div key={tpl.id} style={{
                    ...s.cardStyle, overflow: 'hidden',
                    animation: `nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${0.4 + i * 0.06}s both`,
                    border: isActive ? `2px solid ${s.accent}` : s.cardStyle.border,
                  }} className="nutr-card-hover">
                    {/* Gradient header */}
                    <div style={{
                      background: tpl.gradient, padding: '16px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ font: `700 16px ${s.FONT}`, color: '#fff' }}>{tpl.name}</div>
                      <div style={{ font: `600 14px ${s.MONO}`, color: 'rgba(255,255,255,0.9)' }}>{tpl.cal.toLocaleString()} cal</div>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, marginBottom: 12, lineHeight: 1.5 }}>{tpl.desc}</div>
                      {/* Macro breakdown */}
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <div>
                          <div style={{ font: `600 14px ${s.MONO}`, color: MACRO_COLORS.protein }}>{tpl.p}g</div>
                          <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>Protein</div>
                        </div>
                        <div>
                          <div style={{ font: `600 14px ${s.MONO}`, color: MACRO_COLORS.carbs }}>{tpl.c}g</div>
                          <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>Carbs</div>
                        </div>
                        <div>
                          <div style={{ font: `600 14px ${s.MONO}`, color: '#D97706' }}>{tpl.f}g</div>
                          <div style={{ font: `400 10px ${s.MONO}`, color: s.text3 }}>Fat</div>
                        </div>
                      </div>
                      <MacroBar p={tpl.p} c={tpl.c} f={tpl.f} />
                      <button onClick={() => handleAssignTemplate(tpl)} style={{
                        ...(isActive ? s.pillGhost : s.pillAccent), marginTop: 14, width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        {isActive ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Active Plan
                          </>
                        ) : 'Assign to Client'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Section 6: Weekly Overview ═══ */}
          <WeeklyChart mealLogs={mealLogs} targets={targets} />

          {/* ═══ Food Search Modal ═══ */}
          <FoodSearchModal
            open={foodModalOpen}
            onClose={() => setFoodModalOpen(false)}
            onAdd={handleFoodAdded}
            mealName={foodModalMeal.charAt(0).toUpperCase() + foodModalMeal.slice(1)}
            onSwitchToBarcode={() => { setBarcodeModalMeal(foodModalMeal); setBarcodeModalOpen(true); }}
          />

          <BarcodeScannerModal
            open={barcodeModalOpen}
            onClose={() => setBarcodeModalOpen(false)}
            onAdd={handleBarcodeFoodAdded}
            mealName={barcodeModalMeal.charAt(0).toUpperCase() + barcodeModalMeal.slice(1)}
          />

          {/* Assignment Toast */}
          {assignToast && (
            <div style={{
              position: 'fixed', bottom: 32, right: 32, zIndex: 1100,
              background: s.accent, color: s.accentText,
              padding: '12px 24px', borderRadius: 100,
              font: `500 14px ${s.FONT}`,
              boxShadow: `0 8px 32px ${s.accent}44`,
              animation: 'nutrFadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              {assignToast}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!selectedClient && (
        <div style={{
          ...s.cardStyle, padding: '60px 40px', textAlign: 'center',
          animation: 'nutrFadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{"\uD83E\uDD57"}</div>
          <div style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Select a Client</div>
          <div style={{ font: `400 14px ${s.FONT}`, color: s.text3, maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Choose a client from the dropdown above to view their nutrition data, track macros, and manage meal plans.
          </div>
        </div>
      )}
    </div>
  );
}
