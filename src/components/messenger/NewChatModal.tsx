import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';

interface NewChatModalProps {
  currentUser: User;
  existingChatIds: string[];
  onStart: (userId: string) => void;
  onClose: () => void;
}

export default function NewChatModal({ currentUser, existingChatIds, onStart, onClose }: NewChatModalProps) {
  const [search, setSearch] = useState('');

  const allUsers = (JSON.parse(localStorage.getItem('nexus_users') || '[]') as User[])
    .filter(u => u.id !== currentUser.id);

  const filtered = allUsers.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm mx-4 animate-scale-in" style={{ background: 'rgba(5,10,15,0.98)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px', boxShadow: '0 0 40px rgba(0,212,255,0.1)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <h3 className="font-orbitron font-bold text-sm text-neon-blue">НОВЫЙ ЧАТ</h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center hover:opacity-70" style={{ color: 'rgba(0,212,255,0.5)' }}>
            <Icon name="X" size={14} />
          </button>
        </div>

        <div className="p-3">
          <div className="relative mb-3">
            <Icon name="Search" size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,212,255,0.4)' }} />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени или логину..."
              className="w-full pl-8 pr-3 py-2 text-xs font-ibm outline-none"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '2px', color: '#00d4ff' }}
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center">
                <Icon name="Users" size={24} className="mx-auto mb-2" style={{ color: 'rgba(0,212,255,0.2)' }} />
                <p className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.3)' }}>
                  {allUsers.length === 0 ? 'НЕТ ДРУГИХ ПОЛЬЗОВАТЕЛЕЙ' : 'ПОЛЬЗОВАТЕЛИ НЕ НАЙДЕНЫ'}
                </p>
              </div>
            ) : (
              filtered.map(user => {
                const hasChat = existingChatIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => onStart(user.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 transition-all hover:bg-blue-500/5"
                    style={{ borderRadius: '2px' }}
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center font-orbitron font-bold text-sm flex-shrink-0"
                      style={{
                        background: 'rgba(0,212,255,0.1)',
                        border: '1px solid rgba(0,212,255,0.25)',
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        color: '#00d4ff',
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-orbitron font-bold" style={{ color: '#00d4ff' }}>{user.name}</p>
                      <p className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.4)', fontSize: '10px' }}>@{user.login}</p>
                    </div>
                    {hasChat && (
                      <span className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.3)', fontSize: '9px' }}>ЧАТ ЕСТЬ</span>
                    )}
                    <Icon name="ChevronRight" size={12} style={{ color: 'rgba(0,212,255,0.3)' }} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
