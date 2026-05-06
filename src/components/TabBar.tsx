import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

const TABS = [
  { id: 'home', to: '/', label: 'Accueil', icon: 'home' as const },
  { id: 'archive', to: '/archives', label: 'Archives', icon: 'archive' as const },
  { id: 'create', to: '/games/new', label: 'Créer', icon: 'plus' as const, big: true },
  { id: 'social', to: '/social', label: 'Amis', icon: 'users' as const },
  { id: 'profile', to: '/profile', label: 'Profil', icon: 'user' as const },
];

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="ch-tabbar">
      {TABS.map(t => {
        const active = pathname === t.to;
        return (
          <Link key={t.id} to={t.to} className={`ch-tab ${active ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
            {t.big ? (
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'var(--ch-ink)', color: 'var(--ch-ivory)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(42,37,32,0.18)',
              }}>
                <Icon name={t.icon} size={20} stroke={2} />
              </div>
            ) : (
              <Icon name={t.icon} size={22} stroke={1.5} />
            )}
            {!t.big && <span>{t.label}</span>}
            {!t.big && <div className="ch-tab-dot" />}
          </Link>
        );
      })}
    </nav>
  );
}
