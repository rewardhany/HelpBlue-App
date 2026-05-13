import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, ShieldHalf, Lightbulb, Wand2, Play, ArrowRight, Eye, Share2, Mail, 
  Home, Clock, MessageCircle, User, PlusCircle, Search, ChevronRight, Star, 
  MapPin, Wallet, ArrowLeft, Send, CheckCircle, LogOut, 
  Settings, Bell, HelpCircle, History, Lock, Shield, Info, X, Filter, Navigation,
  CreditCard, Smartphone, Building, FileText, XCircle, Briefcase, List, DollarSign, Power, CheckSquare, TrendingUp, Camera, Upload, Trash2, CheckCircle2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// FIREBASE INITIALIZATION
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "helpblue-demo.firebaseapp.com",
  projectId: "helpblue-demo",
  storageBucket: "helpblue-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123demo"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'helpblue-demo-id';

// MAP LOCATION PICKER COMPONENT

const MapLocationPicker = ({ value, onChange, onClose }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Default center: Jakarta, Indonesia
  const defaultCenter =[-6.2088, 106.8456];

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;

      // Fix default icon paths for Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom blue marker
      const blueIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 36px; height: 36px;
          background: #2563eb;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(37,99,235,0.5);
        "></div>`,
        iconSize: [36, 36],
        iconAnchor:[18, 36],
      });

      const marker = L.marker(defaultCenter, { draggable: true, icon: blueIcon }).addTo(map);
      markerRef.current = marker;

      // Reverse geocode on marker drag end
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        await reverseGeocode(pos.lat, pos.lng);
      });

      // Click on map to move marker
      map.on('click', async (e) => {
        marker.setLatLng(e.latlng);
        await reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
            await reverseGeocode(latitude, longitude);
          },
          () => {
            // fallback: just use Jakarta
            reverseGeocode(defaultCenter[0], defaultCenter[1]);
          },
          { timeout: 5000 }
        );
      } else {
        reverseGeocode(defaultCenter[0], defaultCenter[1]);
      }

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  },[]);

  const reverseGeocode = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      const displayName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(displayName);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onChange(address);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
      <div className="flex items-center gap-4 p-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <button onClick={onClose} className="bg-slate-100 p-2 rounded-xl text-slate-600 hover:bg-slate-200 transition">
          <X size={22} />
        </button>
        <div>
          <h2 className="font-black text-slate-800 text-lg">Pilih Lokasi di Peta</h2>
          <p className="text-xs text-slate-500 font-medium">Tap peta atau seret pin untuk memilih lokasi</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '60vh' }} />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-500">Memuat peta...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-slate-100 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-200">
          <MapPin size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lokasi Dipilih</p>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-500 font-medium">Mencari alamat...</span>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-700 leading-relaxed break-words">{address || 'Tap peta untuk memilih lokasi'}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!address || loading}
          className={`w-full font-black py-4 rounded-2xl transition text-base shadow-lg ${
            address && !loading
              ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Konfirmasi Lokasi Ini
        </button>
      </div>
    </div>
  );
};


const HeaderWithBack = ({ title, onBack }) => (
  <div className="bg-white p-6 sticky top-0 z-10 flex items-center gap-4 shadow-sm border-b border-slate-100">
    <button onClick={onBack} className="bg-slate-50 p-2 rounded-xl text-slate-600 hover:bg-slate-100"><ArrowLeft size={24} /></button>
    <h2 className="font-black text-xl text-slate-800">{title}</h2>
  </div>
);

const SidebarItem = ({ icon, label, active, onClick, isHelper }) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all font-bold ${active ? (isHelper ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50' : 'bg-blue-600 text-white shadow-md shadow-blue-200') : (isHelper ? 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600')}`}>
    {icon} <span>{label}</span>
  </div>
);

const BottomNavItem = ({ icon, label, active, onClick, isHelper }) => (
  <div onClick={onClick} className={`flex flex-col items-center cursor-pointer transition-all ${active ? (isHelper ? 'text-emerald-500 scale-110' : 'text-blue-600 scale-110') : (isHelper ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}>
    <div className={`${active ? (isHelper ? 'bg-emerald-500/20 p-2 rounded-2xl' : 'bg-blue-50 p-2 rounded-2xl') : 'p-2'}`}>{icon}</div>
    <span className="text-[10px] font-bold mt-1">{label}</span>
  </div>
);

const MenuRow = ({ icon, label, onClick, isRed }) => (
  <div onClick={onClick} className="flex justify-between items-center p-4 md:p-5 bg-white cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
    <div className={`flex items-center gap-4 ${isRed ? 'text-red-500' : 'text-slate-700'}`}>
      <div className={`p-2 rounded-xl ${isRed ? 'bg-red-50' : 'bg-slate-100 text-slate-500'}`}>{icon}</div>
      <span className="text-sm md:text-base font-black">{label}</span>
    </div>
    <ChevronRight size={20} className={isRed ? 'text-red-300' : 'text-slate-300'}/>
  </div>
);

// Peningkatan pada NotificationPanel agar interaktif saat di-click (Realtime Expand & Mark Read)
const NotificationPanel = ({ showNotif, setShowNotif, notifications, onMarkAllRead, onNotifClick }) => {
  const [expandedId, setExpandedId] = useState(null);

  return (
    showNotif && (
      <div className="absolute top-24 md:top-20 right-6 md:right-10 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-slate-800">Notifikasi</h3>
          <button onClick={()=>setShowNotif(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-bold text-sm">Belum ada notifikasi baru.</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} onClick={() => { 
                setExpandedId(expandedId === n.id ? null : n.id); 
                if(n.unread) onNotifClick(n.id); 
              }} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-all ${n.unread ? 'bg-blue-50/50' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                   <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                   {n.unread && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 shrink-0"></div>}
                </div>
                <p className={`text-xs text-slate-500 mt-1 leading-relaxed transition-all duration-300 ${expandedId === n.id ? '' : 'line-clamp-2'}`}>{n.desc}</p>
                <span className="text-[10px] font-bold text-slate-400 mt-2 block">{n.time}</span>
              </div>
            ))
          )}
        </div>
        <div onClick={onMarkAllRead} className="p-3 text-center bg-slate-50 border-t border-slate-100 cursor-pointer hover:bg-slate-100 text-sm font-bold text-blue-600">
          Tandai semua sudah dibaca
        </div>
      </div>
    )
  );
};

const DashboardLayout = ({ children, currentView, handleNavigation, showNotif, setShowNotif, notifications, userRole, markAllReadNotifs, handleNotifClick }) => {
  const isHelper = userRole === 'helper';
  
  return (
  <div className="flex h-screen bg-slate-50 font-sans">
    {/* Desktop Sidebar */}
    <aside className={`hidden md:flex flex-col w-72 h-full shadow-sm z-30 transition-colors ${isHelper ? 'bg-slate-900 border-r border-slate-800 text-white' : 'bg-white border-r border-slate-100'}`}>
      <div className="p-8">
        <div className={`text-2xl font-black tracking-tighter cursor-pointer ${isHelper ? 'text-white' : 'text-blue-700'}`} onClick={() => handleNavigation('home')}>HELPBLUE</div>
      </div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        <SidebarItem isHelper={isHelper} icon={<Home size={20} />} label="Dashboard" active={currentView === 'home'} onClick={() => handleNavigation('home')} />
        {isHelper ? (
          <>
            <SidebarItem isHelper={isHelper} icon={<List size={20} />} label="Order Feed" active={currentView === 'order_feed'} onClick={() => handleNavigation('order_feed')} />
            <SidebarItem isHelper={isHelper} icon={<DollarSign size={20} />} label="Earnings" active={currentView === 'earnings'} onClick={() => handleNavigation('earnings')} />
          </>
        ) : (
          <>
            <SidebarItem isHelper={isHelper} icon={<Clock size={20} />} label="My Activity" active={currentView === 'activity'} onClick={() => handleNavigation('activity')} />
            <SidebarItem isHelper={isHelper} icon={<Search size={20} />} label="Find Helper" active={currentView === 'explore'} onClick={() => handleNavigation('explore')} />
          </>
        )}
        <SidebarItem isHelper={isHelper} icon={<MessageCircle size={20} />} label="Messages" active={currentView === 'chat_list' || currentView === 'chat'} onClick={() => handleNavigation('chat_list')} />
        <SidebarItem isHelper={isHelper} icon={<User size={20} />} label="Profile" active={currentView === 'profile'} onClick={() => handleNavigation('profile')} />
        
        <div className={`pt-6 mt-6 border-t ${isHelper ? 'border-slate-800' : 'border-slate-100'}`}>
           <p className={`px-4 text-[10px] font-black uppercase tracking-widest mb-2 ${isHelper ? 'text-slate-500' : 'text-slate-400'}`}>Shortcut</p>
           <SidebarItem isHelper={isHelper} icon={<History size={20} />} label="Wallet History" active={currentView === 'wallet_history'} onClick={() => handleNavigation('wallet_history')} />
           <SidebarItem isHelper={isHelper} icon={<HelpCircle size={20} />} label="Help Center" active={currentView === 'help_center'} onClick={() => handleNavigation('help_center')} />
        </div>
      </nav>
    </aside>

    {/* MAIN CONTENT AREA */}
    <main className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
        <div className="max-w-3xl mx-auto w-full h-full relative">
           {children}
           <NotificationPanel showNotif={showNotif} setShowNotif={setShowNotif} notifications={notifications} onMarkAllRead={markAllReadNotifs} onNotifClick={handleNotifClick} />
        </div>
      </div>

      {/* MOB BOTTOM NAV */}
      <nav className={`md:hidden fixed bottom-0 w-full border-t flex justify-around p-2 pb-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl transition-colors ${isHelper ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <BottomNavItem isHelper={isHelper} icon={<Home size={22} />} label="Home" active={currentView === 'home'} onClick={() => handleNavigation('home')} />
        {isHelper ? (
          <BottomNavItem isHelper={isHelper} icon={<List size={22} />} label="Orders" active={currentView === 'order_feed'} onClick={() => handleNavigation('order_feed')} />
        ) : (
          <BottomNavItem isHelper={isHelper} icon={<Clock size={22} />} label="Activity" active={currentView === 'activity'} onClick={() => handleNavigation('activity')} />
        )}
        <BottomNavItem isHelper={isHelper} icon={<MessageCircle size={22} />} label="Chat" active={currentView === 'chat_list' || currentView === 'chat'} onClick={() => handleNavigation('chat_list')} />
        <BottomNavItem isHelper={isHelper} icon={<User size={22} />} label="Profile" active={currentView === 'profile'} onClick={() => handleNavigation('profile')} />
      </nav>
    </main>
  </div>
  );
};


// MAIN APP COMPONENT

export default function App() {
  // STATE MANAGEMENT
  const[currentView, setCurrentView] = useState('landing'); 
  const [user, setUser] = useState(null);
  const[userProfile, setUserProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [chats, setChats] = useState([]); // REAL-TIME CHAT STATE
  const[activityTab, setActivityTab] = useState('pending');
  const [activeTask, setActiveTask] = useState(null);
  const [taskDetailContext, setTaskDetailContext] = useState('user');
  const[isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Form States
  const[formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [taskForm, setTaskForm] = useState({ title: '', desc: '', budget: '', category: 'Cleaning', location: '' });
  const [chatInput, setChatInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Map Location Picker State
  const[showMapPicker, setShowMapPicker] = useState(false);

  // NEW FEATURES STATES
  const[searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('nearest');
  const[showNotif, setShowNotif] = useState(false);

  // Role & Helper States
  const [userRole, setUserRole] = useState('user'); 
  const [isOnline, setIsOnline] = useState(false);

  // Active chat contact state
  const [activeChatContact, setActiveChatContact] = useState(null);

  // Review states
  const [ratingInput, setRatingInput] = useState(5);
  const[reviewInput, setReviewInput] = useState('');

  // States for Edit Profile & Addresses & Topup
  const[editProfileData, setEditProfileData] = useState({ name: '', phone: '' });
  const[addresses, setAddresses] = useState([
    { id: 1, label: 'Rumah', type: 'Utama', detail: 'Jl. Sukamaju No. 123, RT 01/RW 02, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115', contact: 'Budi Santoso | 081234567890' }
  ]);
  const [newAddressData, setNewAddressData] = useState({ label: '', type: 'Lainnya', detail: '', contact: '' });
  
  const [topupAmount, setTopupAmount] = useState('');
  const[topupMethod, setTopupMethod] = useState('');

  // WITHDRAW & HELPER SUB-MENU STATES
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  
  const [newBankAccount, setNewBankAccount] = useState({ bankName: 'BCA', accountNumber: '', accountName: '' });
  
  // File Upload states for KTP & Selfie verifications
  const ktpInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const [uploadingKTP, setUploadingKTP] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  // Realtime Firebase States for Notifications and Reviews
  // Inisialisasi awal empty array agar tidak ada dummy text flash 
  const[notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [walletHistory, setWalletHistory] = useState([
    { id: 1, type: 'topup', amount: 150000, title: 'Top Up Saldo', date: 'Hari ini, 09:00', status: 'Berhasil' },
    { id: 2, type: 'payment', amount: -25000, title: 'Pembayaran: Print Makalah', date: 'Kemarin, 14:30', status: 'Berhasil' },
    { id: 3, type: 'refund', amount: 50000, title: 'Refund: Tugas Dibatalkan', date: '10 Mei 2026', status: 'Berhasil' }
  ]);

  // Filter explore tasks
  let filteredExploreTasks = tasks.filter(t => t.status === 'available' || t.status === 'pending');
  filteredExploreTasks = filteredExploreTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const normalizedSelectedCat = selectedCategory === 'Jasa Titip' ? 'Delivery' : selectedCategory;
    const matchesCategory = selectedCategory === 'All' || task.category === normalizedSelectedCat;
    return matchesSearch && matchesCategory;
  });

  if (sortBy === 'highest_pay') {
    filteredExploreTasks.sort((a, b) => b.budget - a.budget);
  }

  // FIREBASE EFFECTS
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  },[]);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.role) setUserRole(data.role);
      } else {
        const defaultProfile = {
          name: 'New User',
          email: 'user@example.com',
          phone: '081234567890',
          balance: 150000,
          rating: 5.0,
          role: 'user',
          services: [],
          bankAccounts:[],
          verificationStatus: 'unverified',
          joinedAt: new Date().toISOString()
        };
        setDoc(profileRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    }, (err) => console.error(err));

    const qTasks = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const fetchedTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTasks(fetchedTasks);
    }, (err) => console.error(err));

    // REALTIME CHAT LISTENER
    const qChats = query(collection(db, 'artifacts', appId, 'public', 'data', 'chats'));
    const unsubChats = onSnapshot(qChats, (snap) => {
       const fetchedChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       fetchedChats.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).reverse();
       setChats(fetchedChats);
    }, (err) => console.error(err));

    // REALTIME NOTIFICATIONS LISTENER
    const qNotifs = query(collection(db, 'artifacts', appId, 'public', 'data', 'users', user.uid, 'notifications'));
    const unsubNotifs = onSnapshot(qNotifs, (snap) => {
      const fetchedNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).reverse();
      setNotifications(fetchedNotifs); // real time state update
    }, (err) => console.error(err));

    // REALTIME REVIEWS LISTENER
    const qReviews = query(collection(db, 'artifacts', appId, 'public', 'data', 'users', user.uid, 'reviews'));
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      const fetchedReviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(fetchedReviews);
    }, (err) => console.error(err));

    return () => {
      unsubProfile();
      unsubTasks();
      unsubChats();
      unsubNotifs();
      unsubReviews();
    };
  }, [user]);

  // HELPER FUNCTION TO SEND REALTIME NOTIFICATIONS
  const sendNotification = async (targetUid, title, desc) => {
    if(!targetUid) return;
    try {
      const notifRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'users', targetUid, 'notifications'));
      await setDoc(notifRef, {
        title,
        desc,
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        unread: true
      });
    } catch(e) { console.error("Error notif", e); }
  }

  const markAllReadNotifs = async () => {
    if(!user) return;
    const unreadNotifs = notifications.filter(n => n.unread);
    for(const n of unreadNotifs) {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid, 'notifications', n.id);
      await updateDoc(ref, { unread: false }).catch(e => console.error(e));
    }
  };

  const handleNotifClick = async (notifId) => {
    if(!user) return;
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid, 'notifications', notifId);
      await updateDoc(ref, { unread: false });
    } catch(e) { console.error("Error updating notif", e); }
  };

  // ACTIONS
  const handleNavigation = (view) => {
    if (view === 'edit_profile' && userProfile) {
      setEditProfileData({ name: userProfile.name || '', phone: userProfile.phone || '081234567890' });
    }
    setCurrentView(view);
    window.scrollTo(0, 0); 
    setIsMobileMenuOpen(false); 
    setShowNotif(false); 
  };

  const scrollToSection = (id) => {
    handleNavigation('landing');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setUserProfile({
      name: `${formData.firstName} ${formData.lastName}`.trim() || 'New User',
      balance: 150000
    });
    handleNavigation('role_selection');

    try {
      const userId = user?.uid || 'user-' + Date.now();
      const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userId);
      await setDoc(profileRef, {
        name: `${formData.firstName} ${formData.lastName}`.trim() || 'New User',
        email: formData.email || 'user@example.com',
        phone: formData.phone || '081234567890',
        balance: 150000,
        rating: 5.0,
        role: 'user',
        services: [],
        bankAccounts:[],
        verificationStatus: 'unverified',
        joinedAt: new Date().toISOString()
      });

      // Menambahkan notifikasi welcome secara otomatis ke database ketika register pertama kali
      await sendNotification(userId, 'Selamat Datang di HelpBlue', 'Akun Anda berhasil dibuat. Jelajahi aplikasi dan temukan solusi untuk tugas harian Anda.');
    } catch (err) {
      console.warn("Simpan data tertunda, tapi navigasi tetap jalan:", err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    handleNavigation('home');
  };

  const handleRoleSelect = async (role) => {
    setUserRole(role);
    handleNavigation('home');
    
    if (user) {
      try {
        const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await updateDoc(profileRef, { role: role });
      } catch (err) {
        console.error("Gagal update role", err);
      }
    }
  };

  const handlePostTask = async (e) => {
    e.preventDefault();
    
    const newTask = {
      title: taskForm.title,
      desc: taskForm.desc,
      budget: parseInt(taskForm.budget),
      category: taskForm.category,
      location: taskForm.location || 'Lokasi belum diset',
      status: 'pending',
      distance: taskForm.location || 'Lokasi belum diset',
      requesterId: user?.uid || 'guest-123',
      requesterName: userProfile?.name || 'Guest User',
      requesterRating: userProfile?.rating || 5.0,
      createdAt: new Date().toISOString(),
      isReviewed: false
    };

    setTasks(prev => [{ id: 'local-' + Date.now(), ...newTask }, ...prev]);
    setTaskForm({ title: '', desc: '', budget: '', category: 'Cleaning', location: '' });
    setActivityTab('pending');
    handleNavigation('activity');

    if (user && userProfile) {
      try {
        const taskRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'));
        await setDoc(taskRef, newTask);
      } catch (err) {
        console.error("Error posting task to Firebase:", err);
      }
    }
  };

  const handleTakeTask = async (task) => {
    if (!user || !userProfile) {
       setActivityTab('ongoing');
       handleNavigation('activity');
       return;
    }
    try {
      // 1. Update status task menjadi ongoing
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id);
      await updateDoc(taskRef, {
        status: 'ongoing',
        helperId: user.uid,
        helperName: userProfile.name
      });

      // 2. Buat Room Chat Baru di Firebase
      const chatRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', task.id);
      await setDoc(chatRef, {
         taskId: task.id,
         taskTitle: task.title,
         userId: task.requesterId,
         userName: task.requesterName,
         helperId: user.uid,
         helperName: userProfile.name,
         lastMessage: 'Chat room dibuat. Silakan mulai percakapan.',
         messages:[],
         updatedAt: new Date().toISOString()
      });

      // 3. Notifikasi ke User
      sendNotification(task.requesterId, 'Tugas Diambil!', `Tugas "${task.title}" telah diambil oleh Helper ${userProfile.name}.`);

      setActivityTab('ongoing');
      handleNavigation('activity');
    } catch (err) {
      console.error("Error taking task:", err);
    }
  };

  const handleFinishTask = async (taskId) => {
    try {
      const targetTask = tasks.find(t => t.id === taskId);
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
      await updateDoc(taskRef, { status: 'history' });
      
      if(targetTask) {
        sendNotification(targetTask.requesterId, 'Tugas Selesai!', `Tugas "${targetTask.title}" telah diselesaikan. Silakan berikan ulasan.`);
        sendNotification(targetTask.helperId, 'Tugas Selesai!', `Anda telah menyelesaikan tugas "${targetTask.title}".`);
      }
      handleNavigation('activity');
    } catch (err) {
      console.error("Error finishing task:", err);
    }
  };

  const handleCancelTask = async (taskId) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      handleNavigation('activity');

      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (err) {
      console.error("Error cancelling task:", err);
    }
  };

  const handleSubmitReview = async (taskId, helperId) => {
    try {
      const reviewRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'users', helperId, 'reviews'));
      await setDoc(reviewRef, {
          taskId,
          user: userProfile?.name || 'User',
          rating: ratingInput,
          comment: reviewInput,
          date: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})
      });
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
      await updateDoc(taskRef, { isReviewed: true });
      
      setReviewInput('');
      sendNotification(helperId, 'Ulasan Baru!', `Anda mendapat rating ${ratingInput} Bintang dari ${userProfile?.name || 'User'}`);
      
      handleNavigation('activity');
    } catch(err) {
      console.error("Gagal submit review", err);
    }
  }

  // REALTIME CHAT SEND FUNCTION
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChatContact) return;
    
    const newMsg = {
      id: Date.now(),
      from: userRole, 
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    const currentChat = chats.find(c => c.id === activeChatContact.id) || activeChatContact;
    const updatedMessages = [...(currentChat.messages || []), newMsg];
    
    setChatInput('');

    if (user) {
       try {
         const chatRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', activeChatContact.id);
         await updateDoc(chatRef, {
            messages: updatedMessages,
            lastMessage: newMsg.text,
            updatedAt: new Date().toISOString()
         });
       } catch (err) {
         console.error("Gagal mengirim pesan", err);
       }
    }
  };

  // HELPER PROFILE FUNCTIONS
  const toggleService = async (serviceName) => {
    if (!user || !userProfile) return;
    let currentServices = userProfile.services ||[];
    if (currentServices.includes(serviceName)) {
      currentServices = currentServices.filter(s => s !== serviceName);
    } else {
      currentServices.push(serviceName);
    }
    setUserProfile(prev => ({...prev, services: currentServices}));
    try {
      const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await updateDoc(profileRef, { services: currentServices });
    } catch(e) {}
  };

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    const newBank = { ...newBankAccount, id: Date.now() };
    const updatedBanks =[...(userProfile.bankAccounts || []), newBank];
    setUserProfile(prev => ({...prev, bankAccounts: updatedBanks}));
    setNewBankAccount({ bankName: 'BCA', accountNumber: '', accountName: '' });
    
    try {
      const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await updateDoc(profileRef, { bankAccounts: updatedBanks });
    } catch(e) {}
  };

  const handleDeleteBankAccount = async (bankId) => {
    if (!user || !userProfile) return;
    const updatedBanks = (userProfile.bankAccounts ||[]).filter(b => b.id !== bankId);
    setUserProfile(prev => ({...prev, bankAccounts: updatedBanks}));
    try {
      const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await updateDoc(profileRef, { bankAccounts: updatedBanks });
    } catch(e) {}
  };

  // FUNGSI UNTUK MENGUPLOAD KTP & SELFIE SECARA REALTIME KE FIRESTORE MENGGUNAKAN BASE64
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file || !user) return;
    
    if(type === 'ktp') setUploadingKTP(true);
    if(type === 'selfie') setUploadingSelfie(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
       const base64Str = e.target.result;
       try {
          const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
          if (type === 'ktp') {
             await updateDoc(profileRef, { ktpDataUrl: base64Str });
             setUserProfile(prev => ({...prev, ktpDataUrl: base64Str}));
             setUploadingKTP(false);
          } else if (type === 'selfie') {
             await updateDoc(profileRef, { selfieDataUrl: base64Str, verificationStatus: 'verified' });
             setUserProfile(prev => ({...prev, selfieDataUrl: base64Str, verificationStatus: 'verified'}));
             setUploadingSelfie(false);
          }
       } catch(err) {
          console.error("Upload error", err);
          if(type === 'ktp') setUploadingKTP(false);
          if(type === 'selfie') setUploadingSelfie(false);
       }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setUserProfile(prev => ({ ...prev, name: editProfileData.name, phone: editProfileData.phone }));
    try {
      const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await updateDoc(profileRef, {
        name: editProfileData.name,
        phone: editProfileData.phone
      });
    } catch (error) {
      console.error("Gagal simpan ke database", error);
    }
    handleNavigation('profile');
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const newAddr = {
      id: Date.now(),
      label: newAddressData.label || 'Alamat Baru',
      type: newAddressData.type,
      detail: newAddressData.detail,
      contact: newAddressData.contact || (userProfile?.name + ' | ' + (userProfile?.phone || '081234567890'))
    };
    setAddresses([...addresses, newAddr]);
    setNewAddressData({ label: '', type: 'Lainnya', detail: '', contact: '' });
    handleNavigation('address_list');
  };

  const handleTopUpSubmit = () => {
    if(!topupAmount || !topupMethod) return;
    const amount = parseInt(topupAmount);
    if(userProfile) { setUserProfile(prev => ({ ...prev, balance: prev.balance + amount })); }
    
    const newHistory = {
      id: Date.now(),
      type: 'topup',
      amount: amount,
      title: `Top Up Saldo (${topupMethod})`,
      date: 'Baru saja',
      status: 'Berhasil'
    };
    setWalletHistory([newHistory, ...walletHistory]);
    
    if(user) { sendNotification(user.uid, 'Dana Masuk', `Top-up saldo sebesar Rp ${amount.toLocaleString('id-ID')} berhasil.`); }
    
    handleNavigation('wallet_history');
    setTopupAmount('');
    setTopupMethod('');
  };

  const handleWithdrawSubmit = () => {
    if(!withdrawAmount || !withdrawMethod) return;
    const amount = parseInt(withdrawAmount);
    if (userProfile && amount > userProfile.balance) {
      setWithdrawError('Saldo tidak mencukupi untuk ditarik.');
      return;
    }
    if(userProfile) { setUserProfile(prev => ({ ...prev, balance: prev.balance - amount })); }
    
    const newHistory = {
      id: Date.now(),
      type: 'withdraw',
      amount: -amount,
      title: `Tarik Tunai (${withdrawMethod})`,
      date: 'Baru saja',
      status: 'Diproses'
    };
    setWalletHistory([newHistory, ...walletHistory]);
    handleNavigation('wallet_history');
    setWithdrawAmount('');
    setWithdrawMethod('');
    setWithdrawError('');
  };

  // VIEWS (LANDING, LOGIN, REGISTER)

  const dashboardProps = { currentView, handleNavigation, showNotif, setShowNotif, notifications, userRole, markAllReadNotifs, handleNotifClick };

  if (currentView === 'landing') {
    return (
      <div className="bg-white text-slate-800 min-h-screen flex flex-col font-sans">
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto w-full sticky top-0 bg-white/90 backdrop-blur-md z-50">
          <div className="flex items-center gap-8">
            <button className="text-slate-600 md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-2xl font-black text-blue-700 tracking-tighter cursor-pointer" onClick={() => handleNavigation('landing')}>HELPBLUE</div>
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
              <button onClick={() => scrollToSection('home')} className="hover:text-blue-600 transition">Home</button>
              <button onClick={() => scrollToSection('about')} className="hover:text-blue-600 transition">About</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-blue-600 transition">How it Works</button>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={() => handleNavigation('login')} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition">Login</button>
            <button onClick={() => handleNavigation('register')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all">Join / Register</button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-6 py-4 space-y-4 font-bold text-slate-600 shadow-sm absolute w-full z-40 top-[72px]">
            <div className="cursor-pointer hover:text-blue-600" onClick={() => scrollToSection('home')}>Home</div>
            <div className="cursor-pointer hover:text-blue-600" onClick={() => scrollToSection('about')}>About</div>
            <div className="cursor-pointer hover:text-blue-600" onClick={() => scrollToSection('how-it-works')}>How it Works</div>
          </div>
        )}

        <div id="home" className="animate-[fadeIn_0.4s_ease-out]">
          <section className="bg-[linear-gradient(180deg,#f8faff_0%,#ffffff_100%)] pt-12 pb-20 px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">Solve Your Daily Tasks Faster!</h1>
              <p className="text-slate-500 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
                Delivering a seamless on-demand experience for everyday tasks with a focus on efficiency, reliability, and security.
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-16">
                <button onClick={() => handleNavigation('register')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:scale-105 transition-transform text-lg">Get Started</button>
                <button className="border-2 border-blue-100 text-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-colors text-lg flex items-center justify-center gap-2">
                  <Play fill="currentColor" size={16}/> Watch Demo
                </button>
              </div>

              <div className="relative max-w-lg mx-auto">
                <div className="bg-slate-900 rounded-[2.5rem] aspect-[4/5] shadow-2xl flex items-center justify-center p-8 overflow-hidden relative border-[8px] border-white">
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                  <div className="text-slate-500 font-black text-5xl md:text-6xl opacity-30 select-none italic tracking-tighter leading-none transform -rotate-6">
                    PRODUCTIVE<br/>TASK<br/>PRIORITY
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-4 md:-left-10 bg-white p-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-50 animate-bounce">
                  <div className="bg-blue-600 w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg shadow-blue-200">
                    <ShieldHalf size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Trusted by 10k+</p>
                    <p className="text-sm font-black text-slate-800">Active daily users globally</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="about" className="py-24 px-6 bg-slate-50">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-black mb-3 text-slate-900 tracking-tight">About HelpBlue</h2>
              <div className="w-16 h-1.5 bg-blue-600 mx-auto mb-16 rounded-full"></div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[2rem] text-left shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100">
                  <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-8 font-black text-3xl">?</div>
                  <h3 className="text-xl font-black mb-4 text-slate-800">What is HelpBlue?</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">HelpBlue is a leading task management platform that connects individuals dengan skilled professionals for on-demand task completion.</p>
                </div>
                <div className="bg-white p-10 rounded-[2rem] text-left shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100">
                  <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-8"><Lightbulb size={32} /></div>
                  <h3 className="text-xl font-black mb-4 text-slate-800">Why HelpBlue Exists?</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">In a fast-paced world, we provide a reliable bridge between those who need help and those with the skills to provide it.</p>
                </div>
                <div className="bg-white p-10 rounded-[2rem] text-left shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100">
                  <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-8"><Wand2 size={32} /></div>
                  <h3 className="text-xl font-black mb-4 text-slate-800">Simplifying Tasks</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">By leveraging smart technology and rigorous verification, we eliminate the friction of outsourcing.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto">
            <h2 className="text-4xl font-black mb-4 text-center md:text-left tracking-tight text-slate-900">How It Works</h2>
            <p className="text-slate-500 mb-16 text-center md:text-left font-medium text-lg">Three simple steps to get your to-do list cleared.</p>
            <div className="space-y-12 max-w-2xl">
              <div className="flex gap-8 items-start group">
                <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-black text-xl flex-shrink-0 shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">1</div>
                <div>
                  <h4 className="font-black text-2xl mb-2 text-slate-800">Post a Task</h4>
                  <p className="text-slate-500 leading-relaxed font-medium">Describe what you need, set your budget, and choose a convenient time for the job.</p>
                </div>
              </div>
              <div className="flex gap-8 items-start border-l-4 border-blue-100 ml-7 pl-14 py-6 relative group">
                <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-black text-xl flex-shrink-0 absolute left-[-30px] shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">2</div>
                <div>
                  <h4 className="font-black text-2xl mb-2 text-slate-800">Get Matched</h4>
                  <p className="text-slate-500 leading-relaxed font-medium">Review offers from verified taskers, check their profiles, and pick the best person for you.</p>
                </div>
              </div>
              <div className="flex gap-8 items-start group">
                <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-black text-xl flex-shrink-0 shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">3</div>
                <div>
                  <h4 className="font-black text-2xl mb-2 text-slate-800">Get It Done</h4>
                  <p className="text-slate-500 leading-relaxed font-medium">Relax while your tasker completes the work. Payment is only released when you're satisfied.</p>
                </div>
              </div>
            </div>
            <div className="mt-20 bg-slate-900 rounded-[3rem] aspect-video w-full shadow-2xl relative overflow-hidden flex items-center justify-center group cursor-pointer border-[8px] border-slate-100">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/30 to-transparent mix-blend-overlay"></div>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200" alt="Video cover" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"/>
              <div className="w-24 h-24 bg-white/20 backdrop-blur-xl border-2 border-white/40 rounded-full flex items-center justify-center text-white text-3xl group-hover:scale-110 group-hover:bg-blue-600 transition-all z-10 shadow-2xl shadow-blue-900/50">
                <Play fill="currentColor" className="ml-2" />
              </div>
            </div>
          </section>

          <section className="py-24 px-6 bg-white max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight text-slate-900">Popular Categories</h2>
                <p className="text-slate-500 font-medium">Explore the most requested services on HelpBlue</p>
              </div>
              <button className="text-blue-600 font-black text-sm flex items-center gap-2 hover:gap-3 transition-all bg-blue-50 px-6 py-3 rounded-xl">View All <ArrowRight size={16}/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { img: "https://images.unsplash.com/photo-1581578731522-99457e738940?auto=format&fit=crop&q=80&w=400", title: "Cleaning", taskers: "500+" },
                { img: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400", title: "Handyman", taskers: "320+" },
                { img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400", title: "Admin Help", taskers: "150+" },
                { img: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&q=80&w=400", title: "Moving & Delivery", taskers: "450+" }
              ].map((cat, i) => (
                <div key={i} className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] h-80 shadow-md">
                  <img src={cat.img} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={cat.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-8">
                    <span className="text-[10px] bg-white/20 backdrop-blur-md text-white border border-white/20 w-fit px-4 py-1.5 rounded-full mb-3 font-black uppercase tracking-wider">{cat.taskers} Active Taskers</span>
                    <h4 className="text-white font-black text-2xl tracking-tight">{cat.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 py-24">
            <div className="max-w-5xl mx-auto bg-blue-600 rounded-[3.5rem] p-12 md:p-20 text-center text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Ready to save time?</h2>
                <p className="text-blue-100 mb-12 max-w-xl mx-auto text-lg md:text-xl font-medium leading-relaxed">Join the thousands of users who have simplified their daily routines with HelpBlue.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => handleNavigation('register')} className="bg-white text-blue-700 px-10 py-5 rounded-2xl font-black hover:bg-slate-50 hover:scale-105 transition-all shadow-xl text-lg">Become a Tasker</button>
                  <button onClick={() => handleNavigation('register')} className="bg-blue-800/40 border-2 border-blue-400 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-800 hover:scale-105 transition-all text-lg">Hire Help Now</button>
                </div>
              </div>
            </div>
          </section>

          <footer className="py-16 px-6 border-t border-slate-100 bg-white">
            <div className="max-w-7xl mx-auto text-center">
              <div className="text-3xl font-black text-slate-900 tracking-tighter mb-6">HELPBLUE</div>
              <p className="text-slate-400 text-sm mb-10 max-w-sm mx-auto leading-loose font-medium">Empowering communities through efficient service exchange.</p>
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-black text-slate-500 mb-10">
                <button onClick={() => scrollToSection('home')} className="hover:text-blue-600 transition">Home</button>
                <button onClick={() => scrollToSection('about')} className="hover:text-blue-600 transition">About</button>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-blue-600 transition">How it works</button>
              </div>
              <div className="flex justify-center gap-10 text-[11px] font-black text-slate-400 mb-12 uppercase tracking-widest">
                <a href="#" className="hover:text-blue-600 transition">Privacy Policy</a>
                <a href="#" className="hover:text-blue-600 transition">Terms of Service</a>
              </div>
              <div className="flex justify-center gap-5 mb-10">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"><Share2 size={18}/></div>
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"><Mail size={18}/></div>
              </div>
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">© 2024 HELPBLUE. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-20 px-6 font-sans">
        <div className="absolute top-6 left-6">
          <button onClick={() => handleNavigation('landing')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600"><ArrowLeft size={20}/> Back</button>
        </div>
        <div className="bg-white w-full max-w-md p-10 md:p-14 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-[fadeIn_0.3s_ease-out]">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Log in</h1>
            <p className="text-slate-500 font-medium">Welcome back! Please enter your details.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 ml-1">Email Address</label>
              <input type="email" required placeholder="name@company.com" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-black text-slate-700">Password</label>
                <a href="#" className="text-xs font-black text-blue-600 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
               <input required type={showPassword ? "text" : "password"} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  <Eye size={20} className={showPassword ? "text-blue-500" : "text-slate-400"}/>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 px-1 py-2">
              <input type="checkbox" id="remember" className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer" />
              <label htmlFor="remember" className="text-sm font-bold text-slate-600 cursor-pointer">Remember me for 30 days</label>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition tracking-wide text-lg">Log in</button>
          </form>
          <div className="relative my-12 text-center">
            <hr className="border-slate-100" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Or continue with</span>
          </div>
          <p className="text-center mt-12 text-sm font-bold text-slate-600">
            Don't have an account? <button onClick={() => handleNavigation('register')} className="text-blue-600 font-black hover:underline">Join / Register</button>
          </p>
        </div>
      </div>
    );
  }

  if (currentView === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-10 px-6 font-sans">
        <div className="absolute top-6 left-6">
          <button onClick={() => handleNavigation('landing')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600"><ArrowLeft size={20}/> Back</button>
        </div>
        <div className="bg-white w-full max-w-lg p-10 md:p-14 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-[fadeIn_0.3s_ease-out]">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">Create your account</h1>
            <p className="text-slate-500 font-medium leading-relaxed px-4">Please enter your details to register with HELPBLUE.</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">First name</label>
                <input required type="text" onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="John" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Last name</label>
                <input required type="text" onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 ml-1">Email Address</label>
              <input required type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 ml-1">Create password</label>
              <div className="relative">
               <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  <Eye size={20} className={showPassword ? "text-blue-500" : "text-slate-400"}/>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-bold italic ml-1">Must be at least 8 characters.</p>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition mt-8 text-lg">
              Create account
            </button>
          </form>
          <p className="text-center mt-12 text-sm font-bold text-slate-600">
            Already have an account? <button onClick={() => handleNavigation('login')} className="text-blue-600 font-black hover:underline">Log in</button>
          </p>
        </div>
      </div>
    );
  }

  // DASHBOARD VIEWS

  if (currentView === 'role_selection') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans relative">
        <div className="w-full max-w-md animate-[fadeIn_0.3s_ease-out] flex flex-col items-center">
          {/* Logo / Icon */}
          <div className="mb-8">
            <Send size={56} className="text-blue-600 transform -rotate-45 ml-2" strokeWidth={2.5} />
          </div>

          <h1 className="text-2xl md:text-[28px] font-black text-slate-900 mb-2 text-center tracking-tight">
            Selamat Datang di On-Demand App
          </h1>
          <p className="text-slate-500 mb-10 text-center font-medium text-sm">Pilih akses masuk kamu</p>

          <div className="w-full space-y-4">
            {/* Pilihan User */}
            <button
              onClick={() => handleRoleSelect('user')}
              className="w-full bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md p-5 rounded-2xl flex items-center transition-all group text-left"
            >
              <div className="mr-5">
                <User className="text-blue-600" size={28} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Saya Pengguna</h3>
                <p className="text-slate-500 text-xs font-medium mt-0.5">Mencari bantuan layanan</p>
              </div>
            </button>

            {/* Pilihan Helper */}
            <button
              onClick={() => handleRoleSelect('helper')}
              className="w-full bg-white border border-slate-200 hover:border-orange-500 hover:shadow-md p-5 rounded-2xl flex items-center transition-all group text-left"
            >
              <div className="mr-5">
                <Briefcase className="text-orange-600" size={28} strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Saya Helper</h3>
                <p className="text-slate-500 text-xs font-medium mt-0.5">Ingin menyediakan layanan</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // HELPER DARK DASHBOARD THEME (AKSEN HITAM/GELAP)
  // ==========================================
  if (currentView === 'home' && userRole === 'helper') {
    const currentRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : '0.0';
    const completedTasksCount = tasks.filter(t => t.helperId === user?.uid && t.status === 'history').length || 0;

    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-slate-900 text-white p-6 md:p-10 pb-24 md:pb-28 rounded-b-[3rem] relative shadow-lg shadow-black/50 border-b border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-slate-400 font-bold mb-1">Halo Partner,</p>
              <h2 className="text-2xl md:text-3xl font-black">{formData.firstName || userProfile?.name || 'Helper'}</h2>
            </div>
            <div className="flex gap-3">
              <div className="relative bg-slate-800 border border-slate-700 p-3 rounded-2xl backdrop-blur-md cursor-pointer hover:bg-slate-700 transition" onClick={() => setShowNotif(!showNotif)}>
                <Bell size={24} className="text-white" />
                {notifications.some(n => n.unread) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>}
              </div>
              <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl backdrop-blur-md cursor-pointer hover:bg-slate-700 transition" onClick={() => handleNavigation('profile')}>
                <User size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className={`border p-6 rounded-[2rem] flex items-center justify-between backdrop-blur-xl shadow-2xl transition-all duration-500 ${isOnline ? 'bg-slate-800 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-slate-800 border-slate-700'}`}>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Status Pekerjaan</p>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isOnline ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]' : 'bg-slate-600'}`}></div>
                <h3 className={`font-black text-xl transition-colors duration-300 ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </h3>
              </div>
            </div>
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${isOnline ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 shadow-md ${isOnline ? 'transform translate-x-8' : 'transform translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        <div className="px-6 md:px-10 -mt-12 grid grid-cols-2 gap-4 relative z-10">
          <div onClick={() => handleNavigation('earnings')} className="bg-slate-800 p-6 rounded-[2rem] shadow-xl shadow-black/20 border border-slate-700 cursor-pointer hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
            <div className="bg-slate-700 p-5 rounded-3xl mb-4 group-hover:bg-emerald-500/20 transition-colors border border-slate-600">
              <DollarSign size={36} className="text-emerald-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <h3 className="font-black text-white text-lg">Pendapatan</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Cek saldo & tarik tunai</p>
          </div>
          
          <div onClick={() => handleNavigation('order_feed')} className="bg-slate-800 p-6 rounded-[2rem] shadow-xl shadow-black/20 border border-slate-700 cursor-pointer hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
            <div className="bg-slate-700 p-5 rounded-3xl mb-4 group-hover:bg-blue-500/20 transition-colors border border-slate-600">
              <List size={36} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="font-black text-white text-lg">Orderan</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Cari tugas tersedia</p>
          </div>
        </div>

        <div className="p-6 md:p-10 mt-2">
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Performa Anda</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div onClick={() => handleNavigation('reviews')} className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:-translate-y-1 transition-all">
                <Star size={32} className="text-amber-400 mb-3" fill="currentColor"/>
                <h4 className="font-black text-2xl text-white mb-1">{currentRating}</h4>
                <p className="text-xs font-bold text-slate-400">Rating Helper</p>
             </div>
             <div onClick={() => { setActivityTab('history'); handleNavigation('activity'); }} className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:-translate-y-1 transition-all">
                <CheckSquare size={32} className="text-emerald-500 mb-3" />
                <h4 className="font-black text-2xl text-white mb-1">
                   {completedTasksCount}
                </h4>
                <p className="text-xs font-bold text-slate-400">Tugas Selesai</p>
             </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'order_feed' && userRole === 'helper') {
    const availableOrders = tasks.filter(t => t.status === 'pending');
    
    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => handleNavigation('home')} className="bg-slate-50 p-2 rounded-xl text-slate-600 md:hidden"><ArrowLeft size={24} /></button>
              <div>
                <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tight">Order Feed</h2>
                <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {availableOrders.length} Orderan Baru Tersedia
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan lokasi atau jenis tugas..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none" 
            />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-5 bg-slate-50 min-h-full">
          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
              <Power size={20} className="shrink-0" />
              Status Anda sedang OFFLINE. Aktifkan status di Dashboard untuk mulai bekerja.
            </div>
          )}

          {availableOrders.map(task => (
            <div key={task.id} className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-md border border-slate-100 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center font-black text-slate-600">
                    {task.requesterName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{task.requesterName}</p>
                    <p className="text-[10px] font-bold text-slate-400">Membutuhkan Bantuan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-600 tracking-tight">Rp {task.budget.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">{task.title}</h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed mb-4">{task.desc}</p>
              
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={16} className="text-red-500 shrink-0" />
                <p className="text-xs font-bold text-slate-600 truncate">{task.location || 'Lokasi belum diset'}</p>
              </div>

              <div className="pt-4 border-t border-slate-50 flex gap-3">
                <button 
                  onClick={() => { setActiveTask(task); setTaskDetailContext('explore'); handleNavigation('task_detail'); }}
                  className="flex-1 bg-slate-50 text-slate-700 font-black py-3.5 rounded-xl text-sm border border-slate-200 hover:bg-slate-100 transition"
                >
                  Detail Tugas
                </button>
                <button 
                  onClick={() => handleTakeTask(task)}
                  disabled={!isOnline}
                  className={`flex-1 font-black py-3.5 rounded-xl text-sm shadow-md transition ${isOnline ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                >
                  Terima Order
                </button>
              </div>
            </div>
          ))}

          {availableOrders.length === 0 && (
            <div className="text-center p-10 mt-10">
               <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search className="w-8 h-8 text-slate-400" />
               </div>
               <h3 className="font-black text-slate-800 text-lg mb-2">Belum Ada Orderan</h3>
               <p className="text-sm text-slate-500 font-medium">Orderan baru dari pengguna akan muncul di sini.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'earnings' && userRole === 'helper') {
    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => handleNavigation('home')} className="bg-slate-50 p-2 rounded-xl text-slate-600"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-2xl text-slate-800 tracking-tight">Pendapatan</h2>
          </div>
          <div className="bg-emerald-600 p-8 rounded-[2rem] text-white relative shadow-lg shadow-emerald-200 overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <TrendingUp size={120} />
             </div>
             <div className="relative z-10">
               <p className="text-xs text-emerald-100 font-bold uppercase tracking-widest mb-2">Saldo Bisa Ditarik</p>
               <h3 className="text-4xl font-black tracking-tight mb-6">Rp {(userProfile?.balance || 0).toLocaleString('id-ID')}</h3>
               <button onClick={() => handleNavigation('withdraw')} className="bg-white text-emerald-700 w-full md:w-auto px-8 py-3.5 rounded-xl text-sm font-black shadow-md hover:bg-emerald-50 transition">
                  Tarik Tunai (Withdraw)
               </button>
             </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-slate-50 min-h-full">
          <div className="flex justify-between items-center mb-5">
             <h4 className="font-black text-slate-800 text-lg">Riwayat Pekerjaan</h4>
             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer">Bulan Ini</span>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h5 className="font-black text-slate-800 text-sm">Beli Kopi Cafetaria</h5>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Hari ini, 10:30 AM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600 text-base">+ Rp 25.000</p>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-black">Selesai</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h5 className="font-black text-slate-800 text-sm">Print Makalah</h5>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Kemarin, 14:00</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-emerald-600 text-base">+ Rp 15.000</p>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-black">Selesai</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'home') {
    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-blue-600 text-white p-6 md:p-10 pb-24 md:pb-28 rounded-b-[3rem] relative shadow-lg shadow-blue-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-blue-200 font-bold mb-1">Welcome back,</p>
              <h2 className="text-2xl md:text-3xl font-black">{formData.firstName || userProfile?.name || 'User'}</h2>
            </div>
            <div className="flex gap-3">
              <div className="relative bg-white/10 border border-white/20 p-3 rounded-2xl backdrop-blur-md cursor-pointer hover:bg-white/20 transition" onClick={() => setShowNotif(!showNotif)}>
                <Bell size={24} className="text-white" />
                {notifications.some(n => n.unread) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-blue-600"></span>}
              </div>
              <div className="bg-white/10 border border-white/20 p-3 rounded-2xl backdrop-blur-md cursor-pointer hover:bg-white/20 transition" onClick={() => handleNavigation('profile')}>
                <User size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div onClick={() => handleNavigation('wallet_history')} className="bg-slate-900/40 border border-white/10 p-5 rounded-[2rem] flex items-center justify-between backdrop-blur-xl shadow-2xl cursor-pointer hover:bg-slate-900/60 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/50 p-3 rounded-2xl"><Wallet className="text-white" size={24}/></div>
              <div>
                <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-1">HelpPay Balance</p>
                <p className="font-black text-xl md:text-2xl">Rp {(userProfile?.balance || 0).toLocaleString('id-ID')}</p>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleNavigation('top_up'); }} className="bg-white text-blue-700 text-sm font-black px-5 py-3 rounded-xl hover:scale-105 transition">
              Top Up
            </button>
          </div>
        </div>

        <div className="px-6 md:px-10 -mt-12 grid grid-cols-2 gap-4 relative z-10">
          <div onClick={() => handleNavigation('post_task')} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 cursor-pointer hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
            <div className="bg-blue-50 p-5 rounded-3xl mb-4 group-hover:bg-blue-600 transition-colors">
              <PlusCircle size={36} className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">Post Task</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Need help?</p>
          </div>
          
          <div onClick={() => { setActivityTab('pending'); handleNavigation('activity'); }} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 cursor-pointer hover:-translate-y-1 transition-all flex flex-col items-center text-center group">
            <div className="bg-emerald-50 p-5 rounded-3xl mb-4 group-hover:bg-emerald-500 transition-colors">
              <FileText size={36} className="text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">My Orders</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Track your tasks</p>
          </div>
        </div>

        <div className="p-6 md:p-10 mt-2">
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-black text-2xl text-slate-900 tracking-tight">My Recent Tasks</h3>
            <button onClick={() => { setActivityTab('pending'); handleNavigation('activity'); }} className="text-blue-600 font-bold text-sm hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {tasks.filter(t => t.requesterId === (user?.uid || 'guest-123')).slice(0, 3).map(task => (
              <div key={task.id} onClick={() => { 
                setActiveTask(task); 
                setTaskDetailContext('user');
                handleNavigation('task_detail'); 
              }} className="bg-white p-5 rounded-[2rem] shadow-sm hover:shadow-md border border-slate-100 flex gap-5 cursor-pointer transition-all">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl h-fit">
                  <MapPin size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-black text-lg text-slate-800 leading-tight">{task.title}</h4>
                    <span className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl ml-3 whitespace-nowrap">Rp {task.budget.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">{task.category} • <span className={`font-bold ${task.status === 'pending' ? 'text-amber-600' : task.status === 'ongoing' ? 'text-blue-600' : 'text-emerald-600'}`}>{task.status}</span></p>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.requesterId === (user?.uid || 'guest-123')).length === 0 && (
              <div className="text-center p-10 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-500 font-bold">
                Belum ada task yang di-post. Klik "Post Task" untuk mulai!
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'explore') {
    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => handleNavigation('home')} className="bg-slate-50 p-2 rounded-xl text-slate-600 md:hidden"><ArrowLeft size={24} /></button>
              <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tight">Find Helper</h2>
            </div>
            <button onClick={() => setShowNotif(!showNotif)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
              <Bell size={24}/>
              {notifications.some(n => n.unread) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Search size={14}/></div>
            <p className="text-xs font-bold text-blue-700">Temukan Helper yang tersedia untuk mengerjakan tugas serupa dengan milikmu</p>
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari tugas atau kata kunci..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition" 
            />
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
               <button onClick={() => setSortBy('nearest')} className={`px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap transition ${sortBy === 'nearest' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>Nearest</button>
               <button onClick={() => setSortBy('highest_pay')} className={`px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap transition ${sortBy === 'highest_pay' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>Highest Pay</button>
            </div>
            
            {['All', 'Cleaning', 'Jasa Titip', 'Akademik', 'Handyman', 'Teknis'].map(cat => (
               <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
               >
                  {cat}
               </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-5 bg-slate-50 min-h-full">
          {filteredExploreTasks.map(task => (
            <div key={task.id} onClick={() => { 
              setActiveTask(task); 
              setTaskDetailContext('explore');
              handleNavigation('task_detail'); 
            }} className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-md border border-slate-100 cursor-pointer transition-all hover:-translate-y-1">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-blue-700">
                    {task.requesterName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{task.requesterName}</p>
                    <div className="flex items-center text-xs text-amber-500 font-bold mt-0.5">
                      <Star size={12} fill="currentColor" className="mr-1" /> {task.requesterRating || '5.0'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600 tracking-tight">Rp {task.budget.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">{task.title}</h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{task.desc}</p>
              <div className="mt-6 pt-5 border-t border-slate-50 flex justify-between items-center">
                <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg font-black uppercase tracking-wider">{task.category}</span>
                <button className="text-sm font-black text-blue-600 flex items-center gap-1 hover:gap-2 transition-all">View Details <ChevronRight size={16}/></button>
              </div>
            </div>
          ))}
          {filteredExploreTasks.length === 0 && (
            <div className="text-center p-10 bg-white border border-slate-100 rounded-[2rem] text-slate-500 font-bold flex flex-col items-center">
              <Search className="w-12 h-12 text-slate-300 mb-4" />
              <p>Tidak ada tugas yang sesuai dengan pencarian atau filter.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Map Location Picker
  if (currentView === 'post_task') {
    return (
      <DashboardLayout {...dashboardProps}>
        {/* Map picker overlay - fullscreen */}
        {showMapPicker && (
          <MapLocationPicker
            value={taskForm.location}
            onChange={(addr) => setTaskForm({ ...taskForm, location: addr })}
            onClose={() => setShowMapPicker(false)}
          />
        )}

        <HeaderWithBack title="Post New Task" onBack={()=>handleNavigation('home')}/>
        <div className="p-6 md:p-10 max-w-2xl mx-auto">
          <form onSubmit={handlePostTask} className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Task Title</label>
                <input required value={taskForm.title} onChange={(e)=>setTaskForm({...taskForm, title: e.target.value})} placeholder="e.g. Buy coffee from cafeteria" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Detailed Description</label>
                <textarea required value={taskForm.desc} onChange={(e)=>setTaskForm({...taskForm, desc: e.target.value})} placeholder="Specify what you need exactly..." rows="4" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Budget (Rp)</label>
                  <input type="number" required value={taskForm.budget} onChange={(e)=>setTaskForm({...taskForm, budget: e.target.value})} placeholder="50000" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-black text-slate-700 text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Category</label>
                  <select value={taskForm.category} onChange={(e)=>setTaskForm({...taskForm, category: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-bold text-slate-700 appearance-none">
                    <option>Cleaning</option>
                    <option>Delivery</option>
                    <option>Akademik</option>
                    <option>Handyman</option>
                    <option>Teknis</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Map Location Picker Field */}
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1">Lokasi Penjemputan / Pengantaran</label>
                
                {/* Map preview button */}
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="w-full border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-500 rounded-2xl px-5 py-4 flex items-center gap-3 transition-all group"
                >
                  <div className="bg-blue-600 p-2 rounded-xl text-white group-hover:scale-110 transition-transform shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    {taskForm.location ? (
                      <>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Lokasi Dipilih</p>
                        <p className="text-sm font-bold text-slate-700 truncate leading-snug">{taskForm.location}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-black text-blue-600">Pilih Lokasi di Peta</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Tap untuk membuka peta interaktif</p>
                      </>
                    )}
                  </div>
                  {taskForm.location && (
                    <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shrink-0">Ubah</div>
                  )}
                </button>

                {/* Manual input fallback */}
                <div className="relative">
                  <input 
                    value={taskForm.location} 
                    onChange={(e)=>setTaskForm({...taskForm, location: e.target.value})} 
                    placeholder="Atau ketik alamat manual di sini..." 
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-5 pr-6 py-3.5 focus:ring-0 focus:border-blue-500 focus:bg-white outline-none transition font-medium text-slate-700 text-sm" 
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-bold ml-1 flex items-center gap-1">
                  <Navigation size={11}/> Gunakan peta untuk akurasi lokasi yang lebih baik
                </p>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition text-lg">
              Publish Task
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'task_detail' && activeTask) {
    const isOwnTask = activeTask.requesterId === (user?.uid || 'guest-123');
    const isFromDashboard = taskDetailContext === 'user';

    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title={isOwnTask ? "Detail Pesanan" : "Task Details"} onBack={()=>handleNavigation(isFromDashboard ? 'home' : 'explore')}/>
        <div className="p-6 md:p-10 max-w-2xl mx-auto pb-32">
          
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-black uppercase tracking-wider">
              {activeTask.category}
            </div>
            {isOwnTask && (
              <div className={`text-xs px-3 py-1.5 rounded-lg font-black uppercase tracking-wider ${
                activeTask.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                activeTask.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {activeTask.status === 'pending' ? 'Menunggu Helper' : activeTask.status === 'ongoing' ? 'Sedang Dikerjakan' : 'Selesai'}
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4 tracking-tight">{activeTask.title}</h1>
          <p className="text-slate-600 text-base md:text-lg mb-8 font-medium leading-relaxed">{activeTask.desc}</p>

          <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-[2.5rem] p-6 md:p-8 mb-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
               <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-700">
                  {activeTask.requesterName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Requester</p>
                  <p className="font-black text-xl text-slate-800">{activeTask.requesterName}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 p-5 rounded-3xl">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Reward</p>
                <p className="font-black text-2xl text-emerald-600 tracking-tight">Rp {activeTask.budget.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-3xl">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Kategori</p>
                <p className="font-black text-slate-700">{activeTask.category}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-3xl">
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2">Lokasi</p>
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-red-500 mt-0.5 shrink-0" />
                <p className="font-black text-slate-700 leading-relaxed">{activeTask.location || activeTask.distance || 'Lokasi belum diset'}</p>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeTask.location || activeTask.distance || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-blue-600 text-xs font-black hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Navigation size={14}/> Buka di Google Maps
              </a>
            </div>
          </div>

          {isOwnTask && (
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 mb-6">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-600"/> Ringkasan Pesanan
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">Biaya Jasa</span>
                  <span className="font-black text-slate-800">Rp {activeTask.budget.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">Biaya Platform</span>
                  <span className="font-black text-slate-800">Rp 2.000</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-black text-slate-800">Total</span>
                  <span className="font-black text-blue-700 text-lg">Rp {(activeTask.budget + 2000).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {isOwnTask && activeTask.status === 'history' && !activeTask.isReviewed && (
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 mb-6">
              <h3 className="font-black text-slate-800 mb-3">Beri Nilai Helper</h3>
              <div className="flex gap-2 mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={28} onClick={() => setRatingInput(star)} className={`cursor-pointer ${ratingInput >= star ? 'text-amber-400' : 'text-slate-200'}`} fill={ratingInput >= star ? 'currentColor' : 'none'}/>
                ))}
              </div>
              <textarea value={reviewInput} onChange={(e) => setReviewInput(e.target.value)} placeholder="Tulis ulasan Anda..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-blue-500 mb-3" rows="3"></textarea>
              <button onClick={() => handleSubmitReview(activeTask.id, activeTask.helperId)} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-md hover:bg-blue-700 transition">Kirim Ulasan</button>
            </div>
          )}

          {isOwnTask && activeTask.status === 'ongoing' && activeTask.helperName && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 mb-6">
              <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-2">Helper Kamu</p>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg">
                  {activeTask.helperName.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-800">{activeTask.helperName}</p>
                  <p className="text-xs text-emerald-600 font-bold">Sedang menuju lokasimu</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="fixed md:absolute bottom-0 w-full md:w-auto md:left-6 md:right-6 md:bottom-6 bg-white md:bg-transparent p-4 md:p-0 border-t border-slate-100 md:border-none shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-none z-20">
          {isOwnTask ? (
            <div className="flex gap-3">
              {activeTask.status === 'ongoing' && (
                <button 
                  onClick={() => handleNavigation('chat_list')}
                  className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition text-base flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20}/> Chat Helper
                </button>
              )}
              {activeTask.status === 'pending' && (
                <button 
                  onClick={() => handleCancelTask(activeTask.id)}
                  className="flex-1 bg-red-50 text-red-600 border-2 border-red-100 font-black py-5 rounded-2xl hover:bg-red-100 transition text-base flex items-center justify-center gap-2"
                >
                  <XCircle size={20}/> Batalkan Pesanan
                </button>
              )}
              {activeTask.status === 'history' && (
                <button 
                  onClick={() => handleNavigation('activity')}
                  className="flex-1 bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition text-base"
                >
                  Lihat Riwayat
                </button>
              )}
            </div>
          ) : (
            !isOwnTask && activeTask.status === 'pending' && (
              <button 
                onClick={() => handleTakeTask(activeTask)}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition text-lg"
              >
                Accept This Task
              </button>
            )
          )}
          {!isOwnTask && activeTask.status === 'ongoing' && (
             <div className="flex gap-3">
               <button onClick={() => handleNavigation('chat_list')} className="flex-1 bg-slate-100 text-slate-700 font-black py-5 rounded-2xl hover:bg-slate-200 transition text-lg flex items-center justify-center gap-2">
                  Chat User
               </button>
               <button onClick={() => handleFinishTask(activeTask.id)} className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] transition text-lg flex items-center justify-center gap-2">
                  Selesaikan Tugas
               </button>
             </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'activity') {
    const renderTasks = (statusFilter) => {
      let filtered = tasks.filter(t => t.status === statusFilter);
      
      if (user) {
        if(userRole === 'helper') {
          filtered = filtered.filter(t => t.helperId === user.uid);
        } else {
          filtered = filtered.filter(t => t.requesterId === user.uid);
        }
      } else {
        filtered = filtered.filter(t => t.requesterId === 'guest-123');
      }

      if (filtered.length === 0) {
        return (
          <div className="text-center text-slate-400 mt-20 flex flex-col items-center">
            <div className="bg-slate-100 p-6 rounded-full mb-6"><Clock size={48} className="text-slate-300" /></div>
            <p className="font-bold text-lg mb-2">
              {statusFilter === 'pending' ? 'Belum ada pesanan yang menunggu.' :
               statusFilter === 'ongoing' ? 'Tidak ada pesanan yang sedang berjalan.' :
               'Belum ada riwayat pesanan.'}
            </p>
            {statusFilter === 'pending' && userRole !== 'helper' && (
              <button onClick={() => handleNavigation('post_task')} className="mt-4 bg-blue-600 text-white font-black px-6 py-3 rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 transition text-sm">
                + Post Task Baru
              </button>
            )}
          </div>
        );
      }

      return filtered.map(task => (
        <div key={task.id} 
          onClick={() => { setActiveTask(task); setTaskDetailContext(userRole === 'helper' ? 'explore' : 'user'); handleNavigation('task_detail'); }}
          className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-md border border-slate-100 mb-5 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-black text-lg text-slate-800 tracking-tight">{task.title}</h4>
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${
              task.status === 'pending' ? 'bg-amber-100 text-amber-700' :
              task.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {task.status === 'pending' ? 'Menunggu' : task.status === 'ongoing' ? 'Berjalan' : 'Selesai'}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-bold mb-3 flex items-center gap-2">
            <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Rp {task.budget.toLocaleString('id-ID')}</span> 
            <span>•</span> {task.category}
          </p>
          <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mb-4">
            <MapPin size={12} className="text-red-400"/> {task.location || task.distance || 'Lokasi belum diset'}
          </p>
          
          {task.status === 'ongoing' && (
            <div className="flex flex-col sm:flex-row gap-3 mt-2 pt-5 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleNavigation('chat_list')} className={`flex-1 ${userRole === 'helper' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} text-sm font-black py-4 rounded-xl flex justify-center items-center gap-2 transition`}>
                <MessageCircle size={18} /> Chat {userRole === 'helper' ? 'User' : 'Helper'}
              </button>
            </div>
          )}
          {task.status === 'pending' && userRole !== 'helper' && (
            <div className="flex gap-3 mt-2 pt-4 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => handleCancelTask(task.id)}
                className="flex-1 bg-red-50 text-red-600 text-sm font-black py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-red-100 transition border border-red-100"
              >
                <XCircle size={16} /> Batalkan
              </button>
              <button 
                onClick={() => { setActiveTask(task); setTaskDetailContext('user'); handleNavigation('task_detail'); }}
                className="flex-1 bg-slate-50 text-slate-700 text-sm font-black py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-slate-100 transition border border-slate-200"
              >
                <FileText size={16} /> Detail
              </button>
            </div>
          )}
        </div>
      ));
    };

    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-slate-100">
          <div className="flex items-center gap-4 mb-6 md:hidden">
            <button onClick={() => handleNavigation('home')} className="bg-slate-50 p-2 rounded-xl text-slate-600"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-2xl text-slate-800 tracking-tight">My Activity</h2>
          </div>
          <h2 className="hidden md:block font-black text-3xl text-slate-800 tracking-tight mb-8">My Activity</h2>
          
          <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem]">
            {['pending', 'ongoing', 'history'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActivityTab(tab)}
                className={`flex-1 text-sm font-black py-3 rounded-xl capitalize transition-all ${activityTab === tab ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab === 'pending' ? 'Menunggu' : tab === 'ongoing' ? 'Berjalan' : 'Riwayat'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 md:p-8 bg-slate-50 min-h-full">
          {renderTasks(activityTab)}
        </div>
      </DashboardLayout>
    );
  }

  // =======================================================
  // CHAT LIST VIEW (REAL-TIME FIREBASE)
  // =======================================================
  if (currentView === 'chat_list') {
    const activeConversations = chats.filter(c => userRole === 'helper' ? c.helperId === user?.uid : c.userId === user?.uid);
    const totalUnread = 0; 

    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => handleNavigation('home')} className="bg-slate-50 p-2 rounded-xl text-slate-600 md:hidden"><ArrowLeft size={24} /></button>
              <div>
                <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tight">Messages</h2>
                {totalUnread > 0 && <p className="text-xs font-bold text-blue-600 mt-0.5">{totalUnread} pesan belum dibaca</p>}
              </div>
            </div>
            <button onClick={() => setShowNotif(!showNotif)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
              <Bell size={24}/>
              {notifications.some(n => n.unread) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
          </div>

          <div className="relative mt-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari percakapan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition"
            />
          </div>
        </div>

        <div className="bg-white divide-y divide-slate-50 min-h-full">
          {activeConversations.map((convo) => {
            const displayName = userRole === 'helper' ? convo.userName : convo.helperName;
            const initial = displayName ? displayName.charAt(0) : '?';
            const displayTime = convo.updatedAt ? new Date(convo.updatedAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '';
            
            return (
              <div key={convo.id} onClick={() => { setActiveChatContact(convo); handleNavigation('chat'); }}
                className="flex items-center gap-4 p-5 md:p-6 cursor-pointer hover:bg-slate-50 transition-colors active:bg-blue-50"
              >
                <div className="relative shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md ${userRole === 'helper' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                    {initial}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-black text-slate-800 text-base truncate">{displayName}</h4>
                    <span className="text-[11px] font-bold shrink-0 ml-2 text-slate-400">{displayTime}</span>
                  </div>
                  <p className="text-xs font-bold text-blue-500 mb-1.5 truncate">📋 {convo.taskTitle}</p>
                  <p className="text-sm text-slate-500 font-medium truncate leading-snug">{convo.lastMessage || 'Mulai percakapan...'}</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 shrink-0" />
              </div>
            );
          })}

          {activeConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="bg-slate-100 p-8 rounded-3xl mb-6"><MessageCircle size={48} className="text-slate-300" /></div>
              <h3 className="font-black text-slate-700 text-lg mb-2">Belum ada percakapan</h3>
              <p className="text-slate-400 font-medium text-sm">Percakapan dengan {userRole === 'helper' ? 'Pengguna' : 'Helper'} akan muncul di sini setelah ada task yang diambil.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // =======================================================
  // CHAT ROOM VIEW (REAL-TIME FIREBASE)
  // =======================================================
  if (currentView === 'chat') {
    const currentActiveChat = chats.find(c => c.id === activeChatContact?.id) || activeChatContact;
    const messages = currentActiveChat?.messages ||[];
    const displayName = userRole === 'helper' ? currentActiveChat?.userName : currentActiveChat?.helperName;
    const initial = displayName ? displayName.charAt(0) : '?';

    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-white p-4 md:p-5 sticky top-0 z-10 flex items-center justify-between shadow-sm border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button onClick={() => handleNavigation('chat_list')} className="bg-slate-50 p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"><ArrowLeft size={20} /></button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md ${userRole === 'helper' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
              {initial}
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 leading-none mb-1">{displayName}</h2>
              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active Room
              </span>
            </div>
          </div>
          {currentActiveChat?.taskTitle && (
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl hidden sm:block">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider truncate max-w-[150px]">📋 {currentActiveChat.taskTitle}</p>
            </div>
          )}
        </div>

        <div className="p-5 md:p-6 space-y-4 bg-slate-50 flex-1 min-h-[calc(100vh-280px)] pb-32">
          {messages.length === 0 ? (
             <div className="text-center text-slate-400 font-bold text-sm mt-10">Mulai percakapan sekarang...</div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.from === userRole;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white mr-2 shrink-0 mt-1 ${userRole === 'helper' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                      {initial}
                    </div>
                  )}
                  <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                    isMe ? (userRole === 'helper' ? 'bg-emerald-600 text-white rounded-br-none shadow-emerald-200' : 'bg-blue-600 text-white rounded-br-none shadow-blue-200') : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1.5 text-right font-bold ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-white p-4 md:p-5 border-t border-slate-100 flex gap-3 fixed md:absolute bottom-0 w-full shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-20">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ketik pesan..." 
            className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:bg-white focus:border-blue-500 transition"
          />
          <button 
            onClick={handleSendMessage}
            className={`${userRole === 'helper' ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'} w-13 h-13 min-w-[52px] min-h-[52px] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg hover:scale-105 transition-all`}
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // PROFILE & SUB-VIEWS 

  if (currentView === 'profile') {
    return (
      <DashboardLayout {...dashboardProps}>
         <div className="bg-white p-6 sticky top-0 z-10 flex items-center justify-between shadow-sm border-b border-slate-100">
           <div className="flex items-center gap-4">
            <button onClick={() => handleNavigation('home')} className="bg-slate-50 p-2 rounded-xl text-slate-600 md:hidden"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-2xl text-slate-800">Akun Saya</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNotif(!showNotif)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
              <Bell size={24}/>
              {notifications.some(n => n.unread) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
            <button onClick={() => handleNavigation('edit_profile')} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full">
              <Settings size={24}/>
            </button>
          </div>
        </div>
        
        <div className="p-4 md:p-8 bg-slate-50 min-h-full space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg ${userRole === 'helper' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'}`}>
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
                {userProfile?.name || 'User Name'}
                {userProfile?.verificationStatus === 'verified' && <ShieldHalf className="text-blue-500" size={18} />}
              </h2>
              <p className="text-slate-500 text-sm font-bold mb-2">{userProfile?.email}</p>
              <div className="flex items-center text-amber-500 text-xs font-black">
                <Star size={14} fill="currentColor" className="mr-1"/> {userProfile?.rating || '5.0'} {userRole === 'helper' ? 'Helper Rating' : 'User Rating'}
              </div>
            </div>
          </div>

          <div onClick={() => handleNavigation('wallet_history')} className={`rounded-[2rem] p-6 flex justify-between items-center shadow-lg relative overflow-hidden group cursor-pointer transition-colors ${userRole === 'helper' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'}`}>
            <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] ${userRole === 'helper' ? 'from-emerald-500' : 'from-blue-500'} via-transparent to-transparent`}></div>
            <div className="flex gap-4 items-center z-10">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md"><Wallet className={userRole === 'helper' ? "text-emerald-400" : "text-blue-400"} size={24}/></div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{userRole === 'helper' ? 'Saldo Pendapatan' : 'HelpPay Balance'}</p>
                <p className="font-black text-2xl text-white tracking-tight">Rp {(userProfile?.balance || 0).toLocaleString('id-ID')}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400 z-10" />
          </div>

          <div className="space-y-4">
            {userRole === 'helper' ? (
              <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <h3 className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Profil Helper</h3>
                <MenuRow icon={<User size={20}/>} label="Ubah Profil" onClick={()=>handleNavigation('edit_profile')}/>
                <MenuRow icon={<Briefcase size={20}/>} label="Layanan & Keahlian" onClick={()=>handleNavigation('helper_services')}/>
                <MenuRow icon={<Building size={20}/>} label="Rekening Bank" onClick={()=>handleNavigation('bank_account')}/>
                <MenuRow icon={<FileText size={20}/>} label="Dokumen Verifikasi" onClick={()=>handleNavigation('verification')}/>
              </div>
            ) : (
              <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <h3 className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Profil Saya</h3>
                <MenuRow icon={<User size={20}/>} label="Ubah Profil" onClick={()=>handleNavigation('edit_profile')}/>
                <MenuRow icon={<MapPin size={20}/>} label="Daftar Alamat" onClick={()=>handleNavigation('address_list')}/>
              </div>
            )}

            <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
              <h3 className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Keamanan & Privasi</h3>
              <MenuRow icon={<Shield size={20}/>} label="Keamanan Akun" onClick={()=>handleNavigation('security')}/>
              <MenuRow icon={<Lock size={20}/>} label="Privasi Akun" onClick={()=>handleNavigation('privacy')}/>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
              <h3 className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Aktivitas Saya</h3>
              <MenuRow icon={<Star size={20}/>} label="Ulasan & Rating" onClick={()=>handleNavigation('reviews')}/>
              <MenuRow icon={<History size={20}/>} label="Riwayat Saldo" onClick={()=>handleNavigation('wallet_history')}/>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
              <h3 className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">Info Lainnya</h3>
              <MenuRow icon={<HelpCircle size={20}/>} label="Pusat Bantuan" onClick={()=>handleNavigation('help_center')}/>
              <MenuRow icon={<Info size={20}/>} label="Seputar HelpBlue" onClick={()=>handleNavigation('about')}/>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm mt-6">
              <MenuRow icon={<LogOut size={20}/>} label="Keluar Akun" isRed onClick={()=>handleNavigation('landing')}/>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =======================================================
  // MENU HELPER PROFILE SUB-VIEWS (INTERAKTIF & DATABASE)
  // =======================================================

  if (currentView === 'helper_services') {
    const availableServices =['Cleaning', 'Delivery / Jastip', 'Akademik', 'Handyman / Reparasi', 'Teknis / IT', 'Pindahan'];
    const myServices = userProfile?.services ||[];

    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Layanan & Keahlian" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-10 max-w-xl mx-auto space-y-6">
           <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl flex items-start gap-4 shadow-lg">
              <Info className="text-emerald-500 shrink-0 mt-0.5"/>
              <p className="text-sm font-bold text-slate-300">Pilih jenis layanan yang Anda kuasai. Anda akan menerima notifikasi Order Feed yang relevan dengan keahlian Anda.</p>
           </div>
           
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <h3 className="font-black text-slate-800 mb-4 text-lg">Katalog Keahlian</h3>
             <div className="space-y-3">
               {availableServices.map(srv => {
                 const isActive = myServices.includes(srv);
                 return (
                   <div 
                     key={srv} 
                     onClick={() => toggleService(srv)}
                     className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                   >
                      <span className={`font-black ${isActive ? 'text-emerald-700' : 'text-slate-600'}`}>{srv}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                         {isActive && <CheckCircle size={14}/>}
                      </div>
                   </div>
                 )
               })}
             </div>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'bank_account') {
    const myBanks = userProfile?.bankAccounts ||[];
    
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Rekening Bank" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-10 max-w-xl mx-auto space-y-6">
           
           <div className="bg-slate-900 p-6 rounded-[2rem] shadow-lg text-white">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Daftar Rekening Penarikan</h3>
              {myBanks.length === 0 ? (
                <p className="text-sm text-slate-500 font-bold mb-2">Belum ada rekening yang ditambahkan.</p>
              ) : (
                <div className="space-y-3">
                  {myBanks.map(bank => (
                    <div key={bank.id} className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex justify-between items-center">
                       <div>
                         <p className="font-black text-emerald-400">{bank.bankName}</p>
                         <p className="font-bold text-slate-300 tracking-wider my-1">{bank.accountNumber}</p>
                         <p className="text-xs text-slate-500 uppercase font-black">a.n {bank.accountName}</p>
                       </div>
                       <button onClick={() => handleDeleteBankAccount(bank.id)} className="bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <form onSubmit={handleAddBankAccount} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
             <h3 className="font-black text-slate-800 text-lg mb-2">Tambah Rekening Baru</h3>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Nama Bank</label>
                <select value={newBankAccount.bankName} onChange={(e)=>setNewBankAccount({...newBankAccount, bankName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none">
                  <option>BCA</option><option>Mandiri</option><option>BNI</option><option>BRI</option><option>BSI</option><option>Gopay / OVO / Dana</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Nomor Rekening / E-Wallet</label>
                <input required type="number" value={newBankAccount.accountNumber} onChange={(e)=>setNewBankAccount({...newBankAccount, accountNumber: e.target.value})} placeholder="Contoh: 1234567890" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Nama Pemilik Rekening</label>
                <input required type="text" value={newBankAccount.accountName} onChange={(e)=>setNewBankAccount({...newBankAccount, accountName: e.target.value})} placeholder="Sesuai buku tabungan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
             </div>
             <button type="submit" className="w-full bg-black text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-800 mt-2 transition">Simpan Rekening</button>
           </form>

        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'verification') {
    const isVerified = userProfile?.verificationStatus === 'verified';

    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Dokumen Verifikasi" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-10 max-w-xl mx-auto space-y-6">
           
           {/* Tambahkan file input tersembunyi yang menerima tangkapan gambar secara native dari perangkat pengguna */}
           <input type="file" accept="image/*" ref={ktpInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'ktp')} />
           <input type="file" accept="image/*" capture="environment" ref={selfieInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'selfie')} />
           
           {isVerified ? (
             <div className="bg-slate-900 text-white p-8 rounded-[2rem] text-center shadow-lg border border-slate-800">
               <div className="bg-emerald-500/20 text-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                 <ShieldHalf size={40} />
               </div>
               <h2 className="text-2xl font-black mb-2 tracking-tight">Akun Terverifikasi!</h2>
               <p className="text-slate-400 font-bold text-sm">Terima kasih, dokumen Anda valid. Anda kini mendapat lencana "Verified Helper" dan dapat menerima orderan prioritas.</p>
             </div>
           ) : (
             <>
               <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4">
                  <ShieldHalf className="text-amber-600 shrink-0 mt-0.5"/>
                  <p className="text-sm font-bold text-amber-800">Harap unggah identitas asli Anda untuk keamanan pengguna aplikasi. Data Anda dijamin kerahasiaannya.</p>
               </div>

               <div className="space-y-4">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                    <div className="bg-slate-50 w-full h-40 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center mb-4 overflow-hidden">
                      {uploadingKTP ? (
                        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                      ) : userProfile?.ktpDataUrl ? (
                        <img src={userProfile.ktpDataUrl} alt="Preview KTP" className="w-full h-full object-cover" />
                      ) : (
                        <><CreditCard size={32} className="text-slate-400 mb-2"/> <p className="text-sm font-bold text-slate-500">Preview KTP</p></>
                      )}
                    </div>
                    <h3 className="font-black text-slate-800 mb-1">Upload KTP Asli</h3>
                    <p className="text-xs text-slate-400 font-bold mb-4">Format JPG/PNG maksimal 2MB</p>
                    <button onClick={() => ktpInputRef.current.click()} disabled={uploadingKTP} className="w-full bg-slate-900 text-white font-black py-3.5 rounded-xl border border-slate-800 hover:bg-slate-800 flex items-center justify-center gap-2 transition">
                       <Upload size={18}/> {uploadingKTP ? 'Mengunggah...' : (userProfile?.ktpDataUrl ? 'Ubah Foto KTP' : 'Pilih Foto KTP')}
                    </button>
                 </div>

                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                    <div className="bg-slate-50 w-full h-40 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center mb-4 overflow-hidden">
                      {uploadingSelfie ? (
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : userProfile?.selfieDataUrl ? (
                        <img src={userProfile.selfieDataUrl} alt="Preview Selfie" className="w-full h-full object-cover" />
                      ) : (
                        <><Camera size={32} className="text-slate-400 mb-2"/> <p className="text-sm font-bold text-slate-500">Preview Selfie</p></>
                      )}
                    </div>
                    <h3 className="font-black text-slate-800 mb-1">Selfie dengan KTP</h3>
                    <p className="text-xs text-slate-400 font-bold mb-4">Pastikan wajah dan tulisan KTP terlihat jelas</p>
                    <button onClick={() => selfieInputRef.current.click()} disabled={uploadingSelfie} className="w-full bg-emerald-50 text-emerald-600 font-black py-3.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 flex items-center justify-center gap-2 transition">
                       <Camera size={18}/> {uploadingSelfie ? 'Memverifikasi...' : (userProfile?.selfieDataUrl ? 'Ubah Foto Selfie' : 'Ambil Foto Selfie')}
                    </button>
                 </div>
               </div>
             </>
           )}
        </div>
      </DashboardLayout>
    );
  }

  // =======================================================

  if (currentView === 'edit_profile') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Ubah Profil" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-8 max-w-xl mx-auto">
           <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-xl ${userRole === 'helper' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-blue-600 shadow-blue-200'}`}>
                  {userProfile?.name?.charAt(0) || 'U'}
                </div>
                <button className={`absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-100 hover:scale-110 transition ${userRole === 'helper' ? 'text-emerald-600' : 'text-blue-600'}`}><PlusCircle size={20}/></button>
              </div>
           </div>
           <div className="space-y-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="space-y-2">
               <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
               <input 
                  type="text" 
                  value={editProfileData.name} 
                  onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none ${userRole === 'helper' ? 'focus:border-emerald-500' : 'focus:border-blue-500'}`} 
                />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Email</label>
               <input type="email" value={userProfile?.email || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-500" disabled />
               <p className="text-[10px] text-slate-400 font-bold ml-1">Email tidak dapat diubah.</p>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Nomor HP</label>
               <input 
                  type="tel" 
                  value={editProfileData.phone} 
                  onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none ${userRole === 'helper' ? 'focus:border-emerald-500' : 'focus:border-blue-500'}`} 
               />
             </div>
             <button onClick={handleSaveProfile} className={`w-full text-white font-black py-4 rounded-xl shadow-lg mt-4 transition ${userRole === 'helper' ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}>
                Simpan Perubahan
             </button>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'address_list') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Daftar Alamat" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-8 space-y-4 max-w-xl mx-auto">
          <button onClick={() => handleNavigation('add_address')} className="w-full border-2 border-dashed border-slate-300 text-slate-500 font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 transition">
            <PlusCircle size={20}/> Tambah Alamat Baru
          </button>
          
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
               {addr.type === 'Utama' && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>}
               <div className="flex justify-between items-start mb-2 pl-3">
                 <h4 className="font-black text-slate-800">{addr.label} {addr.type === 'Utama' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded ml-2 uppercase">Utama</span>}</h4>
                 <button className="text-blue-600 text-sm font-bold">Ubah</button>
               </div>
               <p className="text-sm font-bold text-slate-500 pl-3">{addr.contact}</p>
               <p className="text-sm text-slate-600 mt-2 pl-3 leading-relaxed">{addr.detail}</p>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'add_address') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Tambah Alamat" onBack={()=>handleNavigation('address_list')} />
        <div className="p-6 md:p-8 max-w-xl mx-auto">
           <form onSubmit={handleSaveAddress} className="space-y-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <div className="space-y-2">
               <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Label Alamat</label>
               <input 
                  required
                  type="text" 
                  placeholder="Misal: Rumah Kos, Kantor"
                  value={newAddressData.label}
                  onChange={(e) => setNewAddressData({...newAddressData, label: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" 
                />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Detail Lengkap Alamat</label>
               <textarea 
                  required
                  rows="3"
                  placeholder="Nama jalan, gedung, RT/RW..."
                  value={newAddressData.detail}
                  onChange={(e) => setNewAddressData({...newAddressData, detail: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" 
               ></textarea>
             </div>
             <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 mt-4 hover:bg-blue-700 transition">
                Simpan Alamat Baru
             </button>
           </form>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'top_up') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Top Up HelpPay" onBack={()=>handleNavigation('home')} />
        <div className="p-6 md:p-8 max-w-xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <h3 className="font-black text-slate-800 mb-4">Pilih Nominal Top Up</h3>
             <div className="grid grid-cols-2 gap-3">
               {[50000, 100000, 150000, 300000].map(amount => (
                 <button 
                   key={amount}
                   onClick={() => setTopupAmount(amount.toString())}
                   className={`py-3 rounded-xl font-black text-sm border-2 transition ${topupAmount === amount.toString() ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-300'}`}
                 >
                   Rp {amount.toLocaleString('id-ID')}
                 </button>
               ))}
             </div>
             <div className="mt-4">
               <input 
                 type="number" 
                 placeholder="Atau masukkan nominal lain"
                 value={topupAmount}
                 onChange={(e) => setTopupAmount(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none" 
               />
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <h3 className="font-black text-slate-800 mb-4">Metode Pembayaran</h3>
             <div className="space-y-3">
               {[
                 { id: 'bca', name: 'Transfer Bank BCA', icon: <Building size={20}/> },
                 { id: 'qris', name: 'QRIS (Gopay, OVO, Dana)', icon: <Smartphone size={20}/> },
                 { id: 'indomaret', name: 'Indomaret / Alfamart', icon: <CreditCard size={20}/> }
               ].map(method => (
                 <div 
                   key={method.id}
                   onClick={() => setTopupMethod(method.id)}
                   className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${topupMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-300'}`}
                 >
                   <div className={`${topupMethod === method.id ? 'text-blue-600' : 'text-slate-400'}`}>{method.icon}</div>
                   <span className="font-black text-slate-700 text-sm">{method.name}</span>
                 </div>
               ))}
             </div>
          </div>

          <button 
            onClick={handleTopUpSubmit}
            className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition ${topupAmount && topupMethod ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'}`}
          >
             Lanjutkan Pembayaran
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'security') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Keamanan Akun" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-8 max-w-xl mx-auto space-y-4">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-xl text-slate-500"><Lock size={24}/></div>
                <div>
                  <h4 className="font-black text-slate-800">Ubah Kata Sandi</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">Terakhir diubah 3 bulan lalu</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300"/>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-xl text-slate-500"><Shield size={24}/></div>
                <div>
                  <h4 className="font-black text-slate-800">Ubah PIN HelpPay</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">Untuk keamanan transaksi</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300"/>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'privacy') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Privasi Akun" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-8 max-w-xl mx-auto space-y-6 bg-white rounded-[2rem] m-6 border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center pb-4 border-b border-slate-100">
             <div>
               <h4 className="font-black text-slate-800 text-sm">Bagikan Profil Publik</h4>
               <p className="text-xs text-slate-500 mt-1 max-w-xs">Izinkan Helper lain melihat foto dan nama Anda.</p>
             </div>
             <input type="checkbox" defaultChecked className="w-6 h-6 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
           </div>
           <div className="flex justify-between items-center pb-4 border-b border-slate-100">
             <div>
               <h4 className="font-black text-slate-800 text-sm">Personalisasi Iklan</h4>
               <p className="text-xs text-slate-500 mt-1 max-w-xs">Gunakan data aktivitas untuk rekomendasi.</p>
             </div>
             <input type="checkbox" defaultChecked className="w-6 h-6 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
           </div>
           <button className="text-red-500 text-sm font-black w-full text-left py-2 hover:underline">Hapus Akun Permanen</button>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'reviews') {
    const currentRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : '0.0';

    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Ulasan & Rating" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-center text-white mb-6">
             <h3 className="text-5xl font-black mb-2">{currentRating}</h3>
             <div className="flex justify-center text-amber-400 mb-2">
               <Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/>
             </div>
             <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Dari Total {reviews.length} Ulasan</p>
          </div>
          
          {reviews.length === 0 ? (
             <div className="text-center p-10 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm text-slate-500 font-bold">Belum ada ulasan.</div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-600">{r.user.charAt(0)}</div>
                     <div>
                       <h4 className="font-black text-sm text-slate-800">{r.user}</h4>
                       <p className="text-[10px] text-slate-400 font-bold">{r.date}</p>
                     </div>
                   </div>
                   <div className="flex text-amber-400 items-center text-sm font-black gap-1"><Star size={14} fill="currentColor"/> {r.rating}</div>
                 </div>
                 <p className="text-sm text-slate-600 font-medium leading-relaxed">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'wallet_history') {
    return (
      <DashboardLayout {...dashboardProps}>
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-slate-100">
           <div className="flex items-center gap-4 mb-6">
            <button onClick={() => handleNavigation('home')} className="bg-slate-50 p-2 rounded-xl text-slate-600"><ArrowLeft size={24} /></button>
            <h2 className="font-black text-2xl text-slate-800">Riwayat Saldo</h2>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl text-white flex justify-between items-center shadow-lg">
             <div>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">{userRole === 'helper' ? 'Saldo Pendapatan' : 'Total Saldo'}</p>
               <h3 className="text-2xl font-black tracking-tight">Rp {(userProfile?.balance || 0).toLocaleString('id-ID')}</h3>
             </div>
             {userRole === 'helper' ? (
                <button onClick={() => handleNavigation('withdraw')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 transition">
                  Tarik Tunai
                </button>
             ) : (
                <button onClick={() => handleNavigation('top_up')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition">
                  Top Up
                </button>
             )}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 min-h-full space-y-3">
          <h4 className="font-black text-slate-500 text-sm mb-4 uppercase tracking-wider">Transaksi Terakhir</h4>
          {walletHistory.map(w => (
            <div key={w.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${w.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {w.amount > 0 ? <ArrowLeft size={20} className="-rotate-45" /> : <ArrowRight size={20} className="-rotate-45" />}
                </div>
                <div>
                  <h5 className="font-black text-slate-800 text-sm">{w.title}</h5>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{w.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-base ${w.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {w.amount > 0 ? '+' : ''}Rp {Math.abs(w.amount).toLocaleString('id-ID')}
                </p>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-black">{w.status}</span>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'help_center') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Pusat Bantuan" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Cari masalah Anda..." className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:border-blue-500 outline-none" />
          </div>

          <h3 className="font-black text-slate-800 text-lg mb-4">Pertanyaan Populer (FAQ)</h3>
          <div className="space-y-3">
            {['Bagaimana cara membatalkan tugas?', 'Kapan saldo saya diteruskan ke Helper?', 'Bagaimana cara tarik tunai (Withdraw)?'].map((q, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:bg-slate-50">
                <span className="text-sm font-black text-slate-700">{q}</span>
                <ChevronRight size={18} className="text-slate-400"/>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 p-6 md:p-8 rounded-[2rem] text-center border border-blue-100">
             <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"><MessageCircle size={28}/></div>
             <h4 className="font-black text-slate-800 text-lg mb-2">Masih butuh bantuan?</h4>
             <p className="text-sm text-slate-500 font-medium mb-6">Tim Support kami siap membantu Anda 24/7 melalui Live Chat.</p>
            <button className="bg-green-600 text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition w-full md:w-auto">Chat with Support</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'about') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Seputar HelpBlue" onBack={()=>handleNavigation('profile')} />
        <div className="p-6 md:p-10 max-w-2xl mx-auto text-center space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="text-4xl font-black text-blue-700 tracking-tighter mb-2">HELPBLUE</div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Versi 1.0.0 (Beta)</p>
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-8 max-w-md">
              HelpBlue adalah platform inovatif yang menghubungkan orang yang membutuhkan bantuan harian dengan Helper terpercaya di sekitar mereka.
            </p>
            <div className="w-full flex flex-col gap-3">
              <button className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 rounded-xl hover:bg-slate-100 transition text-sm">Syarat & Ketentuan</button>
              <button className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 rounded-xl hover:bg-slate-100 transition text-sm">Kebijakan Privasi</button>
              <button className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 rounded-xl hover:bg-slate-100 transition text-sm">Beri Rating Aplikasi</button>
            </div>
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] mt-8">© 2026 HELPBLUE.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentView === 'withdraw') {
    return (
      <DashboardLayout {...dashboardProps}>
        <HeaderWithBack title="Tarik Tunai" onBack={()=>handleNavigation('wallet_history')} />
        <div className="p-6 md:p-8 max-w-xl mx-auto space-y-6">
          <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-lg text-white">
             <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-2">Saldo Dapat Ditarik</h3>
             <h3 className="text-3xl font-black mb-4 tracking-tight">Rp {(userProfile?.balance || 0).toLocaleString('id-ID')}</h3>
             <div className="mt-4">
               <label className="text-sm font-bold text-slate-300 ml-1 mb-2 block">Nominal Penarikan</label>
               <input 
                 type="number" 
                 placeholder="Minimal Rp 50.000"
                 value={withdrawAmount}
                 onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
                 className="w-full bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white transition placeholder:text-slate-500" 
               />
               {withdrawError && <p className="text-red-400 text-xs font-bold mt-2 ml-1">{withdrawError}</p>}
             </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <h3 className="font-black text-slate-800 mb-4">Transfer Ke Bank Anda</h3>
             <div className="space-y-3">
               {[
                 { id: 'bca', name: 'BCA - 1234567890 (a.n Kamu)', icon: <Building size={20}/> },
                 { id: 'mandiri', name: 'Mandiri - 0987654321 (a.n Kamu)', icon: <Building size={20}/> },
               ].map(method => (
                 <div 
                   key={method.id}
                   onClick={() => setWithdrawMethod(method.id)}
                   className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${withdrawMethod === method.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'}`}
                 >
                   <div className={`${withdrawMethod === method.id ? 'text-emerald-600' : 'text-slate-400'}`}>{method.icon}</div>
                   <span className="font-black text-slate-700 text-sm">{method.name}</span>
                 </div>
               ))}
             </div>
             <button onClick={() => handleNavigation('bank_account')} className="mt-4 w-full border-2 border-dashed border-slate-200 text-blue-600 text-sm font-bold py-3 rounded-xl hover:bg-slate-50">
               + Tambah Rekening Lain
             </button>
          </div>

          <button 
            onClick={handleWithdrawSubmit}
            className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition ${withdrawAmount && withdrawMethod ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-300 cursor-not-allowed'}`}
          >
             Proses Penarikan Dana
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
