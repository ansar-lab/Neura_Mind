import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listChatSessions } from '../services/chatService';
import {
  Brain,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Compass,
  GraduationCap,
  MessageSquare,
  Zap,
  TrendingUp,
} from 'lucide-react';

const QUICK_PROMPT_SUGGESTIONS = [
  {
    topic: 'Computer Science',
    prompt: 'Explain the difference between TCP and UDP with real-world examples',
    icon: Zap,
    gradient: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    topic: 'Mathematics',
    prompt: 'Break down Bayes Theorem step by step with an intuitive scenario',
    icon: TrendingUp,
    gradient: 'from-violet-500/20 to-primary-500/20 text-primary-400 border-primary-500/30',
  },
  {
    topic: 'Study Planning',
    prompt: 'Build me a 7-day study schedule for preparing for final exams',
    icon: GraduationCap,
    gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    topic: 'AI & Data Science',
    prompt: 'How does self-attention in transformers work under the hood?',
    icon: Brain,
    gradient: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const context = useOutletContext() || {};
  const profile = context.profile;
  const navigate = useNavigate();

  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const studentName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student';

  const educationLevel = profile?.education_level || 'Academic Explorer';

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      listChatSessions(user.id).then(({ data }) => {
        if (isMounted) {
          setRecentSessions(data || []);
          setLoadingSessions(false);
        }
      });
    } else {
      setLoadingSessions(false);
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleLaunchPrompt = (promptText) => {
    navigate('/chat', { state: { initialPrompt: promptText } });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Hero Greeting Banner */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-dark-900 via-dark-900/90 to-primary-950/40 border border-white/10 shadow-2xl">
        {/* Ambient accent glows inside hero */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/15 border border-primary-500/30 text-primary-300">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              Academic Space
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              {educationLevel}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">{studentName}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Ready to explore? NeuraMind is calibrated to your academic level to help you master challenging concepts, test your reasoning, and study with high focus.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-violet hover:from-primary-500 hover:to-primary-600 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 transition-all cursor-pointer group"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI Tutor</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate('/resources')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900/80 hover:bg-dark-800/80 border border-white/10 text-slate-200 text-sm font-semibold transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Browse Study Resources</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Platform Stats & Status Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="p-5 rounded-2xl bg-dark-900/60 border border-white/5 backdrop-blur-sm relative overflow-hidden group hover:border-primary-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Tutor</span>
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">Online & Ready</div>
          <p className="text-xs text-slate-400 mt-1">Multi-turn context with step-by-step guidance.</p>
        </div>

        {/* Stat 2 */}
        <div className="p-5 rounded-2xl bg-dark-900/60 border border-white/5 backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Curated Library</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">15+ Handpicked</div>
          <p className="text-xs text-slate-400 mt-1">Verified academic courses & reference hubs.</p>
        </div>

        {/* Stat 3 */}
        <div className="p-5 rounded-2xl bg-dark-900/60 border border-white/5 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Saved Chats</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {loadingSessions ? '...' : `${recentSessions.length} Sessions`}
          </div>
          <p className="text-xs text-slate-400 mt-1">Stored securely with Supabase RLS.</p>
        </div>
      </section>

      {/* 3. Quick Concept Starters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary-400" />
              Prompt Starters
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Jump straight into a focused learning session with one click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {QUICK_PROMPT_SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleLaunchPrompt(item.prompt)}
                className="p-4 rounded-2xl bg-dark-900/60 border border-white/5 hover:border-white/15 hover:bg-dark-800/60 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                      {item.topic}
                    </span>
                    <div className={`p-1.5 rounded-lg border ${item.gradient}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-200 line-clamp-3 leading-relaxed">
                    "{item.prompt}"
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-primary-400 font-semibold group-hover:text-primary-300">
                  <span>Explore topic</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Chat Conversations (2 cols on desktop) */}
        <section className="lg:col-span-2 p-6 rounded-2xl bg-dark-900/60 border border-white/5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-400" />
                Recent Conversations
              </h2>
              {recentSessions.length > 0 && (
                <button
                  onClick={() => navigate('/chat')}
                  className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                >
                  View All ({recentSessions.length})
                </button>
              )}
            </div>

            {loadingSessions ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                <div className="w-5 h-5 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : recentSessions.length === 0 ? (
              /* Honest empty state */
              <div className="py-10 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-dark-950/40">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-400 mx-auto flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  No learning activity yet.
                </p>
                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                  Start an interactive explanation session with your AI Tutor to ask questions and take notes.
                </p>
                <button
                  onClick={() => navigate('/chat')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-xl transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start First Conversation</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate('/chat', { state: { sessionId: session.id } })}
                    className="p-3.5 rounded-xl bg-dark-950/60 border border-white/5 hover:border-primary-500/30 hover:bg-dark-800/60 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-primary-300 truncate">
                          {session.title || 'Untitled Session'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(session.updated_at || session.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-500">
            Sessions are automatically stored and synchronized across your devices.
          </div>
        </section>

        {/* Quick Navigation Card (1 col on desktop) */}
        <section className="p-6 rounded-2xl bg-dark-900/60 border border-white/5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-4">
              Quick Shortcuts
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-dark-950/60 border border-white/5 hover:border-primary-500/30 hover:bg-dark-800/60 text-left transition-all cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-primary-300">
                    AI Tutor Workspace
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Start step-by-step guidance</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate('/resources')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-dark-950/60 border border-white/5 hover:border-cyan-500/30 hover:bg-dark-800/60 text-left transition-all cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300">
                    Curated Resources
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Explore CS, Math & Science</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-dark-950/60 border border-white/5 hover:border-emerald-500/30 hover:bg-dark-800/60 text-left transition-all cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300">
                    Student Profile
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Update level & preferences</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-primary-200">
            <span className="font-semibold block mb-1">💡 Study Tip</span>
            Ask the AI Tutor to provide analogies or quiz you after explaining a new theorem or algorithm.
          </div>
        </section>
      </div>

    </div>
  );
}
