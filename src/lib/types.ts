export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  last_seen: string;
  created_at: string;
}

export interface Chat {
  chat_id: string;
  chat_type: "direct" | "group" | "announcement";
  chat_name: string | null;
  other_user_id: string | null;
  other_username: string | null;
  other_display_name: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  last_message_sender: string | null;
  unread_count: number;
  member_role: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  status: "sent" | "delivered" | "read";
  created_at: string;
  sender_username?: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
  reply_to?: string | null;
  reply_content?: string;
  reply_sender?: string;
  edited_at?: string | null;
  forwarded_from?: string | null;
  forwarded_content?: string;
  forwarded_sender?: string;
  deleted?: boolean;
  reactions?: Reaction[];
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasOwn: boolean;
}

export interface ChatMember {
  chat_id: string;
  user_id: string;
  role: "owner" | "member" | "admin";
  joined_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface PinnedMessage {
  id: string;
  chat_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
  content?: string;
  sender_name?: string;
}
