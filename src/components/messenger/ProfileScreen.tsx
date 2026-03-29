import { useState } from 'react';
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
  const [description, setDescription] = useState(currentUser.description);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [textColor, setTextColor] = useState(currentUser.textColor || '#00d4ff');

  const saveField = (field: string) => {
    if (field === 'name' && name.trim()) onUpdateUser({ name: name.trim() });
    if (field === 'login' && login.trim()) onUpdateUser({ login: login.trim() });
    if (field === 'description') onUpdateUser({ description });
    setEditField(null);
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    if (newPassword.length < 6) { setPasswordError('Минимум 6 символов'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Пароли не совпадают'); return; }
    const users = JSON.parse(localStorage.getItem('nexus_users') || '[]') as User[];
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) { (users[idx] as User & { password: string }).password = newPassword; localStorage.setItem('nexus_users', JSON.stringify(users)); }
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
            value={name}
            editKey="name"
            editField={editField}
            onEdit={setEditField}
            onChange={setName}
            onSave={() => saveField('name')}
          />
          <EditRow
            label="Логин"
            value={`@${login}`}
            editKey="login"
            editField={editField}
            onEdit={setEditField}
            onChange={v => setLogin(v.replace('@', ''))}
            onSave={() => saveField('login')}
          />
          <EditRow
            label="Описание"
            value={description || '—'}
            editKey="description"
            editField={editField}
            onEdit={setEditField}
            onChange={setDescription}
            onSave={() => saveField('description')}
          />
        </Section>

        {/* Text color */}
        <Section title="ЦВЕТ ТЕКСТА">
          <div className="grid grid-cols-4 gap-2 p-1">
            {NEON_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => handleColorChange(c.value)}
                className="flex flex-col items-center gap-1.5 py-2 px-1 transition-all"
                style={{
                  background: textColor === c.value ? 'rgba(0,212,255,0.1)' : 'transparent',
                  border: `1px solid ${textColor === c.value ? c.value : 'rgba(0,212,255,0.1)'}`,
                  borderRadius: '2px',
                }}
              >
                <div className="w-5 h-5 rounded-full" style={{ background: c.value, boxShadow: `0 0 8px ${c.value}88` }} />
                <span className="text-xs font-mono-tech leading-none" style={{ color: 'rgba(0,212,255,0.5)', fontSize: '9px' }}>{c.name}</span>
              </button>
            ))}
          </div>
          <div className="px-3 pb-3">
            <label className="block text-xs font-mono-tech mb-1.5" style={{ color: 'rgba(0,212,255,0.5)' }}>ПОЛЬЗОВАТЕЛЬСКИЙ ХЕШ</label>
            <input
              type="color"
              value={textColor}
              onChange={e => handleColorChange(e.target.value)}
              className="w-full h-8 cursor-pointer rounded"
              style={{ background: 'transparent', border: '1px solid rgba(0,212,255,0.2)' }}
            />
          </div>
          <div className="mx-3 mb-3 p-2 text-sm font-ibm" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: '2px', color: textColor }}>
            Вот так будет выглядеть твой текст в чате
          </div>
        </Section>

        {/* Password */}
        <Section title="БЕЗОПАСНОСТЬ">
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Key" size={13} style={{ color: 'rgba(0,212,255,0.5)' }} />
              <span className="text-xs font-mono-tech" style={{ color: 'rgba(0,212,255,0.5)' }}>СМЕНА ПАРОЛЯ</span>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Новый пароль"
              className="w-full px-3 py-2 text-sm font-ibm outline-none"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '2px', color: '#00d4ff' }}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              className="w-full px-3 py-2 text-sm font-ibm outline-none"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '2px', color: '#00d4ff' }}
            />
            {passwordError && (
              <p className="text-xs font-ibm" style={{ color: '#ff4444' }}>{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-xs font-ibm flex items-center gap-1" style={{ color: '#00ff88' }}>
                <Icon name="Check" size={12} /> Пароль обновлён
              </p>
            )}
            <button
              onClick={handlePasswordChange}
              className="w-full py-2 text-xs font-orbitron font-bold transition-all"
              style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '2px' }}
            >
              СМЕНИТЬ ПАРОЛЬ
            </button>
          </div>

          <div className="px-3 pb-3 space-y-2">
            <div className="flex items-center gap-2 p-2" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px' }}>
              <Icon name="Shield" size={13} style={{ color: '#00ff88' }} />
              <span className="text-xs font-mono-tech" style={{ color: '#00ff88' }}>E2E ШИФРОВАНИЕ АКТИВНО</span>
            </div>
            <div className="flex items-center gap-2 p-2" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px' }}>
              <Icon name="EyeOff" size={13} style={{ color: '#00ff88' }} />
              <span className="text-xs font-mono-tech" style={{ color: '#00ff88' }}>IP СКРЫТ</span>
            </div>
            <div className="flex items-center gap-2 p-2" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px' }}>
              <Icon name="WifiOff" size={13} style={{ color: '#00ff88' }} />
              <span className="text-xs font-mono-tech" style={{ color: '#00ff88' }}>АКТИВНОСТЬ СКРЫТА</span>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="УПРАВЛЕНИЕ АККАУНТОМ">
          <div className="p-3 space-y-2">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-orbitron font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.3)', borderRadius: '2px', color: '#ff6600' }}
            >
              <Icon name="LogOut" size={14} /> ВЫЙТИ ИЗ АККАУНТА
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 py-2.5 px-3 text-xs font-orbitron font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,0,68,0.08)', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '2px', color: '#ff0044' }}
            >
              <Icon name="Trash2" size={14} /> УДАЛИТЬ АККАУНТ
            </button>
          </div>
        </Section>
      </div>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <ConfirmDialog
          title="ВЫХОД ИЗ АККАУНТА"
          text="Вы уверены, что хотите выйти? Все данные сессии будут очищены."
          confirmLabel="ВЫЙТИ"
          confirmColor="#ff6600"
          onConfirm={onLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="УДАЛЕНИЕ АККАУНТА"
          text="Аккаунт и все данные будут удалены безвозвратно. Вы уверены?"
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

function EditRow({ label, value, editKey, editField, onEdit, onChange, onSave }: {
  label: string; value: string; editKey: string;
  editField: string | null; onEdit: (k: string | null) => void;
  onChange: (v: string) => void; onSave: () => void;
}) {
  const isEditing = editField === editKey;
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
      <div className="flex-1">
        <p className="text-xs font-mono-tech mb-0.5" style={{ color: 'rgba(0,212,255,0.4)' }}>{label}</p>
        {isEditing ? (
          <input
            autoFocus
            value={value.replace('@', '')}
            onChange={e => onChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={e => e.key === 'Enter' && onSave()}
            className="text-sm font-ibm outline-none bg-transparent w-full"
            style={{ color: '#00d4ff', borderBottom: '1px solid rgba(0,212,255,0.5)' }}
          />
        ) : (
          <p className="text-sm font-ibm" style={{ color: '#00d4ff' }}>{value}</p>
        )}
      </div>
      <button
        onClick={() => isEditing ? onSave() : onEdit(editKey)}
        className="w-7 h-7 flex items-center justify-center transition-all hover:scale-110 ml-2"
        style={{ color: isEditing ? '#00ff88' : 'rgba(0,212,255,0.4)' }}
      >
        <Icon name={isEditing ? 'Check' : 'Pencil'} size={13} />
      </button>
    </div>
  );
}

function ConfirmDialog({ title, text, confirmLabel, confirmColor, onConfirm, onCancel }: {
  title: string; text: string; confirmLabel: string; confirmColor: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="p-6 max-w-sm w-full mx-4 animate-scale-in" style={{ background: 'rgba(5,10,15,0.98)', border: `1px solid ${confirmColor}44`, borderRadius: '2px' }}>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="AlertTriangle" size={18} style={{ color: confirmColor }} />
          <h3 className="font-orbitron font-bold text-sm" style={{ color: confirmColor }}>{title}</h3>
        </div>
        <p className="text-xs font-ibm mb-5" style={{ color: 'rgba(0,212,255,0.6)' }}>{text}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-xs font-orbitron font-bold transition-all hover:opacity-90"
            style={{ background: `${confirmColor}22`, color: confirmColor, border: `1px solid ${confirmColor}66`, borderRadius: '2px' }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-xs font-orbitron font-bold transition-all"
            style={{ background: 'transparent', color: 'rgba(0,212,255,0.6)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px' }}
          >
            ОТМЕНА
          </button>
        </div>
      </div>
    </div>
  );
}
