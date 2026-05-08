import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth';
import { NotificationBell } from './NotificationBell';
import { Logo } from './Logo';

interface Props {
  children: React.ReactNode;
}

export function LangSwitch() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const next = current === 'fr' ? 'en' : 'fr';
  return (
    <button
      onClick={() => i18n.changeLanguage(next)}
      style={{
        background: 'none',
        border: 'none',
        padding: '2px 4px',
        fontSize: 20,
        cursor: 'pointer',
        lineHeight: 1,
      }}
      aria-label="Switch language"
    >
      {current === 'fr' ? '🇬🇧' : '🇫🇷'}
    </button>
  );
}

export function AppShell({ children }: Props) {
  const user = useAuthStore(s => s.user);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="ch-topbar" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <Logo size={15} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LangSwitch />
          <NotificationBell />
          <Link
            to="/profile"
            className="ch-avatar"
            style={{ width: 30, height: 30, textDecoration: 'none', flexShrink: 0 }}
          >
            {user?.pseudo[0]?.toUpperCase() ?? '?'}
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
