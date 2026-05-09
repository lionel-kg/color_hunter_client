import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotificationsStore } from "../stores/notifications";
import type { Notification } from "../types/api";

function getNotifUrl(notif: Notification): string | null {
  switch (notif.type) {
    case 'DM':              return notif.actorId ? `/chat/${notif.actorId}` : null;
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED': return '/social';
    case 'GRID_LIKE':
    case 'GRID_COMMENT':    return notif.entityId ? `/feed` : null;
    default:                return null;
  }
}

function NotifItem({
  notif,
  onRead,
  onDelete,
  onClose,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isUnread = !notif.readAt;

  const LABELS: Record<string, string> = {
    FRIEND_REQUEST: t('notifications.friendRequest'),
    FRIEND_ACCEPTED: t('notifications.friendAccepted'),
    GRID_LIKE: t('notifications.gridLike'),
    GRID_COMMENT: t('notifications.gridComment'),
    GAME_STARTED: t('notifications.gameStarted'),
    DM: t('notifications.dm'),
  };

  function handleClick() {
    const url = getNotifUrl(notif);
    if (!url) return;
    if (isUnread) onRead(notif.id);
    onDelete(notif.id);
    onClose();
    navigate(url);
  }

  return (
    <div style={{ ...styles.notifItem, background: isUnread ? "var(--ch-cream)" : "transparent" }}>
      <div
        onClick={handleClick}
        style={{ display: "flex", flex: 1, gap: 10, cursor: getNotifUrl(notif) ? "pointer" : "default", minWidth: 0 }}
      >
        <div style={styles.notifDot}>
          {isUnread && <span style={styles.dot} />}
        </div>
        <div style={styles.notifBody}>
          <span style={styles.actor}>{notif.actor?.pseudo ?? "Color Hunt"}</span>{" "}
          <span style={styles.label}>{LABELS[notif.type] ?? notif.type}</span>
          <div style={styles.time}>
            {new Date(notif.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        style={styles.deleteBtn}
        aria-label="Supprimer"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { unreadCount, notifications, loadNotifications, markAllRead, markRead, deleteNotification } = useNotificationsStore();

  useEffect(() => { loadNotifications(); }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle() {
    setOpen((v) => !v);
    if (!open) loadNotifications();
  }

  return (
    <div ref={ref} style={styles.wrapper}>
      <button onClick={toggle} style={styles.bell} aria-label={t('notifications.title')}>
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={styles.readAllBtn}>
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <p style={styles.empty}>{t('notifications.empty')}</p>
            ) : (
              notifications.map((n) => (
                <NotifItem key={n.id} notif={n} onRead={markRead} onDelete={deleteNotification} onClose={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: "relative", display: "inline-flex" },
  bell: { background: "none", border: "none", cursor: "pointer", fontSize: 20, position: "relative", padding: "4px 6px", borderRadius: "var(--ch-r-sm)", lineHeight: 1 },
  badge: { position: "absolute", top: -2, right: -2, background: "var(--ch-danger)", color: "#fff", fontSize: 9, fontFamily: "var(--ch-sans)", fontWeight: 700, minWidth: 16, height: 16, borderRadius: "var(--ch-r-pill)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" },
  panel: { position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "var(--ch-paper)", border: "1px solid var(--ch-line-2)", borderRadius: "var(--ch-r-lg)", boxShadow: "var(--ch-shadow-lg)", zIndex: 200, overflow: "hidden" },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid var(--ch-line)" },
  panelTitle: { fontFamily: "var(--ch-serif)", fontSize: 16, color: "var(--ch-ink)" },
  readAllBtn: { background: "none", border: "none", cursor: "pointer", fontFamily: "var(--ch-sans)", fontSize: 11, color: "var(--ch-ink-mute)", textDecoration: "underline" },
  list: { maxHeight: 360, overflowY: "auto" },
  empty: { fontFamily: "var(--ch-sans)", fontSize: 13, color: "var(--ch-ink-mute)", textAlign: "center", padding: "24px 16px" },
  notifItem: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--ch-line)", transition: "background 0.1s" },
  deleteBtn: { flexShrink: 0, background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, color: "var(--ch-ink-mute)", padding: "0 2px", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 },
  notifDot: { width: 8, paddingTop: 4, flexShrink: 0 },
  dot: { display: "block", width: 8, height: 8, borderRadius: "50%", background: "var(--ch-clay)" },
  notifBody: { flex: 1, fontFamily: "var(--ch-sans)", fontSize: 13 },
  actor: { fontWeight: 600, color: "var(--ch-ink)" },
  label: { color: "var(--ch-ink-soft)" },
  time: { fontSize: 11, color: "var(--ch-ink-mute)", marginTop: 2 },
};
