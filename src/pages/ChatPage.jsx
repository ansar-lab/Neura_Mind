import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createChatSession,
  listChatSessions,
  getChatMessages,
  updateChatSessionTitle,
  deleteChatSession,
  sendChatMessage,
} from '../services/chatService';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {
  Brain,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Menu,
  X,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  Code2,
  BookOpen,
  HelpCircle,
  Clock,
  ArrowUp,
  Key,
  Check,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    icon: Code2,
    title: 'Explain Dijkstra’s Algorithm',
    text: 'Explain Dijkstra’s algorithm step by step with a clear weighted graph example and time complexity.',
  },
  {
    icon: Lightbulb,
    title: 'Understand Linear Algebra',
    text: 'Help me intuitively understand what eigenvalues and eigenvectors actually represent geometrically.',
  },
  {
    icon: BookOpen,
    title: '5-Day Study Plan',
    text: 'Build me a high-yield 5-day study plan to prepare for an exam in Database Management Systems.',
  },
  {
    icon: HelpCircle,
    title: 'Debug & Code Review',
    text: 'I have a problem with recursion running into a stack overflow. Can you show me how to convert it to an iterative approach?',
  },
];

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Composer state
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // API Key modal state
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [keySavedMessage, setKeySavedMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load any stored custom API key
  useEffect(() => {
    try {
      const stored = localStorage.getItem('neuramind.gemini_api_key') || '';
      setCustomKeyInput(stored);
    } catch {
      // ignore
    }
  }, []);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    try {
      const trimmed = customKeyInput.trim();
      if (trimmed) {
        localStorage.setItem('neuramind.gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('neuramind.gemini_api_key');
      }
      setKeySavedMessage(true);
      setTimeout(() => {
        setKeySavedMessage(false);
        setApiKeyModalOpen(false);
      }, 1200);
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to save API key:', err);
    }
  };

  // 1. Load student's chat sessions on mount
  const loadSessions = useCallback(
    async (preferredSessionId = null) => {
      const userId = user?.id || 'local-student';
      setLoadingSessions(true);

      const { data } = await listChatSessions(userId);
      const sessionList = data || [];
      setSessions(sessionList);
      setLoadingSessions(false);

      if (preferredSessionId && sessionList.some((s) => s.id === preferredSessionId)) {
        setActiveSessionId(preferredSessionId);
      } else if (sessionList.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionList[0].id);
      }
    },
    [user?.id, activeSessionId]
  );

  useEffect(() => {
    const passedSessionId = location.state?.sessionId;
    loadSessions(passedSessionId);
  }, [loadSessions, location.state?.sessionId]);

  // 2. Handle initial prompt passed from Dashboard or shortcuts
  useEffect(() => {
    if (location.state?.initialPrompt) {
      const promptToRun = location.state.initialPrompt;
      window.history.replaceState({}, document.title);
      handleSendMessage(promptToRun);
    }
  }, [location.state?.initialPrompt]);

  // 3. Load messages whenever activeSessionId changes
  useEffect(() => {
    const userId = user?.id || 'local-student';
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);
    setErrorMessage(null);

    getChatMessages(activeSessionId, userId).then(({ data, error }) => {
      if (!isMounted) return;
      setLoadingMessages(false);
      if (error) {
        setErrorMessage('Unable to load chat history from local storage.');
      } else {
        setMessages(data || []);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, user?.id]);

  // 4. Create a new chat session
  const handleNewChat = async () => {
    const userId = user?.id || 'local-student';
    if (isSending) return;
    setErrorMessage(null);

    const { data, error } = await createChatSession(userId, 'New Chat');
    if (error || !data) {
      setErrorMessage('Failed to start a new chat. Please try again.');
      return;
    }

    setSessions((prev) => [data, ...prev]);
    setActiveSessionId(data.id);
    setMessages([]);
    setMobileDrawerOpen(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // 5. Delete chat session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    const userId = user?.id || 'local-student';

    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    const { error } = await deleteChatSession(sessionId, userId);
    if (error) {
      setErrorMessage('Failed to delete session.');
      return;
    }

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);

    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  };

  // 6. Send message logic
  const handleSendMessage = async (textToSend) => {
    const rawText = textToSend || inputValue;
    const trimmed = rawText.trim();
    const userId = user?.id || 'local-student';
    if (!trimmed || isSending) return;

    setErrorMessage(null);
    setInputValue('');

    let currentSessionId = activeSessionId;

    // If no active session exists, create one first
    if (!currentSessionId) {
      const { data: newSession, error: sessionErr } = await createChatSession(userId, 'New Chat');
      if (sessionErr || !newSession) {
        setErrorMessage('Could not initialize chat session.');
        return;
      }
      currentSessionId = newSession.id;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    }

    // Optimistically render the student's message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      session_id: currentSessionId,
      user_id: userId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    // Update session title if this is the first message
    const activeSession = sessions.find((s) => s.id === currentSessionId);
    if (activeSession && activeSession.title === 'New Chat') {
      const derivedTitle = trimmed.length > 40 ? `${trimmed.substring(0, 40)}...` : trimmed;
      updateChatSessionTitle(currentSessionId, userId, derivedTitle).then(({ data }) => {
        if (data) {
          setSessions((prev) =>
            prev.map((s) => (s.id === currentSessionId ? { ...s, title: derivedTitle } : s))
          );
        }
      });
    }

    // Call Google Gemini directly
    const { data: responseData, error: sendErr } = await sendChatMessage(
      currentSessionId,
      trimmed,
      userId
    );
    setIsSending(false);

    if (sendErr || !responseData?.message) {
      const friendlyError =
        sendErr?.message && !sendErr.message.includes('fetch')
          ? sendErr.message
          : "Sorry, I couldn't get a response right now. Please verify your Gemini API key or try again.";
      setErrorMessage(friendlyError);
      return;
    }

    // Append the verified assistant message
    const assistantMsg = responseData.message;
    setMessages((prev) => [...prev, assistantMsg]);

    // Update session updated_at in local state so it stays near the top
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === currentSessionId ? { ...s, updated_at: new Date().toISOString() } : s
      );
      return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const hasEnvKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-5.5rem)] bg-dark-900/60 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden relative">
      {/* 1. Chat Top Header */}
      <header className="h-16 border-b border-white/5 px-4 sm:px-6 flex items-center justify-between bg-dark-950/40 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle chat history"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  {activeSession ? activeSession.title : 'AI Tutor Workspace'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Interactive step-by-step academic explanations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* API Key settings button */}
          <button
            type="button"
            onClick={() => setApiKeyModalOpen(true)}
            title="Configure Gemini API Key"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-primary-400" />
            <span className="hidden sm:inline">API Key</span>
          </button>

          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace: Sidebar + Messages + Composer */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Desktop Sidebar: Chat History */}
        <aside className="hidden md:flex md:w-72 flex-col border-r border-white/5 bg-dark-950/50 flex-shrink-0">
          <div className="p-3.5 border-b border-white/5">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-violet hover:from-primary-500 hover:to-primary-600 rounded-xl transition-all cursor-pointer shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
            {loadingSessions ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <div className="w-4 h-4 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                <span>Loading chats...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500 leading-relaxed">
                No past chats yet. Start your first learning conversation above.
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-primary-500/15 border border-primary-500/30 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-primary-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{s.title || 'Untitled Chat'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded-md hover:bg-white/10 transition-all text-slate-500 shrink-0"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Mobile History Drawer (Slide-out) */}
        {mobileDrawerOpen && (
          <div className="md:hidden absolute inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-dark-900 h-full shadow-2xl flex flex-col z-50 border-r border-white/10">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Conversations
                </span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 border-b border-white/5">
                <button
                  onClick={handleNewChat}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-violet rounded-xl flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                      s.id === activeSessionId
                        ? 'bg-primary-500/20 text-white font-semibold border border-primary-500/30'
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate pr-2">{s.title || 'Untitled Chat'}</span>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Messages & Composer Canvas */}
        <section className="flex-1 flex flex-col min-w-0 bg-dark-950/20">
          {/* Scrollable Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {/* Error Notification */}
            {errorMessage && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to complete request</p>
                  <p className="mt-0.5 text-rose-300/90">{errorMessage}</p>
                  {errorMessage.toLowerCase().includes('key') && (
                    <button
                      type="button"
                      onClick={() => setApiKeyModalOpen(true)}
                      className="mt-2 text-xs font-semibold underline text-primary-300 hover:text-primary-200"
                    >
                      Click here to update your Gemini API Key
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Empty State / Suggested Prompts */}
            {!activeSessionId || (messages.length === 0 && !loadingMessages) ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600/30 to-accent-violet/30 border border-primary-500/30 flex items-center justify-center mb-4 shadow-xl shadow-primary-500/10">
                  <Brain className="w-8 h-8 text-primary-400" />
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  What would you like to master today?
                </h2>

                <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                  NeuraMind provides personalized, step-by-step academic explanations across computer
                  science, mathematics, engineering, and more.
                </p>

                {/* Suggested Prompts Cards */}
                <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt.text)}
                        className="p-4 rounded-2xl bg-dark-900/80 border border-white/5 hover:border-primary-500/30 hover:bg-dark-800/80 text-left transition-all shadow-sm hover:shadow-md group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-primary-300">
                            {prompt.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {prompt.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <div className="w-5 h-5 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                  <span>Loading conversation history...</span>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-violet flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20 mt-1">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-2xl rounded-2xl px-5 py-4 ${
                        isUser
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-tr-xs shadow-md shadow-primary-600/15'
                          : 'bg-dark-900/90 border border-white/10 text-slate-100 rounded-tl-xs shadow-lg'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                          {msg.content}
                        </p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Assistant Thinking Pulse */}
            {isSending && (
              <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-violet flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20 mt-1">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-dark-900/90 border border-white/10 rounded-2xl rounded-tl-xs px-5 py-3.5 shadow-lg flex items-center space-x-3">
                  <span className="text-xs font-semibold text-primary-300">
                    NeuraMind is formulating response
                  </span>
                  <div className="flex space-x-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 4. Floating Composer Bar */}
          <div className="border-t border-white/5 bg-dark-950/60 backdrop-blur-xl p-3 sm:p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-end gap-2 bg-dark-900/90 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all shadow-xl">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question or paste a problem statement..."
                  disabled={isSending}
                  className="flex-1 bg-transparent border-0 resize-none max-h-36 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 leading-relaxed py-1"
                  style={{ minHeight: '2.25rem' }}
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isSending}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-r from-primary-600 to-accent-violet hover:from-primary-500 hover:to-primary-600 disabled:opacity-40 disabled:hover:from-primary-600 disabled:hover:to-accent-violet text-white transition-all shadow-md shadow-primary-500/20 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                <span>Enter to send • Shift + Enter for new line</span>
                <span className="hidden sm:inline">Powered by Google Gemini</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Gemini API Key Configuration Modal */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-dark-900 border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Gemini API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setApiKeyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="mt-4 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your Google Gemini API key below. You can get a free key from{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:underline"
                >
                  Google AI Studio
                </a>
                .
              </p>

              {hasEnvKey && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>An active key is already configured in .env.local</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Custom API Key (Optional Override)
                </label>
                <input
                  type="password"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder="Paste AI Studio API key here"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {keySavedMessage && (
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> API Key saved successfully!
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApiKeyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
