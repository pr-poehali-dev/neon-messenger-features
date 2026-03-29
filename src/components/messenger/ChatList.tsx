import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { User, Chat, Message } from './types';

interface ChatListProps {
  currentUser: User;
  chats: Chat[];
  messages: Message[];
  activeChat: string | null;
  onSelectChat: (userId: string) => void;
  onNewChat: () => void;
}

export default function ChatList({ currentUser, chats, messages, activeChat, onSelectChat, onNewChat }: ChatListProps) {
  const [search, setSearch] = useState('');

  const allUsers = JSON.parse(localStorage.getItem('nexus_users') || '[]') as User[];

  const chatItems = useMemo(() => {
    return chats
      .filter(c => !c.hidden)
      .map(chat => {
        const user = allUsers.find(u => u.id === chat.userId);
        const lastMsg = [...messages]
          .filter(m => (m.fromId === currentUser.id && m.toId === chat.userId) || (m.fromId === chat.userId && m.toId === currentUser.id))
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        return { chat, user, lastMsg };
      })
      .filter(item => {
        if (!search) return true;
        const displayName = item.chat.customName || item.user?.name || '';
        return displayName.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const ta = a.lastMsg?.timestamp || 0;
        const tb = b.lastMsg?.timestamp || 0;
        return tb - ta;
      });
  }, [chats, messages, search, allUsers, currentUser.id]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
  };

  const getLastMsgText = (msg?: Message) => {
    if (!msg) return 'Нет сообщений';
    if (msg.type === 'voice') return '🎙 Голосовое';
    if (msg.type === 'video' || msg.type === 'videocircle') return '📹 Видео';
    if (msg.type === 'file') return `📎 ${msg.fileName || 'Файл'}`;
    if (msg.type === 'image') return '🖼 Изображение';
    return msg.text || '';
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(5,10,15,0.95)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-orbitron font-bold text-sm tracking-widest text-neon-blue">ЧАТЫ</h2>
          <button
            onClick={onNewChat}
            className="w-7 h-7 flex items-center justify-center rounded transition-all hover:scale-110"
            style={{ border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
            title="Новый чат"
          >
            <Icon name="Plus" size={14} />
          </button>
        </div>
        <div className="relative">
          <Icon name="Search" size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,212,255,0.4)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-8 pr-3 py-1.5 text-xs font-ibm outline-none"
            style={{
              background: 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.15)',
              borderRadius: '2px',
              color: '#00d4ff',
            }}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chatItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Icon name="MessageSquare" size={32} style={{ color: 'rgba(0,212,255,0.2)' }} />
            <p className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.3)' }}>НЕТ ЧАТОВ</p>
            <button
              onClick={onNewChat}
              className="text-xs font-orbitron px-3 py-1.5 transition-all"
              style={{ color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '2px' }}
            >
              НАЧАТЬ ЧАТ
            </button>
          </div>
        ) : (
          chatItems.map(({ chat, user, lastMsg }) => {
            const displayName = chat.customName || user?.name || chat.userId;
            const isActive = activeChat === chat.userId;
            const isBlocked = chat.blocked;

            return (
              <button
                key={chat.userId}
                onClick={() => onSelectChat(chat.userId)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all relative"
                style={{
                  background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                  borderLeft: isActive ? '2px solid #00d4ff' : '2px solid transparent',
                }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 flex items-center justify-center font-orbitron font-bold text-sm"
                    style={{
                      background: isBlocked ? 'rgba(255,0,68,0.1)' : 'rgba(0,212,255,0.1)',
                      border: `1px solid ${isBlocked ? 'rgba(255,0,68,0.4)' : 'rgba(0,212,255,0.3)'}`,
                      borderRadius: '2px',
                      color: isBlocked ? '#ff0044' : '#00d4ff',
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  {isBlocked && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 flex items-center justify-center rounded-full" style={{ background: '#ff0044' }}>
                      <Icon name="Ban" size={6} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-orbitron font-bold truncate" style={{ color: isBlocked ? '#ff0044' : '#00d4ff' }}>
                      {displayName}
                    </span>
                    {lastMsg && (
                      <span className="text-xs font-mono-tech flex-shrink-0 ml-1" style={{ color: 'rgba(0,212,255,0.3)', fontSize: '10px' }}>
                        {formatTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs truncate mt-0.5 font-ibm" style={{ color: 'rgba(0,212,255,0.4)', fontSize: '11px' }}>
                    {getLastMsgText(lastMsg)}
                  </div>
                </div>

                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6" style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }} />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
