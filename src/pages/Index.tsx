import { useState, useCallback, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import AuthScreen from '@/components/messenger/AuthScreen';
import ChatList from '@/components/messenger/ChatList';
import ChatWindow from '@/components/messenger/ChatWindow';
import ProfileScreen from '@/components/messenger/ProfileScreen';
import SettingsScreen from '@/components/messenger/SettingsScreen';
import NewChatModal from '@/components/messenger/NewChatModal';
import { User, Message, Chat } from '@/components/messenger/types';

type Tab = 'chats' | 'profile' | 'settings';

const STORAGE_KEYS = {
  messages: 'nexus_messages',
  chats: (userId: string) => `nexus_chats_${userId}`,
};

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexus_current');
    return saved ? JSON.parse(saved) : null;
  });
  const [tab, setTab] = useState<Tab>('chats');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(() =>
    JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]')
  );
  const [chats, setChats] = useState<Chat[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.chats(currentUser.id)) || '[]') as Chat[];
      setChats(saved);
    }
  }, [currentUser?.id]);

  const saveChats = useCallback((updated: Chat[], userId: string) => {
    localStorage.setItem(STORAGE_KEYS.chats(userId), JSON.stringify(updated));
    setChats(updated);
  }, []);

  const saveMessages = useCallback((updated: Message[]) => {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(updated));
    setMessages(updated);
  }, []);

  const handleAuth = useCallback((user: User) => {
    setCurrentUser(user);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.chats(user.id)) || '[]') as Chat[];
    setChats(saved);
  }, []);

  const handleSendMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = { ...msg, id: Date.now().toString(), timestamp: Date.now() };
    const updated = [...messages, newMsg];
    saveMessages(updated);
  }, [messages, saveMessages]);

  const handleSelectChat = useCallback((userId: string) => {
    setActiveChat(userId);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleNewChat = useCallback((userId: string) => {
    if (!currentUser) return;
    const exists = chats.find(c => c.userId === userId);
    if (!exists) {
      const updated = [...chats, { userId, hidden: false }];
      saveChats(updated, currentUser.id);
    } else if (exists.hidden) {
      const updated = chats.map(c => c.userId === userId ? { ...c, hidden: false } : c);
      saveChats(updated, currentUser.id);
    }
    setActiveChat(userId);
    setShowNewChat(false);
    setSidebarOpen(false);
  }, [chats, currentUser, saveChats]);

  const handleDeleteChat = useCallback((forBoth: boolean = false) => {
    if (!currentUser || !activeChat) return;
    if (forBoth) {
      const updatedMsgs = messages.filter(m =>
        !((m.fromId === currentUser.id && m.toId === activeChat) || (m.fromId === activeChat && m.toId === currentUser.id))
      );
      saveMessages(updatedMsgs);
    }
    const updated = chats.filter(c => c.userId !== activeChat);
    saveChats(updated, currentUser.id);
    setActiveChat(null);
    setSidebarOpen(true);
  }, [currentUser, activeChat, chats, messages, saveChats, saveMessages]);

  const handleBlockUser = useCallback(() => {
    if (!currentUser || !activeChat) return;
    const updated = chats.map(c => c.userId === activeChat ? { ...c, blocked: !c.blocked } : c);
    saveChats(updated, currentUser.id);
  }, [currentUser, activeChat, chats, saveChats]);

  const handleUpdateChat = useCallback((data: Partial<Chat>) => {
    if (!currentUser || !activeChat) return;
    const updated = chats.map(c => c.userId === activeChat ? { ...c, ...data } : c);
    saveChats(updated, currentUser.id);
  }, [currentUser, activeChat, chats, saveChats]);

  const handleUpdateUser = useCallback((data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem('nexus_current', JSON.stringify(updated));
    const users = JSON.parse(localStorage.getItem('nexus_users') || '[]') as User[];
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) { users[idx] = { ...users[idx], ...data }; localStorage.setItem('nexus_users', JSON.stringify(users)); }
  }, [currentUser]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('nexus_current');
    setCurrentUser(null);
    setActiveChat(null);
    setChats([]);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    if (!currentUser) return;
    const users = (JSON.parse(localStorage.getItem('nexus_users') || '[]') as User[]).filter(u => u.id !== currentUser.id);
    localStorage.setItem('nexus_users', JSON.stringify(users));
    localStorage.removeItem('nexus_current');
    localStorage.removeItem(STORAGE_KEYS.chats(currentUser.id));
    setCurrentUser(null);
    setActiveChat(null);
    setChats([]);
  }, [currentUser]);

  if (!currentUser) return <AuthScreen onAuth={handleAuth} />;

  const activeChatData = chats.find(c => c.userId === activeChat) || null;

  const navItems: { tab: Tab; icon: string; label: string }[] = [
    { tab: 'chats', icon: 'MessageSquare', label: 'ЧАТЫ' },
    { tab: 'profile', icon: 'User', label: 'ПРОФИЛЬ' },
    { tab: 'settings', icon: 'Settings', label: 'НАСТРОЙКИ' },
  ];

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--cyber-dark)' }}>
      {/* Sidebar */}
      <div
        className="flex flex-col h-full transition-all duration-300 flex-shrink-0"
        style={{
          width: sidebarOpen ? '280px' : '0px',
          overflow: 'hidden',
          borderRight: '1px solid rgba(0,212,255,0.1)',
          minWidth: sidebarOpen ? '280px' : '0px',
        }}
      >
        {/* Logo bar */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)', background: 'rgba(0,5,10,0.95)' }}>
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ border: '1px solid rgba(0,212,255,0.4)', borderRadius: '2px', boxShadow: '0 0 10px rgba(0,212,255,0.2)' }}>
            <Icon name="Shield" size={14} style={{ color: '#00d4ff' }} />
          </div>
          <span className="font-orbitron font-black text-sm tracking-widest text-neon-blue" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)', whiteSpace: 'nowrap' }}>NEXUS</span>
          <div className="ml-auto flex items-center gap-1 text-xs font-mono-tech flex-shrink-0" style={{ color: 'rgba(0,255,136,0.6)', fontSize: '9px' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span style={{ whiteSpace: 'nowrap' }}>SECURE</span>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
          {navItems.map(item => (
            <button
              key={item.tab}
              onClick={() => setTab(item.tab)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
              style={{
                color: tab === item.tab ? '#00d4ff' : 'rgba(0,212,255,0.35)',
                borderBottom: tab === item.tab ? '2px solid #00d4ff' : '2px solid transparent',
                background: tab === item.tab ? 'rgba(0,212,255,0.04)' : 'transparent',
              }}
            >
              <Icon name={item.icon} size={15} />
              <span className="font-orbitron font-bold" style={{ fontSize: '8px', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {tab === 'chats' && (
            <ChatList
              currentUser={currentUser}
              chats={chats}
              messages={messages}
              activeChat={activeChat}
              onSelectChat={handleSelectChat}
              onNewChat={() => setShowNewChat(true)}
            />
          )}
          {tab === 'profile' && (
            <ProfileScreen
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onDeleteAccount={handleDeleteAccount}
            />
          )}
          {tab === 'settings' && <SettingsScreen />}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header strip when sidebar closed */}
        {!sidebarOpen && (
          <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,5,10,0.95)' }}>
            <button
              onClick={() => { setSidebarOpen(true); setActiveChat(null); }}
              className="flex items-center gap-2 px-2 py-1 text-xs font-orbitron transition-all hover:opacity-80"
              style={{ color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
            >
              <Icon name="ChevronLeft" size={13} /> НАЗАД
            </button>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 ml-1" style={{ border: '1px solid rgba(0,212,255,0.3)', borderRadius: '2px' }}>
              <Icon name="Shield" size={11} style={{ color: '#00d4ff' }} />
            </div>
            <span className="font-orbitron font-bold text-xs text-neon-blue tracking-widest">NEXUS</span>
          </div>
        )}

        {activeChat && currentUser ? (
          <ChatWindow
            currentUser={currentUser}
            chatUserId={activeChat}
            chat={activeChatData}
            messages={messages}
            onSendMessage={handleSendMessage}
            onDeleteChat={handleDeleteChat}
            onBlockUser={handleBlockUser}
            onUpdateChat={handleUpdateChat}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 cyber-grid-bg h-full relative">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 flex items-center justify-center mx-auto" style={{ border: '2px solid rgba(0,212,255,0.2)', borderRadius: '2px', boxShadow: '0 0 30px rgba(0,212,255,0.08)', background: 'rgba(0,212,255,0.03)' }}>
                <Icon name="MessageSquare" size={28} style={{ color: 'rgba(0,212,255,0.4)' }} />
              </div>
              <p className="font-orbitron text-sm font-bold" style={{ color: 'rgba(0,212,255,0.4)' }}>NEXUS MESSENGER</p>
              <p className="font-mono-tech text-xs" style={{ color: 'rgba(0,212,255,0.25)' }}>ВЫБЕРИТЕ ЧАТ ДЛЯ НАЧАЛА</p>
              <div className="flex items-center justify-center gap-2 text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.2)', fontSize: '10px' }}>
                <Icon name="Lock" size={10} />
                <span>E2E ENCRYPTED</span>
              </div>
            </div>

            {/* Sidebar toggle — only when sidebar is open */}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-all hover:scale-110"
                style={{ border: '1px solid rgba(0,212,255,0.15)', borderRadius: '2px', color: 'rgba(0,212,255,0.4)', background: 'rgba(5,10,15,0.5)' }}
              >
                <Icon name="PanelLeftClose" size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && currentUser && (
        <NewChatModal
          currentUser={currentUser}
          existingChatIds={chats.map(c => c.userId)}
          onStart={handleNewChat}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </div>
  );
}