// Unified Comment and CommentUser types for use across the app
export interface CommentUser {
  id: string;
  name: string | null;
  avatar: string | null;
  initials: string | null;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  user: CommentUser;
  ticketId?: string;
}
