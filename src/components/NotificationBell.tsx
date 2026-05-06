import { useState, useRef, useEffect } from 'react';
import { useNotificationsStore } from '../stores/notifications';
import type { Notification } from '../types/api';

const LABELS: Record<string, string> = {
  FRIEND_REQUEST: 'te demande en ami',
  FRIEND_ACCEPTED: 'a accepté ta demande',
  GRID_LIKE: 'a aimé ta grille',
  GRID_COMMENT: 'a commenté ta grille',
  GAME_STARTED: 'La partie a démarré',
  DM: 'te dit quelque chose',
};

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const isUnread = !notif.readAt;
  return (
    <div
      onClick={() => isUnread && onRead(notif.id)}
      style={{
        ...styles.notifItem,
        background: isUnread ? 'var(--ch-cream)' : 'transparent',
      }}
    >
      <div style={styles.notifDot}>{isUnread && <span style={styles.dot} />}</div>
      <div style={styles.notifBody}>
        <span style={styles.actor}>{notif.actor?.pseudo ?? 'Color Hunt'}</span>
        {' '}
        <span style={styles.label}>{LABELS[notif.type] ?? notif.type}</span>
        <div style={styles.time}>
          {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { unreadCount, notifications, loadNotifications, markAllRead, markRead } =
    useNotificationsStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggle() {
    setOpen(v => !v);
    if (!open) loadNotifications();
  }

  return (
    <div ref={ref} style={styles.wrapper}>
      <button onClick={toggle} style={styles.bell} aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={styles.readAllBtn}>
                Tout marquer lu
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <p style={styles.empty}>Aucune notification pour l'instant.</p>
            ) : (
              notifications.map(n => (
                <NotifItem key={n.id} notif={n} onRead={markRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: 'relative', display: 'inline-flex' },
  bell: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 20,
    position: 'relative',
    padding: '4px 6px',
    borderRadius: 'var(--ch-r-sm)',
    lineHeight: 1,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    background: 'var(--ch-danger)',
    color: '#fff',
    fontSize: 9,
    fontFamily: 'var(--ch-sans)',
    fontWeight: 700,
    minWidth: 16,
    height: 16,
    borderRadius: 'var(--ch-r-pill)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 300,
    background: 'var(--ch-paper)',
    border: '1px solid var(--ch-line-2)',
    borderRadius: 'var(--ch-r-lg)',
    boxShadow: 'var(--ch-shadow-lg)',
    zIndex: 200,
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: '1px solid var(--ch-line)',
  },
  panelTitle: {
    fontFamily: 'var(--ch-serif)',
    fontSize: 16,
    color: 'var(--ch-ink)',
  },
  readAllBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--ch-sans)',
    fontSize: 11,
    color: 'var(--ch-ink-mute)',
    textDecoration: 'underline',
  },
  list: {
    maxHeight: 360,
    overflowY: 'auto',
  },
  empty: {
    fontFamily: 'var(--ch-sans)',
    fontSize: 13,
    color: 'var(--ch-ink-mute)',
    textAlign: 'center',
    padding: '24px 16px',
  },
  notifItem: {
    display: 'flex',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '1px solid var(--ch-line)',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  notifDot: { width: 8, paddingTop: 4, flexShrink: 0 },
  dot: {
    display: 'block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--ch-clay)',
  },
  notifBody: { flex: 1, fontFamily: 'var(--ch-sans)', fontSize: 13 },
  actor: { fontWeight: 600, color: 'var(--ch-ink)' },
  label: { color: 'var(--ch-ink-soft)' },
  time: { fontSize: 11, color: 'var(--ch-ink-mute)', marginTop: 2 },
};
