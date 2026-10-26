// NeuraMind chat service — local-first UI with direct Google Gemini AI responses.
//
// Chat sessions/messages are persisted in localStorage for instant responsiveness.
// AI generation calls the Google Gemini API directly with multi-turn context
// and automatic fallback across models.

const SESSION_PREFIX = 'neuramind.chat_sessions.';
const MESSAGE_PREFIX = 'neuramind.chat_messages.';

const SYSTEM_INSTRUCTION =
  'You are NeuraMind, an intelligent, patient, and encouraging AI Academic Learning Assistant. ' +
  'Your role is to guide students through academic and learning concepts step-by-step. ' +
  'Explain topics clearly and patiently using simple, student-friendly language. ' +
  'Break difficult concepts into structured steps and provide practical examples when useful. ' +
  'Help students understand principles rather than merely providing rote answers. ' +
  'Use clear Markdown formatting (headings, lists, bold key concepts, and code blocks with syntax highlighting). ' +
  'Be supportive, educational, and respectful.';

// -----------------------------------------------------------------------------
// localStorage helpers
// -----------------------------------------------------------------------------
function sessionsKey(userId) {
  return `${SESSION_PREFIX}${userId || 'local-student'}`;
}

function messagesKey(userId) {
  return `${MESSAGE_PREFIX}${userId || 'local-student'}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error('Failed to read chat data from localStorage:', err);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to persist chat data to localStorage:', err);
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function appendMessage(userId, message) {
  const all = readJson(messagesKey(userId), []);
  all.push(message);
  writeJson(messagesKey(userId), all);
  return message;
}

function touchSession(userId, sessionId) {
  const sessions = readJson(sessionsKey(userId), []);
  const next = sessions.map((s) =>
    s.id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s
  );
  writeJson(sessionsKey(userId), next);
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export async function createChatSession(userId, title = 'New Chat') {
  try {
    const now = new Date().toISOString();
    const session = {
      id: generateId(),
      user_id: userId || 'local-student',
      title: (title || '').trim() || 'New Chat',
      created_at: now,
      updated_at: now,
    };

    const sessions = readJson(sessionsKey(userId), []);
    writeJson(sessionsKey(userId), [session, ...sessions]);

    return { data: session, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function listChatSessions(userId) {
  try {
    const sessions = readJson(sessionsKey(userId), []);
    sessions.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return { data: sessions, error: null };
  } catch (err) {
    return { data: [], error: err };
  }
}

export async function getChatMessages(sessionId, userId) {
  try {
    const all = readJson(messagesKey(userId), []);
    const messages = all
      .filter((msg) => msg.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return { data: messages, error: null };
  } catch (err) {
    return { data: [], error: err };
  }
}

export async function updateChatSessionTitle(sessionId, userId, title) {
  try {
    const sessions = readJson(sessionsKey(userId), []);
    let updated = null;

    const next = sessions.map((s) => {
      if (s.id !== sessionId) return s;
      updated = { ...s, title: (title || '').trim(), updated_at: new Date().toISOString() };
      return updated;
    });

    writeJson(sessionsKey(userId), next);

    return {
      data: updated,
      error: updated ? null : new Error('Chat session not found'),
    };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteChatSession(sessionId, userId) {
  try {
    const sessions = readJson(sessionsKey(userId), []).filter((s) => s.id !== sessionId);
    writeJson(sessionsKey(userId), sessions);

    const messages = readJson(messagesKey(userId), []).filter(
      (msg) => msg.session_id !== sessionId
    );
    writeJson(messagesKey(userId), messages);

    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

export async function sendChatMessage(sessionId, message, userId) {
  try {
    const trimmed = (message || '').trim();
    if (!trimmed) {
      return { data: null, error: new Error('Message must not be empty') };
    }

    // 1. Get API key from env or localStorage
    const apiKey =
      (import.meta.env.VITE_GEMINI_API_KEY || '').trim() ||
      (typeof localStorage !== 'undefined'
        ? (localStorage.getItem('neuramind.gemini_api_key') || '').trim()
        : '');

    if (!apiKey) {
      throw new Error(
        'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.'
      );
    }

    // 2. Build candidate models with automatic fallback
    const envModel = (import.meta.env.VITE_GEMINI_MODEL || '').trim();
    // Note: gemini-2.5-flash has been retired by Google API; default to active models
    const primaryModel =
      envModel && envModel !== 'gemini-2.5-flash' ? envModel : 'gemini-3.5-flash';

    const candidateModels = Array.from(
      new Set([
        primaryModel,
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ])
    ).filter(Boolean);

    // 3. Save student message locally
    const effectiveUserId = userId || 'local-student';
    const userMessage = {
      id: generateId(),
      session_id: sessionId,
      user_id: effectiveUserId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    appendMessage(effectiveUserId, userMessage);

    // 4. Load recent conversation history for multi-turn context (last 14 messages)
    const allMessages = readJson(messagesKey(effectiveUserId), [])
      .filter((msg) => msg.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Exclude the current message we just appended, take up to 14 prior messages
    const priorMessages = allMessages.slice(0, -1).slice(-14);

    const contents = [];
    for (const prev of priorMessages) {
      if (prev.role === 'user' || prev.role === 'assistant') {
        contents.push({
          role: prev.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: prev.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: trimmed }],
    });

    // 5. Query Gemini API with fallback
    let assistantReply = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }],
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errMsg = payload?.error?.message || `Request failed with status ${response.status}`;
          lastError = new Error(errMsg);

          // Retry with next model on demand spikes (503), retired model (404), or rate limits (429)
          if ([404, 503, 429].includes(response.status)) {
            console.warn(`Model ${model} returned HTTP ${response.status}. Trying next model...`);
            continue;
          }

          // For critical errors (e.g. invalid key 400/403), stop and report
          throw lastError;
        }

        const candidateText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText || !candidateText.trim()) {
          lastError = new Error('AI returned empty response.');
          continue;
        }

        assistantReply = candidateText.trim();
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Gemini attempt with model ${model} failed:`, err.message);
      }
    }

    if (!assistantReply) {
      throw (
        lastError ||
        new Error('Unable to get an AI response right now. Please check your Gemini API key.')
      );
    }

    // 6. Save assistant message
    const savedAssistantMessage = {
      id: generateId(),
      session_id: sessionId,
      user_id: effectiveUserId,
      role: 'assistant',
      content: assistantReply,
      created_at: new Date().toISOString(),
    };

    appendMessage(effectiveUserId, savedAssistantMessage);
    touchSession(effectiveUserId, sessionId);

    return {
      data: { message: savedAssistantMessage },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err };
  }
}
