import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useNotificationsStore } from '../stores/notifications';

export function TabBar() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const pendingRequests = useNotificationsStore(s => s.pendingRequests);
  const unreadMessages = useNotificationsStore(s => s.unreadMessages);

  const socialBadge = pendingRequests.length + unreadMessages.reduce((sum, e) => sum + e.count, 0);

  const TABS = [
    { id: 'home',    to: '/',        label: t('tabbar.home'),    icon: 'home'  as const },
    { id: 'feed',    to: '/feed',    label: t('tabbar.feed'),    icon: 'feed'  as const },
    { id: 'create',  to: '/games/new', label: '',                icon: 'plus'  as const, big: true },
    { id: 'social',  to: '/social',  label: t('tabbar.social'),  icon: 'users' as const, badge: socialBadge },
    { id: 'profile', to: '/profile', label: t('tabbar.profile'), icon: 'user'  as const },
  ];

  return (
    <nav className="ch-tabbar">
      {TABS.map(tab => {
        const active = pathname === tab.to;
        return (
          <Link key={tab.id} to={tab.to} className={`ch-tab ${active ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
            {tab.big ? (
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'var(--ch-ink)', color: 'var(--ch-ivory)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(42,37,32,0.18)',
              }}>
                <Icon name={tab.icon} size={20} stroke={2} />
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon name={tab.icon} size={22} stroke={1.5} />
                {(tab.badge ?? 0) > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    minWidth: 16, height: 16, borderRadius: 999,
                    background: 'var(--ch-danger, #e05a5a)', color: '#fff',
                    fontSize: 9, fontWeight: 700, fontFamily: 'var(--ch-sans)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                  }}>
                    {(tab.badge ?? 0) > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
            )}
            {!tab.big && <span>{tab.label}</span>}
            {!tab.big && <div className="ch-tab-dot" />}
          </Link>
        );
      })}
    </nav>
  );
}
