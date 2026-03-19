import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStyles, getAvatarGradient } from '../theme';
import { getPatients, subscribe } from '../data/store';

/* ─── Keyframes ─── */
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
    @keyframes nutrSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes nutrBarGrow {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }
    @keyframes nutrScanLine {
      0% { top: 10%; }
      50% { top: 80%; }
      100% { top: 10%; }
    }
    .nutr-card-hover:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03) !important;
    }
    .nutr-meal-row:hover {
      background: rgba(0,0,0,0.015) !important;
    }
    .nutr-modal-overlay {
      animation: nutrOverlayIn 0.25s ease;
    }
    @keyframes nutrOverlayIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .nutr-modal-content {
      animation: nutrModalSlideUp 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes nutrModalSlideUp {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(sheet);
}

/* ── Icons ── */
const ICO = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  chev: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  scan: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

/* ── Helpers ── */
const today = new Date();
const d = (offset) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
};
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Macro colors ── */
const MACRO_COLORS = {
  calories: '#0E7A82',
  protein: '#22C55E',
  carbs: '#EAB308',
  fat: '#EF4444',
};

/* ── Seed meal data ── */
function seedNutritionData() {
  const clients = getPatients();
  if (clients.length < 5) return;

  // Macro targets for all 5 clients
  const targetMap = {
    [clients[0].id]: { calories: 2800, protein: 200, carbs: 300, fat: 90 },   // James — cutting/building
    [clients[1].id]: { calories: 1800, protein: 140, carbs: 180, fat: 60 },   // Sarah — fat loss
    [clients[2].id]: { calories: 2800, protein: 200, carbs: 300, fat: 90 },   // Marcus — bulking
    [clients[3].id]: { calories: 2000, protein: 120, carbs: 220, fat: 65 },   // Emily — prenatal
    [clients[4].id]: { calories: 2200, protein: 170, carbs: 230, fat: 70 },   // David — maintenance/rehab
  };

  Object.entries(targetMap).forEach(([id, targets]) => {
    if (!localStorage.getItem(`ms_macro_targets_${id}`)) {
      localStorage.setItem(`ms_macro_targets_${id}`, JSON.stringify(targets));
    }
  });

  // James — high protein muscle building meals
  if (!localStorage.getItem(`ms_nutrition_${clients[0].id}`)) {
    const meals = {};
    for (let i = 0; i < 7; i++) {
      const date = d(-i);
      const factor = 0.85 + Math.random() * 0.3;
      meals[date] = {
        breakfast: [
          { name: 'Scrambled Eggs (4)', calories: Math.round(320 * factor), protein: 24, carbs: 2, fat: 22 },
          { name: 'Oatmeal w/ Banana', calories: Math.round(350 * factor), protein: 10, carbs: 60, fat: 6 },
          { name: 'Black Coffee', calories: 5, protein: 0, carbs: 1, fat: 0 },
        ],
        lunch: [
          { name: 'Grilled Chicken Breast (8oz)', calories: Math.round(380 * factor), protein: 56, carbs: 0, fat: 8 },
          { name: 'Brown Rice (1 cup)', calories: Math.round(220 * factor), protein: 5, carbs: 46, fat: 2 },
          { name: 'Steamed Broccoli', calories: 55, protein: 4, carbs: 10, fat: 0 },
        ],
        dinner: [
          { name: 'Salmon Fillet (6oz)', calories: Math.round(350 * factor), protein: 40, carbs: 0, fat: 18 },
          { name: 'Sweet Potato', calories: Math.round(180 * factor), protein: 4, carbs: 42, fat: 0 },
          { name: 'Mixed Green Salad', calories: 80, protein: 2, carbs: 12, fat: 3 },
        ],
        snacks: [
          { name: 'Protein Shake', calories: 280, protein: 40, carbs: 12, fat: 4 },
          { name: 'Almonds (1oz)', calories: 164, protein: 6, carbs: 6, fat: 14 },
          { name: 'Greek Yogurt', calories: 130, protein: 15, carbs: 8, fat: 4 },
        ],
      };
    }
    localStorage.setItem(`ms_nutrition_${clients[0].id}`, JSON.stringify(meals));
  }

  // Sarah — clean eating, lower cal
  if (!localStorage.getItem(`ms_nutrition_${clients[1].id}`)) {
    const meals = {};
    for (let i = 0; i < 7; i++) {
      const date = d(-i);
      const factor = 0.85 + Math.random() * 0.3;
      meals[date] = {
        breakfast: [
          { name: 'Avocado Toast (Whole Grain)', calories: Math.round(280 * factor), protein: 8, carbs: 30, fat: 16 },
          { name: 'Green Smoothie', calories: Math.round(180 * factor), protein: 6, carbs: 32, fat: 2 },
        ],
        lunch: [
          { name: 'Turkey Wrap', calories: Math.round(320 * factor), protein: 28, carbs: 35, fat: 8 },
          { name: 'Side Salad w/ Vinaigrette', calories: 95, protein: 2, carbs: 10, fat: 5 },
        ],
        dinner: [
          { name: 'Grilled Shrimp (6oz)', calories: Math.round(240 * factor), protein: 36, carbs: 2, fat: 4 },
          { name: 'Quinoa (3/4 cup)', calories: Math.round(170 * factor), protein: 6, carbs: 30, fat: 3 },
          { name: 'Roasted Vegetables', calories: 120, protein: 3, carbs: 18, fat: 4 },
        ],
        snacks: [
          { name: 'Apple w/ Almond Butter', calories: 200, protein: 4, carbs: 28, fat: 10 },
          { name: 'Protein Bar', calories: 210, protein: 20, carbs: 22, fat: 8 },
        ],
      };
    }
    localStorage.setItem(`ms_nutrition_${clients[1].id}`, JSON.stringify(meals));
  }

  // Marcus — high calorie bulking athlete
  if (!localStorage.getItem(`ms_nutrition_${clients[2].id}`)) {
    const meals = {};
    for (let i = 0; i < 7; i++) {
      const date = d(-i);
      const factor = 0.85 + Math.random() * 0.3;
      meals[date] = {
        breakfast: [
          { name: 'Egg White Omelette (6 whites + 2 whole)', calories: Math.round(340 * factor), protein: 36, carbs: 4, fat: 12 },
          { name: 'Bagel w/ Cream Cheese', calories: Math.round(380 * factor), protein: 12, carbs: 58, fat: 10 },
          { name: 'Orange Juice', calories: 120, protein: 2, carbs: 28, fat: 0 },
        ],
        lunch: [
          { name: 'Double Chicken Burrito Bowl', calories: Math.round(650 * factor), protein: 58, carbs: 65, fat: 16 },
          { name: 'Tortilla Chips + Guac', calories: 220, protein: 3, carbs: 20, fat: 14 },
        ],
        dinner: [
          { name: 'Steak (10oz Sirloin)', calories: Math.round(500 * factor), protein: 62, carbs: 0, fat: 24 },
          { name: 'Mashed Potatoes', calories: Math.round(240 * factor), protein: 4, carbs: 36, fat: 10 },
          { name: 'Steamed Asparagus', calories: 40, protein: 4, carbs: 6, fat: 0 },
        ],
        snacks: [
          { name: 'Mass Gainer Shake', calories: 420, protein: 50, carbs: 48, fat: 8 },
          { name: 'PB&J Sandwich', calories: 380, protein: 14, carbs: 46, fat: 16 },
          { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
        ],
      };
    }
    localStorage.setItem(`ms_nutrition_${clients[2].id}`, JSON.stringify(meals));
  }

  // Emily — prenatal, balanced and nutrient-dense
  if (!localStorage.getItem(`ms_nutrition_${clients[3].id}`)) {
    const meals = {};
    for (let i = 0; i < 7; i++) {
      const date = d(-i);
      const factor = 0.85 + Math.random() * 0.3;
      meals[date] = {
        breakfast: [
          { name: 'Greek Yogurt Parfait w/ Granola', calories: Math.round(320 * factor), protein: 20, carbs: 42, fat: 8 },
          { name: 'Prenatal Smoothie (berries, spinach, flax)', calories: Math.round(220 * factor), protein: 10, carbs: 34, fat: 6 },
        ],
        lunch: [
          { name: 'Grilled Salmon Salad', calories: Math.round(380 * factor), protein: 34, carbs: 12, fat: 22 },
          { name: 'Whole Grain Roll', calories: 150, protein: 5, carbs: 28, fat: 2 },
        ],
        dinner: [
          { name: 'Baked Chicken Thigh', calories: Math.round(280 * factor), protein: 28, carbs: 0, fat: 16 },
          { name: 'Brown Rice (3/4 cup)', calories: Math.round(165 * factor), protein: 4, carbs: 34, fat: 1 },
          { name: 'Steamed Spinach + Lemon', calories: 45, protein: 5, carbs: 6, fat: 1 },
        ],
        snacks: [
          { name: 'Cottage Cheese w/ Berries', calories: 180, protein: 18, carbs: 16, fat: 4 },
          { name: 'Trail Mix (1/4 cup)', calories: 170, protein: 5, carbs: 14, fat: 10 },
        ],
      };
    }
    localStorage.setItem(`ms_nutrition_${clients[3].id}`, JSON.stringify(meals));
  }

  // David — maintenance/rehab, balanced
  if (!localStorage.getItem(`ms_nutrition_${clients[4].id}`)) {
    const meals = {};
    for (let i = 0; i < 7; i++) {
      const date = d(-i);
      const factor = 0.85 + Math.random() * 0.3;
      meals[date] = {
        breakfast: [
          { name: 'Whole Eggs (3) + Toast', calories: Math.round(380 * factor), protein: 22, carbs: 28, fat: 18 },
          { name: 'Turkey Sausage (2 links)', calories: Math.round(140 * factor), protein: 14, carbs: 2, fat: 8 },
          { name: 'Black Coffee', calories: 5, protein: 0, carbs: 1, fat: 0 },
        ],
        lunch: [
          { name: 'Chicken Caesar Wrap', calories: Math.round(420 * factor), protein: 36, carbs: 32, fat: 16 },
          { name: 'Mixed Fruit Cup', calories: 80, protein: 1, carbs: 20, fat: 0 },
        ],
        dinner: [
          { name: 'Grilled Tilapia (8oz)', calories: Math.round(280 * factor), protein: 46, carbs: 0, fat: 6 },
          { name: 'Roasted Sweet Potato Wedges', calories: Math.round(200 * factor), protein: 3, carbs: 40, fat: 4 },
          { name: 'Coleslaw', calories: 100, protein: 1, carbs: 12, fat: 5 },
        ],
        snacks: [
          { name: 'Protein Shake', calories: 250, protein: 35, carbs: 10, fat: 4 },
          { name: 'Rice Cakes w/ PB', calories: 190, protein: 6, carbs: 22, fat: 8 },
        ],
      };
    }
    localStorage.setItem(`ms_nutrition_${clients[4].id}`, JSON.stringify(meals));
  }
}

/* ── Meal Plan Templates ── */
const MEAL_PLANS = [
  {
    name: 'High Protein Cut',
    icon: '🥩',
    macros: { calories: 2000, protein: 200, carbs: 150, fat: 70 },
    description: 'High protein, moderate carb, low fat for fat loss while preserving muscle.',
    meals: ['Egg whites + oatmeal', '8oz chicken + rice + veggies', '6oz salmon + sweet potato + greens', 'Protein shake + almonds'],
  },
  {
    name: 'Lean Bulk',
    icon: '💪',
    macros: { calories: 3200, protein: 220, carbs: 380, fat: 100 },
    description: 'Caloric surplus with high protein for maximum muscle growth.',
    meals: ['4 eggs + bagel + fruit', '10oz steak + large rice + broccoli', 'Pasta + ground turkey + sauce', 'PB sandwich + mass gainer'],
  },
  {
    name: 'Balanced',
    icon: '⚖️',
    macros: { calories: 2200, protein: 150, carbs: 250, fat: 75 },
    description: 'Even macro split for general fitness and sustainable eating.',
    meals: ['Greek yogurt parfait', 'Turkey sandwich + fruit', 'Grilled fish + brown rice + salad', 'Trail mix + protein bar'],
  },
  {
    name: 'Keto',
    icon: '🥑',
    macros: { calories: 2000, protein: 150, carbs: 30, fat: 155 },
    description: 'Very low carb, high fat for ketogenic fat burning.',
    meals: ['Bacon + eggs + avocado', '8oz salmon + caesar salad (no croutons)', 'Ribeye + asparagus + butter', 'Cheese + macadamia nuts'],
  },
];

/* ── DonutRing SVG ── */
function DonutRing({ value, max, color, label, unit, size = 100 }) {
  const s = useStyles();
  const pct = Math.min(value / max, 1);
  const circumference = 283; // 2 * PI * 45
  const offset = circumference * (1 - pct);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke={s.border} strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          style={{ animation: 'nutrRingDraw 1.2s ease forwards', transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{ marginTop: -size / 2 - 10, position: 'relative', height: 0 }}>
        <span style={{ fontFamily: s.MONO, fontSize: size > 90 ? 18 : 14, fontWeight: 700, color: s.text }}>{value}</span>
      </div>
      <div style={{ marginTop: size > 90 ? 24 : 18 }}>
        <div style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: 600, color: s.text }}>{label}</div>
        <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3 }}>{value} / {max}{unit}</div>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function Nutrition() {
  const s = useStyles();
  const [clients, setClients] = useState(getPatients);
  const [selectedClient, setSelectedClient] = useState('');
  const [nutritionData, setNutritionData] = useState({});
  const [targets, setTargets] = useState({ calories: 2200, protein: 150, carbs: 250, fat: 75 });
  const [expandedMeal, setExpandedMeal] = useState('breakfast');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [addToMealType, setAddToMealType] = useState('snacks');
  const [planModal, setPlanModal] = useState(null);
  const debounceRef = useRef(null);

  // Seed data on mount
  useEffect(() => { seedNutritionData(); }, []);

  // Subscribe to store changes
  useEffect(() => subscribe(() => setClients(getPatients())), []);

  // Auto-select first client
  useEffect(() => {
    if (!selectedClient && clients.length > 0) setSelectedClient(clients[0].id);
  }, [clients, selectedClient]);

  // Load data when client changes
  useEffect(() => {
    if (!selectedClient) return;
    try {
      const data = JSON.parse(localStorage.getItem(`ms_nutrition_${selectedClient}`) || '{}');
      setNutritionData(data);
      const t = JSON.parse(localStorage.getItem(`ms_macro_targets_${selectedClient}`) || 'null');
      if (t) setTargets(t);
      else setTargets({ calories: 2200, protein: 150, carbs: 250, fat: 75 });
    } catch {
      setNutritionData({});
    }
  }, [selectedClient]);

  // Save nutrition data
  const saveData = useCallback((newData) => {
    setNutritionData(newData);
    if (selectedClient) localStorage.setItem(`ms_nutrition_${selectedClient}`, JSON.stringify(newData));
  }, [selectedClient]);

  const todayStr = d(0);
  const todayMeals = nutritionData[todayStr] || { breakfast: [], lunch: [], dinner: [], snacks: [] };

  // Calculate today's totals
  const todayTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(todayMeals).forEach(meal => {
      (meal || []).forEach(item => {
        totals.calories += item.calories || 0;
        totals.protein += item.protein || 0;
        totals.carbs += item.carbs || 0;
        totals.fat += item.fat || 0;
      });
    });
    return totals;
  }, [todayMeals]);

  // Weekly data for chart
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = d(-6 + i);
      const day = new Date(date + 'T12:00:00');
      const meals = nutritionData[date] || {};
      const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      Object.values(meals).forEach(meal => {
        (meal || []).forEach(item => {
          totals.calories += item.calories || 0;
          totals.protein += item.protein || 0;
          totals.carbs += item.carbs || 0;
          totals.fat += item.fat || 0;
        });
      });
      return { date, dayName: DAY_NAMES[day.getDay()], ...totals };
    });
  }, [nutritionData]);

  /* ── USDA Food Search ── */
  useEffect(() => {
    if (!foodSearch.trim()) { setFoodResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setFoodLoading(true);
      try {
        const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(foodSearch)}&pageSize=12`);
        const json = await res.json();
        const foods = (json.foods || []).map(f => {
          const get = (name) => {
            const n = (f.foodNutrients || []).find(n => n.nutrientName?.toLowerCase().includes(name.toLowerCase()));
            return Math.round(n?.value || 0);
          };
          return {
            name: f.description || f.lowercaseDescription || 'Unknown',
            brand: f.brandName || f.brandOwner || '',
            calories: get('energy'),
            protein: get('protein'),
            carbs: get('carbohydrate'),
            fat: get('total lipid'),
            serving: f.servingSize ? `${f.servingSize}${f.servingSizeUnit || 'g'}` : '100g',
          };
        });
        setFoodResults(foods);
      } catch {
        setFoodResults([]);
      }
      setFoodLoading(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [foodSearch]);

  /* ── Barcode Lookup ── */
  const lookupBarcode = async (code) => {
    if (!code) return;
    setBarcodeScanning(true);
    setBarcodeResult(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const json = await res.json();
      if (json.status === 1 && json.product) {
        const p = json.product;
        const n = p.nutriments || {};
        setBarcodeResult({
          name: p.product_name || 'Unknown Product',
          brand: p.brands || '',
          calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
          protein: Math.round(n.proteins_100g || n.proteins || 0),
          carbs: Math.round(n.carbohydrates_100g || n.carbohydrates || 0),
          fat: Math.round(n.fat_100g || n.fat || 0),
          serving: p.serving_size || '100g',
          image: p.image_front_small_url || '',
        });
      } else {
        setBarcodeResult({ error: true, name: 'Product not found' });
      }
    } catch {
      setBarcodeResult({ error: true, name: 'Lookup failed' });
    }
    setBarcodeScanning(false);
  };

  // Try BarcodeDetector API
  const startCameraScan = async () => {
    if (!('BarcodeDetector' in window)) {
      alert('Camera barcode scanning is not supported in this browser. Please enter the barcode manually.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const detect = async () => {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            setBarcodeInput(barcodes[0].rawValue);
            lookupBarcode(barcodes[0].rawValue);
            stream.getTracks().forEach(t => t.stop());
            return;
          }
        } catch {}
        requestAnimationFrame(detect);
      };
      detect();
      // Auto-stop after 10 seconds
      setTimeout(() => stream.getTracks().forEach(t => t.stop()), 10000);
    } catch {
      alert('Could not access camera.');
    }
  };

  /* ── Add food to meal log ── */
  const addFoodToMeal = (food, mealType) => {
    const newData = { ...nutritionData };
    if (!newData[todayStr]) newData[todayStr] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    if (!newData[todayStr][mealType]) newData[todayStr][mealType] = [];
    newData[todayStr][mealType].push({
      name: food.name + (food.brand ? ` (${food.brand})` : ''),
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
    saveData(newData);
  };

  /* ── Remove food from meal ── */
  const removeFoodFromMeal = (mealType, idx) => {
    const newData = { ...nutritionData };
    if (newData[todayStr]?.[mealType]) {
      newData[todayStr][mealType] = newData[todayStr][mealType].filter((_, i) => i !== idx);
      saveData(newData);
    }
  };

  /* ── Apply meal plan template ── */
  const applyPlan = (plan) => {
    if (selectedClient) {
      localStorage.setItem(`ms_macro_targets_${selectedClient}`, JSON.stringify(plan.macros));
      setTargets(plan.macros);
    }
    setPlanModal(null);
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { key: 'lunch', label: 'Lunch', icon: '☀️' },
    { key: 'dinner', label: 'Dinner', icon: '🌙' },
    { key: 'snacks', label: 'Snacks', icon: '🍎' },
  ];

  const client = clients.find(c => c.id === selectedClient);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: s.HEADING, fontSize: 28, fontWeight: 700, color: s.text, margin: 0 }}>Nutrition</h1>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, margin: '4px 0 0' }}>
            Track meals, macros, and meal plans
          </p>
        </div>
        {/* Client selector */}
        <select
          style={{ ...s.input, width: 'auto', minWidth: 220, cursor: 'pointer' }}
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
        >
          <option value="">Select client...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
      </div>

      {!selectedClient ? (
        <div style={{ ...s.cardStyle, padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: s.FONT, fontSize: 16, color: s.text3 }}>Select a client to view nutrition data</p>
        </div>
      ) : (
        <>
          {/* ═══ TODAY'S MACROS ═══ */}
          <div style={{ ...s.cardStyle, padding: 24, marginBottom: 24, animation: 'nutrFadeInUp 0.4s ease' }}>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 20px' }}>
              Today's Macros
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 24, justifyItems: 'center' }}>
              <DonutRing value={todayTotals.calories} max={targets.calories} color={MACRO_COLORS.calories} label="Calories" unit=" cal" size={110} />
              <DonutRing value={todayTotals.protein} max={targets.protein} color={MACRO_COLORS.protein} label="Protein" unit="g" />
              <DonutRing value={todayTotals.carbs} max={targets.carbs} color={MACRO_COLORS.carbs} label="Carbs" unit="g" />
              <DonutRing value={todayTotals.fat} max={targets.fat} color={MACRO_COLORS.fat} label="Fat" unit="g" />
            </div>
            {/* Remaining */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Cal remaining', val: targets.calories - todayTotals.calories },
                { label: 'Protein left', val: targets.protein - todayTotals.protein, unit: 'g' },
              ].map((r, i) => (
                <span key={i} style={{
                  fontFamily: s.MONO, fontSize: 12,
                  color: r.val > 0 ? s.text2 : s.danger,
                  background: r.val > 0 ? s.surfaceAlt : s.dangerBg,
                  padding: '4px 12px', borderRadius: 100,
                }}>
                  {r.val > 0 ? r.val : 'Over by ' + Math.abs(r.val)} {r.unit || 'cal'} {r.val > 0 ? 'left' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* ═══ MEAL LOG ═══ */}
          <div style={{ ...s.cardStyle, padding: 0, marginBottom: 24, overflow: 'hidden', animation: 'nutrFadeInUp 0.4s ease 0.05s both' }}>
            <div style={{ padding: '20px 24px 0' }}>
              <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 16px' }}>
                Meal Log — {new Date(todayStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
            </div>
            {mealTypes.map(mt => {
              const items = todayMeals[mt.key] || [];
              const mealCal = items.reduce((s, i) => s + (i.calories || 0), 0);
              const mealProt = items.reduce((s, i) => s + (i.protein || 0), 0);
              const isExpanded = expandedMeal === mt.key;
              return (
                <div key={mt.key} style={{ borderBottom: `1px solid ${s.border}` }}>
                  {/* Meal header */}
                  <div
                    onClick={() => setExpandedMeal(isExpanded ? null : mt.key)}
                    style={{
                      padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{mt.icon}</span>
                      <span style={{ fontFamily: s.FONT, fontSize: 15, fontWeight: 600, color: s.text }}>{mt.label}</span>
                      <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3, marginLeft: 4 }}>
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontFamily: s.MONO, fontSize: 13, color: s.accent, fontWeight: 600 }}>{mealCal} cal</span>
                      <span style={{ fontFamily: s.MONO, fontSize: 12, color: s.text3 }}>{mealProt}g protein</span>
                      <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: s.text3 }}>
                        {ICO.chev}
                      </span>
                    </div>
                  </div>
                  {/* Expanded items */}
                  {isExpanded && (
                    <div style={{ padding: '0 24px 16px', animation: 'nutrFadeInUp 0.25s ease' }}>
                      {items.length === 0 ? (
                        <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, padding: '8px 0' }}>No items logged</p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['Food', 'Cal', 'Protein', 'Carbs', 'Fat', ''].map(h => (
                                <th key={h} style={{ fontFamily: s.FONT, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: s.text3, padding: '6px 4px', textAlign: 'left' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, j) => (
                              <tr key={j} className="nutr-meal-row" style={{ borderBottom: j < items.length - 1 ? `1px solid ${s.borderLight}` : 'none' }}>
                                <td style={{ fontFamily: s.FONT, fontSize: 13, color: s.text, padding: '8px 4px', fontWeight: 500 }}>{item.name}</td>
                                <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.accent, padding: '8px 4px' }}>{item.calories}</td>
                                <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.text2, padding: '8px 4px' }}>{item.protein}g</td>
                                <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.text2, padding: '8px 4px' }}>{item.carbs}g</td>
                                <td style={{ fontFamily: s.MONO, fontSize: 13, color: s.text2, padding: '8px 4px' }}>{item.fat}g</td>
                                <td style={{ padding: '8px 4px' }}>
                                  <button onClick={() => removeFoodFromMeal(mt.key, j)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text3, padding: 2 }}>
                                    {ICO.trash}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══ FOOD SEARCH + BARCODE ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Food Search */}
            <div style={{ ...s.cardStyle, padding: 24, animation: 'nutrFadeInUp 0.4s ease 0.1s both' }}>
              <h3 style={{ fontFamily: s.HEADING, fontSize: 16, fontWeight: 600, color: s.text, margin: '0 0 14px' }}>
                Food Search (USDA)
              </h3>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: s.text3 }}>{ICO.search}</span>
                <input
                  style={{ ...s.input, paddingLeft: 40 }}
                  placeholder="Search foods..."
                  value={foodSearch}
                  onChange={e => setFoodSearch(e.target.value)}
                />
              </div>
              {/* Add to selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>Add to:</span>
                <select style={{ ...s.input, width: 'auto', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }} value={addToMealType} onChange={e => setAddToMealType(e.target.value)}>
                  {mealTypes.map(mt => <option key={mt.key} value={mt.key}>{mt.label}</option>)}
                </select>
              </div>
              {/* Results */}
              <div style={{ maxHeight: 320, overflow: 'auto' }}>
                {foodLoading && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ width: 24, height: 24, border: `3px solid ${s.border}`, borderTopColor: s.accent, borderRadius: '50%', animation: 'nutrSpin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                )}
                {foodResults.map((food, i) => (
                  <div
                    key={i}
                    className="nutr-meal-row"
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: i < foodResults.length - 1 ? `1px solid ${s.borderLight}` : 'none',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => addFoodToMeal(food, addToMealType)}
                  >
                    <div>
                      <div style={{ fontFamily: s.FONT, fontSize: 13, fontWeight: 500, color: s.text }}>{food.name}</div>
                      {food.brand && <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3 }}>{food.brand}</div>}
                      <div style={{ fontFamily: s.MONO, fontSize: 11, color: s.text3, marginTop: 2 }}>
                        {food.serving} — P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: s.MONO, fontSize: 14, fontWeight: 600, color: s.accent }}>{food.calories}</span>
                      <span style={{ color: s.accent }}>{ICO.plus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barcode Scanner */}
            <div style={{ ...s.cardStyle, padding: 24, animation: 'nutrFadeInUp 0.4s ease 0.15s both' }}>
              <h3 style={{ fontFamily: s.HEADING, fontSize: 16, fontWeight: 600, color: s.text, margin: '0 0 14px' }}>
                Barcode Scanner
              </h3>
              <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3, margin: '0 0 14px' }}>
                Scan or enter a barcode to look up nutrition info via Open Food Facts.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  placeholder="Enter barcode (e.g. 0049000006346)"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookupBarcode(barcodeInput)}
                />
                <button style={{ ...s.pillAccent, whiteSpace: 'nowrap' }} onClick={() => lookupBarcode(barcodeInput)}>
                  Look Up
                </button>
              </div>
              <button
                style={{ ...s.pillOutline, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}
                onClick={startCameraScan}
              >
                {ICO.scan} Scan with Camera
              </button>

              {barcodeScanning && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 24, height: 24, border: `3px solid ${s.border}`, borderTopColor: s.accent, borderRadius: '50%', animation: 'nutrSpin 0.8s linear infinite', margin: '0 auto 8px' }} />
                  <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text3 }}>Looking up product...</p>
                </div>
              )}

              {barcodeResult && !barcodeResult.error && (
                <div style={{ padding: 16, borderRadius: 12, background: s.surfaceAlt, border: `1px solid ${s.border}` }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    {barcodeResult.image && (
                      <img src={barcodeResult.image} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8 }} />
                    )}
                    <div>
                      <div style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 600, color: s.text }}>{barcodeResult.name}</div>
                      {barcodeResult.brand && <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{barcodeResult.brand}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Cal', val: barcodeResult.calories, color: MACRO_COLORS.calories },
                      { label: 'Protein', val: barcodeResult.protein + 'g', color: MACRO_COLORS.protein },
                      { label: 'Carbs', val: barcodeResult.carbs + 'g', color: MACRO_COLORS.carbs },
                      { label: 'Fat', val: barcodeResult.fat + 'g', color: MACRO_COLORS.fat },
                    ].map((m, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: s.MONO, fontSize: 15, fontWeight: 700, color: m.color }}>{m.val}</div>
                        <div style={{ fontFamily: s.FONT, fontSize: 10, color: s.text3, textTransform: 'uppercase' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select style={{ ...s.input, width: 'auto', padding: '6px 12px', fontSize: 12, cursor: 'pointer', flex: 1 }} value={addToMealType} onChange={e => setAddToMealType(e.target.value)}>
                      {mealTypes.map(mt => <option key={mt.key} value={mt.key}>{mt.label}</option>)}
                    </select>
                    <button style={s.pillCta} onClick={() => { addFoodToMeal(barcodeResult, addToMealType); setBarcodeResult(null); setBarcodeInput(''); }}>
                      Add to Meal
                    </button>
                  </div>
                </div>
              )}
              {barcodeResult?.error && (
                <div style={{ padding: 16, borderRadius: 12, background: s.dangerBg, textAlign: 'center' }}>
                  <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.danger }}>{barcodeResult.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ MEAL PLAN TEMPLATES ═══ */}
          <div style={{ marginBottom: 24, animation: 'nutrFadeInUp 0.4s ease 0.2s both' }}>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 16px' }}>
              Meal Plan Templates
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {MEAL_PLANS.map((plan, i) => (
                <div
                  key={i}
                  className="nutr-card-hover"
                  style={{ ...s.cardStyle, padding: 20, cursor: 'pointer', transition: 'all 0.25s ease' }}
                  onClick={() => setPlanModal(plan)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{plan.icon}</span>
                    <h3 style={{ fontFamily: s.HEADING, fontSize: 16, fontWeight: 600, color: s.text, margin: 0 }}>{plan.name}</h3>
                  </div>
                  <p style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, margin: '0 0 12px', lineHeight: 1.5 }}>
                    {plan.description}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: s.MONO, fontSize: 11, color: MACRO_COLORS.calories, background: s.surfaceAlt, padding: '2px 8px', borderRadius: 100 }}>{plan.macros.calories} cal</span>
                    <span style={{ fontFamily: s.MONO, fontSize: 11, color: MACRO_COLORS.protein, background: s.surfaceAlt, padding: '2px 8px', borderRadius: 100 }}>{plan.macros.protein}g P</span>
                    <span style={{ fontFamily: s.MONO, fontSize: 11, color: MACRO_COLORS.carbs, background: s.surfaceAlt, padding: '2px 8px', borderRadius: 100 }}>{plan.macros.carbs}g C</span>
                    <span style={{ fontFamily: s.MONO, fontSize: 11, color: MACRO_COLORS.fat, background: s.surfaceAlt, padding: '2px 8px', borderRadius: 100 }}>{plan.macros.fat}g F</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ WEEKLY OVERVIEW (Stacked Bar Chart) ═══ */}
          <div style={{ ...s.cardStyle, padding: 24, animation: 'nutrFadeInUp 0.4s ease 0.25s both' }}>
            <h2 style={{ fontFamily: s.HEADING, fontSize: 18, fontWeight: 600, color: s.text, margin: '0 0 20px' }}>
              Weekly Overview
            </h2>
            <WeeklyBarChart data={weekData} targets={targets} s={s} />
          </div>

          {/* ═══ PLAN DETAIL MODAL ═══ */}
          {planModal && (
            <div
              className="nutr-modal-overlay"
              onClick={() => setPlanModal(null)}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              }}
            >
              <div
                className="nutr-modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                  background: s.surface, borderRadius: 20, border: `1px solid ${s.border}`,
                  boxShadow: s.shadowLg, maxWidth: 480, width: '90vw', padding: 28, position: 'relative',
                }}
              >
                <button onClick={() => setPlanModal(null)} style={{
                  position: 'absolute', top: 16, right: 16, background: s.surfaceAlt,
                  border: `1px solid ${s.border}`, borderRadius: 10, width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: s.text2,
                }}>
                  {ICO.x}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 40 }}>{planModal.icon}</span>
                  <h2 style={{ fontFamily: s.HEADING, fontSize: 22, fontWeight: 700, color: s.text, margin: 0 }}>{planModal.name}</h2>
                </div>
                <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, lineHeight: 1.6, margin: '0 0 20px' }}>
                  {planModal.description}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Calories', val: planModal.macros.calories, unit: '', color: MACRO_COLORS.calories },
                    { label: 'Protein', val: planModal.macros.protein, unit: 'g', color: MACRO_COLORS.protein },
                    { label: 'Carbs', val: planModal.macros.carbs, unit: 'g', color: MACRO_COLORS.carbs },
                    { label: 'Fat', val: planModal.macros.fat, unit: 'g', color: MACRO_COLORS.fat },
                  ].map((m, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: 12, borderRadius: 12, background: s.surfaceAlt }}>
                      <div style={{ fontFamily: s.MONO, fontSize: 20, fontWeight: 700, color: m.color }}>{m.val}{m.unit}</div>
                      <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, textTransform: 'uppercase', marginTop: 4 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: s.FONT, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.text3, marginBottom: 8, display: 'block' }}>Sample Meals</span>
                  <ol style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, margin: 0, paddingLeft: 18, lineHeight: 2 }}>
                    {planModal.meals.map((m, i) => <li key={i}>{m}</li>)}
                  </ol>
                </div>
                <button style={{ ...s.pillCta, width: '100%' }} onClick={() => applyPlan(planModal)}>
                  Apply Macro Targets for {client?.firstName || 'Client'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══ Weekly Stacked Bar Chart ═══ */
function WeeklyBarChart({ data, targets, s }) {
  const maxCal = Math.max(targets.calories * 1.2, ...data.map(d => d.calories));
  const barH = 200;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', justifyContent: 'space-between', height: barH + 40 }}>
      {data.map((day, i) => {
        const pPct = (day.protein * 4 / maxCal) * barH;
        const cPct = (day.carbs * 4 / maxCal) * barH;
        const fPct = (day.fat * 9 / maxCal) * barH;
        const isToday = day.date === new Date().toISOString().slice(0, 10);
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            {/* Stacked bar */}
            <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', height: barH, justifyContent: 'flex-start' }}>
              <div style={{
                width: '70%', maxWidth: 48, borderRadius: '6px 6px 0 0',
                background: MACRO_COLORS.fat, height: Math.max(fPct, 2),
                animation: `nutrBarGrow 0.6s ease ${i * 0.07}s both`,
                transformOrigin: 'bottom',
                opacity: 0.85,
              }} />
              <div style={{
                width: '70%', maxWidth: 48,
                background: MACRO_COLORS.carbs, height: Math.max(cPct, 2),
                animation: `nutrBarGrow 0.6s ease ${i * 0.07 + 0.1}s both`,
                transformOrigin: 'bottom',
                opacity: 0.85,
              }} />
              <div style={{
                width: '70%', maxWidth: 48, borderRadius: '6px 6px 0 0',
                background: MACRO_COLORS.protein, height: Math.max(pPct, 2),
                animation: `nutrBarGrow 0.6s ease ${i * 0.07 + 0.2}s both`,
                transformOrigin: 'bottom',
                opacity: 0.85,
              }} />
            </div>
            {/* Calorie label */}
            <div style={{ fontFamily: s.MONO, fontSize: 10, color: s.text3, marginTop: 4 }}>
              {day.calories > 0 ? day.calories : '-'}
            </div>
            {/* Day label */}
            <div style={{
              fontFamily: s.FONT, fontSize: 12, fontWeight: isToday ? 700 : 400,
              color: isToday ? s.accent : s.text3, marginTop: 2,
            }}>
              {day.dayName}
            </div>
            {/* Target line */}
            {targets.calories > 0 && (
              <div style={{
                position: 'absolute',
                bottom: 40 + (targets.calories / maxCal) * barH,
                left: 0, right: 0,
                borderTop: `1.5px dashed ${s.border}`,
                pointerEvents: 'none',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
