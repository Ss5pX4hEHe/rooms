-- =============================================
-- ROOMS MESSENGER — вставь всё это в Supabase SQL Editor и нажми Run
-- =============================================

-- Профили
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Чаты
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct','group','announcement')),
  name TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Участники
CREATE TABLE public.chat_members (
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner','member','admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- RLS для чатов
CREATE POLICY "chats_read" ON public.chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = chats.id AND user_id = auth.uid())
);
CREATE POLICY "chats_insert" ON public.chats FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "chats_update" ON public.chats FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = chats.id AND user_id = auth.uid() AND role IN ('owner','admin'))
);

-- RLS для участников
CREATE POLICY "members_read" ON public.chat_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_members AS cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid())
);
CREATE POLICY "members_insert" ON public.chat_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_delete" ON public.chat_members FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.chat_members AS cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid() AND cm.role IN ('owner','admin')
  )
);

-- Сообщения
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL CHECK (length(content) <= 4000),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','read')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_chat ON public.messages (chat_id, created_at DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_read" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = messages.chat_id AND user_id = auth.uid())
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = messages.chat_id AND user_id = auth.uid())
);

-- Инвайты
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ,
  max_uses INT DEFAULT 0,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_read" ON public.invites FOR SELECT USING (true);
CREATE POLICY "invites_insert" ON public.invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = invites.chat_id AND user_id = auth.uid() AND role IN ('owner','admin'))
);
CREATE POLICY "invites_update" ON public.invites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = invites.chat_id AND user_id = auth.uid() AND role IN ('owner','admin'))
);

-- Функция: получить или создать direct чат
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  existing UUID;
  new_id UUID;
BEGIN
  SELECT cm1.chat_id INTO existing
  FROM public.chat_members cm1
  JOIN public.chat_members cm2 ON cm1.chat_id = cm2.chat_id
  JOIN public.chats c ON c.id = cm1.chat_id
  WHERE cm1.user_id = auth.uid() AND cm2.user_id = other_user_id AND c.type = 'direct';
  IF existing IS NOT NULL THEN RETURN existing; END IF;
  INSERT INTO public.chats (type, created_by) VALUES ('direct', auth.uid()) RETURNING id INTO new_id;
  INSERT INTO public.chat_members (chat_id, user_id, role) VALUES (new_id, auth.uid(), 'owner');
  INSERT INTO public.chat_members (chat_id, user_id, role) VALUES (new_id, other_user_id, 'member');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция: присоединиться по инвайт-коду
CREATE OR REPLACE FUNCTION public.join_by_invite(invite_code TEXT)
RETURNS UUID AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM public.invites WHERE code = invite_code;
  IF inv IS NULL THEN RAISE EXCEPTION 'Invalid invite'; END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN RAISE EXCEPTION 'Expired'; END IF;
  IF inv.max_uses > 0 AND inv.use_count >= inv.max_uses THEN RAISE EXCEPTION 'Limit reached'; END IF;
  IF EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = inv.chat_id AND user_id = auth.uid()) THEN
    RETURN inv.chat_id;
  END IF;
  INSERT INTO public.chat_members (chat_id, user_id, role) VALUES (inv.chat_id, auth.uid(), 'member');
  UPDATE public.invites SET use_count = use_count + 1 WHERE id = inv.id;
  RETURN inv.chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция: мои чаты с последним сообщением
CREATE OR REPLACE FUNCTION public.get_my_chats()
RETURNS TABLE (
  chat_id UUID, chat_type TEXT, chat_name TEXT,
  other_user_id UUID, other_username TEXT, other_display_name TEXT,
  last_message_content TEXT, last_message_at TIMESTAMPTZ, last_message_sender UUID,
  unread_count BIGINT, member_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.type, c.name,
    CASE WHEN c.type='direct' THEN om.user_id ELSE NULL END,
    CASE WHEN c.type='direct' THEN p.username ELSE NULL END,
    CASE WHEN c.type='direct' THEN p.display_name ELSE NULL END,
    lm.content, lm.created_at, lm.sender_id,
    (SELECT count(*) FROM public.messages m WHERE m.chat_id=c.id AND m.created_at>cm.last_read_at AND m.sender_id!=auth.uid()),
    cm.role
  FROM public.chat_members cm
  JOIN public.chats c ON c.id=cm.chat_id
  LEFT JOIN LATERAL (SELECT cm2.user_id FROM public.chat_members cm2 WHERE cm2.chat_id=c.id AND cm2.user_id!=auth.uid() LIMIT 1) om ON c.type='direct'
  LEFT JOIN public.profiles p ON p.id=om.user_id
  LEFT JOIN LATERAL (SELECT m.content,m.created_at,m.sender_id FROM public.messages m WHERE m.chat_id=c.id ORDER BY m.created_at DESC LIMIT 1) lm ON true
  WHERE cm.user_id=auth.uid()
  ORDER BY CASE WHEN c.type='announcement' THEN 0 ELSE 1 END, lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Автоматически добавлять новых юзеров в announcement канал
CREATE OR REPLACE FUNCTION public.auto_join_announcement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_members (chat_id, user_id, role)
  SELECT c.id, NEW.id, 'member'
  FROM public.chats c WHERE c.type = 'announcement'
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_profile_auto_announce
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_join_announcement();
