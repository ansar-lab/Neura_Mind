import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// -----------------------------------------------------------------------------
// NeuraMind — Phase 5B: Secure AI Chat Edge Function
// -----------------------------------------------------------------------------

interface RequestBody {
  session_id?: string;
  message?: string;
}

interface ChatMessageRecord {
  id?: string;
  session_id?: string;
  user_id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface ProviderMessagePayload {
  role: "system" | "user" | "assistant";
  content: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 8000;
const MAX_HISTORY_MESSAGES = 50;
const AI_REQUEST_TIMEOUT_MS = 45000;

const SYSTEM_INSTRUCTION =
  "You are the NeuraMind AI Learning Assistant. " +
  "Your role is to guide students through academic and learning concepts step-by-step. " +
  "Explain topics clearly and patiently, preferring simple, student-friendly language. " +
  "Break difficult concepts into structured steps and provide practical examples when useful. " +
  "Help students understand principles rather than merely providing rote answers. " +
  "Be supportive, educational, and respectful. " +
  "Never fabricate sources or present unverified information as certainty. " +
  "Stay focused on academic learning and student assistance.";

// -----------------------------------------------------------------------------
// CORS Helpers
// -----------------------------------------------------------------------------
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedProduction = Deno.env.get("FRONTEND_URL") || "";
  const allowedLocal = "http://localhost:3000";

  let matchedOrigin = allowedProduction || allowedLocal;
  if (origin === allowedLocal || (allowedProduction && origin === allowedProduction)) {
    matchedOrigin = origin;
  }

  return {
    "Access-Control-Allow-Origin": matchedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// -----------------------------------------------------------------------------
// AI Provider Adapter (Provider-Agnostic HTTP Integration)
// -----------------------------------------------------------------------------
async function callAIProvider(
  messages: ProviderMessagePayload[],
  apiKey: string,
  apiUrl: string,
  model: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `AI provider request failed with status: ${response.status}`
      );
      throw new Error(`Provider returned error status ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data?.choices?.[0]?.message?.content;

    if (typeof assistantText !== "string" || !assistantText.trim()) {
      throw new Error("AI provider returned empty or malformed message content");
    }

    return assistantText.trim();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("AI provider request timed out");
      throw new Error("AI provider request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// -----------------------------------------------------------------------------
// Main Edge Function Handler
// -----------------------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Enforce POST only
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  // 3. Environment & Configuration Check
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const aiApiKey = Deno.env.get("AI_API_KEY");
  const aiApiUrl = Deno.env.get("AI_API_URL") || "https://api.openai.com/v1/chat/completions";
  const aiModel = Deno.env.get("AI_MODEL") || "gpt-4o-mini";

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in Edge Function environment");
    return jsonResponse({ error: "Server configuration error" }, 500, corsHeaders);
  }

  if (!aiApiKey) {
    console.error("Missing AI_API_KEY in Edge Function environment");
    return jsonResponse({ error: "AI service is not configured" }, 503, corsHeaders);
  }

  // 4. Authenticate Request via Supabase JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
  }

  // 5. Parse & Validate Request Body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
  }

  const sessionId = body?.session_id;
  const rawMessage = body?.message;

  if (!sessionId || typeof sessionId !== "string" || !UUID_REGEX.test(sessionId)) {
    return jsonResponse({ error: "A valid session_id (UUID) is required" }, 400, corsHeaders);
  }

  if (typeof rawMessage !== "string" || !rawMessage.trim()) {
    return jsonResponse({ error: "Message must be a non-empty string" }, 400, corsHeaders);
  }

  const trimmedMessage = rawMessage.trim();
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse(
      { error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters` },
      400,
      corsHeaders
    );
  }

  try {
    // 6. Verify Chat Session Ownership
    // Enforced at query level and verified via RLS (auth.uid() = user_id)
    const { data: sessionData, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionError) {
      console.error("Database query error checking session ownership:", sessionError.message);
      return jsonResponse({ error: "Failed to verify chat session" }, 500, corsHeaders);
    }

    if (!sessionData) {
      return jsonResponse({ error: "Chat session not found" }, 404, corsHeaders);
    }

    // 7. Store the New User Message First
    const { error: userInsertError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: user.id,
      role: "user",
      content: trimmedMessage,
    });

    if (userInsertError) {
      console.error("Failed to insert student user message:", userInsertError.message);
      return jsonResponse({ error: "Failed to record message" }, 500, corsHeaders);
    }

    // 8. Load Conversation History (Chronological, capped at MAX_HISTORY_MESSAGES)
    const { data: historyData, error: historyError } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY_MESSAGES);

    if (historyError) {
      console.error("Failed to load conversation history:", historyError.message);
      return jsonResponse({ error: "Failed to load conversation context" }, 500, corsHeaders);
    }

    // Reverse to chronological order (oldest to newest)
    const chronologicalHistory = (historyData as ChatMessageRecord[] || []).reverse();

    // 9. Format Messages for AI Provider
    const providerMessages: ProviderMessagePayload[] = [
      { role: "system", content: SYSTEM_INSTRUCTION },
    ];

    for (const msg of chronologicalHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        providerMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // 10. Invoke External AI Provider Securely
    let assistantReply: string;
    try {
      assistantReply = await callAIProvider(providerMessages, aiApiKey, aiApiUrl, aiModel);
    } catch (aiErr: unknown) {
      console.error("AI service error:", aiErr instanceof Error ? aiErr.message : "Unknown error");
      return jsonResponse(
        { error: "AI service temporarily unavailable. Please try again shortly." },
        502,
        corsHeaders
      );
    }

    // 11. Store Assistant Message in Database
    const { data: assistantRecord, error: assistantInsertError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role: "assistant",
        content: assistantReply,
      })
      .select("id, role, content, created_at")
      .single();

    if (assistantInsertError || !assistantRecord) {
      console.error(
        "Failed to insert assistant message:",
        assistantInsertError?.message || "Missing record"
      );
      return jsonResponse({ error: "Failed to save AI response" }, 500, corsHeaders);
    }

    // 12. Refresh Session Timestamp
    // The database trigger updates updated_at, and we can also signal the row update
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    // 13. Return Clean JSON Response to Frontend
    return jsonResponse(
      {
        message: {
          id: assistantRecord.id,
          role: assistantRecord.role,
          content: assistantRecord.content,
          created_at: assistantRecord.created_at,
        },
      },
      200,
      corsHeaders
    );
  } catch (serverErr: unknown) {
    console.error("Unexpected server exception in ai-chat function:", serverErr);
    return jsonResponse({ error: "An unexpected error occurred" }, 500, corsHeaders);
  }
});
