import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Bot,
  Library,
  User,
  RotateCcw,
  Menu,
  X,
  Sparkles,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

export default function AppLayout() {
  const { user, profile: authProfile } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(authProfile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync profile from localStorage / auth context
  const fetchProfile = useCallback(() => {
    try {
      const stored = localStorage.getItem('neuramind.student_profile');
      if (stored) {
        setProfile(JSON.parse(stored));
        return;
      }
    } catch (e) {
      console.warn('Could not read stored profile:', e);
    }
    setProfile(authProfile || { full_name: 'Student', education_level: 'Undergraduate' });
  }, [authProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, authProfile]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleResetData = () => {
    if (
      window.confirm(
        'Clear your local chat history and reset workspace? This will remove saved conversations.'
      )
    ) {
      try {
        const userId = user?.id || 'local-student';
        localStorage.removeItem(`neuramind.chat_sessions.${userId}`);
        localStorage.removeItem(`neuramind.chat_messages.${userId}`);
        window.location.reload();
      } catch (err) {
        console.error('Failed to reset workspace:', err);
      }
    }
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    'Student';

  const initial = displayName.charAt(0).toUpperCase();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'AI Tutor',
      path: '/chat',
      icon: Bot,
      highlight: true,
    },
    {
      name: 'Resources',
      path: '/resources',
      icon: Library,
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col md:flex-row relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambient Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0E1424]/85 backdrop-blur-xl border-b border-white/[0.06] px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-glow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base tracking-tight leading-none">
              NeuraMind
            </span>
            <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase mt-0.5">
              AI Learning
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Toggle mobile navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-30 bg-[#0B0F1D]/95 backdrop-blur-2xl border-b border-white/[0.08] p-4 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 flex items-center gap-3 bg-white/[0.03] rounded-xl border border-white/[0.05] mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Open Access Active
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/30 shadow-glow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-white/[0.06] mt-3">
            <button
              onClick={handleResetData}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Chat History</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-[#0C111E]/80 backdrop-blur-xl border-r border-white/[0.07]">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 px-6 h-20 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-glow-sm">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight block leading-none">
                NeuraMind
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-400 mt-1 block">
                AI Companion
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/40 shadow-glow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                  {item.highlight && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      AI
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Student Profile Card & Workspace Controls */}
          <div className="p-4 border-t border-white/[0.06] bg-white/[0.01]">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate" title={displayName}>
                  {displayName}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <GraduationCap className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{profile?.education_level || 'Undergraduate'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 py-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Open Access
              </span>
              <button
                type="button"
                onClick={handleResetData}
                title="Clear local chat conversations"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Chats</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 relative z-10">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ profile, refreshProfile: fetchProfile }} />
        </main>
      </div>
    </div>
  );
}
