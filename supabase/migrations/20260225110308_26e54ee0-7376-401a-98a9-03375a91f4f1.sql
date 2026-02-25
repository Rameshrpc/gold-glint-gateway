
-- 1. whatsapp_chats table
CREATE TABLE public.whatsapp_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_phone VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INT NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, customer_phone)
);

-- 2. whatsapp_messages table
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.whatsapp_chats(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_type VARCHAR NOT NULL,
  sender_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  message_text TEXT,
  message_type VARCHAR NOT NULL DEFAULT 'text',
  media_url TEXT,
  provider_message_id VARCHAR,
  delivery_status VARCHAR NOT NULL DEFAULT 'sent',
  is_outbound BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Index for message history queries
CREATE INDEX idx_whatsapp_messages_chat_created ON public.whatsapp_messages (chat_id, created_at);

-- 4. Index for inbox sorting
CREATE INDEX idx_whatsapp_chats_last_message ON public.whatsapp_chats (client_id, last_message_at DESC);

-- 5. Updated_at trigger for chats
CREATE TRIGGER update_whatsapp_chats_updated_at
  BEFORE UPDATE ON public.whatsapp_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE public.whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies using existing get_user_client_id()
CREATE POLICY "tenant_isolation" ON public.whatsapp_chats
  FOR ALL TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()))
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "tenant_isolation" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()))
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()));

-- 8. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
