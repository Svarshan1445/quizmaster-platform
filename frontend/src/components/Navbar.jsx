import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Award, LayoutDashboard, BookOpen, Trophy, ShieldCheck, 
  LogOut, User, Menu, X, ChevronDown, Sparkles 
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

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

          {/* User Profile & Role Info */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center space-x-3 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 transition"
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
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  {!isAdmin && (
                    <button
                      onClick={() => {
                        setActivePage('profile');
                        setUserDropdown(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-700/60 transition"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActivePage(link.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activePage === link.id
                    ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </button>
            );
          })}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div>
                <p className="text-xs font-semibold">{user?.name}</p>
                <p className="text-[10px] text-slate-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs text-rose-400 bg-rose-500/10 rounded-lg hover:bg-rose-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
