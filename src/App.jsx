import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Search, Plus, Trash2, ChevronRight, ChevronLeft, ChevronDown, X,
  Clock, CalendarDays, ListChecks, CheckCircle2, Circle, Save, Pencil,
  Loader2, TrendingUp, Target, Settings, Sparkle, Sun, Moon, AlertCircle, 
  Scale, Droplets, RefreshCw
} from 'lucide-react';

// --- Configuration ---
const APP_ID = 'calorie-tracker-v1';

// AZURE DEPLOYMENT: Replace these strings with your import.meta.env variables before deploying to GitHub
const USDA_API_KEY = 'lkRdpKqn24LgJ3oDTYpLyXyQH7elck6d4GTiOR9Q'; 
const apiKey = ""; 

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); }

// --- Aesthetic Theme Engine ---
const COLORS = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-900/30', ring: 'ring-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/50', shadow: 'shadow-emerald-900/20' },
  sky: { bg: 'bg-sky-500', text: 'text-sky-500', bgLight: 'bg-sky-50', bgDark: 'dark:bg-sky-900/30', ring: 'ring-sky-500', border: 'border-sky-200 dark:border-sky-800/50', shadow: 'shadow-sky-900/20' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', bgLight: 'bg-orange-50', bgDark: 'dark:bg-orange-900/30', ring: 'ring-orange-500', border: 'border-orange-200 dark:border-orange-800/50', shadow: 'shadow-orange-900/20' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', bgLight: 'bg-indigo-50', bgDark: 'dark:bg-indigo-900/30', ring: 'ring-indigo-500', border: 'border-indigo-200 dark:border-indigo-800/50', shadow: 'shadow-indigo-900/20' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-900/30', ring: 'ring-rose-500', border: 'border-rose-200 dark:border-rose-800/50', shadow: 'shadow-rose-900/20' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-500', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/30', ring: 'ring-amber-500', border: 'border-amber-200 dark:border-amber-800/50', shadow: 'shadow-amber-900/20' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/30', ring: 'ring-blue-500', border: 'border-blue-200 dark:border-blue-800/50', shadow: 'shadow-blue-900/20' }
};

const getThemeForDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00Z');
  const m = d.getMonth() + 1; 
  const day = d.getDate();

  if (m === 12 && day >= 20) return { img: 'https://images.unsplash.com/photo-1512389142860-9c281c678a85?auto=format&fit=crop&w=800&q=80', color: COLORS.rose }; // Christmas
  if (m === 10 && day >= 24) return { img: 'https://images.unsplash.com/photo-1508344928928-7137b29de216?auto=format&fit=crop&w=800&q=80', color: COLORS.amber }; // Halloween
  if (m === 2 && day >= 10 && day <= 14) return { img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80', color: COLORS.rose }; // Valentines
  if (m === 7 && day >= 1 && day <= 4) return { img: 'https://images.unsplash.com/photo-1531366936336-1e64df2ec2e0?auto=format&fit=crop&w=800&q=80', color: COLORS.blue }; // Independence

  if (m >= 3 && m <= 5) return { img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80', color: COLORS.emerald }; // Spring
  if (m >= 6 && m <= 8) return { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', color: COLORS.sky }; // Summer
  if (m >= 9 && m <= 11) return { img: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=80', color: COLORS.orange }; // Autumn
  return { img: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=800&q=80', color: COLORS.indigo }; // Winter
};

// --- Ultimate Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle size={48} className="text-rose-500 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Oops, something hitched!</h1>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- SafeInput ---
const SafeInput = ({ value, onChange, ...props }) => {
  const [localVal, setLocalVal] = useState(value !== undefined && value !== null ? String(value) : '');
  useEffect(() => { setLocalVal(value !== undefined && value !== null ? String(value) : ''); }, [value]);
  return (
    <input 
      value={localVal} 
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={() => { if (localVal !== String(value)) onChange(localVal); }}
      className={`focus:outline-none transition-all ${props.className}`}
      {...props} 
    />
  );
};

const TrackerApp = () => {
  // Navigation & UI
  const [activeTab, setActiveTab] = useState('log'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [viewingHistoryDetail, setViewingHistoryDetail] = useState(null);
  
  // Theme Management
  const currentTheme = useMemo(() => getThemeForDate(selectedDate), [selectedDate]);
  const th = currentTheme.color; 
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem(`${APP_ID}_theme`); if (saved) setIsDarkMode(saved === 'true'); } catch(e) {}
  }, []);
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    try { localStorage.setItem(`${APP_ID}_theme`, newTheme); } catch(e) {}
  };

  // Search & USDA
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('db'); 
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [mealType, setMealType] = useState('Breakfast');
  const [customCalories, setCustomCalories] = useState('');

  // Routine Builder
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [builderName, setBuilderName] = useState('');
  const [builderDays, setBuilderDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [builderItems, setBuilderItems] = useState([]);

  // Data State
  const defaultProfile = { 
    dailyGoal: 2000, proteinGoal: 150, carbsGoal: 250, fatGoal: 65,
    currentWeight: 150, targetWeight: 140, waterGoal: 80, units: 'lbs'
  };
  const [user, setUser] = useState(null);
  const [dailyLog, setDailyLog] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [userProfile, setUserProfile] = useState(defaultProfile);

  // --- USDA API Search ---
  const searchUSDA = async (query) => {
    if (!query || query.length < 3) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=8`);
      const data = await response.json();
      const results = (data.foods || []).map(f => {
        const getNut = (id) => f.foodNutrients?.find(n => n.nutrientId === id || n.nutrientNumber === id.toString())?.value || 0;
        return {
          id: f.fdcId.toString() + Math.floor(Math.random() * 1000),
          name: f.description,
          brand: f.brandOwner,
          calories: Math.round(getNut(208) || getNut(1008)),
          protein: Math.round(getNut(203)),
          carbs: Math.round(getNut(205)),
          fat: Math.round(getNut(204)),
          portion: f.servingSize ? `${f.servingSize}${f.servingSizeUnit}` : '1 serving'
        };
      });
      setSearchResults(results);
    } catch (e) { console.error(e); } finally { setIsSearching(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (searchMode === 'db' && searchQuery.length > 2) searchUSDA(searchQuery); }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMode]);

  // --- Sync Logic & Optimistic Updates ---
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, u => { if (u) setUser(u); else signInAnonymously(auth).catch(() => {}); });
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const path = (c) => collection(db, 'artifacts', APP_ID, 'users', user.uid, c);
    const unsubs = [
      onSnapshot(path('dailyLog'), s => setDailyLog(s.docs.map(d => ({...d.data(), id: d.id})))),
      onSnapshot(path('routines'), s => setRoutines(s.docs.map(d => ({...d.data(), id: d.id})))),
      onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), ds => { if (ds.exists()) setUserProfile({...defaultProfile, ...ds.data()}); })
    ];
    return () => unsubs.forEach(u => typeof u === 'function' && u());
  }, [user]);

  const updateDB = async (c, id, data, isDel = false) => {
    if (c === 'dailyLog') setDailyLog(prev => isDel ? prev.filter(i => i.id !== id) : [...prev.filter(i => i.id !== id), data]);
    else if (c === 'routines') setRoutines(prev => isDel ? prev.filter(i => i.id !== id) : [...prev.filter(i => i.id !== id), data]);
    else if (c === 'profile') setUserProfile(data);

    if (!db || !user) return;
    const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, c, id.toString());
    try { if (isDel) await deleteDoc(ref); else await setDoc(ref, data); } 
    catch(e) { console.warn("Remote sync delayed", e); }
  };

  const handleProfileUpdate = (key, val, isString = false) => {
    const parsedVal = isString ? val : (val === '' ? '' : Number(val));
    updateDB('profile', 'main', { ...userProfile, [key]: parsedVal });
  };

  // --- Calculations ---
  const safeDailyGoal = Math.max(Number(userProfile?.dailyGoal) || 2000, 1);
  const totals = useMemo(() => {
    return (dailyLog || []).filter(i => i.date === selectedDate && i.isEaten !== false).reduce((acc, i) => {
      acc.calories += (Number(i.calories) || 0); acc.protein += (Number(i.protein) || 0); acc.carbs += (Number(i.carbs) || 0); acc.fat += (Number(i.fat) || 0);
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [dailyLog, selectedDate]);

  const todayRoutines = useMemo(() => {
    const dayName = new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
    return (routines || []).filter(r => r?.days?.includes(dayName));
  }, [routines, selectedDate]);

  // --- Actions ---
  const handleAddItem = (foodItem) => {
    if (isBuilding) {
      setBuilderItems([...(builderItems || []), { ...foodItem, id: Date.now().toString() + Math.floor(Math.random()*1000), mealType }]);
    } else {
      const uniqueId = Date.now().toString() + Math.floor(Math.random()*1000);
      updateDB('dailyLog', uniqueId, { ...foodItem, id: uniqueId, date: selectedDate, mealType, isEaten: true });
    }
    setSearchResults([]);
    setSearchQuery('');
    setCustomCalories('');
  };

  const handleApplyRoutine = (routine) => {
    (routine?.items || []).forEach(item => {
      const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000);
      updateDB('dailyLog', uniqueId, { ...item, id: uniqueId, date: selectedDate, isEaten: true, routineId: routine.id });
    });
  };

  const handleRemoveRoutine = (routineId) => {
    const itemsToRemove = (dailyLog || []).filter(log => log.date === selectedDate && log.routineId === routineId);
    itemsToRemove.forEach(item => updateDB('dailyLog', item.id, null, true));
  };

  const saveRoutine = () => {
    if (!builderName) return;
    const id = editingRoutineId || Date.now().toString();
    updateDB('routines', id, { id, name: builderName, items: builderItems, days: builderDays });
    setIsBuilding(false);
    setBuilderName('');
    setBuilderItems([]);
    setEditingRoutineId(null);
  };

  // --- Unified Search UI Render Function ---
  const renderSearchEngineUI = () => (
    <div className="space-y-3">
      <div className={`relative flex items-center rounded-[24px] border-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm ${th.border} focus-within:${th.ring} transition-all shadow-sm`}>
        <button onClick={() => { setSearchMode(searchMode === 'ai' ? 'db' : 'ai'); setSearchResults([]); }} className={`pl-5 pr-2 py-4 text-[10px] font-black ${th.text} uppercase tracking-widest`}>
          {searchMode === 'ai' ? '✨ AI' : '🔍 DB'}
        </button>
        <input placeholder={searchMode === 'db' ? "Search USDA Database..." : "Custom food name..."} className="flex-1 bg-transparent py-4 px-2 text-sm font-medium dark:text-white focus:outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {isSearching && <Loader2 className={`animate-spin ${th.text} mr-5`} size={20} />}
      </div>

      {(searchResults.length > 0 || (searchQuery.length > 2 && searchMode === 'ai')) && (
        <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] border ${th.border} p-2 shadow-2xl space-y-1 animate-in slide-in-from-top-4 relative z-20`}>
          <div className="flex gap-1 p-1 mb-2">
             {['Breakfast','Lunch','Dinner','Snacks'].map(m => <button key={m} onClick={() => setMealType(m)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${mealType === m ? `${th.bg} text-white shadow-md` : `text-slate-500 bg-slate-100 dark:bg-slate-800 hover:${th.bgLight}`}`}>{m}</button>)}
          </div>
          
          {searchResults.map(f => (
            <button key={f.id} onClick={() => handleAddItem(f)} className={`w-full text-left p-4 hover:${th.bgLight} rounded-2xl flex justify-between items-center transition-colors`}>
              <div className="flex-1 mr-4 overflow-hidden"><p className="text-xs font-bold dark:text-white truncate">{f.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase truncate">{f.brand || 'USDA'}</p></div>
              <div className={`text-right ${th.text} font-black text-xs whitespace-nowrap ${th.bgLight} px-3 py-1.5 rounded-xl`}>{f.calories} kcal</div>
            </button>
          ))}

          <div className={`p-3 ${th.bgLight} rounded-2xl mt-2 border ${th.border}`}>
             <p className={`text-[10px] font-black ${th.text} uppercase tracking-widest mb-2 px-1 opacity-70`}>Or Add Custom Entry</p>
             <div className="flex gap-2">
               <input type="number" placeholder="Calories" value={customCalories} onChange={e => setCustomCalories(e.target.value)} className="w-24 bg-white dark:bg-slate-800 p-3 rounded-xl text-xs font-bold dark:text-white text-center focus:outline-none shadow-sm" />
               <button onClick={() => { if(searchQuery && customCalories) handleAddItem({ name: searchQuery, calories: Number(customCalories), protein: 0, carbs: 0, fat: 0, portion: '1 custom serving' }); }} className={`flex-1 ${th.bg} text-white font-black text-xs uppercase rounded-xl shadow-md active:scale-95 transition-transform`}>Add Custom</button>
             </div>
          </div>
          <button onClick={() => { setSearchResults([]); setSearchQuery(''); setCustomCalories(''); }} className="w-full py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2 hover:text-rose-400 transition-colors">Close Search</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen font-sans flex flex-col items-center bg-slate-900 transition-colors duration-1000">
      
      {/* --- AESTHETIC APP CONTAINER --- */}
      <div 
        className="w-full max-w-md h-screen flex flex-col relative overflow-hidden bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${currentTheme.img})` }}
      >
        <div className={`absolute inset-0 transition-colors duration-1000 ${isDarkMode ? 'bg-black/60' : 'bg-black/20'}`}></div>

        {/* --- GLOBAL HEADER --- */}
        {!isBuilding && (
          <div className="p-6 pb-12 text-white shrink-0 relative z-10">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => { const d = new Date(selectedDate+'T12:00:00Z'); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"><ChevronLeft /></button>
              <button onClick={() => { setIsDatePickerOpen(true); setPickerMonth(new Date(selectedDate + 'T12:00:00Z')); }} className="flex items-center gap-2 group px-4 py-2 hover:bg-white/10 rounded-2xl backdrop-blur-sm transition-all">
                <h1 className="font-black text-xl tracking-tight drop-shadow-md">{new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</h1>
                <ChevronDown size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
              <button onClick={() => { const d = new Date(selectedDate+'T12:00:00Z'); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"><ChevronRight /></button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="bg-white/15 p-6 rounded-[32px] backdrop-blur-xl border border-white/30 text-center min-w-[120px] shadow-2xl">
                <div className="text-4xl font-black drop-shadow-md">{Math.max(safeDailyGoal - totals.calories, 0)}</div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 mt-1">Remaining</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-end drop-shadow-sm"><p className="text-xs font-bold opacity-90 uppercase tracking-widest">Intake: {totals.calories}</p><p className="text-[10px] opacity-80">Goal: {safeDailyGoal}</p></div>
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden border border-white/30 shadow-inner"><div className={`h-full ${th.bg} transition-all duration-1000 ease-out`} style={{ width: `${Math.min((totals.calories / safeDailyGoal) * 100, 100)}%` }}></div></div>
              </div>
            </div>
          </div>
        )}

        {/* --- GLOBAL DATE PICKER MODAL --- */}
        {isDatePickerOpen && (
          <div className="absolute inset-0 z-[60] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl w-full rounded-[40px] shadow-2xl p-6 space-y-4 border border-white/20 dark:border-slate-700/50">
               <div className="flex justify-between items-center px-2">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest">{pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-2"><ChevronLeft size={18} className="dark:text-white"/></button>
                    <button onClick={() => setPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-2"><ChevronRight size={18} className="dark:text-white"/></button>
                  </div>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400">
                  {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-1.5">
                  {(() => {
                    const year = pickerMonth.getFullYear(), m = pickerMonth.getMonth();
                    const days = [], first = new Date(year, m, 1).getDay(), total = new Date(year, m+1, 0).getDate();
                    for(let i=0; i<first; i++) days.push(null);
                    for(let i=1; i<=total; i++) days.push({day: i, date: `${year}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`});
                    return days;
                  })().map((d, i) => {
                    if (!d) return <div key={`empty-${i}`}></div>;
                    
                    const isToday = d.date === new Date().toISOString().split('T')[0];
                    const isSelected = selectedDate === d.date;
                    
                    let btnClasses = 'aspect-square rounded-xl text-xs font-black flex items-center justify-center transition-all active:scale-90 ';
                    if (isSelected) {
                        btnClasses += `${th.bg} text-white shadow-lg shadow-black/20 `;
                    } else {
                        btnClasses += 'bg-slate-100/50 dark:bg-slate-800/50 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 ';
                    }
                    if (isToday && !isSelected) {
                        btnClasses += `ring-2 ${th.ring} ring-offset-1 dark:ring-offset-slate-900 `;
                    }

                    return (
                      <button key={d.date} onClick={() => { setSelectedDate(d.date); setIsDatePickerOpen(false); }} className={btnClasses}>
                        {d.day}
                      </button>
                    );
                  })}
               </div>
               <div className="flex gap-2 pt-2">
                  <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setIsDatePickerOpen(false); }} className={`flex-1 py-4 ${th.bgLight} ${th.text} rounded-2xl font-black text-xs uppercase tracking-widest transition-colors`}>Today</button>
                  <button onClick={() => setIsDatePickerOpen(false)} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors">Cancel</button>
               </div>
            </div>
          </div>
        )}

        {/* --- DYNAMIC TAB CONTENT --- */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar transition-colors duration-1000 relative z-10 rounded-t-[40px] border-t border-white/40 dark:border-slate-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isDarkMode ? 'bg-slate-950/85 backdrop-blur-2xl' : 'bg-white/85 backdrop-blur-2xl'}`}>
          
          {isBuilding ? (
            /* BUILDER UI */
            <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-10">
              <div className="flex justify-between items-center"><h2 className="text-2xl font-black dark:text-white">Routine Builder</h2><button onClick={() => setIsBuilding(false)} className="p-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full text-slate-500 hover:text-rose-500 transition-colors"><X size={20}/></button></div>
              
              <input placeholder="Name Your Routine..." className="w-full p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 dark:text-white font-black text-lg border border-white/20 dark:border-slate-700/50 focus:outline-none" value={builderName} onChange={e => setBuilderName(e.target.value)} />
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Repeat Weekly On</p>
                <div className="flex justify-between gap-1 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-[24px] border border-white/20 dark:border-slate-700/50">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                    <button key={day} onClick={() => setBuilderDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${builderDays.includes(day) ? `${th.bg} text-white shadow-md` : 'text-slate-500'}`}>{day}</button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-3">Add Foods to Routine</p>
                {renderSearchEngineUI()}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{(builderItems || []).length} Planned Items</p>
                {(builderItems || []).map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-white/20 dark:border-slate-700/50">
                    <div><p className="text-sm font-bold dark:text-white">{item.name}</p><p className={`text-[10px] ${th.text} font-bold uppercase tracking-widest`}>{item.mealType} • {item.calories} kcal</p></div>
                    <button onClick={() => setBuilderItems(builderItems.filter(i => i.id !== item.id))} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={18}/></button>
                  </div>
                ))}
              </div>
              <button onClick={saveRoutine} className={`w-full py-5 ${th.bg} text-white rounded-3xl font-black text-lg shadow-xl ${th.shadow} flex items-center justify-center gap-3 transition-transform active:scale-95`}><Save /> Save Routine</button>
            </div>
            
          ) : activeTab === 'log' ? (
            /* DAILY LOG TAB */
            <div className="space-y-6 animate-in fade-in pb-6">
              {renderSearchEngineUI()}

              {todayRoutines.length > 0 && (dailyLog || []).filter(i => i.date === selectedDate).length === 0 && (
                <div className={`${th.bgLight} p-5 rounded-[32px] border ${th.border} flex items-center justify-between group shadow-sm`}>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><Sparkle size={18} className={`${th.text} animate-pulse`} /></div>
                    <div><p className={`text-[10px] font-black ${th.text} uppercase tracking-widest opacity-80`}>Scheduled Today</p><h4 className="text-sm font-bold dark:text-white">{todayRoutines[0]?.name}</h4></div>
                  </div>
                  <button onClick={() => handleApplyRoutine(todayRoutines[0])} className={`px-5 py-2 ${th.bg} text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform`}>Apply All</button>
                </div>
              )}

              {/* Meal Sections */}
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
                <div key={m} className="space-y-3">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${th.bg} shadow-md`}></div>{m}</h3>
                  <div className="space-y-2">
                    {(dailyLog || []).filter(i => i.date === selectedDate && i.mealType === m).map(item => (
                      <div key={item.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-4 rounded-[32px] flex justify-between items-center shadow-sm border border-white/40 dark:border-slate-700/50 transition-all">
                        <div className="flex items-center gap-4">
                          <button onClick={() => updateDB('dailyLog', item.id, { ...item, isEaten: !item.isEaten })} className="transition-transform active:scale-75">
                            {item.isEaten !== false ? <CheckCircle2 className={th.text} size={24} /> : <Circle className="text-slate-300 dark:text-slate-600" size={24} />}
                          </button>
                          <div className={item.isEaten === false ? 'opacity-40 line-through' : ''}>
                            <p className="text-sm font-bold dark:text-white">{item.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{item.calories} kcal</p>
                          </div>
                        </div>
                        <button onClick={() => updateDB('dailyLog', item.id, null, true)} className="p-2 text-slate-300 hover:text-rose-400 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    ))}
                    {(dailyLog || []).filter(i => i.date === selectedDate && i.mealType === m).length === 0 && (
                      <p className="text-[10px] font-bold text-slate-400/70 dark:text-slate-600 uppercase tracking-widest italic py-2 pl-4">Empty</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
          ) : activeTab === 'routines' ? (
            /* ROUTINES TAB */
            <div className="space-y-4 animate-in fade-in pb-6">
              <button onClick={() => { setIsBuilding(true); setEditingRoutineId(null); setBuilderName(''); setBuilderItems([]); setSearchQuery(''); setSearchResults([]); setCustomCalories(''); }} className={`w-full py-5 border-2 border-dashed ${th.border} ${th.text} rounded-[32px] font-black tracking-wide text-sm flex items-center justify-center gap-3 hover:${th.bgLight} transition-colors`}>
                <div className="p-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><Plus size={18}/></div> Create New Routine
              </button>
              
              {(routines || []).length === 0 && (
                <div className="text-center py-12 px-6 border border-white/20 dark:border-slate-800/50 rounded-[40px] bg-white/30 dark:bg-slate-900/30">
                  <p className="text-slate-500 text-sm font-bold">No routines yet.</p>
                  <p className="text-slate-400 text-xs mt-2">Create one to quickly log repeated meals!</p>
                </div>
              )}

              {(routines || []).map(r => {
                if (!r) return null;
                const isApplied = (dailyLog || []).some(log => log.date === selectedDate && log.routineId === r.id);
                return (
                  <div key={r.id} className="p-6 bg-white/60 dark:bg-slate-900/60 rounded-[40px] border border-white/40 dark:border-slate-700/50 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-lg dark:text-white leading-tight">{r.name || 'Untitled Routine'}</h4>
                        <div className="flex gap-1.5 mt-2">
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d} className={`text-[8px] font-black uppercase ${r.days?.includes(d) ? th.text : 'text-slate-400 dark:text-slate-600'}`}>{d}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-2 border-y border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex-1 text-center border-r border-slate-200/50 dark:border-slate-700/50"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Energy</p><p className={`text-sm font-black ${th.text}`}>{(r.items || []).reduce((s,i)=>s+Number(i.calories), 0)} kcal</p></div>
                      <div className="flex-1 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Items</p><p className="text-sm font-black dark:text-white">{(r.items || []).length}</p></div>
                    </div>
                    <div className="flex gap-2">
                      {isApplied ? (
                        <button onClick={() => handleRemoveRoutine(r.id)} className="flex-1 py-3 bg-rose-50 text-rose-600 dark:bg-rose-900/30 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95"><X size={16}/> Remove</button>
                      ) : (
                        <button onClick={() => handleApplyRoutine(r)} className={`flex-1 py-3 ${th.bgLight} ${th.text} rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95`}><CheckCircle2 size={16}/> Apply</button>
                      )}
                      <button onClick={() => { setEditingRoutineId(r.id); setBuilderName(r.name || ''); setBuilderItems(r.items || []); setBuilderDays(r.days || []); setSearchQuery(''); setSearchResults([]); setIsBuilding(true); }} className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"><Pencil size={18}/></button>
                      <button onClick={() => updateDB('routines', r.id, null, true)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm"><Trash2 size={18}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
            
          ) : activeTab === 'plan' ? (
            /* HISTORY TAB */
            <div className="space-y-6 animate-in fade-in pb-6">
              <div className="flex items-center gap-3"><CalendarDays className={th.text} size={24} /><h3 className="font-black text-xl dark:text-white tracking-tight">Activity Log</h3></div>
              
              <div className="bg-white/60 dark:bg-slate-900/60 p-5 rounded-[40px] border border-white/40 dark:border-slate-700/50 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                   <h3 className="font-black text-sm uppercase tracking-widest text-slate-600 dark:text-slate-300">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                   <div className="flex gap-1">
                     <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><ChevronLeft size={14} className="dark:text-white"/></button>
                     <button onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><ChevronRight size={14} className="dark:text-white"/></button>
                   </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2.5">
                  {(() => {
                    const year = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
                    const days = [], first = new Date(year, m, 1).getDay(), total = new Date(year, m+1, 0).getDate();
                    for(let i=0; i<first; i++) days.push(null);
                    for(let i=1; i<=total; i++) {
                      const dStr = `${year}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                      const cal = (dailyLog || []).filter(l => l.date === dStr && l.isEaten !== false).reduce((s,x)=>s+(Number(x.calories)||0),0);
                      days.push({ day: i, date: dStr, total: cal });
                    }
                    return days;
                  })().map((d, i) => {
                    if (!d) return <div key={`empty-${i}`}></div>;
                    
                    const isToday = d.date === new Date().toISOString().split('T')[0];
                    const isSelected = viewingHistoryDetail === d.date;
                    const hasData = d.total > 0;
                    const isOver = d.total > safeDailyGoal;

                    let baseBg = 'bg-white/50 dark:bg-slate-800/30';
                    let baseText = 'text-slate-500 dark:text-white';
                    let border = 'border border-transparent dark:border-slate-700/50';

                    if (hasData) {
                      if (isOver) {
                        baseBg = 'bg-rose-100 dark:bg-rose-500/30';
                        baseText = 'text-rose-600 dark:text-white';
                        border = 'border border-rose-200 dark:border-rose-400/50';
                      } else {
                        baseBg = `${th.bgLight}`;
                        baseText = `${th.text} dark:text-white`;
                        border = `border ${th.border}`;
                      }
                    }

                    let ringClass = '';
                    if (isSelected) ringClass = `ring-2 ${th.ring} ring-offset-2 dark:ring-offset-slate-900 z-10`;
                    else if (isToday) ringClass = 'ring-2 ring-emerald-400 dark:ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 z-10';

                    return (
                      <button key={d.date} onClick={() => setViewingHistoryDetail(d.date)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 shadow-sm ${baseBg} ${baseText} ${border} ${ringClass}`}>
                        <span className="text-[12px] font-black">{d.day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* History Detail Overlay */}
              {viewingHistoryDetail && (
                <div className={`p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-2 ${th.border} rounded-[40px] animate-in slide-in-from-top-4 shadow-xl`}>
                   <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-700/50 pb-4 mb-4">
                     <h4 className="font-black text-xs uppercase tracking-[0.2em] dark:text-white">{new Date(viewingHistoryDetail + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</h4>
                     <button onClick={() => setViewingHistoryDetail(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm"><X size={16}/></button>
                   </div>
                   <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                     {(dailyLog || []).filter(l => l.date === viewingHistoryDetail).map(item => (
                       <div key={item.id} className="flex justify-between items-center p-4 bg-white/90 dark:bg-slate-800/90 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700/50">
                         <span className="text-xs font-bold dark:text-white truncate mr-4">{item.name}</span>
                         <span className={`text-xs font-black ${th.text} whitespace-nowrap`}>{item.calories} kcal</span>
                       </div>
                     ))}
                     {(dailyLog || []).filter(l => l.date === viewingHistoryDetail).length === 0 && <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest py-6">No food logged</p>}
                   </div>
                </div>
              )}
            </div>
            
          ) : (
            /* SETTINGS TAB */
            <div className="space-y-6 animate-in fade-in pb-6">
               <div className="flex items-center gap-3"><Settings className={th.text} size={24} /><h3 className="font-black text-xl dark:text-white tracking-tight">App Settings</h3></div>

               {/* Nutrition Profile */}
               <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-6 rounded-[32px] border border-white/40 dark:border-slate-700/50 space-y-6 shadow-sm">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2"><Target size={14}/> Nutrition Targets</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1 block text-center">Daily Calorie Goal</label>
                    <SafeInput type="number" className={`w-full p-4 bg-white dark:bg-slate-800 rounded-2xl dark:text-white font-black text-2xl text-center shadow-sm border border-slate-100 dark:border-slate-700 focus:border-transparent focus:ring-2 ${th.ring}`} value={userProfile?.dailyGoal ?? 2000} onChange={v => handleProfileUpdate('dailyGoal', v)} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: 'Protein (g)', k: 'proteinGoal', c: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', def: 150 },
                      { l: 'Carbs (g)', k: 'carbsGoal', c: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', def: 250 },
                      { l: 'Fat (g)', k: 'fatGoal', c: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', def: 65 }
                    ].map(g => (
                      <div key={g.k} className="space-y-2">
                        <label className={`text-[9px] font-black uppercase text-center block ${g.c}`}>{g.l}</label>
                        <SafeInput type="number" className={`w-full p-3 ${g.bg} rounded-xl dark:text-white font-black text-center shadow-sm border border-white/50 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-300`} value={userProfile?.[g.k] ?? g.def} onChange={v => handleProfileUpdate(g.k, v)} />
                      </div>
                    ))}
                  </div>
               </div>

               {/* Personal Metrics */}
               <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-6 rounded-[32px] border border-white/40 dark:border-slate-700/50 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2"><Scale size={14}/> Body Metrics</h4>
                    <button onClick={() => handleProfileUpdate('units', userProfile?.units === 'kg' ? 'lbs' : 'kg', true)} className="text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg transition-transform active:scale-95"><RefreshCw size={10}/> Switch Units</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-center block text-slate-400 tracking-widest">Current ({userProfile?.units || 'lbs'})</label>
                        <SafeInput type="number" className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-black text-center shadow-sm border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300" value={userProfile?.currentWeight ?? 150} onChange={v => handleProfileUpdate('currentWeight', v)} />
                     </div>
                     <div className="space-y-2">
                        <label className={`text-[9px] font-black uppercase text-center block ${th.text} tracking-widest`}>Goal ({userProfile?.units || 'lbs'})</label>
                        <SafeInput type="number" className={`w-full p-3 ${th.bgLight} rounded-xl dark:text-white font-black text-center shadow-sm border border-white/50 dark:border-transparent focus:outline-none focus:ring-2 ${th.ring}`} value={userProfile?.targetWeight ?? 140} onChange={v => handleProfileUpdate('targetWeight', v)} />
                     </div>
                  </div>
                  
                  <div className="pt-2 border-t border-white/40 dark:border-slate-700/50 mt-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 flex items-center gap-2 justify-center"><Droplets size={12} className="text-blue-500"/> Daily Water Goal (oz)</label>
                    <SafeInput type="number" className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl dark:text-white font-black text-xl text-center shadow-sm border border-blue-100 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300" value={userProfile?.waterGoal ?? 80} onChange={v => handleProfileUpdate('waterGoal', v)} />
                  </div>
               </div>

               {/* Preferences */}
               <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-6 rounded-[32px] border border-white/40 dark:border-slate-700/50 space-y-4 shadow-sm">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2"><Settings size={14}/> Preferences</h4>
                  
                  <button onClick={toggleTheme} className="w-full py-4 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-600 dark:text-slate-300 transition-transform active:scale-95 shadow-sm border border-slate-100 dark:border-slate-700">
                    {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className={th.text} />}
                    {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* --- GLOBAL NAVIGATION (Frosted Pane) --- */}
        {!isBuilding && (
          <div className={`shrink-0 border-t border-white/40 dark:border-slate-700/50 flex justify-around py-5 pb-9 sm:pb-5 transition-all relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${isDarkMode ? 'bg-slate-950/85 backdrop-blur-2xl' : 'bg-white/85 backdrop-blur-2xl'}`}>
            <button onClick={() => setActiveTab('log')} className={activeTab === 'log' ? `${th.text} scale-125` : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}><Clock size={24} strokeWidth={activeTab === 'log' ? 3 : 2}/></button>
            <button onClick={() => setActiveTab('routines')} className={activeTab === 'routines' ? `${th.text} scale-125` : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}><ListChecks size={24} strokeWidth={activeTab === 'routines' ? 3 : 2}/></button>
            <button onClick={() => { setActiveTab('plan'); setViewingHistoryDetail(null); }} className={activeTab === 'plan' ? `${th.text} scale-125` : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}><CalendarDays size={24} strokeWidth={activeTab === 'plan' ? 3 : 2}/></button>
            <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? `${th.text} scale-125` : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}><Settings size={24} strokeWidth={activeTab === 'settings' ? 3 : 2}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <TrackerApp />
  </ErrorBoundary>
);

export default App;
