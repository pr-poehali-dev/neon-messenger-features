import Icon from '@/components/ui/icon';

export default function SettingsScreen() {
  const settings = [
    {
      group: 'ПРИВАТНОСТЬ',
      items: [
        { icon: 'EyeOff', label: 'Скрытие IP-адреса', desc: 'Ваш IP скрыт от собеседников', active: true },
        { icon: 'Shield', label: 'Скрытие IP собеседника', desc: 'IP адрес пользователей анонимизирован', active: true },
        { icon: 'WifiOff', label: 'Скрытие от операторов', desc: 'Трафик зашифрован и туннелирован', active: true },
        { icon: 'Eye', label: 'Скрыть статус активности', desc: 'Другие не видят, когда вы онлайн', active: false },
      ]
    },
    {
      group: 'ШИФРОВАНИЕ',
      items: [
        { icon: 'Lock', label: 'End-to-End шифрование', desc: 'Все сообщения зашифрованы', active: true },
        { icon: 'Key', label: 'Автоудаление ключей', desc: 'Ключи обновляются каждые 24ч', active: true },
        { icon: 'FileKey', label: 'Шифрование медиафайлов', desc: 'Файлы передаются в зашифрованном виде', active: true },
      ]
    },
    {
      group: 'УВЕДОМЛЕНИЯ',
      items: [
        { icon: 'Bell', label: 'Push-уведомления', desc: 'Сигналы о новых сообщениях', active: true },
        { icon: 'Volume2', label: 'Звук сообщений', desc: 'Звуковые сигналы', active: false },
        { icon: 'Vibrate', label: 'Вибрация', desc: 'Тактильная отдача', active: true },
      ]
    },
    {
      group: 'МЕДИА',
      items: [
        { icon: 'Download', label: 'Автозагрузка медиа', desc: 'Сохранение медиафайлов автоматически', active: false },
        { icon: 'HardDrive', label: 'Сохранение файлов', desc: 'Все файлы доступны для скачивания', active: true },
        { icon: 'Mic', label: 'Изменение голоса', desc: 'Эффекты для голосовых сообщений', active: true },
      ]
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="mb-6">
          <h2 className="font-orbitron font-bold text-sm tracking-widest text-neon-blue">НАСТРОЙКИ</h2>
          <p className="text-xs font-mono-tech mt-1" style={{ color: 'rgba(0,212,255,0.3)' }}>КОНФИГУРАЦИЯ СИСТЕМЫ</p>
        </div>

        {/* Status panel */}
        <div className="p-4 relative" style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '2px' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '2px' }}>
              <Icon name="ShieldCheck" size={20} style={{ color: '#00ff88' }} />
            </div>
            <div>
              <p className="text-sm font-orbitron font-bold" style={{ color: '#00ff88' }}>ЗАЩИТА АКТИВНА</p>
              <p className="text-xs font-mono-tech" style={{ color: 'rgba(0,255,136,0.5)' }}>Все системы в норме • NEXUS v2.0</p>
            </div>
            <div className="ml-auto">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse block" />
            </div>
          </div>
        </div>

        {settings.map(section => (
          <div key={section.group} style={{ background: 'rgba(5,10,15,0.9)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: '2px' }}>
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
              <span className="text-xs font-orbitron font-bold tracking-widest" style={{ color: 'rgba(0,212,255,0.5)' }}>{section.group}</span>
            </div>
            {section.items.map((item, idx) => (
              <SettingToggle
                key={item.label}
                icon={item.icon}
                label={item.label}
                desc={item.desc}
                active={item.active}
                last={idx === section.items.length - 1}
              />
            ))}
          </div>
        ))}

        {/* App info */}
        <div className="py-4 text-center space-y-1">
          <p className="font-orbitron text-xs font-bold" style={{ color: 'rgba(0,212,255,0.3)' }}>NEXUS MESSENGER</p>
          <p className="font-mono-tech text-xs" style={{ color: 'rgba(0,212,255,0.2)', fontSize: '10px' }}>VERSION 2.0.0 • BUILD 20260330</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Icon name="Shield" size={10} style={{ color: 'rgba(0,212,255,0.3)' }} />
            <span className="font-mono-tech text-xs" style={{ color: 'rgba(0,212,255,0.3)', fontSize: '10px' }}>E2E ENCRYPTED</span>
            <Icon name="Shield" size={10} style={{ color: 'rgba(0,212,255,0.3)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ icon, label, desc, active, last }: {
  icon: string; label: string; desc: string; active: boolean; last: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-all"
      style={{ borderBottom: last ? 'none' : '1px solid rgba(0,212,255,0.05)' }}
    >
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: active ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.2)', border: `1px solid ${active ? 'rgba(0,212,255,0.25)' : 'rgba(0,212,255,0.08)'}`, borderRadius: '2px' }}>
        <Icon name={icon} size={14} style={{ color: active ? '#00d4ff' : 'rgba(0,212,255,0.3)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-ibm font-medium" style={{ color: active ? '#00d4ff' : 'rgba(0,212,255,0.5)' }}>{label}</p>
        <p className="text-xs font-ibm mt-0.5" style={{ color: 'rgba(0,212,255,0.3)', fontSize: '10px' }}>{desc}</p>
      </div>
      <div
        className="relative w-10 h-5 rounded-full cursor-pointer transition-all flex-shrink-0"
        style={{
          background: active ? 'rgba(0,212,255,0.2)' : 'rgba(0,0,0,0.3)',
          border: active ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(0,212,255,0.1)',
          boxShadow: active ? '0 0 8px rgba(0,212,255,0.3)' : 'none',
        }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            left: active ? '22px' : '2px',
            background: active ? '#00d4ff' : 'rgba(0,212,255,0.3)',
            boxShadow: active ? '0 0 8px #00d4ff' : 'none',
          }}
        />
      </div>
    </div>
  );
}
