import { useState, useRef, useEffect, useCallback, createPortal } from 'react';
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

const VOICE_EFFECTS = [
  { id: 'normal', label: 'Обычный', pitch: 1, rate: 1 },
  { id: 'robot', label: 'Робот', pitch: 0.5, rate: 0.85 },
  { id: 'echo', label: 'Эхо', pitch: 1.1, rate: 0.95 },
  { id: 'deep', label: 'Глубокий', pitch: 0.6, rate: 0.9 },
  { id: 'high', label: 'Высокий', pitch: 2, rate: 1.1 },
];

type RecordType = 'voice' | 'video' | 'circle';

export default function ChatWindow({ currentUser, chatUserId, chat, messages, onSendMessage, onDeleteChat, onBlockUser, onUpdateChat }: ChatWindowProps) {
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<null | 'self' | 'both'>(null);
  const [showVoiceEffects, setShowVoiceEffects] = useState(false);
  const [voiceEffectId, setVoiceEffectId] = useState('normal');
  const [recording, setRecording] = useState<null | RecordType>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [editName, setEditName] = useState(false);
  const [editDesc, setEditDesc] = useState(false);
  const [customName, setCustomName] = useState(chat?.customName || '');
  const [customDesc, setCustomDesc] = useState(chat?.customDescription || '');
  const [showAttach, setShowAttach] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

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

  // ESC closes overlays
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setShowDeleteConfirm(null);
        setShowVoiceEffects(false);
        setShowAttach(false);
        setEditName(false);
        setEditDesc(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async (type: RecordType) => {
    setMediaError('');
    chunksRef.current = [];

    try {
      const isVideo = type === 'video' || type === 'circle';
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { facingMode: 'user', width: 320, height: 320 } : false,
      });
      streamRef.current = stream;

      if (isVideo && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const mimeType = isVideo
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm');

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);

      setRecording(type);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setMediaError('Нет доступа к микрофону/камере. Разрешите в браузере.');
    }
  };

  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr || !recording) {
      setRecording(null);
      setRecordingTime(0);
      stopStream();
      return;
    }

    const capturedType = recording;
    const capturedTime = recordingTime;

    mr.onstop = () => {
      const isVideo = capturedType === 'video' || capturedType === 'circle';
      const mime = isVideo ? 'video/webm' : 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);

      onSendMessage({
        fromId: currentUser.id,
        toId: chatUserId,
        type: capturedType === 'voice' ? 'voice' : capturedType === 'video' ? 'video' : 'videocircle',
        fileUrl: url,
        fileName: isVideo ? 'video.webm' : 'voice.webm',
        fileSize: blob.size,
        duration: capturedTime,
      });

      stopStream();
      chunksRef.current = [];
    };

    mr.stop();
    setRecording(null);
    setRecordingTime(0);
  }, [recording, recordingTime, currentUser.id, chatUserId, onSendMessage]);

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
  const isVideoRec = recording === 'video' || recording === 'circle';

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
            ref={menuBtnRef}
            onClick={() => {
              if (!showMenu && menuBtnRef.current) {
                const rect = menuBtnRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
              }
              setShowMenu(!showMenu);
            }}
            className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 ml-1"
            style={{ color: 'rgba(0,212,255,0.6)' }}
          >
            <Icon name="MoreVertical" size={16} />
          </button>
        </div>
      </div>

      {/* Context menu — portal, always on top */}
      {showMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)} />
          <div
            className="fixed z-[91] w-52 py-1 animate-scale-in"
            style={{ top: menuPos.top, right: menuPos.right, background: 'rgba(5,10,20,0.99)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: '2px', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
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
              <Icon name={isBlocked ? 'ShieldCheck' : 'Ban'} size={13} />
              {isBlocked ? 'Разблокировать' : 'Заблокировать'}
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
        </>,
        document.body
      )}

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
                  <p className="text-sm font-ibm break-words whitespace-pre-wrap" style={{ color: msg.textColor || (isOut ? '#00d4ff' : '#c084fc') }}>
                    {msg.text}
                  </p>
                )}

                {msg.type === 'voice' && (
                  <div className="flex items-center gap-2 min-w-[180px]">
                    {msg.fileUrl ? (
                      <AudioPlayer url={msg.fileUrl} isOut={isOut} duration={msg.duration || 0} />
                    ) : (
                      <>
                        <div className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0" style={{ background: isOut ? 'rgba(0,212,255,0.2)' : 'rgba(168,85,247,0.2)', color: isOut ? '#00d4ff' : '#c084fc' }}>
                          <Icon name="Mic" size={12} />
                        </div>
                        <div className="flex gap-px">
                          {[...Array(16)].map((_, i) => (
                            <div key={i} className="w-0.5 rounded-full" style={{ height: `${8 + Math.sin(i) * 8 + 4}px`, background: isOut ? 'rgba(0,212,255,0.5)' : 'rgba(168,85,247,0.5)' }} />
                          ))}
                        </div>
                        <span className="text-xs font-mono-tech" style={{ color: isOut ? 'rgba(0,212,255,0.6)' : 'rgba(168,85,247,0.6)' }}>{formatDur(msg.duration || 0)}</span>
                      </>
                    )}
                  </div>
                )}

                {(msg.type === 'video' || msg.type === 'videocircle') && (
                  <div>
                    {msg.fileUrl ? (
                      <div className="relative">
                        <video
                          src={msg.fileUrl}
                          controls
                          playsInline
                          className="max-w-full"
                          style={{
                            borderRadius: msg.type === 'videocircle' ? '50%' : '2px',
                            maxWidth: msg.type === 'videocircle' ? '160px' : '240px',
                            maxHeight: msg.type === 'videocircle' ? '160px' : '180px',
                            display: 'block',
                            objectFit: 'cover',
                            border: isOut ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(168,85,247,0.3)',
                          }}
                        />
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName || 'video.webm'}
                          className="flex items-center gap-1 mt-1 text-xs font-mono-tech hover:opacity-80"
                          style={{ color: isOut ? 'rgba(0,212,255,0.5)' : 'rgba(168,85,247,0.5)' }}
                        >
                          <Icon name="Download" size={10} /> Скачать
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-12 h-12 flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.3)', border: isOut ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(168,85,247,0.3)', borderRadius: msg.type === 'videocircle' ? '50%' : '2px' }}
                        >
                          <Icon name="Video" size={18} style={{ color: isOut ? '#00d4ff' : '#c084fc' }} />
                        </div>
                        <div>
                          <p className="text-xs font-orbitron" style={{ color: isOut ? '#00d4ff' : '#c084fc' }}>{msg.type === 'videocircle' ? 'ВИДЕОКРУЖОК' : 'ВИДЕО'}</p>
                          <p className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.4)' }}>{formatDur(msg.duration || 0)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {msg.type === 'image' && (
                  <div className="space-y-1">
                    <div className="max-w-xs overflow-hidden" style={{ borderRadius: '2px', border: isOut ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(168,85,247,0.2)' }}>
                      <img src={msg.fileUrl} alt="img" className="w-full h-auto object-cover" style={{ maxHeight: '200px' }} />
                    </div>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl} download={msg.fileName || 'image'} className="flex items-center gap-1 text-xs font-mono-tech hover:opacity-80" style={{ color: isOut ? 'rgba(0,212,255,0.6)' : 'rgba(168,85,247,0.6)' }}>
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
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(0,5,10,0.95)' }}>

          {/* Media error */}
          {mediaError && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 animate-fade-in" style={{ background: 'rgba(255,0,68,0.08)', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '2px' }}>
              <Icon name="AlertCircle" size={12} style={{ color: '#ff0044' }} />
              <span className="text-xs font-ibm" style={{ color: '#ff0044' }}>{mediaError}</span>
              <button onClick={() => setMediaError('')} className="ml-auto" style={{ color: 'rgba(255,0,68,0.5)' }}><Icon name="X" size={10} /></button>
            </div>
          )}

          {/* Recording indicator */}
          {recording && (
            <div className="mb-2 animate-fade-in">
              {/* Video preview */}
              {isVideoRec && (
                <div className="mb-2 flex justify-center">
                  <video
                    ref={videoPreviewRef}
                    muted
                    playsInline
                    className="bg-black"
                    style={{
                      width: recording === 'circle' ? '120px' : '200px',
                      height: recording === 'circle' ? '120px' : '140px',
                      borderRadius: recording === 'circle' ? '50%' : '4px',
                      border: '2px solid rgba(255,0,68,0.6)',
                      objectFit: 'cover',
                      boxShadow: '0 0 20px rgba(255,0,68,0.3)',
                    }}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 px-3 py-2" style={{ background: 'rgba(255,0,68,0.08)', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '2px' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-xs font-mono-tech text-red-400">
                  {recording === 'voice' ? '🎙 ГОЛОС' : recording === 'video' ? '📹 ВИДЕО' : '⭕ КРУЖОК'} — {formatDur(recordingTime)}
                </span>
                <button
                  onClick={stopRecording}
                  className="ml-auto text-xs font-orbitron px-3 py-1 transition-all hover:opacity-80"
                  style={{ color: '#ff0044', border: '1px solid rgba(255,0,68,0.5)', borderRadius: '2px', background: 'rgba(255,0,68,0.1)' }}
                >
                  ОТПРАВИТЬ
                </button>
              </div>
            </div>
          )}

          {!recording && (
            <div className="flex items-end gap-2">
              {/* Attach menu */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowAttach(!showAttach)}
                  className="w-9 h-9 flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: 'rgba(0,212,255,0.6)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
                >
                  <Icon name="Paperclip" size={15} />
                </button>
                {showAttach && (
                  <div className="absolute bottom-10 left-0 z-50 w-48 py-1 animate-scale-in" style={{ background: 'rgba(5,10,20,0.98)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
                      <Icon name="File" size={13} /> Файл / Фото
                    </button>
                    <button onClick={() => { startRecording('voice'); setShowAttach(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
                      <Icon name="Mic" size={13} /> Голосовое
                    </button>
                    <button onClick={() => { startRecording('video'); setShowAttach(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
                      <Icon name="Video" size={13} /> Видеосообщение
                    </button>
                    <button onClick={() => { startRecording('circle'); setShowAttach(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-ibm hover:bg-blue-500/10 transition-all" style={{ color: '#00d4ff' }}>
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
          )}
        </div>
      )}

      {isBlocked && (
        <div className="px-4 py-4 text-center flex-shrink-0" style={{ borderTop: '1px solid rgba(255,0,68,0.1)' }}>
          <p className="text-xs font-orbitron" style={{ color: 'rgba(255,0,68,0.6)' }}>ПОЛЬЗОВАТЕЛЬ ЗАБЛОКИРОВАН</p>
        </div>
      )}

      {/* Delete confirm — portal */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[95] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="p-6 max-w-sm w-full mx-4 animate-scale-in" style={{ background: 'rgba(5,10,15,0.98)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '2px', boxShadow: '0 0 40px rgba(255,0,68,0.15)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="AlertTriangle" size={18} style={{ color: '#ff4444' }} />
              <h3 className="font-orbitron font-bold text-sm" style={{ color: '#ff4444' }}>УДАЛЕНИЕ ЧАТА</h3>
            </div>
            <p className="text-xs font-ibm mb-4 leading-relaxed" style={{ color: 'rgba(0,212,255,0.6)' }}>
              {showDeleteConfirm === 'both'
                ? 'Удалить чат и все сообщения у обоих пользователей? Это действие необратимо.'
                : 'Удалить чат только у себя? Собеседник по-прежнему увидит историю.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { onDeleteChat(showDeleteConfirm === 'both'); setShowDeleteConfirm(null); }}
                className="flex-1 py-2 text-xs font-orbitron font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'rgba(255,0,68,0.15)', color: '#ff4444', border: '1px solid rgba(255,0,68,0.4)', borderRadius: '2px' }}
              >
                УДАЛИТЬ
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 text-xs font-orbitron font-bold transition-all hover:opacity-80"
                style={{ background: 'transparent', color: 'rgba(0,212,255,0.6)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Voice effects — portal */}
      {showVoiceEffects && createPortal(
        <div className="fixed inset-0 z-[95] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="p-6 max-w-xs w-full mx-4 animate-scale-in" style={{ background: 'rgba(5,10,15,0.98)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px', boxShadow: '0 0 40px rgba(0,212,255,0.1)' }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-orbitron font-bold text-sm text-neon-blue">ЭФФЕКТЫ ГОЛОСА</h3>
              <button onClick={() => setShowVoiceEffects(false)} style={{ color: 'rgba(0,212,255,0.4)' }}>
                <Icon name="X" size={14} />
              </button>
            </div>
            <p className="text-xs font-mono-tech mb-4" style={{ color: 'rgba(0,212,255,0.3)' }}>Применяются к следующим записям</p>
            <div className="space-y-2 mb-4">
              {VOICE_EFFECTS.map(e => (
                <button
                  key={e.id}
                  onClick={() => setVoiceEffectId(e.id)}
                  className="w-full py-2 px-3 text-xs font-ibm text-left transition-all flex items-center gap-2 hover:opacity-90 active:scale-98"
                  style={{
                    background: voiceEffectId === e.id ? 'rgba(0,212,255,0.12)' : 'transparent',
                    border: voiceEffectId === e.id ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(0,212,255,0.1)',
                    borderRadius: '2px',
                    color: voiceEffectId === e.id ? '#00d4ff' : 'rgba(0,212,255,0.5)',
                    boxShadow: voiceEffectId === e.id ? '0 0 8px rgba(0,212,255,0.15)' : 'none',
                  }}
                >
                  <Icon name={voiceEffectId === e.id ? 'CheckCircle' : 'Circle'} size={12} />
                  <span>{e.label}</span>
                  <span className="ml-auto font-mono-tech" style={{ fontSize: '9px', color: 'rgba(0,212,255,0.3)' }}>
                    pitch ×{e.pitch}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowVoiceEffects(false)}
              className="w-full py-2 text-xs font-orbitron font-bold transition-all hover:opacity-90"
              style={{ background: '#00d4ff', color: '#050a0f', borderRadius: '2px', boxShadow: '0 0 15px rgba(0,212,255,0.4)' }}
            >
              ПРИМЕНИТЬ
            </button>
          </div>
        </div>,
        document.body
      )}

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} accept="*/*" />
    </div>
  );
}

// Inline audio player component
function AudioPlayer({ url, isOut, duration }: { url: string; isOut: boolean; duration: number }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const formatDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => {
          const a = e.currentTarget;
          setCurrentTime(a.currentTime);
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
      />
      <button
        onClick={toggle}
        className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-all hover:scale-110"
        style={{ background: isOut ? 'rgba(0,212,255,0.25)' : 'rgba(168,85,247,0.25)', color: isOut ? '#00d4ff' : '#c084fc', border: `1px solid ${isOut ? 'rgba(0,212,255,0.4)' : 'rgba(168,85,247,0.4)'}` }}
      >
        <Icon name={playing ? 'Pause' : 'Play'} size={12} />
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-1 rounded-full overflow-hidden" style={{ background: isOut ? 'rgba(0,212,255,0.15)' : 'rgba(168,85,247,0.15)' }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: isOut ? '#00d4ff' : '#c084fc', boxShadow: isOut ? '0 0 4px #00d4ff' : '0 0 4px #c084fc' }}
          />
        </div>
        <span className="text-xs font-mono-tech" style={{ color: isOut ? 'rgba(0,212,255,0.5)' : 'rgba(168,85,247,0.5)', fontSize: '9px' }}>
          {playing ? formatDur(Math.round(currentTime)) : formatDur(duration)}
        </span>
      </div>

      <a href={url} download="voice.webm" className="flex-shrink-0 hover:opacity-80 transition-all" style={{ color: isOut ? 'rgba(0,212,255,0.4)' : 'rgba(168,85,247,0.4)' }}>
        <Icon name="Download" size={12} />
      </a>
    </div>
  );
}