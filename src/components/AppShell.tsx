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
      className="lang-switch"
      aria-label="Switch language"
    >
      {current === 'fr' ? '🇬🇧' : '🇫🇷'}
    </button>
  );
}

export function AppShell({ children }: Props) {
  const user = useAuthStore(s => s.user);

  return (
    <div className="app-shell">
      <header className="ch-topbar app-shell__topbar">
        <Logo size={15} />
        <div className="app-shell__topbar-right">
          <LangSwitch />
          <NotificationBell />
          <Link
            to="/profile"
            className="ch-avatar app-shell__avatar-link"
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
