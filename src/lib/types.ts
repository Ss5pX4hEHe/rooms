export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
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
}

export interface ChatMember {
  chat_id: string;
  user_id: string;
  role: "owner" | "member" | "admin";
  joined_at: string;
  username?: string;
  display_name?: string;
}
