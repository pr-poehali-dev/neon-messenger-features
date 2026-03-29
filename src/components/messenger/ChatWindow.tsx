import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { User, Message, Chat } from './types';

interface ChatWindowProps {
  currentUser: User;
  chatUserId: string;
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  onDeleteChat: (forBoth?: boolean) => void;
  onBlockUser: () => void;
  onUpdateChat: (data: Partial<Chat>) => void;
}

const VOICE_EFFECTS = ['Обычный', 'Робот', 'Эхо', 'Глубокий', 'Высокий'];

export default function ChatWindow({ currentUser, chatUserId, chat, messages, onSendMessage, onDeleteChat, onBlockUser, onUpdateChat }: ChatWindowProps) {
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<null | 'self' | 'both'>(null);
  const [showVoiceEffects, setShowVoiceEffects] = useState(false);
  const [voiceEffect, setVoiceEffect] = useState('Обычный');
  const [recording, setRecording] = useState<null | 'voice' | 'video' | 'circle'>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [editName, setEditName] = useState(false);
  const [editDesc, setEditDesc] = useState(false);
  const [customName, setCustomName] = useState(chat?.customName || '');
  const [customDesc, setCustomDesc] = useState(chat?.customDescription || '');
  const [showAttach, setShowAttach] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allUsers = JSON.parse(localStorage.getItem('nexus_users') || '[]') as User[];
  const chatUser = allUsers.find(u => u.id === chatUserId);
  const displayName = chat?.customName || chatUser?.name || chatUserId;
  const displayDesc = chat?.customDescription || chatUser?.description || '';

  const chatMessages = messages
    .filter(m =>
      (m.fromId === currentUser.id && m.toId === chatUserId) ||
      (m.fromId === chatUserId && m.toId === currentUser.id)
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  useEffect(() => {
    setCustomName(chat?.customName || '');
    setCustomDesc(chat?.customDescription || '');
  }, [chat?.customName, chat?.customDescription]);

  const startRecording = (type: 'voice' | 'video' | 'circle') => {
    setRecording(type);
    setRecordingTime(0);
    recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (recording) {
      onSendMessage({
        fromId: currentUser.id,
        toId: chatUserId,
        type: recording === 'voice' ? 'voice' : recording === 'video' ? 'video' : 'videocircle',
        duration: recordingTime,
      });
    }
    setRecording(null);
    setRecordingTime(0);
  };

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSendMessage({
      fromId: currentUser.id,
      toId: chatUserId,
      type: 'text',
      text: text.trim(),
      textColor: currentUser.textColor,
    });
    setText('');
  }, [text, currentUser, chatUserId, onSendMessage]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    onSendMessage({
      fromId: currentUser.id,
      toId: chatUserId,
      type: isImage ? 'image' : 'file',
      fileUrl: url,
      fileName: file.name,
      fileSize: file.size,
    });
    setShowAttach(false);
    e.target.value = '';
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  const formatDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatSize = (b: number) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} МБ` : `${(b / 1024).toFixed(0)} КБ`;

  const isBlocked = chat?.blocked;

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'rgba(5,10,15,0.98)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 relative" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)', background: 'rgba(0,10,20,0.95)' }}>
        <div
          className="w-9 h-9 flex items-center justify-center font-orbitron font-bold text-sm flex-shrink-0"
          style={{
            background: isBlocked ? 'rgba(255,0,68,0.1)' : 'rgba(0,212,255,0.1)',
            border: `1px solid ${isBlocked ? 'rgba(255,0,68,0.4)' : 'rgba(0,212,255,0.3)'}`,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            color: isBlocked ? '#ff0044' : '#00d4ff',
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {editName ? (
            <input
              autoFocus
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onBlur={() => { onUpdateChat({ customName: customName || undefined }); setEditName(false); }}
              onKeyDown={e => e.key === 'Enter' && (onUpdateChat({ customName: customName || undefined }), setEditName(false))}
              className="w-full text-sm font-orbitron font-bold outline-none bg-transparent"
              style={{ color: '#00d4ff', borderBottom: '1px solid rgba(0,212,255,0.5)' }}
            />
          ) : (
            <button onClick={() => setEditName(true)} className="text-sm font-orbitron font-bold truncate block text-left hover:opacity-80" style={{ color: isBlocked ? '#ff0044' : '#00d4ff' }}>
              {displayName}
            </button>
          )}
          {editDesc ? (
            <input
              autoFocus
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              onBlur={() => { onUpdateChat({ customDescription: customDesc || undefined }); setEditDesc(false); }}
              onKeyDown={e => e.key === 'Enter' && (onUpdateChat({ customDescription: customDesc || undefined }), setEditDesc(false))}
              className="w-full text-xs font-ibm outline-none bg-transparent mt-0.5"
              style={{ color: 'rgba(0,212,255,0.5)', borderBottom: '1px solid rgba(0,212,255,0.3)' }}
            />
          ) : (
            <button onClick={() => setEditDesc(true)} className="text-xs font-ibm truncate block text-left hover:opacity-80" style={{ color: 'rgba(0,212,255,0.4)', fontSize: '11px' }}>
              {displayDesc || 'Нажмите, чтобы добавить описание'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isBlocked ? (
            <span className="text-xs font-mono-tech px-2 py-0.5" style={{ color: '#ff0044', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '2px' }}>ЗАБЛОКИРОВАН</span>
          ) : (
            <div className="flex items-center gap-1 text-xs font-mono-tech" style={{ color: 'rgba(0,255,136,0.7)', fontSize: '10px' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              E2E
            </div>
          )}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 ml-1"
            style={{ color: 'rgba(0,212,255,0.6)' }}
          >
            <Icon name="MoreVertical" size={16} />
          </button>
        </div>

        {/* Context menu */}
        {showMenu && (
          <div
            className="absolute right-4 top-12 z-50 w-52 py-1 animate-scale-in"
            style={{ background: 'rgba(5,10,20,0.98)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <button
              onClick={() => { setShowMenu(false); setShowVoiceEffects(true); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-ibm hover:bg-blue-500/10 transition-all"
              style={{ color: '#00d4ff' }}
            >
              <Icon name="Mic" size={13} /> Эффекты голоса
            </button>
            <button
              onClick={() => { setShowMenu(false); onBlockUser(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-ibm hover:bg-red-500/10 transition-all"
              style={{ color: isBlocked ? '#00ff88' : '#ff4466' }}
            >
              <Icon name={isBlocked ? 'ShieldCheck' : 'Ban'} size={13} /> {isBlocked ? 'Разблокировать' : 'Заблокировать'}
            </button>
            <div style={{ height: '1px', background: 'rgba(0,212,255,0.1)', margin: '2px 0' }} />
            <button
              onClick={() => { setShowMenu(false); setShowDeleteConfirm('self'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-ibm hover:bg-red-500/10 transition-all"
              style={{ color: '#ff6644' }}
            >
              <Icon name="Trash2" size={13} /> Удалить у себя
            </button>
            <button
              onClick={() => { setShowMenu(false); setShowDeleteConfirm('both'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-ibm hover:bg-red-500/10 transition-all"
              style={{ color: '#ff2244' }}
            >
              <Icon name="Trash" size={13} /> Удалить у обоих
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 cyber-grid-bg" onClick={() => setShowMenu(false)}>
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Icon name="Lock" size={28} style={{ color: '#00d4ff' }} />
            <p className="text-xs font-mono-tech text-neon-blue">ЧАТ ЗАШИФРОВАН</p>
          </div>
        )}
        {chatMessages.map(msg => {
          const isOut = msg.fromId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div
                className="max-w-xs lg:max-w-sm xl:max-w-md px-3 py-2 relative"
                style={{
                  borderRadius: '2px',
                  ...(isOut ? {
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.08))',
                    border: '1px solid rgba(0,212,255,0.3)',
                    boxShadow: '0 0 12px rgba(0,212,255,0.1)',
                  } : {
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.06))',
                    border: '1px solid rgba(168,85,247,0.25)',
                    boxShadow: '0 0 12px rgba(168,85,247,0.08)',
                  })
                }}
              >
                {msg.type === 'text' && (
                  <p className="text-sm font-ibm break-words" style={{ color: msg.textColor || (isOut ? '#00d4ff' : '#c084fc') }}>
                    {msg.text}
                  </p>
                )}
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-2">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110"
                      style={{ background: isOut ? 'rgba(0,212,255,0.3)' : 'rgba(168,85,247,0.3)', color: isOut ? '#00d4ff' : '#c084fc' }}
                    >
                      <Icon name="Play" size={12} />
                    </button>
                    <div className="flex gap-px">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-0.5 rounded-full" style={{ height: `${8 + Math.random() * 16}px`, background: isOut ? 'rgba(0,212,255,0.6)' : 'rgba(168,85,247,0.6)' }} />
                      ))}
                    </div>
                    <span className="text-xs font-mono-tech" style={{ color: isOut ? 'rgba(0,212,255,0.6)' : 'rgba(168,85,247,0.6)' }}>
                      {formatDur(msg.duration || 0)}
                    </span>
                    <Icon name="Mic" size={10} style={{ color: isOut ? 'rgba(0,212,255,0.4)' : 'rgba(168,85,247,0.4)' }} />
                  </div>
                )}
                {(msg.type === 'video' || msg.type === 'videocircle') && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: isOut ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(168,85,247,0.3)',
                        borderRadius: msg.type === 'videocircle' ? '50%' : '2px',
                      }}
                    >
                      <Icon name="Video" size={18} style={{ color: isOut ? '#00d4ff' : '#c084fc' }} />
                    </div>
                    <div>
                      <p className="text-xs font-orbitron" style={{ color: isOut ? '#00d4ff' : '#c084fc' }}>
                        {msg.type === 'videocircle' ? 'ВИДЕОКРУЖОК' : 'ВИДЕО'}
                      </p>
                      <p className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.4)' }}>{formatDur(msg.duration || 0)}</p>
                    </div>
                  </div>
                )}
                {msg.type === 'image' && (
                  <div className="space-y-1">
                    <div className="w-48 h-32 flex items-center justify-center rounded relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}>
                      {msg.fileUrl ? (
                        <img src={msg.fileUrl} alt="img" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="Image" size={24} style={{ color: 'rgba(0,212,255,0.3)' }} />
                      )}
                    </div>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-1 text-xs font-mono-tech hover:opacity-80" style={{ color: isOut ? 'rgba(0,212,255,0.6)' : 'rgba(168,85,247,0.6)' }}>
                        <Icon name="Download" size={10} /> Сохранить
                      </a>
                    )}
                  </div>
                )}
                {msg.type === 'file' && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}>
                      <Icon name="FileText" size={14} style={{ color: isOut ? '#00d4ff' : '#c084fc' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-ibm truncate" style={{ color: isOut ? '#00d4ff' : '#c084fc' }}>{msg.fileName}</p>
                      <p className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.4)' }}>{formatSize(msg.fileSize || 0)}</p>
                    </div>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl} download={msg.fileName} className="flex-shrink-0 hover:scale-110 transition-all" style={{ color: isOut ? '#00d4ff' : '#c084fc' }}>
                        <Icon name="Download" size={14} />
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.3)', fontSize: '9px' }}>{formatTime(msg.timestamp)}</span>
                  {isOut && <Icon name="CheckCheck" size={10} style={{ color: 'rgba(0,212,255,0.5)' }} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isBlocked && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(0,5,10,0.95)' }}>
          {recording && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 animate-fade-in" style={{ background: 'rgba(255,0,68,0.08)', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '2px' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono-tech text-red-400">
                {recording === 'voice' ? 'ЗАПИСЬ ГОЛОСА' : recording === 'video' ? 'ЗАПИСЬ ВИДЕО' : 'ЗАПИСЬ КРУЖКА'} — {formatDur(recordingTime)}
              </span>
              <button onClick={stopRecording} className="ml-auto text-xs font-orbitron px-2 py-0.5 hover:opacity-80" style={{ color: '#ff0044', border: '1px solid rgba(255,0,68,0.4)', borderRadius: '2px' }}>
                СТОП
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Attach */}
            <div className="relative">
              <button
                onClick={() => setShowAttach(!showAttach)}
                className="w-9 h-9 flex items-center justify-center transition-all hover:scale-110"
                style={{ color: 'rgba(0,212,255,0.6)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
              >
                <Icon name="Paperclip" size={15} />
              </button>
              {showAttach && (
                <div className="absolute bottom-10 left-0 z-50 w-44 py-1 animate-scale-in" style={{ background: 'rgba(5,10,20,0.98)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
                    <Icon name="File" size={13} /> Файл / Фото
                  </button>
                  <button onClick={() => { startRecording('voice'); setShowAttach(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
                    <Icon name="Mic" size={13} /> Голосовое
                  </button>
                  <button onClick={() => { startRecording('video'); setShowAttach(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
                    <Icon name="Video" size={13} /> Видеосообщение
                  </button>
                  <button onClick={() => { startRecording('circle'); setShowAttach(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
                    <Icon name="Circle" size={13} /> Видеокружок
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Зашифрованное сообщение..."
              rows={1}
              className="flex-1 resize-none outline-none text-sm font-ibm px-3 py-2"
              style={{
                background: 'rgba(0,212,255,0.05)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '2px',
                color: currentUser.textColor || '#00d4ff',
                maxHeight: '100px',
                lineHeight: '1.4',
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 100) + 'px';
              }}
            />

            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="w-9 h-9 flex items-center justify-center transition-all hover:scale-110 flex-shrink-0"
              style={{
                background: text.trim() ? '#00d4ff' : 'rgba(0,212,255,0.1)',
                color: text.trim() ? '#050a0f' : 'rgba(0,212,255,0.3)',
                borderRadius: '2px',
                boxShadow: text.trim() ? '0 0 15px rgba(0,212,255,0.4)' : 'none',
              }}
            >
              <Icon name="Send" size={15} />
            </button>
          </div>
        </div>
      )}
      {isBlocked && (
        <div className="px-4 py-4 text-center" style={{ borderTop: '1px solid rgba(255,0,68,0.1)' }}>
          <p className="text-xs font-orbitron" style={{ color: 'rgba(255,0,68,0.6)' }}>ПОЛЬЗОВАТЕЛЬ ЗАБЛОКИРОВАН</p>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="p-6 max-w-sm w-full mx-4 animate-scale-in" style={{ background: 'rgba(5,10,15,0.98)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '2px' }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="AlertTriangle" size={18} style={{ color: '#ff4444' }} />
              <h3 className="font-orbitron font-bold text-sm" style={{ color: '#ff4444' }}>УДАЛЕНИЕ ЧАТА</h3>
            </div>
            <p className="text-xs font-ibm mb-4" style={{ color: 'rgba(0,212,255,0.6)' }}>
              {showDeleteConfirm === 'both' ? 'Удалить чат у обоих пользователей? Это действие необратимо.' : 'Удалить чат только у себя?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { onDeleteChat(showDeleteConfirm === 'both'); setShowDeleteConfirm(null); }}
                className="flex-1 py-2 text-xs font-orbitron font-bold transition-all"
                style={{ background: 'rgba(255,0,68,0.2)', color: '#ff4444', border: '1px solid rgba(255,0,68,0.4)', borderRadius: '2px' }}
              >
                УДАЛИТЬ
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 text-xs font-orbitron font-bold transition-all"
                style={{ background: 'transparent', color: 'rgba(0,212,255,0.6)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice effects */}
      {showVoiceEffects && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="p-6 max-w-xs w-full mx-4 animate-scale-in" style={{ background: 'rgba(5,10,15,0.98)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}>
            <h3 className="font-orbitron font-bold text-sm mb-4 text-neon-blue">ЭФФЕКТЫ ГОЛОСА</h3>
            <div className="space-y-2 mb-4">
              {VOICE_EFFECTS.map(e => (
                <button
                  key={e}
                  onClick={() => setVoiceEffect(e)}
                  className="w-full py-2 px-3 text-xs font-ibm text-left transition-all"
                  style={{
                    background: voiceEffect === e ? 'rgba(0,212,255,0.15)' : 'transparent',
                    border: voiceEffect === e ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(0,212,255,0.1)',
                    borderRadius: '2px',
                    color: voiceEffect === e ? '#00d4ff' : 'rgba(0,212,255,0.5)',
                    boxShadow: voiceEffect === e ? '0 0 8px rgba(0,212,255,0.2)' : 'none',
                  }}
                >
                  {e === voiceEffect ? '◆ ' : '◇ '}{e}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowVoiceEffects(false)}
              className="w-full py-2 text-xs font-orbitron font-bold"
              style={{ background: '#00d4ff', color: '#050a0f', borderRadius: '2px', boxShadow: '0 0 15px rgba(0,212,255,0.4)' }}
            >
              ПРИМЕНИТЬ
            </button>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept="*/*" />
    </div>
  );
}
