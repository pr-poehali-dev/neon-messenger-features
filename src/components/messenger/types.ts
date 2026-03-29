export interface User {
  id: string;
  login: string;
  name: string;
  description: string;
  password?: string;
  textColor?: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text?: string;
  type: 'text' | 'voice' | 'video' | 'videocircle' | 'file' | 'image';
  timestamp: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  textColor?: string;
}

export interface Chat {
  userId: string;
  customName?: string;
  customDescription?: string;
  blocked?: boolean;
  hidden?: boolean;
}

export interface AppState {
  currentUser: User;
  chats: Chat[];
  messages: Message[];
}
