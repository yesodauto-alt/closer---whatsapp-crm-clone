-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Core Tables
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  openai_api_key TEXT,
  instance_name TEXT,
  status TEXT DEFAULT 'DISCONNECTED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  remote_jid TEXT NOT NULL,
  push_name TEXT,
  profile_picture_url TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, remote_jid)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  from_me BOOLEAN DEFAULT FALSE,
  text TEXT,
  type TEXT,
  timestamp TIMESTAMPTZ,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own integrations" ON public.user_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own contacts" ON public.whatsapp_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own messages" ON public.whatsapp_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own import jobs" ON public.import_jobs FOR ALL USING (auth.uid() = user_id);

-- Production starts without demo credentials or synthetic CRM data.
