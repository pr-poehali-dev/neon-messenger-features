import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { User } from './types';

interface ProfileScreenProps {
  currentUser: User;
  onUpdateUser: (data: Partial<User>) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const NEON_COLORS = [
  { name: 'Нео-синий', value: '#00d4ff' },
  { name: 'Пурпур', value: '#a855f7' },
  { name: 'Нео-зелёный', value: '#00ff88' },
  { name: 'Пинк', value: '#ff00aa' },
  { name: 'Оранж', value: '#ff6600' },
  { name: 'Жёлтый', value: '#ffee00' },
  { name: 'Белый', value: '#e0f0ff' },
  { name: 'Красный', value: '#ff2244' },
];

export default function ProfileScreen({ currentUser, onUpdateUser, onLogout, onDeleteAccount }: ProfileScreenProps) {
  const [editField, setEditField] = useState<string | null>(null);
  const [name, setName] = useState(currentUser.name);
  const [login, setLogin] = useState(currentUser.login);
  const [description, setDescription] = useState(currentUser.description || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [textColor, setTextColor] = useState(currentUser.textColor || '#00d4ff');
  const [savedField, setSavedField] = useState<string | null>(null);

  // Sync state when currentUser changes externally
  useEffect(() => {
    setName(currentUser.name);
    setLogin(currentUser.login);
    setDescription(currentUser.description || '');
    setTextColor(currentUser.textColor || '#00d4ff');
  }, [currentUser.id]);

  const saveField = (field: string) => {
    let updated = false;
    if (field === 'name' && name.trim()) { onUpdateUser({ name: name.trim() }); updated = true; }
    if (field === 'login' && login.trim()) { onUpdateUser({ login: login.trim() }); updated = true; }
    if (field === 'description') { onUpdateUser({ description }); updated = true; }
    setEditField(null);
    if (updated) {
      setSavedField(field);
      setTimeout(() => setSavedField(null), 2000);
    }
  };

  const cancelField = (field: string) => {
    if (field === 'name') setName(currentUser.name);
    if (field === 'login') setLogin(currentUser.login);
    if (field === 'description') setDescription(currentUser.description || '');
    setEditField(null);
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    if (newPassword.length < 6) { setPasswordError('Минимум 6 символов'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Пароли не совпадают'); return; }
    const users = JSON.parse(localStorage.getItem('nexus_users') || '[]') as (User & { password: string })[];
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) { users[idx].password = newPassword; localStorage.setItem('nexus_users', JSON.stringify(users)); }
    setNewPassword(''); setConfirmPassword('');
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    onUpdateUser({ textColor: color });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="text-center pb-2">
          <div className="relative inline-block mb-4">
            <div
              className="w-20 h-20 flex items-center justify-center mx-auto font-orbitron font-black text-2xl"
              style={{
                background: 'rgba(0,212,255,0.1)',
                border: '2px solid rgba(0,212,255,0.4)',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                color: textColor,
                boxShadow: `0 0 30px ${textColor}44`,
                transition: 'all 0.3s',
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <h2 className="font-orbitron font-bold text-lg text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.5)' }}>
            {currentUser.name}
          </h2>
          <p className="text-xs font-mono-tech mt-1" style={{ color: 'rgba(0,212,255,0.4)' }}>@{currentUser.login}</p>
        </div>

        {/* Profile info */}
        <Section title="ПРОФИЛЬ">
          <EditRow
            label="Имя"
            fieldKey="name"
            value={name}
            displayValue={currentUser.name}
            editField={editField}
            saved={savedField === 'name'}
            onEdit={() => setEditField('name')}
            onChange={setName}
            onSave={() => saveField('name')}
            onCancel={() => cancelField('name')}
          />
          <EditRow
            label="Логин"
            fieldKey="login"
            value={login}
            displayValue={`@${currentUser.login}`}
            editField={editField}
            saved={savedField === 'login'}
            onEdit={() => setEditField('login')}
            onChange={setLogin}
            onSave={() => saveField('login')}
            onCancel={() => cancelField('login')}
          />
          <EditRow
            label="Описание"
            fieldKey="description"
            value={description}
            displayValue={currentUser.description || '—'}
            editField={editField}
            saved={savedField === 'description'}
            onEdit={() => setEditField('description')}
            onChange={setDescription}
            onSave={() => saveField('description')}
            onCancel={() => cancelField('description')}
            last
          />
        </Section>

        {/* Text color */}
        <Section title="ЦВЕТ ТЕКСТА">
          <div className="grid grid-cols-4 gap-2 p-3">
            {NEON_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => handleColorChange(c.value)}
                className="flex flex-col items-center gap-1.5 py-2 px-1 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: textColor === c.value ? 'rgba(0,212,255,0.1)' : 'transparent',
                  border: `1px solid ${textColor === c.value ? c.value : 'rgba(0,212,255,0.1)'}`,
                  borderRadius: '2px',
                  boxShadow: textColor === c.value ? `0 0 8px ${c.value}44` : 'none',
                }}
              >
                <div className="w-5 h-5 rounded-full" style={{ background: c.value, boxShadow: `0 0 8px ${c.value}88` }} />
                <span className="font-mono-tech leading-none" style={{ color: 'rgba(0,212,255,0.5)', fontSize: '8px' }}>{c.name}</span>
              </button>
            ))}
          </div>
          <div className="px-3 pb-3 space-y-2">
            <label className="block text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.5)' }}>СВОЙ ЦВЕТ (HEX)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={e => handleColorChange(e.target.value)}
                className="w-10 h-8 cursor-pointer rounded flex-shrink-0"
                style={{ background: 'transparent', border: '1px solid rgba(0,212,255,0.2)', padding: '2px' }}
              />
              <span className="text-xs font-mono-tech" style={{ color: textColor }}>{textColor}</span>
            </div>
          </div>
          <div className="mx-3 mb-3 p-3 text-sm font-ibm" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: '2px', color: textColor, transition: 'color 0.2s' }}>
            Вот так будет выглядеть твой текст в чате
          </div>
        </Section>

        {/* Password */}
        <Section title="БЕЗОПАСНОСТЬ">
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Key" size={13} style={{ color: 'rgba(0,212,255,0.5)' }} />
              <span className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.5)' }}>СМЕНА ПАРОЛЯ</span>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Новый пароль"
              className="w-full px-3 py-2 text-sm font-ibm outline-none transition-all"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '2px', color: '#00d4ff' }}
              onFocus={e => (e.target.style.borderColor = '#00d4ff')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.15)')}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              className="w-full px-3 py-2 text-sm font-ibm outline-none transition-all"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '2px', color: '#00d4ff' }}
              onFocus={e => (e.target.style.borderColor = '#00d4ff')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.15)')}
              onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
            />
            {passwordError && (
              <p className="text-xs font-ibm flex items-center gap-1.5" style={{ color: '#ff4444' }}>
                <Icon name="AlertCircle" size={11} /> {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-xs font-ibm flex items-center gap-1.5 animate-fade-in" style={{ color: '#00ff88' }}>
                <Icon name="CheckCircle" size={11} /> Пароль успешно обновлён
              </p>
            )}
            <button
              onClick={handlePasswordChange}
              disabled={!newPassword || !confirmPassword}
              className="w-full py-2 text-xs font-orbitron font-bold transition-all hover:opacity-90 active:scale-98"
              style={{
                background: newPassword && confirmPassword ? 'rgba(0,212,255,0.1)' : 'rgba(0,0,0,0.2)',
                color: newPassword && confirmPassword ? '#00d4ff' : 'rgba(0,212,255,0.3)',
                border: `1px solid ${newPassword && confirmPassword ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.08)'}`,
                borderRadius: '2px',
                cursor: newPassword && confirmPassword ? 'pointer' : 'not-allowed',
              }}
            >
              СМЕНИТЬ ПАРОЛЬ
            </button>
          </div>

          <div className="px-3 pb-3 space-y-2">
            {[
              { icon: 'Shield', label: 'E2E ШИФРОВАНИЕ АКТИВНО', color: '#00ff88' },
              { icon: 'EyeOff', label: 'IP СКРЫТ', color: '#00ff88' },
              { icon: 'WifiOff', label: 'АКТИВНОСТЬ СКРЫТА ОТ ОПЕРАТОРОВ', color: '#00ff88' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 p-2" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px' }}>
                <Icon name={item.icon} size={13} style={{ color: item.color }} />
                <span className="text-xs font-mono-tech" style={{ color: item.color }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="УПРАВЛЕНИЕ АККАУНТОМ">
          <div className="p-3 space-y-2">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-orbitron font-bold transition-all hover:opacity-90 active:scale-98"
              style={{ background: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.3)', borderRadius: '2px', color: '#ff6600' }}
            >
              <Icon name="LogOut" size={14} /> ВЫЙТИ ИЗ АККАУНТА
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-orbitron font-bold transition-all hover:opacity-90 active:scale-98"
              style={{ background: 'rgba(255,0,68,0.08)', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '2px', color: '#ff0044' }}
            >
              <Icon name="Trash2" size={14} /> УДАЛИТЬ АККАУНТ
            </button>
          </div>
        </Section>
      </div>

      {showLogoutConfirm && (
        <ConfirmDialog
          title="ВЫХОД ИЗ АККАУНТА"
          text="Вы уверены, что хотите выйти? Сессия будет завершена."
          confirmLabel="ВЫЙТИ"
          confirmColor="#ff6600"
          onConfirm={onLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="УДАЛЕНИЕ АККАУНТА"
          text="Аккаунт и все данные будут удалены безвозвратно. Это действие необратимо."
          confirmLabel="УДАЛИТЬ"
          confirmColor="#ff0044"
          onConfirm={onDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(5,10,15,0.9)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: '2px' }}>
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
        <span className="text-xs font-orbitron font-bold tracking-widest" style={{ color: 'rgba(0,212,255,0.5)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function EditRow({ label, fieldKey, value, displayValue, editField, saved, onEdit, onChange, onSave, onCancel, last }: {
  label: string; fieldKey: string; value: string; displayValue: string;
  editField: string | null; saved: boolean;
  onEdit: () => void; onChange: (v: string) => void;
  onSave: () => void; onCancel: () => void;
  last?: boolean;
}) {
  const isEditing = editField === fieldKey;
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: last ? 'none' : '1px solid rgba(0,212,255,0.05)' }}>
      <div className="flex-1 min-w-0 mr-2">
        <p className="text-xs font-mono-tech mb-0.5" style={{ color: 'rgba(0,212,255,0.4)' }}>{label}</p>
        {isEditing ? (
          <input
            autoFocus
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
            className="text-sm font-ibm outline-none bg-transparent w-full"
            style={{ color: '#00d4ff', borderBottom: '1px solid rgba(0,212,255,0.5)' }}
          />
        ) : (
          <p className="text-sm font-ibm truncate" style={{ color: '#00d4ff' }}>{displayValue}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {saved && !isEditing && (
          <span className="text-xs font-mono-tech animate-fade-in" style={{ color: '#00ff88', fontSize: '10px' }}>✓ Сохранено</span>
        )}
        {isEditing && (
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110"
            style={{ color: 'rgba(255,68,68,0.7)' }}
          >
            <Icon name="X" size={13} />
          </button>
        )}
        <button
          onClick={() => isEditing ? onSave() : onEdit()}
          className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110"
          style={{ color: isEditing ? '#00ff88' : 'rgba(0,212,255,0.4)' }}
        >
          <Icon name={isEditing ? 'Check' : 'Pencil'} size={13} />
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, text, confirmLabel, confirmColor, onConfirm, onCancel }: {
  title: string; text: string; confirmLabel: string; confirmColor: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="p-6 max-w-sm w-full mx-4 animate-scale-in" style={{ background: 'rgba(5,10,15,0.98)', border: `1px solid ${confirmColor}44`, borderRadius: '2px', boxShadow: `0 0 40px ${confirmColor}22` }}>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="AlertTriangle" size={18} style={{ color: confirmColor }} />
          <h3 className="font-orbitron font-bold text-sm" style={{ color: confirmColor }}>{title}</h3>
        </div>
        <p className="text-xs font-ibm mb-5 leading-relaxed" style={{ color: 'rgba(0,212,255,0.6)' }}>{text}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-xs font-orbitron font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: `${confirmColor}22`, color: confirmColor, border: `1px solid ${confirmColor}66`, borderRadius: '2px' }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-xs font-orbitron font-bold transition-all hover:opacity-80"
            style={{ background: 'transparent', color: 'rgba(0,212,255,0.6)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
          >
            ОТМЕНА
          </button>
        </div>
      </div>
    </div>
  );
}
