import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Search, Plus, Trash2, ChevronRight, ChevronLeft, ChevronDown, X,
  Clock, CalendarDays, ListChecks, CheckCircle2, Circle, Save, Pencil,
  Loader2, Target, Settings, Sparkle, Sun, Moon, AlertCircle, 
  Scale, Droplets, RefreshCw, Trophy, Medal, Flame, LogOut
} from 'lucide-react';

// --- Configuration ---
const APP_ID = 'calorie-tracker-v1';
const USDA_API_KEY = 'lkRdpKqn24LgJ3oDTYpLyXyQH7elck6d4GTiOR9Q'; 

const firebaseConfig = {
  apiKey: "AIzaSyBSYiydcnxEeT0JG4TRDNPVoDKRgi5u2vs",
  authDomain: "calorie-tracker-60896.firebaseapp.com",
  projectId: "calorie-tracker-60896",
  storageBucket: "calorie-tracker-60896.firebasestorage.app",
  messagingSenderId: "1061772404332",
  appId: "1:1061772404332:web:a209695d117146cf52da49",
  measurementId: "G-L81H28LXG1"
};

// --- Firebase Initialization ---
let auth = null, db = null;
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Setup Error:", e);
}

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

// Rock-solid, verified permanent public domain Unsplash IDs
const IMAGES = {
  spring: ['1464822759023-fed622ff2c3b', '1490750967868-88aa4486c946', '1438786107032-f282f1b0a80e', '1520699049698-acd2fce147f2', '1470240731273-7821a6eeb6bc'],
  summer: ['1507525428034-b723cf961d3e', '1499813292437-0245a49931ce', '1473496169904-712b5043bfb1', '1533371452382-d45a9da51f47', '1501862700950-18382cd204ff'],
  autumn: ['1476820865390-c52aeebb9891', '1443048997380-04e43e5d038d', '1505322137976-19d2cc8477d8', '1477414348463-c0eb7f1359b6', '1508919801845-a589e47cbaf0'],
  winter: ['1483664852095-d6cc6870702d', '1450050854492-56455110d7e4', '1478264350174-8b6b2cd64455', '1491002052846-2e52cdd8974a', '1478719059408-592965723cbc'],
  holiday: ['1512389142860-9c281c678a85', '1518199266791-5375a83190b7', '1508344928928-7137b29de216', '1543363363486-e0e64f7b6d19']
};

const getThemeForDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00Z');
  const m = d.getMonth() + 1; 
  const day = d.getDate();
  const year = d.getFullYear();
  const dailyIndex = year * 366 + m * 31 + day; 

  const getImgUrl = (arr, index) => `https://images.unsplash.com/photo-${arr[index]}?auto=format&fit=crop&w=800&q=80`;

  if (m === 12 && day >= 20) return { img: getImgUrl(IMAGES.holiday, dailyIndex % IMAGES.holiday.length), fallbackImg: getImgUrl(IMAGES.holiday, 0), color: COLORS.rose };
  if (m === 10 && day >= 24) return { img: getImgUrl(IMAGES.autumn, dailyIndex % IMAGES.autumn.length), fallbackImg: getImgUrl(IMAGES.autumn, 0), color: COLORS.amber };
  if (m === 2 && day >= 10 && day <= 14) return { img: getImgUrl(IMAGES.holiday, dailyIndex % IMAGES.holiday.length), fallbackImg: getImgUrl(IMAGES.holiday, 1), color: COLORS.rose };
  if (m === 7 && day >= 1 && day <= 4) return { img: getImgUrl(IMAGES.summer, dailyIndex % IMAGES.summer.length), fallbackImg: getImgUrl(IMAGES.summer, 0), color: COLORS.blue };

  if (m >= 3 && m <= 5) return { img: getImgUrl(IMAGES.spring, dailyIndex % IMAGES.spring.length), fallbackImg: getImgUrl(IMAGES.spring, 1), color: COLORS.emerald }; // Spring Fallback = Flowers
  if (m >= 6 && m <= 8) return { img: getImgUrl(IMAGES.summer, dailyIndex % IMAGES.summer.length), fallbackImg: getImgUrl(IMAGES.summer, 0), color: COLORS.sky }; // Summer Fallback = Ocean
  if (m >= 9 && m <= 11) return { img: getImgUrl(IMAGES.autumn, dailyIndex % IMAGES.autumn.length), fallbackImg: getImgUrl(IMAGES.autumn, 0), color: COLORS.orange }; // Autumn Fallback = Leaves
  return { img: getImgUrl(IMAGES.winter, dailyIndex % IMAGES.winter.length), fallbackImg: getImgUrl(IMAGES.winter, 0), color: COLORS.indigo }; // Winter Fallback = Snow
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
  const [activeTab, setActiveTab] = useState('log'); 
  const tabsOrder = ['log', 'routines', 'plan', 'settings'];

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [viewingHistoryDetail, setViewingHistoryDetail] = useState(null);
  const searchInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [loginError, setLoginError] = useState('');

  // --- SWIPE LOGIC ---
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };
  const onTouchMove = (e) => {
    touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current || isBuilding) return;
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
      const currentIndex = tabsOrder.indexOf(activeTab);
      if (distanceX > 0 && currentIndex < tabsOrder.length - 1) setActiveTab(tabsOrder[currentIndex + 1]);
      else if (distanceX < 0 && currentIndex > 0) setActiveTab(tabsOrder[currentIndex - 1]);
    }
  };
  
  const currentTheme = useMemo(() => getThemeForDate(selectedDate), [selectedDate]);
  const th = currentTheme.color; 

  // --- IMAGE PRE-LOADER & FALLBACK ENGINE ---
  const [activeBackground, setActiveBackground] = useState(currentTheme.fallbackImg); // Start with safe backup
  useEffect(() => {
    let isMounted = true;
    const img = new window.Image();
    img.src = currentTheme.img;
    img.onload = () => { if (isMounted) setActiveBackground(currentTheme.img); };
    img.onerror = () => { if (isMounted) setActiveBackground(currentTheme.fallbackImg); }; // Swap to beautiful backup!
    return () => { isMounted = false; };
  }, [currentTheme.img, currentTheme.fallbackImg]);
  
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('db'); 
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [mealType, setMealType] = useState('Breakfast');
  const [customMacros, setCustomMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' });

  const [isBuilding, setIsBuilding] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [builderName, setBuilderName] = useState('');
  const [builderDays, setBuilderDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [builderItems, setBuilderItems] = useState([]);

  const defaultProfile = { 
    dailyGoal: 2000, proteinGoal: 150, carbsGoal: 250, fatGoal: 65,
    currentWeight: 150, targetWeight: 140, waterGoal: 80, units: 'lbs'
  };
  // Change user default state from null to undefined so we know when Firebase is loading
  const [user, setUser] = useState(undefined);
  const [dailyLog, setDailyLog] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [userProfile, setUserProfile] = useState(defaultProfile);

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

  useEffect(() => {
    if (!auth) { setUser(null); return; }
    // Remove the automatic anonymous sign in, and just set the user to whoever is logged in (or null)
    return onAuthStateChanged(auth, u => { setUser(u); });
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
    catch(e) { console.warn("Sync delayed", e); }
  };

  const handleProfileUpdate = (key, val, isString = false) => {
    const parsedVal = isString ? val : (val === '' ? '' : Number(val));
    updateDB('profile', 'main', { ...userProfile, [key]: parsedVal });
  };

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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const isEndOfDay = selectedDate < todayStr || (selectedDate === todayStr && today.getHours() >= 19); 
  const isGoalCrushed = isEndOfDay && totals.calories > 0 && totals.calories <= safeDailyGoal;
  const isProteinCrushed = totals.protein > 0 && totals.protein >= (userProfile?.proteinGoal || 150);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoginError('');
    const provider = new GoogleAuthProvider();
    try { 
      await signInWithPopup(auth, provider); 
    } catch (error) { 
      console.error("Google login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setLoginError("To use Google Login here, please test locally or deploy to your Azure domain. Otherwise, click 'Continue as Guest' below to try the app!");
      } else {
        setLoginError(error.message);
      }
    }
  };

  const handleLogout = () => {
    if (auth) signOut(auth);
  };

  const handleAddItem = (foodItem) => {
    if (isBuilding) {
      setBuilderItems([...(builderItems || []), { ...foodItem, id: Date.now().toString() + Math.floor(Math.random()*1000), mealType }]);
    } else {
      const uniqueId = Date.now().toString() + Math.floor(Math.random()*1000);
      updateDB('dailyLog', uniqueId, { ...foodItem, id: uniqueId, date: selectedDate, mealType, isEaten: true });
    }
    setSearchResults([]);
    setSearchQuery('');
    setCustomMacros({ calories: '', protein: '', carbs: '', fat: '' });
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

  const renderSearchEngineUI = () => (
    <div className="space-y-3">
      <div className={`relative flex items-center rounded-[24px] border-2 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/80'} backdrop-blur-sm ${th.border} focus-within:${th.ring} transition-all shadow-sm`}>
        <button onClick={() => { setSearchMode(searchMode === 'ai' ? 'db' : 'ai'); setSearchResults([]); }} className={`pl-5 pr-2 py-4 text-[10px] font-black ${th.text} uppercase tracking-widest`}>
          {searchMode === 'ai' ? '✨ AI' : '🔍 DB'}
        </button>
        <input ref={searchInputRef} placeholder={searchMode === 'db' ? "Search USDA Database..." : "Custom food name..."} className={`flex-1 bg-transparent py-4 px-2 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'} focus:outline-none`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {isSearching && <Loader2 className={`animate-spin ${th.text} mr-5`} size={20} />}
      </div>

      {(searchResults.length > 0 || (searchQuery.length > 2 && searchMode === 'ai')) && (
        <div className={`${isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-xl rounded-[32px] border ${th.border} p-2 shadow-2xl space-y-1 animate-in slide-in-from-top-4 relative z-20`}>
          <div className="flex gap-1 p-1 mb-2">
             {['Breakfast','Lunch','Dinner','Snacks'].map(m => <button key={m} onClick={() => setMealType(m)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${mealType === m ? `${th.bg} text-white shadow-md` : `text-slate-500 bg-slate-100 dark:bg-slate-800 hover:${th.bgLight}`}`}>{m}</button>)}
          </div>
          
          {searchResults.map(f => (
            <button key={f.id} onClick={() => handleAddItem(f)} className={`w-full text-left p-4 hover:${th.bgLight} rounded-2xl flex justify-between items-center transition-colors`}>
              <div className="flex-1 mr-4 overflow-hidden"><p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} truncate`}>{f.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase truncate">{f.brand || 'USDA'}</p></div>
              <div className={`text-right ${th.text} font-black text-xs whitespace-nowrap ${th.bgLight} px-3 py-1.5 rounded-xl`}>{f.calories} kcal</div>
            </button>
          ))}

          <div className={`p-3 ${th.bgLight} rounded-2xl mt-2 border ${th.border}`}>
             <p className={`text-[10px] font-black ${th.text} uppercase tracking-widest mb-2 px-1 opacity-70`}>Or Add Custom Entry</p>
             <div className="grid grid-cols-4 gap-2 mb-2">
               {['calories', 'protein', 'carbs', 'fat'].map(k => (
                 <input key={k} type="number" placeholder={k.substring(0,3)} value={customMacros[k]} onChange={e => setCustomMacros({...customMacros, [k]: e.target.value})} className={`w-full ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'} p-2 rounded-xl text-[10px] font-bold text-center focus:outline-none shadow-sm`} />
               ))}
             </div>
             <button onClick={() => { if(searchQuery && customMacros.calories) handleAddItem({ name: searchQuery, calories: Number(customMacros.calories), protein: Number(customMacros.protein)||0, carbs: Number(customMacros.carbs)||0, fat: Number(customMacros.fat)||0, portion: '1 custom serving' }); }} className={`w-full py-3 ${th.bg} text-white font-black text-xs uppercase rounded-xl shadow-md active:scale-95 transition-transform`}>Add Custom</button>
          </div>
          <button onClick={() => { setSearchResults([]); setSearchQuery(''); setCustomMacros({ calories: '', protein: '', carbs: '', fat: '' }); }} className="w-full py-3 text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mt-2 hover:text-rose-400 transition-colors">Close Search</button>
        </div>
      )}
    </div>
  );

  // Show a loading spinner while Firebase checks if you have a saved session
  if (user === undefined) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className={`animate-spin ${th.text}`} size={48} /></div>;
  }

  // Show the aesthetic Login Screen if the user is not logged in
  if (user === null) {
    return (
      <div className="min-h-screen font-sans flex flex-col items-center justify-center bg-slate-900 transition-colors duration-1000 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-1000" style={{ backgroundImage: `url(${currentTheme.img})` }}></div>
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"></div>
        
        <div className="relative z-10 p-8 w-full max-w-md flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
           <div className={`w-24 h-24 rounded-[32px] ${th.bg} flex items-center justify-center shadow-2xl shadow-${th.bg}/50 mb-4`}>
              <Flame size={48} className="text-white" />
           </div>
           <div>
             <h1 className="text-4xl font-black text-white tracking-tight mb-2">Tracker</h1>
             <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Your Personal Nutrition Hub</p>
           </div>
           
           <div className="w-full space-y-4 pt-8">
             {loginError && (
               <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-bold leading-relaxed mb-4 text-center">
                 {loginError}
               </div>
             )}
             <button onClick={handleGoogleLogin} className="w-full py-4 bg-white text-slate-900 rounded-3xl font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 transition-transform active:scale-95">
               <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
               Sign in with Google
             </button>
             
             <button onClick={() => { setLoginError(''); signInAnonymously(auth); }} className="w-full py-4 bg-white/10 text-white rounded-3xl font-black text-sm flex items-center justify-center gap-3 border border-white/20 hover:bg-white/20 transition-transform active:scale-95">
               Continue as Guest
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col items-center transition-colors duration-1000 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* THE FALLBACK ENGINE is now actively powering this div */}
      <div 
        className={`w-full max-w-md h-screen flex flex-col relative overflow-hidden bg-cover bg-center transition-all duration-1000 bg-slate-900`}
        style={{ backgroundImage: `url('${activeBackground}')` }}
      >
        <div className={`absolute inset-0 transition-colors duration-1000 ${isDarkMode ? 'bg-black/60' : 'bg-black/25'}`}></div>

        {/* --- GLOBAL HEADER --- */}
        {!isBuilding && (
          <div className="p-6 pb-10 text-white shrink-0 relative z-10">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => { const d = new Date(selectedDate+'T12:00:00Z'); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"><ChevronLeft /></button>
              <button onClick={() => { setIsDatePickerOpen(true); setPickerMonth(new Date(selectedDate + 'T12:00:00Z')); }} className="flex items-center gap-2 group px-4 py-2 hover:bg-white/10 rounded-2xl backdrop-blur-sm transition-all">
                <h1 className="font-black text-xl tracking-tight drop-shadow-md">{new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</h1>
                <ChevronDown size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
              <button onClick={() => { const d = new Date(selectedDate+'T12:00:00Z'); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"><ChevronRight /></button>
            </div>
            
            <div className="flex items-center gap-6 mb-5">
              <div className="bg-white/15 p-6 rounded-[32px] backdrop-blur-xl border border-white/30 text-center min-w-[120px] shadow-2xl">
                <div className="text-4xl font-black drop-shadow-md">{safeDailyGoal - totals.calories}</div>
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80 mt-1">Remaining</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-end drop-shadow-sm"><p className="text-xs font-bold opacity-90 uppercase tracking-widest">Intake: {totals.calories}</p><p className="text-[10px] opacity-80">Goal: {safeDailyGoal}</p></div>
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden border border-white/30 shadow-inner"><div className={`h-full ${th.bg} transition-all duration-1000 ease-out`} style={{ width: `${Math.min((totals.calories / safeDailyGoal) * 100, 100)}%` }}></div></div>
              </div>
            </div>

            <div className="flex justify-between gap-3 px-2">
              {[
                { label: 'Pro', val: totals.protein, goal: userProfile?.proteinGoal || 150, color: 'bg-rose-400' },
                { label: 'Carb', val: totals.carbs, goal: userProfile?.carbsGoal || 250, color: 'bg-emerald-400' },
                { label: 'Fat', val: totals.fat, goal: userProfile?.fatGoal || 65, color: 'bg-amber-400' }
              ].map(m => (
                <div key={m.label} className="flex-1 space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-90 drop-shadow-sm">
                    <span>{m.label}</span>
                    <span>{m.val}/{m.goal}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${m.color} transition-all duration-1000`} style={{ width: `${Math.min((m.val / Math.max(m.goal, 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- GLOBAL DATE PICKER --- */}
        {isDatePickerOpen && (
          <div className="absolute inset-0 z-[60] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className={`${isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-xl w-full rounded-[40px] shadow-2xl p-6 space-y-4 border ${isDarkMode ? 'border-slate-700/50' : 'border-white/20'}`}>
               <div className="flex justify-between items-center px-2">
                  <h3 className={`font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth()-1, 1))} className={`p-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><ChevronLeft/></button>
                    <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth()+1, 1))} className={`p-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}><ChevronRight/></button>
                  </div>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400">
                  {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-1.5">
                  {(() => {
                    const days = [], first = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1).getDay(), total = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth()+1, 0).getDate();
                    for(let i=0; i<first; i++) days.push(null);
                    for(let i=1; i<=total; i++) days.push({day: i, date: `${pickerMonth.getFullYear()}-${String(pickerMonth.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`});
                    return days;
                  })().map((d, i) => {
                    if (!d) return <div key={`empty-${i}`}></div>;
                    const isSelected = selectedDate === d.date;
                    const isToday = d.date === new Date().toISOString().split('T')[0];
                    
                    let btnClasses = 'aspect-square rounded-xl text-xs font-black transition-all ';
                    if (isSelected) btnClasses += `${th.bg} text-white shadow-lg `;
                    else btnClasses += `${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'} hover:bg-slate-200 dark:hover:bg-slate-700 `;
                    if (isToday && !isSelected) btnClasses += `ring-2 ${th.ring} ring-offset-2 ${isDarkMode ? 'dark:ring-offset-slate-900' : 'ring-offset-white'} `;

                    return <button key={d.date} onClick={() => { setSelectedDate(d.date); setIsDatePickerOpen(false); }} className={btnClasses}>{d.day}</button>;
                  })}
               </div>
               <button onClick={() => setIsDatePickerOpen(false)} className={`w-full py-4 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'} rounded-2xl font-black text-xs uppercase transition-colors`}>Cancel</button>
            </div>
          </div>
        )}

        {/* --- DYNAMIC TAB CONTENT (Now Swipeable) --- */}
        <div 
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          ref={scrollContainerRef} 
          className={`flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar transition-colors duration-1000 relative z-10 rounded-t-[40px] border-t border-white/40 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isDarkMode ? 'bg-slate-950/85 backdrop-blur-2xl dark:border-slate-700/50' : 'bg-white/95 backdrop-blur-2xl'}`}
        >
          {isBuilding ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 pb-10">
              <div className="flex justify-between items-center"><h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Routine Builder</h2><button onClick={() => setIsBuilding(false)} className={`p-2 rounded-full text-slate-500 hover:text-rose-500 transition-colors ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200/50'}`}><X size={20}/></button></div>
              <input placeholder="Name Your Routine..." className={`w-full p-5 rounded-3xl font-black text-lg focus:outline-none border ${isDarkMode ? 'bg-slate-900/60 text-white border-slate-700/50' : 'bg-white text-slate-800 border-slate-200 shadow-sm'}`} value={builderName} onChange={e => setBuilderName(e.target.value)} />
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Repeat Weekly On</p>
                <div className={`flex justify-between gap-1 p-1.5 rounded-[24px] border ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                    <button key={day} onClick={() => setBuilderDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${builderDays.includes(day) ? `${th.bg} text-white shadow-md` : 'text-slate-500'}`}>{day}</button>
                  ))}
                </div>
              </div>
              {renderSearchEngineUI()}
              <div className="space-y-2">
                {(builderItems || []).map(item => (
                  <div key={item.id} className={`flex justify-between items-center p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div><p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.name}</p><p className={`text-[10px] ${th.text} font-bold uppercase tracking-widest`}>{item.mealType} • {item.calories} kcal</p></div>
                    <button onClick={() => setBuilderItems(builderItems.filter(i => i.id !== item.id))} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={18}/></button>
                  </div>
                ))}
              </div>
              <button onClick={saveRoutine} className={`w-full py-5 ${th.bg} text-white rounded-3xl font-black text-lg shadow-xl ${th.shadow} flex items-center justify-center gap-3 transition-transform active:scale-95`}><Save /> Save Routine</button>
            </div>
          ) : activeTab === 'log' ? (
            <div className="space-y-6 animate-in fade-in pb-6">
              {(isGoalCrushed || isProteinCrushed) && (
                <div className={`p-4 rounded-[24px] border ${isGoalCrushed && isProteinCrushed ? 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/30' : isGoalCrushed ? 'bg-amber-100 border-amber-300 dark:bg-amber-900/30' : 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30'} flex items-center gap-4 animate-in slide-in-from-top-4`}>
                  <div className={`p-3 rounded-2xl ${isGoalCrushed && isProteinCrushed ? 'bg-indigo-500 shadow-indigo-500/30' : isGoalCrushed ? 'bg-amber-500 shadow-amber-500/30' : 'bg-emerald-500 shadow-emerald-500/30'} text-white shadow-lg`}>
                    {isGoalCrushed && isProteinCrushed ? <Flame size={20}/> : isGoalCrushed ? <Trophy size={20}/> : <Medal size={20}/>}
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-70 ${isGoalCrushed && isProteinCrushed ? 'text-indigo-800 dark:text-indigo-400' : isGoalCrushed ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-400'}`}>Accomplishment unlocked</p>
                    <h4 className={`text-sm font-black ${isGoalCrushed && isProteinCrushed ? 'text-indigo-600 dark:text-indigo-500' : isGoalCrushed ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>{isGoalCrushed && isProteinCrushed ? 'Perfect Day!' : isGoalCrushed ? 'Calorie Goal Met!' : 'Protein Target Hit!'}</h4>
                  </div>
                </div>
              )}
              {renderSearchEngineUI()}
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => {
                const mealItems = (dailyLog || []).filter(i => i.date === selectedDate && i.mealType === m);
                return (
                  <div key={m} className={`p-5 rounded-[32px] shadow-sm space-y-4 border ${isDarkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
                    <div className={`flex justify-between items-center border-b pb-3 mx-1 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}><div className={`w-2.5 h-2.5 rounded-full ${th.bg} shadow-md`}></div>{m}</h3>
                      <span className={`text-[11px] font-black px-3 py-1 rounded-xl shadow-inner ${isDarkMode ? 'text-slate-400 bg-slate-800/50' : 'text-slate-600 bg-slate-100'}`}>{mealItems.reduce((s,i)=>s+(Number(i.calories)||0),0)} kcal</span>
                    </div>
                    <div className="space-y-2">
                      {mealItems.map(item => (
                        <div key={item.id} className={`p-4 rounded-[24px] flex justify-between items-center shadow-sm border transition-all active:scale-[0.98] ${isDarkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                          <div className="flex items-center gap-4">
                            <button onClick={() => updateDB('dailyLog', item.id, { ...item, isEaten: !item.isEaten })} className="transition-transform active:scale-75">
                              {item.isEaten !== false ? <CheckCircle2 className={th.text} size={24} /> : <Circle className={`text-slate-300 ${isDarkMode ? 'dark:text-slate-600' : ''}`} size={24} />}
                            </button>
                            <div className={item.isEaten === false ? 'opacity-40 line-through' : ''}>
                              <p className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{item.calories} kcal</p>
                            </div>
                          </div>
                          <button onClick={() => updateDB('dailyLog', item.id, null, true)} className="p-2 text-slate-300 hover:text-rose-400 transition-colors"><Trash2 size={18}/></button>
                        </div>
                      ))}
                      <button onClick={() => { setMealType(m); searchInputRef.current?.focus(); }} className={`w-full py-4 border-2 border-dashed rounded-3xl text-[10px] font-black uppercase text-slate-400 hover:${th.bgLight} transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'border-slate-600' : 'border-slate-300 hover:text-slate-700'}`}>
                        <Plus size={14}/> Add to {m}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'routines' ? (
            <div className="space-y-4 animate-in fade-in pb-6">
              <button onClick={() => { setIsBuilding(true); setEditingRoutineId(null); setBuilderName(''); setBuilderItems([]); setSearchQuery(''); setSearchResults([]); setCustomMacros({calories:'',protein:'',carbs:'',fat:''}); }} className={`w-full py-5 border-2 border-dashed ${th.border} ${th.text} rounded-[32px] font-black tracking-wide text-sm flex items-center justify-center gap-3 hover:${th.bgLight} transition-colors`}>
                <div className={`p-1 rounded-lg shadow-sm ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}><Plus size={18}/></div> Create New Routine
              </button>
              {(routines || []).map(r => {
                const isApplied = (dailyLog || []).some(log => log.date === selectedDate && log.routineId === r.id);
                return (
                  <div key={r.id} className={`p-6 rounded-[40px] border shadow-sm space-y-4 ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
                    <h4 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{r.name || 'Untitled'}</h4>
                    <div className="flex gap-2">
                      <button onClick={() => isApplied ? handleRemoveRoutine(r.id) : handleApplyRoutine(r)} className={`flex-1 py-3 ${isApplied ? 'bg-rose-50 text-rose-600' : th.bgLight + ' ' + th.text} rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2`}>
                        {isApplied ? <X size={16}/> : <CheckCircle2 size={16}/>} {isApplied ? 'Remove' : 'Apply'}
                      </button>
                      <button onClick={() => updateDB('routines', r.id, null, true)} className={`p-3 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors shadow-sm ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}><Trash2 size={18}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'plan' ? (
            <div className="space-y-6 animate-in fade-in pb-6">
              <div className="flex items-center gap-3"><CalendarDays className={th.text} size={24} /><h3 className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Activity Log</h3></div>
              <div className={`p-5 rounded-[40px] border shadow-sm ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 mb-4">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <div className="grid grid-cols-7 gap-2.5">
                  {(() => {
                    const days = [], first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay(), total = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth()+1, 0).getDate();
                    for(let i=0; i<first; i++) days.push(null);
                    for(let i=1; i<=total; i++) {
                      const dStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                      const cal = (dailyLog || []).filter(l => l.date === dStr && l.isEaten !== false).reduce((s,x)=>s+(Number(x.calories)||0),0);
                      days.push({ day: i, date: dStr, total: cal });
                    }
                    return days;
                  })().map((d, i) => {
                    if (!d) return <div key={i}></div>;
                    const isSelected = viewingHistoryDetail === d.date;
                    const isToday = d.date === new Date().toISOString().split('T')[0];
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
                    else if (isToday) ringClass = `ring-2 ring-emerald-400 dark:ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 z-10`;

                    return (
                      <button key={d.date} onClick={() => setViewingHistoryDetail(d.date)} className={`aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${baseBg} ${baseText} ${border} ${ringClass}`}>
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
            <div className="space-y-6 animate-in fade-in pb-6">
               <div className="flex items-center gap-3"><Settings className={th.text} size={24} /><h3 className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Settings</h3></div>
               
               <div className={`p-6 rounded-[32px] border space-y-6 shadow-sm ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
                  <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2"><Target size={14}/> Nutrition Targets</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block text-center">Daily Calories</label>
                    <SafeInput type="number" className={`w-full p-4 rounded-2xl font-black text-2xl text-center border focus:ring-2 ${th.ring} ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200 shadow-sm'}`} value={userProfile?.dailyGoal ?? 2000} onChange={v => handleProfileUpdate('dailyGoal', v)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: 'Pro', k: 'proteinGoal', c: 'text-rose-500', bg: isDarkMode ? 'bg-rose-900/20' : 'bg-rose-50' },
                      { l: 'Carb', k: 'carbsGoal', c: 'text-emerald-500', bg: isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50' },
                      { l: 'Fat', k: 'fatGoal', c: 'text-amber-500', bg: isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50' }
                    ].map(g => (
                      <div key={g.k} className="space-y-1">
                        <label className={`text-[9px] font-black uppercase text-center block ${g.c}`}>{g.l}</label>
                        <SafeInput type="number" className={`w-full p-3 ${g.bg} rounded-xl font-black text-center border ${isDarkMode ? 'border-transparent text-white' : 'border-slate-100 text-slate-800 shadow-sm'}`} value={userProfile?.[g.k]} onChange={v => handleProfileUpdate(g.k, v)} />
                      </div>
                    ))}
                  </div>
               </div>

               <div className={`p-6 rounded-[32px] border space-y-6 shadow-sm ${isDarkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
                  <div className="flex justify-between items-center"><h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2"><Scale size={14}/> Body Metrics</h4><button onClick={() => handleProfileUpdate('units', userProfile?.units === 'kg' ? 'lbs' : 'kg', true)} className="text-[9px] font-black text-indigo-500 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">{userProfile?.units || 'lbs'}</button></div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 block text-center">Current</label><SafeInput type="number" className={`w-full p-3 rounded-xl font-black text-center shadow-sm ${isDarkMode ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-slate-800 border border-slate-200'}`} value={userProfile?.currentWeight} onChange={v => handleProfileUpdate('currentWeight', v)} /></div>
                     <div className="space-y-1"><label className={`text-[9px] font-black uppercase ${th.text} block text-center`}>Goal</label><SafeInput type="number" className={`w-full p-3 ${th.bgLight} rounded-xl font-black text-center shadow-sm ${isDarkMode ? 'text-white border-transparent' : 'text-slate-800 border border-slate-100'}`} value={userProfile?.targetWeight} onChange={v => handleProfileUpdate('targetWeight', v)} /></div>
                  </div>
                  <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2 justify-center"><Droplets size={12} className="text-blue-500"/> Daily Water (oz)</label>
                    <SafeInput type="number" className={`w-full p-4 rounded-2xl font-black text-xl text-center shadow-sm ${isDarkMode ? 'bg-blue-900/20 text-white border-transparent' : 'bg-blue-50 text-slate-800 border border-blue-100'}`} value={userProfile?.waterGoal} onChange={v => handleProfileUpdate('waterGoal', v)} />
                  </div>
               </div>

               <button onClick={toggleTheme} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-sm border transition-transform active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className={th.text} />}
                  {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               </button>

               <button onClick={handleLogout} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-sm border transition-transform active:scale-95 text-rose-500 ${isDarkMode ? 'bg-rose-900/20 border-rose-900/50' : 'bg-rose-50 border-rose-100'}`}>
                  <LogOut size={18} /> Sign Out
               </button>
            </div>
          )}
        </div>

        {!isBuilding && (
          <div className={`shrink-0 border-t flex justify-around py-5 pb-9 sm:pb-5 transition-all relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${isDarkMode ? 'bg-slate-950/85 backdrop-blur-2xl border-slate-700/50' : 'bg-white/95 backdrop-blur-2xl border-white/40'}`}>
            {['log', 'routines', 'plan', 'settings'].map((t, idx) => {
              const Icons = [Clock, ListChecks, CalendarDays, Settings];
              const Icon = Icons[idx];
              return (
                <button key={t} onClick={() => setActiveTab(t)} className={activeTab === t ? `${th.text} scale-125` : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}>
                  <Icon size={24} strokeWidth={activeTab === t ? 3 : 2}/>
                </button>
              );
            })}
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