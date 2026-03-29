import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface NexusUser { id: string; login: string; name: string; password: string; description: string; }

interface AuthScreenProps {
  onAuth: (user: { id: string; login: string; name: string; description: string }) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (mode === 'register') {
        if (!login || !password || !name) { setError('Заполните все поля'); return; }
        if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
        const users = JSON.parse(localStorage.getItem('nexus_users') || '[]') as NexusUser[];
        if (users.find((u) => u.login === login)) { setError('Логин уже занят'); return; }
        const user: NexusUser = { id: Date.now().toString(), login, name, password, description: 'Новый пользователь NEXUS' };
        users.push(user);
        localStorage.setItem('nexus_users', JSON.stringify(users));
        localStorage.setItem('nexus_current', JSON.stringify(user));
        onAuth(user);
      } else {
        if (!login || !password) { setError('Введите логин и пароль'); return; }
        const users = JSON.parse(localStorage.getItem('nexus_users') || '[]') as NexusUser[];
        const user = users.find((u) => u.login === login && u.password === password);
        if (!user) { setError('Неверный логин или пароль'); return; }
        localStorage.setItem('nexus_current', JSON.stringify(user));
        onAuth(user);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden cyber-grid-bg">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/6 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }} />
        {/* Data streams */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px opacity-20"
            style={{
              left: `${15 + i * 14}%`,
              top: '-100px',
              height: '200px',
              background: 'linear-gradient(transparent, #00d4ff, transparent)',
              animation: `dataStream ${3 + i * 0.7}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md px-4 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 relative">
            <div className="absolute inset-0 rounded-full animate-pulse-neon" style={{ border: '2px solid #00d4ff', boxShadow: '0 0 20px rgba(0,212,255,0.5)' }} />
            <Icon name="Shield" size={28} className="text-neon-blue relative z-10" />
          </div>
          <h1 className="font-orbitron text-3xl font-black text-neon-blue tracking-widest" style={{ textShadow: '0 0 20px rgba(0,212,255,0.6)' }}>
            NEXUS
          </h1>
          <p className="font-mono-tech text-xs mt-1" style={{ color: 'rgba(0,212,255,0.5)' }}>
            ENCRYPTED MESSENGER v2.0
          </p>
        </div>

        {/* Panel */}
        <div className="relative p-6 rounded" style={{ background: 'rgba(5,10,15,0.92)', border: '1px solid rgba(0,212,255,0.25)', boxShadow: '0 0 40px rgba(0,212,255,0.08), inset 0 0 40px rgba(0,212,255,0.02)' }}>
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-blue" style={{ borderColor: '#00d4ff' }} />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: '#00d4ff' }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: '#00d4ff' }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: '#00d4ff' }} />

          {/* Tabs */}
          <div className="flex mb-6 relative">
            <div className="flex w-full" style={{ border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}>
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className="flex-1 py-2 text-xs font-orbitron font-bold tracking-widest transition-all duration-200"
                  style={{
                    color: mode === m ? '#050a0f' : 'rgba(0,212,255,0.6)',
                    background: mode === m ? '#00d4ff' : 'transparent',
                    boxShadow: mode === m ? '0 0 15px rgba(0,212,255,0.5)' : 'none',
                  }}
                >
                  {m === 'login' ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-mono-tech mb-1" style={{ color: 'rgba(0,212,255,0.6)' }}>ИМЯ АГЕНТА</label>
                <div className="relative">
                  <Icon name="User" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,212,255,0.5)' }} />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-ibm outline-none transition-all"
                    style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px', color: '#00d4ff' }}
                    onFocus={e => e.target.style.borderColor = '#00d4ff'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.2)'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono-tech mb-1" style={{ color: 'rgba(0,212,255,0.6)' }}>ИДЕНТИФИКАТОР</label>
              <div className="relative">
                <Icon name="AtSign" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <input
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="login"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono-tech outline-none transition-all"
                  style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px', color: '#00d4ff' }}
                  onFocus={e => e.target.style.borderColor = '#00d4ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.2)'}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono-tech mb-1" style={{ color: 'rgba(0,212,255,0.6)' }}>КОД ДОСТУПА</label>
              <div className="relative">
                <Icon name="Lock" size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono-tech outline-none transition-all"
                  style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px', color: '#00d4ff' }}
                  onFocus={e => e.target.style.borderColor = '#00d4ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.2)'}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 py-2 px-3 text-xs animate-fade-in" style={{ background: 'rgba(255,0,68,0.08)', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '2px', color: '#ff0044' }}>
                <Icon name="AlertTriangle" size={12} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 font-orbitron text-xs font-bold tracking-widest transition-all duration-200 relative overflow-hidden"
              style={{
                background: loading ? 'rgba(0,212,255,0.1)' : '#00d4ff',
                color: loading ? '#00d4ff' : '#050a0f',
                borderRadius: '2px',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,212,255,0.5)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border border-current rounded-full animate-spin" style={{ borderTopColor: 'transparent' }} />
                  АВТОРИЗАЦИЯ...
                </span>
              ) : (
                mode === 'login' ? 'ВОЙТИ В СИСТЕМУ' : 'СОЗДАТЬ АККАУНТ'
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.3)' }}>
            <Icon name="ShieldCheck" size={10} />
            <span>E2E ENCRYPTION ACTIVE</span>
            <span className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              SECURE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}