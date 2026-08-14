import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Award, LayoutDashboard, BookOpen, Trophy, ShieldCheck, 
  LogOut, User, Menu, X, ChevronDown, Sparkles, Bell, Palette, Check 
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  
  // Notification Bell State
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Theme Selector State
  const [themeDropdown, setThemeDropdown] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('indigo');

  const themes = [
    { id: 'indigo', name: 'Indigo Classic', color: '#6366f1' },
    { id: 'emerald', name: 'Emerald Mint', color: '#10b981' },
    { id: 'violet', name: 'Royal Violet', color: '#a855f7' },
    { id: 'rose', name: 'Rose Crimson', color: '#f43f5e' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('app_theme') || 'indigo';
    setCurrentTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
    document.body.setAttribute('data-theme', saved);
  }, []);

  const handleThemeChange = (tId) => {
    setCurrentTheme(tId);
    localStorage.setItem('app_theme', tId);
    document.documentElement.setAttribute('data-theme', tId);
    document.body.setAttribute('data-theme', tId);
    setThemeDropdown(false);
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.warn('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const handleOpenNotifications = async () => {
    setNotifDropdown(!notifDropdown);
    if (!notifDropdown && unreadCount > 0) {
      try {
        await api.post('/notifications/read');
        setUnreadCount(0);
      } catch (err) {}
    }
  };

  const studentLinks = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quiz-discovery', label: 'Browse Quizzes', icon: BookOpen },
    { id: 'history', label: 'My Attempts', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'verify-cert', label: 'Verify Certificate', icon: ShieldCheck }
  ];

  const adminLinks = [
    { id: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'admin-quizzes', label: 'Manage Quizzes', icon: BookOpen },
    { id: 'admin-categories', label: 'Categories', icon: Sparkles },
    { id: 'admin-users', label: 'User Control', icon: User },
    { id: 'admin-attempts', label: 'All Attempts', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'verify-cert', label: 'Verify Certificate', icon: ShieldCheck }
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActivePage(isAdmin ? 'admin-dashboard' : 'student-dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                QuizMaster
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActivePage(link.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Controls: Theme, Notification Bell & User Dropdown */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Custom Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdown(!themeDropdown)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition"
                title="Choose Theme"
              >
                <Palette className="w-4 h-4 text-indigo-400" />
              </button>

              {themeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">App Visual Theme</p>
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        currentTheme === t.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.color }}></span>
                        <span>{t.name}</span>
                      </div>
                      {currentTheme === t.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell System */}
            <div className="relative">
              <button
                onClick={handleOpenNotifications}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-indigo-400" /> Real-Time Notifications
                    </h4>
                    <span className="text-[10px] text-slate-400">{notifications.length} recent</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="pt-2 text-left space-y-0.5">
                          <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                          <p className="text-[11px] text-slate-400 leading-snug">{n.message}</p>
                          <p className="text-[9px] text-slate-500">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center space-x-3 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    {isAdmin ? (
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-indigo-400 font-medium">Student</span>
                    )}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-700/60">
                    <p className="text-xs font-semibold text-white">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  {!isAdmin && (
                    <button
                      onClick={() => { setActivePage('profile'); setUserDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                  )}
                  <button
                    onClick={() => { logout(); setUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
