-- ==============================================================================
-- NeuraMind — Phase 2A: Supabase Database Schema & Security (Student Profiles)
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  education_level TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
-- Authenticated students can view ONLY their own profile
CREATE POLICY "Students can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Authenticated students can insert ONLY their own profile
CREATE POLICY "Students can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Authenticated students can update ONLY their own profile
CREATE POLICY "Students can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Function & Trigger: Automatic profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, education_level)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'education_level', '')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Function & Trigger: Automatic updated_at timestamp maintenance
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- NeuraMind — Phase 5A: AI Tutor Chat System Schema & Row Level Security
-- ==============================================================================

-- 6. Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_messages_role_check CHECK (role IN ('user', 'assistant'))
);

-- 8. Enable Row Level Security (RLS) on Chat Tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies for chat_sessions
-- SELECT: Students can view only their own sessions
DROP POLICY IF EXISTS "Students can view their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Students can view their own chat sessions"
  ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Students can create sessions only for themselves
DROP POLICY IF EXISTS "Students can insert their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Students can insert their own chat sessions"
  ON public.chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Students can update only their own sessions
DROP POLICY IF EXISTS "Students can update their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Students can update their own chat sessions"
  ON public.chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Students can delete only their own sessions
DROP POLICY IF EXISTS "Students can delete their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Students can delete their own chat sessions"
  ON public.chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 10. Row Level Security Policies for chat_messages
-- Enforces double-ownership check: message.user_id = auth.uid() AND parent session.user_id = auth.uid()

-- SELECT: Students can view only messages from their own sessions
DROP POLICY IF EXISTS "Students can view messages from their own sessions" ON public.chat_messages;
CREATE POLICY "Students can view messages from their own sessions"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE public.chat_sessions.id = chat_messages.session_id
        AND public.chat_sessions.user_id = auth.uid()
    )
  );

-- INSERT: Students can insert messages only into their own sessions
DROP POLICY IF EXISTS "Students can insert messages into their own sessions" ON public.chat_messages;
CREATE POLICY "Students can insert messages into their own sessions"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE public.chat_sessions.id = chat_messages.session_id
        AND public.chat_sessions.user_id = auth.uid()
    )
  );

-- UPDATE: Students can update only their own messages within their own sessions
DROP POLICY IF EXISTS "Students can update messages in their own sessions" ON public.chat_messages;
CREATE POLICY "Students can update messages in their own sessions"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE public.chat_sessions.id = chat_messages.session_id
        AND public.chat_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE public.chat_sessions.id = chat_messages.session_id
        AND public.chat_sessions.user_id = auth.uid()
    )
  );

-- DELETE: Students can delete only their own messages within their own sessions
DROP POLICY IF EXISTS "Students can delete messages from their own sessions" ON public.chat_messages;
CREATE POLICY "Students can delete messages from their own sessions"
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE public.chat_sessions.id = chat_messages.session_id
        AND public.chat_sessions.user_id = auth.uid()
    )
  );

-- 11. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON public.chat_messages(session_id, created_at ASC);

-- 12. Trigger: Automatically maintain updated_at on chat_sessions
DROP TRIGGER IF EXISTS set_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER set_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
