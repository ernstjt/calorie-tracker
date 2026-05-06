import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Search, Plus, Trash2, ChevronRight, Utensils, Flame, Activity, Scale, X,
  PieChart, Clock, History, ChevronLeft, Calendar, Coffee, Sun, Moon, Cookie,
  Sparkles, MessageSquare, Wand2, GripVertical, AlertCircle, Mic, Camera,
  CalendarDays, ListChecks, CheckCircle2, Circle, Save, Repeat, BarChart3,
  ScanLine, Cloud, CloudOff, Zap, Pencil
} from 'lucide-react';

// Environment variables for local deployment
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'calorie-counter-v1';
const USDA_API_KEY = 'lkRdpKqn24LgJ3oDTYpLyXyQH7elck6d4GTiOR9Q'; 
// NOTE: When deploying, uncomment the line below and use your .env file!
// const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const apiKey = ""; 

// --- Firebase Init ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// --- SafeInput Component ---
// This completely isolates mobile keyboard typing from React re-renders, 
// fixing the "backwards typing" / cursor jumping bug on Android/iOS.
const SafeInput = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value || '');
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  const handleChange = (e) => {
    setLocalVal(e.target.value);
    onChange(e.target.value);
  };
  return <input value={localVal} onChange={handleChange} {...props} />;
};

const App = () => {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('log'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('ai'); 
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFoodForEdit, setSelectedFoodForEdit] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState('Breakfast');
  
  // Theme & Quick Add
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(`${APP_ID}_theme`) === 'true');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '1 serving' });

  // Camera Menu State
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('meal'); 
  const fileInputRef = useRef(null);
  
  // Routine Builder State
  const [builderItems, setBuilderItems] = useState([]);
  const [builderName, setBuilderName] = useState('');
  const [builderAutoDays, setBuilderAutoDays] = useState([]);
  const [editingRoutineId, setEditingRoutineId] = useState(null);

  // Drag and Drop State
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dropTargetMeal, setDropTargetMeal] = useState(null);
  const [touchDrag, setTouchDrag] = useState(null);
  const ghostRef = useRef(null);
  const longPressTimeout = useRef(null);
  const initialTouch = useRef(null);

  // AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCoachResponse, setAiCoachResponse] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [newDietInput, setNewDietInput] = useState('');

  const defaultDiets = ['Keto', 'Vegan', 'Vegetarian', 'PCOS-Friendly', 'Macular Support', 'Gluten-Free'];

  // Cloud Data State
  const [user, setUser] = useState(null);
  const [dailyLog, setDailyLog] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [appliedRoutines, setAppliedRoutines] = useState({});
  const [userProfile, setUserProfile] = useState({ dailyGoal: 2000, proteinGoal: 150, carbsGoal: 250, fatGoal: 65, customDiets: defaultDiets });

  useEffect(() => { 
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(`${APP_ID}_theme`, isDarkMode); 
  }, [isDarkMode]);

  // Auth
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
      else { await signInAnonymously(auth); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user || !db) return;
    const unsubs = [
      onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'dailyLog'), (snap) => setDailyLog(snap.docs.map(d => d.data())), console.error),
      onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'routines'), (snap) => setRoutines(snap.docs.map(d => d.data())), console.error),
      onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'profile'), (snap) => { 
        snap.docs.forEach(d => { 
          if (d.id === 'main') {
            const data = d.data();
            setUserProfile({ ...data, customDiets: data.customDiets || defaultDiets });
          }
        }); 
      }, console.error)
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  const updateDB = async (c, id, data, isDel = false) => {
    if (!db || !user) return;
    const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, c, id.toString());
    if (isDel) await deleteDoc(ref); else await setDoc(ref, data);
  };

  const handleUpdateProfile = (np) => { setUserProfile(np); updateDB('profile', 'main', np); };

  const addCustomDiet = () => {
    if (!newDietInput.trim()) return;
    const currentDiets = userProfile.customDiets || defaultDiets;
    if (currentDiets.includes(newDietInput.trim())) return setNewDietInput('');
    handleUpdateProfile({ ...userProfile, customDiets: [...currentDiets, newDietInput.trim()] });
    setNewDietInput('');
  };

  const removeCustomDiet = (dietToRemove, e) => {
    e.stopPropagation();
    const currentDiets = userProfile.customDiets || defaultDiets;
    handleUpdateProfile({ ...userProfile, customDiets: currentDiets.filter(d => d !== dietToRemove) });
    setSelectedDiets(prev => prev.filter(d => d !== dietToRemove));
  };

  // Theme Logic
  const currentTheme = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00Z');
    const m = d.getMonth() + 1;
    if (m === 12) return { bg: 'bg-gradient-to-br from-red-600 to-green-700', deco: '🎄' };
    return { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', deco: '🐝' };
  }, [selectedDate]);

  const filteredLogs = useMemo(() => dailyLog.filter(item => item.date === selectedDate), [dailyLog, selectedDate]);
  const totals = useMemo(() => filteredLogs.reduce((acc, i) => {
    if (i.isEaten !== false) { acc.calories += (i.calories || 0); acc.protein += (i.protein || 0); acc.carbs += (i.carbs || 0); acc.fat += (i.fat || 0); }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 }), [filteredLogs]);

  const weeklyTrends = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate + 'T12:00:00Z'); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dCals = dailyLog.filter(l => l.date === dStr && l.isEaten !== false).reduce((s, j) => s + j.calories, 0);
      days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), calories: dCals });
    }
    return { days, avgCals: Math.round(days.reduce((s,d)=>s+d.calories,0)/7) };
  }, [dailyLog, selectedDate]);

  // Form Resets
  const resetRoutineForm = () => { setBuilderName(''); setBuilderItems([]); setBuilderAutoDays([]); setEditingRoutineId(null); };
  const resetSearchForm = () => { setSearchQuery(''); setSearchResults([]); };
  const resetQuickAddForm = () => { setQuickAddData({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '1 serving' }); };

  // Drag & Drop
  useEffect(() => {
    if (!draggingItemId) return;
    const handleTouchMove = (e) => {
      if (e.cancelable) e.preventDefault(); 
      const touch = e.touches[0];
      if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${touch.clientX - 30}px, ${touch.clientY - 30}px, 0)`;
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const meal = el?.closest('[data-meal-type]')?.getAttribute('data-meal-type');
      setDropTargetMeal(meal || null);
    };
    const handleTouchEnd = () => {
      if (draggingItemId && dropTargetMeal) {
        const item = dailyLog.find(i => i.id === draggingItemId);
        if (item) updateDB('dailyLog', item.id, { ...item, mealType: dropTargetMeal });
      }
      setDraggingItemId(null); setDropTargetMeal(null); setTouchDrag(null);
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('touchend', handleTouchEnd); document.body.style.overflow = ''; };
  }, [draggingItemId, dropTargetMeal, dailyLog]);

  const handleItemTouchStart = (e, item) => {
    if (e.target.closest('button')) return;
    const t = e.touches[0];
    initialTouch.current = { x: t.clientX, y: t.clientY };
    longPressTimeout.current = setTimeout(() => {
      setDraggingItemId(item.id); setTouchDrag({ item, initialX: t.clientX, initialY: t.clientY });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 350);
  };

  // Date Change
  const changeDate = (offset) => {
    const d = new Date(selectedDate + 'T12:00:00Z'); d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // API Call Wrapper
  const callGemini = async (prompt, systemInstruction, imageData = null, mimeType = null) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const fetchWithRetry = async (retries = 0) => {
      try {
        const parts = [{ text: prompt }];
        if (imageData) parts.push({ inlineData: { mimeType, data: imageData } });
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { responseMimeType: "application/json" } }) });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
      } catch (err) {
        if (retries < 5) { await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000)); return fetchWithRetry(retries + 1); }
        throw err;
      }
    };
    return fetchWithRetry();
  };

  // Actions
  const handleUnifiedSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    if (searchMode === 'ai') {
      setIsAiLoading(true);
      try {
        const res = await callGemini(`Estimate nutrition: "${searchQuery}"`, `Format: { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number }`);
        const parsed = JSON.parse(res.candidates[0].content.parts[0].text.replace(/```json\n?|```/g, ''));
        const newItem = { id: Date.now(), date: selectedDate, mealType: mealType, name: parsed.name, brand: 'AI ✨', calories: parsed.calories, protein: parsed.protein, carbs: parsed.carbs, fat: parsed.fat, isEaten: true, portion: '1 serving' };
        if (activeTab === 'routineBuilder') setBuilderItems([...builderItems, newItem]);
        else { updateDB('dailyLog', newItem.id, newItem); setActiveTab('log'); }
        resetSearchForm();
      } catch (e) { setAiError("AI Error"); } finally { setIsAiLoading(false); }
    } else {
      setIsLoading(true);
      const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=15`);
      const data = await res.json();
      setSearchResults(data.foods || []); setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsAiLoading(true); setAiError(null); setShowCameraMenu(false);
    try {
      const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = error => reject(error); });
      const isLabel = cameraTarget === 'label';
      const systemPrompt = isLabel ? `You are an OCR and Nutrition bot. Read this nutrition label exactly as printed. Extract the exact numbers for 1 serving. DO NOT GUESS. Format: { "name": "Scanned Food", "calories": number, "protein": number, "carbs": number, "fat": number, "portion": "string" }` : `You are a nutrition expert. Analyze the food in the image and return a JSON object with nutrition facts. Format: { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "portion": "string" }`;
      
      const data = await callGemini(isLabel ? `Extract exact nutrition facts from this label.` : `Estimate nutrition for this food.`, systemPrompt, base64, file.type);
      const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text.replace(/```json\n?|```/g, '').trim());
      const newItem = {
        id: Date.now(), date: selectedDate, mealType: mealType, name: parsed.name, brand: isLabel ? '🏷️ Scanned Label' : '📸 AI Camera ✨',
        calories: Math.round(parsed.calories || 0), protein: Math.round(parsed.protein || 0), carbs: Math.round(parsed.carbs || 0), fat: Math.round(parsed.fat || 0),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), portion: parsed.portion || '1 serving', isEaten: true
      };
      updateDB('dailyLog', newItem.id, newItem);
      if (!db) setDailyLog([newItem, ...dailyLog]);
      setActiveTab('log');
    } catch (err) { setAiError("Could not analyze image. Try a clearer photo!"); } 
    finally { setIsAiLoading(false); e.target.value = ''; }
  };

  const generateMealPlan = async () => {
    setIsGeneratingPlan(true); setAiError(null);
    try {
      const dietContext = selectedDiets.length > 0 ? `The meals MUST strictly adhere to the following dietary restrictions/regiments: ${selectedDiets.join(', ')}. ` : '';
      const data = await callGemini(`Create a 1-day meal plan hitting exactly ${userProfile.dailyGoal} calories, ${userProfile.proteinGoal}g protein, ${userProfile.carbsGoal}g carbs, ${userProfile.fatGoal}g fat. ${dietContext}Return a JSON array of exactly 4 meals. Format: [{"mealType": "Breakfast", "name": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "portion": "string"}, ...]`, "Return ONLY a JSON array.");
      const parsedMeals = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text.replace(/```json\n?|```/g, '').trim());
      parsedMeals.forEach(meal => {
        const newItem = { id: Date.now() + Math.random(), date: selectedDate, mealType: meal.mealType, name: meal.name, brand: 'AI Planned ✨', calories: Math.round(meal.calories), protein: Math.round(meal.protein), carbs: Math.round(meal.carbs), fat: Math.round(meal.fat), time: 'Planned', portion: meal.portion, isEaten: false };
        updateDB('dailyLog', newItem.id, newItem);
        if (!db) setDailyLog(prev => [newItem, ...prev]);
      });
      setActiveTab('log');
    } catch (err) { setAiError("Failed to generate meal plan."); } 
    finally { setIsGeneratingPlan(false); }
  };

  const getAiInsights = async () => {
    setIsAiLoading(true); setShowAiModal(true); setAiCoachResponse(null);
    const logSummary = filteredLogs.filter(i => i.isEaten !== false).map(i => `${i.name} (${i.calories} kcal)`).join(', ');
    try {
      const data = await callGemini(`Progress: ${totals.calories}/${userProfile.dailyGoal} kcal. Log: ${logSummary || 'Nothing logged.'}. Return JSON: { "advice": [string, string, string], "rating": string }`, "Friendly health coach.");
      setAiCoachResponse(JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text));
    } catch (err) { setAiError("Failed to get AI insights."); } 
    finally { setIsAiLoading(false); }
  };

  const handleQuickAddAction = () => {
    if (!quickAddData.name || !quickAddData.calories) return;
    const newItem = {
      id: Date.now(), date: selectedDate, mealType: mealType,
      name: quickAddData.name, brand: '⚡ Quick Add',
      calories: parseInt(quickAddData.calories) || 0, protein: parseInt(quickAddData.protein) || 0, carbs: parseInt(quickAddData.carbs) || 0, fat: parseInt(quickAddData.fat) || 0,
      portion: quickAddData.portion || '1 serving', isEaten: true
    };
    updateDB('dailyLog', newItem.id, newItem);
    setShowQuickAdd(false); resetQuickAddForm(); setActiveTab('log');
  };

  const handleAddItemAction = () => {
    if (!selectedFoodForEdit) return;
    const getNutrient = (food, id) => { const n = food.foodNutrients?.find(x => x.nutrientId === id || x.nutrientNumber === id.toString()); return n ? n.value : 0; };
    const newItem = {
      id: Date.now(), date: selectedDate, mealType: mealType,
      name: selectedFoodForEdit.description, brand: selectedFoodForEdit.brandOwner || 'Generic',
      calories: Math.round(getNutrient(selectedFoodForEdit, 1008) * quantity), protein: Math.round(getNutrient(selectedFoodForEdit, 1003) * quantity), carbs: Math.round(getNutrient(selectedFoodForEdit, 1005) * quantity), fat: Math.round(getNutrient(selectedFoodForEdit, 1004) * quantity),
      portion: selectedFoodForEdit.servingSize ? `${(selectedFoodForEdit.servingSize * quantity).toFixed(1)} ${selectedFoodForEdit.servingSizeUnit}` : `${quantity} serving(s)`
    };
    if (activeTab === 'routineBuilder') setBuilderItems([...builderItems, newItem]);
    else { updateDB('dailyLog', newItem.id, { ...newItem, isEaten: true }); setActiveTab('log'); }
    setSelectedFoodForEdit(null); resetSearchForm();
  };

  const saveRoutine = () => {
    if (!builderName.trim() || builderItems.length === 0) return;
    const newRoutine = { id: editingRoutineId || Date.now(), name: builderName, items: builderItems, autoDays: builderAutoDays };
    updateDB('routines', newRoutine.id, newRoutine);
    resetRoutineForm(); setActiveTab('routines');
  };

  const applyRoutine = (routine) => {
    routine.items.forEach(item => {
      const newItem = { ...item, id: Date.now() + Math.random(), date: selectedDate, isEaten: false, time: 'Routine' };
      updateDB('dailyLog', newItem.id, newItem);
    });
    setAppliedRoutines(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), routine.id] }));
    setActiveTab('log');
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return setAiError("Voice search not supported.");
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => setSearchQuery(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const renderProgressBar = (current, goal, label, color) => (
    <div key={label} className="mb-4">
      <div className="flex justify-between text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500 dark:text-slate-400"><span>{label}</span><span>{current} / {goal}g</span></div>
      <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2.5 overflow-hidden shadow-inner"><div className={`h-full transition-all duration-500 ease-out ${color}`} style={{ width: `${Math.min((current / goal) * 100, 100)}%` }} /></div>
    </div>
  );

  const renderMealSection = (title, Icon, type, theme = 'indigo') => {
    const items = filteredLogs.filter(i => i.mealType === type);
    const mealCals = items.reduce((s, i) => s + (i.isEaten !== false ? i.calories : 0), 0);
    const styles = { amber: 'text-amber-500 bg-amber-50/50', sky: 'text-sky-500 bg-sky-50/50', indigo: 'text-indigo-500 bg-indigo-50/50', rose: 'text-rose-500 bg-rose-50/50' };
    return (
      <div key={type} data-meal-type={type} className={`mb-6 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all ${dropTargetMeal === type ? 'bg-indigo-50 dark:bg-indigo-900/20 scale-105 border-dashed' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2"><div className={`p-2 rounded-xl ${styles[theme]} dark:bg-slate-800`}><Icon size={18} /></div><h3 className="font-bold dark:text-white">{title}</h3></div>
          <span className="text-xs font-black text-slate-400">{mealCals} kcal</span>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} onTouchStart={(e) => handleItemTouchStart(e, item)} className={`bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm ${draggingItemId === item.id ? 'opacity-0' : ''}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => updateDB('dailyLog', item.id, { ...item, isEaten: !item.isEaten })}>{item.isEaten === false ? <Circle className="text-slate-300" /> : <CheckCircle2 className="text-emerald-500" />}</button>
                <div className={item.isEaten === false ? 'opacity-40' : ''}>
                  <p className="text-sm font-bold dark:text-white leading-tight">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.portion}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-indigo-600">{item.calories}</span>
                <button onClick={() => updateDB('dailyLog', item.id, null, true)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 flex flex-col items-center p-4 overflow-hidden">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col h-[90vh] relative transition-colors duration-300">
        
        {/* Day Header */}
        <div className={`${currentTheme.bg} p-6 text-white shrink-0 relative overflow-hidden`}>
          <div className="absolute -top-6 -right-6 text-[120px] opacity-20 pointer-events-none">{currentTheme.deco}</div>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <button onClick={() => changeDate(-1)} className="p-1 hover:bg-white/10 rounded-lg"><ChevronLeft /></button>
            <h1 className="font-bold text-lg">{new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</h1>
            <button onClick={() => changeDate(1)} className="p-1 hover:bg-white/10 rounded-lg"><ChevronRight /></button>
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="text-center bg-white/20 p-4 rounded-3xl backdrop-blur-md">
              <div className="text-3xl font-black">{Math.max(userProfile.dailyGoal - totals.calories, 0)}</div>
              <div className="text-[10px] uppercase font-bold opacity-80">Remaining</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">Goal: {userProfile.dailyGoal} kcal</div>
              <button onClick={getAiInsights} className="bg-white/20 px-3 py-1 rounded-full text-[10px] mt-2 flex items-center gap-1 hover:bg-white/30"><Sparkles size={10} /> AI Coach</button>
            </div>
          </div>
        </div>

        {/* Global Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-20">
          <form onSubmit={handleUnifiedSearch} className="flex items-center gap-2">
            <div className={`relative flex-1 flex items-center rounded-2xl border transition-all overflow-hidden ${searchMode === 'ai' ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-slate-50'} dark:bg-slate-800 dark:border-slate-700`}>
              <select value={searchMode} onChange={e => setSearchMode(e.target.value)} className="bg-transparent pl-3 pr-2 py-3 text-xs font-bold appearance-none dark:text-white cursor-pointer focus:outline-none">
                <option value="ai">✨ AI</option>
                <option value="db">🔍 DB</option>
              </select>
              <SafeInput autoComplete="off" spellCheck="false" placeholder="What did you eat?" className="flex-1 bg-transparent py-3 px-2 text-sm dark:text-white focus:outline-none w-full" value={searchQuery} onChange={setSearchQuery} />
              {searchMode === 'ai' && <button type="button" onClick={startListening} className={`p-2 ${isListening ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}><Mic size={18} /></button>}
            </div>
            <button type="submit" className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={20} /></button>
          </form>
          
          <div className="flex gap-2 mt-3">
             <button onClick={() => setShowQuickAdd(true)} className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Zap size={14}/> Quick Add</button>
             <button onClick={() => { setShowCameraMenu(!showCameraMenu); setCameraTarget('meal'); }} className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Camera size={14}/> Scan Meal</button>
             <button onClick={() => { setShowCameraMenu(!showCameraMenu); setCameraTarget('label'); }} className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2"><ScanLine size={14}/> Scan Label</button>
             {showCameraMenu && <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {searchQuery && searchResults.length > 0 && searchMode === 'db' ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Search Results</div>
              {searchResults.map((food, idx) => (
                <div key={idx} onClick={() => { setSelectedFoodForEdit(food); setQuantity(1); }} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-200 cursor-pointer">
                  <div className="flex-1 mr-4"><p className="text-sm font-bold dark:text-white line-clamp-1">{food.description}</p><p className="text-[10px] text-slate-400 uppercase">{food.brandOwner || 'Generic'}</p></div>
                  <div className="text-indigo-600 font-bold text-sm">{Math.round(food.foodNutrients?.find(n => n.nutrientId === 1008)?.value || 0)} <span className="text-[8px] font-normal text-slate-400">kcal</span></div>
                </div>
              ))}
            </div>
          ) : activeTab === 'routineBuilder' ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-sm mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Routine Name</label>
                <SafeInput type="text" autoComplete="off" spellCheck="false" placeholder="e.g. Work Day Routine..." className="w-full text-lg font-bold border-b-2 border-indigo-100 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none py-2 bg-transparent dark:text-white" value={builderName} onChange={setBuilderName} />
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 mt-4">Auto-Apply Days</label>
                <div className="flex justify-between gap-1">
                  {['S','M','T','W','T','F','S'].map((day, idx) => (<button key={idx} onClick={() => setBuilderAutoDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])} className={`w-8 h-8 rounded-full text-xs font-bold ${builderAutoDays.includes(idx) ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{day}</button>))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold flex justify-between dark:text-white">Routine Items<span className="text-indigo-600">{builderItems.reduce((s,i) => s + i.calories, 0)} kcal</span></h3>
                {builderItems.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">Search above to add foods!</div> : builderItems.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div><p className="text-sm font-bold dark:text-white">{item.name}</p><p className="text-[10px] text-slate-400">{item.portion}</p></div>
                      <div className="flex items-center gap-3"><span className="text-xs font-bold text-indigo-600">{item.calories}</span><button onClick={() => setBuilderItems(builderItems.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => { resetRoutineForm(); setActiveTab('routines'); }} className="flex-1 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 dark:text-white">Cancel</button>
                <button onClick={saveRoutine} disabled={!builderName.trim() || builderItems.length === 0} className="flex-[2] py-3 rounded-xl font-bold text-white bg-indigo-600 disabled:opacity-50"><Save size={18} className="inline mr-2"/> {editingRoutineId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          ) : activeTab === 'routines' ? (
             <div className="space-y-4">
               <button onClick={() => { resetRoutineForm(); setActiveTab('routineBuilder'); }} className="w-full py-4 border-2 border-dashed border-indigo-200 text-indigo-600 font-bold rounded-2xl"><Plus size={20} className="inline mr-2"/> Create New Routine</button>
               {routines.map(routine => (
                 <div key={routine.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="font-bold dark:text-white">{routine.name}</h3>
                       <p className="text-xs text-slate-500">{routine.items.length} items • {routine.items.reduce((s,i)=>s+i.calories,0)} kcal</p>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => { setBuilderName(routine.name); setBuilderItems(routine.items); setBuilderAutoDays(routine.autoDays || []); setEditingRoutineId(routine.id); setActiveTab('routineBuilder'); }} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"><Pencil size={16}/></button>
                       <button onClick={() => updateDB('routines', routine.id, null, true)} className="p-2 bg-slate-50 dark:bg-slate-800 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                     </div>
                   </div>
                   <button onClick={() => applyRoutine(routine)} className="w-full py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 font-bold rounded-xl text-sm">Apply to Today</button>
                 </div>
               ))}
             </div>
          ) : activeTab === 'log' ? (
            <>
              {renderMealSection('Breakfast', Coffee, 'Breakfast', 'amber')}
              {renderMealSection('Lunch', Sun, 'Lunch', 'sky')}
              {renderMealSection('Dinner', Moon, 'Dinner', 'indigo')}
              {renderMealSection('Snacks', Cookie, 'Snacks', 'rose')}
            </>
          ) : activeTab === 'stats' ? (
            <div className="space-y-6">
               <section className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                 <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><Activity size={18} /> Daily Macros</h3>
                 <div className="space-y-4">
                   <div className="mb-4">
                     <div className="flex justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400"><span>Protein</span><span>{totals.protein} / {userProfile.proteinGoal}g</span></div>
                     <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-500" style={{ width: `${Math.min((totals.protein/userProfile.proteinGoal)*100, 100)}%` }} /></div>
                   </div>
                   <div className="mb-4">
                     <div className="flex justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400"><span>Carbs</span><span>{totals.carbs} / {userProfile.carbsGoal}g</span></div>
                     <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden"><div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500" style={{ width: `${Math.min((totals.carbs/userProfile.carbsGoal)*100, 100)}%` }} /></div>
                   </div>
                   <div className="mb-4">
                     <div className="flex justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400"><span>Fat</span><span>{totals.fat} / {userProfile.fatGoal}g</span></div>
                     <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${Math.min((totals.fat/userProfile.fatGoal)*100, 100)}%` }} /></div>
                   </div>
                 </div>
               </section>
               <section className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center"><label className="text-sm font-bold dark:text-white">Dark Mode</label><button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">{isDarkMode ? <Moon size={18}/> : <Sun size={18}/>}</button></div>
               </section>
            </div>
          ) : activeTab === 'plan' ? (
            <div className="space-y-6">
              <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl">
                 <h2 className="text-xl font-bold mb-2">AI Meal Planner</h2>
                 <p className="text-xs opacity-80 mb-4">Select diets and let AI plan your perfect day.</p>
                 <div className="flex flex-wrap gap-2 mb-4">
                   {(userProfile.customDiets || defaultDiets).map(d => (
                     <div key={d} onClick={() => setSelectedDiets(p => p.includes(d) ? p.filter(x=>x!==d) : [...p, d])} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${selectedDiets.includes(d) ? 'bg-white text-indigo-600 border-white' : 'border-white/30 text-white/80'}`}>{d}</div>
                   ))}
                 </div>
                 <button onClick={generateMealPlan} disabled={isGeneratingPlan} className="w-full bg-white text-indigo-600 font-bold py-3 rounded-2xl shadow-lg disabled:opacity-50 transition-all">{isGeneratingPlan ? 'Building...' : 'Generate Plan'}</button>
              </div>
            </div>
          ) : activeTab === 'trends' ? (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2"><BarChart3 size={24} className="text-indigo-600" /> 7-Day Trends</h2>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 h-64 flex items-end justify-between gap-2">
                  {weeklyTrends.days.map((day, idx) => {
                    const pct = Math.min((day.calories / userProfile.dailyGoal) * 100, 100);
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                        <div className="relative w-full flex justify-center h-full items-end">
                           <div className={`w-3/4 rounded-t-md transition-all duration-700 ${idx === 6 ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`} style={{ height: `${pct}%`, minHeight: '4px' }} />
                        </div>
                        <div className="text-[10px] font-bold mt-2 text-slate-400">{day.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl"><div className="text-[10px] font-bold text-indigo-400 uppercase">Avg Calories</div><div className="text-2xl font-black text-indigo-700">{weeklyTrends.avgCals}</div></div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Navigation */}
        <div className="shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex justify-between px-8 py-4 z-20 transition-colors duration-300">
          <button onClick={() => setActiveTab('log')} className={activeTab === 'log' ? 'text-indigo-600' : 'text-slate-400'}><Clock size={20}/></button>
          <button onClick={() => setActiveTab('routines')} className={activeTab === 'routines' || activeTab === 'routineBuilder' ? 'text-indigo-600' : 'text-slate-400'}><ListChecks size={20}/></button>
          <button onClick={() => setActiveTab('plan')} className={activeTab === 'plan' ? 'text-indigo-600' : 'text-slate-400'}><CalendarDays size={20}/></button>
          <button onClick={() => setActiveTab('trends')} className={activeTab === 'trends' ? 'text-indigo-600' : 'text-slate-400'}><BarChart3 size={20}/></button>
          <button onClick={() => setActiveTab('stats')} className={activeTab === 'stats' ? 'text-indigo-600' : 'text-slate-400'}><Scale size={20}/></button>
        </div>

        {/* Quick Add Modal */}
        {showQuickAdd && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-bold text-lg dark:text-white">Quick Add</h2>
                <button onClick={() => { setShowQuickAdd(false); resetQuickAddForm(); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={16}/></button>
              </div>
              <div className="space-y-4">
                <SafeInput type="text" placeholder="Food Name" value={quickAddData.name} onChange={v => setQuickAddData({...quickAddData, name: v})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white" />
                <div className="grid grid-cols-2 gap-3">
                  <SafeInput type="number" placeholder="Calories" value={quickAddData.calories} onChange={v => setQuickAddData({...quickAddData, calories: v})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white" />
                  <SafeInput type="number" placeholder="Protein (g)" value={quickAddData.protein} onChange={v => setQuickAddData({...quickAddData, protein: v})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white" />
                  <SafeInput type="number" placeholder="Carbs (g)" value={quickAddData.carbs} onChange={v => setQuickAddData({...quickAddData, carbs: v})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white" />
                  <SafeInput type="number" placeholder="Fat (g)" value={quickAddData.fat} onChange={v => setQuickAddData({...quickAddData, fat: v})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white" />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(type => (
                    <button key={type} onClick={() => setMealType(type)} className={`py-2 rounded-xl text-[10px] font-bold border ${mealType === type ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>{type}</button>
                  ))}
                </div>
                <button onClick={handleQuickAddAction} disabled={!quickAddData.name || !quickAddData.calories} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold mt-4 disabled:opacity-50">Add Custom Food</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Food Modal */}
        {selectedFoodForEdit && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center p-4">
             <div className="bg-white dark:bg-slate-900 w-full rounded-3xl p-6 shadow-2xl">
               <div className="flex justify-between items-start mb-4">
                 <div><h2 className="font-bold text-lg dark:text-white line-clamp-1">{selectedFoodForEdit.description}</h2></div>
                 <button onClick={() => setSelectedFoodForEdit(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={16}/></button>
               </div>
               <div className="space-y-6">
                 <div className="grid grid-cols-4 gap-2">{['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(type => (<button key={type} onClick={() => setMealType(type)} className={`py-2 rounded-xl text-[10px] font-bold border ${mealType === type ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>{type}</button>))}</div>
                 <div>
                   <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-slate-400">Servings</label><span className="text-lg font-bold text-indigo-600">{quantity}x</span></div>
                   <input type="range" min="0.25" max="5" step="0.25" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                 </div>
                 <button onClick={handleAddItemAction} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold">Add to {activeTab === 'routineBuilder' ? 'Routine' : 'Log'}</button>
               </div>
             </div>
          </div>
        )}

        {/* AI Insight Modal */}
        {showAiModal && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 w-full rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-indigo-600 p-4 text-white flex justify-between"><h3 className="font-bold">✨ AI Coach</h3><button onClick={() => setShowAiModal(false)}><X size={20} /></button></div>
              <div className="p-6">
                {isAiLoading ? <p className="text-center">Analyzing data...</p> : aiCoachResponse ? (
                  <div className="space-y-4">
                    <div className="text-center font-bold text-indigo-600 bg-indigo-50 rounded-full py-1">{aiCoachResponse.rating}</div>
                    {aiCoachResponse.advice.map((tip, i) => <div key={i} className="text-sm dark:text-white bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">{tip}</div>)}
                  </div>
                ) : <p className="text-center text-red-500">{aiError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Drag Ghost Overlay */}
        {touchDrag && (
          <div ref={ghostRef} className="fixed top-0 left-0 z-[100] bg-white dark:bg-slate-800 p-4 rounded-3xl border-2 border-indigo-500 shadow-2xl w-64 opacity-95 pointer-events-none will-change-transform" style={{ transform: `translate3d(${touchDrag.initialX-30}px, ${touchDrag.initialY-30}px, 0)` }}>
            <p className="text-sm font-bold dark:text-white truncate">{touchDrag.item.name}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase">{touchDrag.item.calories} kcal</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;