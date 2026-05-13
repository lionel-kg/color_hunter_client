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
    case 'GRID_COMMENT':
    case 'GRID_COMMENT_REPLY':
    case 'GRID_COMMENT_LIKE': {
      if (!notif.entityId) return null;
      const [gridId, commentId] = notif.entityId.split(':');
      const params = new URLSearchParams({ grid: gridId });
      if (commentId) params.set('comment', commentId);
      return `/feed?${params.toString()}`;
    }
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
    GRID_COMMENT_REPLY: t('notifications.gridCommentReply'),
    GRID_COMMENT_LIKE: t('notifications.gridCommentLike'),
    GAME_STARTED: t('notifications.gameStarted'),
    DM: t('notifications.dm'),
  };

  function handleClick() {
    const url = getNotifUrl(notif);
    if (!url) return;
    if (isUnread) onRead(notif.id);
    onDelete(notif.id);
    onClose();
    // Nonce pour forcer re-scroll/re-highlight si même notif re-cliquée
    const sep = url.includes('?') ? '&' : '?';
    navigate(`${url}${sep}t=${Date.now().toString(36)}`);
  }

  return (
    <div className={`notif-item${isUnread ? ' notif-item--unread' : ''}`}>
      <div
        onClick={handleClick}
        className={`notif-item__click-area${!getNotifUrl(notif) ? ' notif-item__click-area--no-link' : ''}`}
      >
        <div className="notif-item__dot-col">
          {isUnread && <span className="notif-item__dot" />}
        </div>
        <div className="notif-item__body">
          <span className="notif-item__actor">{notif.actor?.pseudo ?? "Color Hunt"}</span>{" "}
          <span className="notif-item__label">{LABELS[notif.type] ?? notif.type}</span>
          <div className="notif-item__time">
            {new Date(notif.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        className="notif-item__delete-btn"
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
    <div ref={ref} className="notif-bell">
      <button onClick={toggle} className="notif-bell__trigger" aria-label={t('notifications.title')}>
        🔔
        {unreadCount > 0 && (
          <span className="notif-bell__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-bell__panel">
          <div className="notif-bell__panel-header">
            <span className="notif-bell__panel-title">{t('notifications.title')}</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="notif-bell__read-all-btn">
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          <div className="notif-bell__list">
            {notifications.length === 0 ? (
              <p className="notif-bell__empty">{t('notifications.empty')}</p>
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
