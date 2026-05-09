import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { Icon } from '../components/Icon';
import { TabBar } from '../components/TabBar';
import type { Friendship } from '../types/api';

export function SocialPage() {
  const me = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const { pendingRequests, unreadMessages, remove: removeNotif } = useNotificationsStore();
  const { t } = useTranslation();

  const load = () => {
    api.get<Friendship[]>('/users/friends')
      .then(r => setFriendships(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const acceptRequest = async (f: Friendship) => {
    try {
      await api.post(`/users/friends/accept/${f.id}`);
      removeNotif(f.id);
      load();
    } catch { }
  };

  const declineRequest = async (f: Friendship) => {
    try {
      await api.delete(`/users/friends/${f.id}`);
      removeNotif(f.id);
      load();
    } catch { }
  };

  const removeFriend = async (f: Friendship) => {
    try {
      await api.delete(`/users/friends/${f.id}`);
      setConfirmRemoveId(null);
      load();
    } catch { }
  };

  const accepted = friendships.filter(f => f.status === 'ACCEPTED');
  const sentPending = friendships.filter(f => f.status === 'PENDING' && f.senderId === me?.id);

  function friendUser(f: Friendship) {
    return f.senderId === me?.id ? f.receiver : f.sender;
  }

  const sortedAccepted = [...accepted].sort((a, b) => {
    const aId = friendUser(a)?.id;
    const bId = friendUser(b)?.id;
    const aUnread = unreadMessages.find(e => e.senderId === aId)?.count ?? 0;
    const bUnread = unreadMessages.find(e => e.senderId === bId)?.count ?? 0;
    return bUnread - aUnread;
  });

  return (
    <div className="ch-screen ch-app" style={{ minHeight: '100vh' }}>
      <div className="ch-scroll" style={{ paddingBottom: 100 }}>
        <div className="social__header">
          <span className="ch-serif social__title">{t('social.friends')}</span>
          {pendingRequests.length > 0 && (
            <span className="social__pending-badge">{pendingRequests.length}</span>
          )}
        </div>

        {pendingRequests.length > 0 && (
          <div className="social__requests">
            <div className="ch-eyebrow social__requests-title">{t('social.receivedRequests')}</div>
            <div className="social__requests-list">
              {pendingRequests.map(f => (
                <div key={f.id} className="ch-card social__request-card">
                  <Link to={`/users/${f.sender?.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div className="ch-avatar" style={{ width: 40, height: 40 }}>
                      {f.sender?.pseudo[0]?.toUpperCase()}
                    </div>
                  </Link>
                  <div className="social__request-info">
                    <Link to={`/users/${f.sender?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="social__request-name">{f.sender?.pseudo}</div>
                    </Link>
                    <div className="social__request-sub">{t('social.wantsToAdd')}</div>
                  </div>
                  <div className="social__request-actions">
                    <button onClick={() => acceptRequest(f)} className="social__accept-btn">{t('social.accept')}</button>
                    <button onClick={() => declineRequest(f)} className="social__decline-btn">{t('social.decline')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="social__friends">
          <div className="social__friends-header">
            <div className="ch-eyebrow">{t('social.myFriends')}</div>
            <span className="social__friends-count">{accepted.length}</span>
          </div>
          {loading ? (
            <div className="social__friends-loading">{t('social.loading')}</div>
          ) : accepted.length === 0 ? (
            <div className="ch-card social__friends-empty">
              {t('social.noFriends')}<br />
              <span style={{ fontSize: 12 }}>{t('social.noFriendsHint')}</span>
            </div>
          ) : (
            <div className="social__friends-list">
              {sortedAccepted.map(f => {
                const friend = friendUser(f);
                const unreadEntry = unreadMessages.find(e => e.senderId === friend?.id);
                const unreadCount = unreadEntry?.count ?? 0;
                return (
                  <div
                    key={f.id}
                    className={`ch-card social__friend-card${unreadCount > 0 ? ' social__friend-card--unread' : ''}`}
                  >
                    <Link to={`/users/${friend?.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      <div className="ch-avatar" style={{ width: 40, height: 40 }}>
                        {friend?.pseudo[0]?.toUpperCase()}
                      </div>
                    </Link>
                    <div className="social__friend-info">
                      <Link to={`/users/${friend?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="social__friend-name">{friend?.pseudo}</div>
                      </Link>
                      {unreadCount > 0 && (
                        <div className="social__friend-preview">
                          {unreadEntry?.lastText?.slice(0, 30)}{(unreadEntry?.lastText?.length ?? 0) > 30 ? '…' : ''}
                        </div>
                      )}
                    </div>
                    <div className="social__friend-actions">
                      <button onClick={() => navigate(`/chat/${friend?.id}`)} className="social__message-btn">
                        <Icon name="arrowRight" size={12} /> {t('social.message')}
                        {unreadCount > 0 && (
                          <span className="social__message-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                      </button>
                      <Link to={`/users/${friend?.id}`} className="social__profile-link">
                        <Icon name="user" size={12} /> {t('social.profile')}
                      </Link>
                      {confirmRemoveId === f.id ? (
                        <div className="social__remove-confirm">
                          <span className="social__remove-label">{t('social.remove')}</span>
                          <button onClick={() => removeFriend(f)} className="social__remove-yes">{t('social.yes')}</button>
                          <button onClick={() => setConfirmRemoveId(null)} className="social__remove-no">{t('social.no')}</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemoveId(f.id)} className="social__remove-btn">
                          <Icon name="x" size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sentPending.length > 0 && (
          <div className="social__sent">
            <div className="ch-eyebrow" style={{ marginBottom: 10 }}>{t('social.sentRequests')}</div>
            <div className="social__sent-list">
              {sentPending.map(f => (
                <div key={f.id} className="ch-card social__sent-card">
                  <div className="ch-avatar" style={{ width: 40, height: 40 }}>
                    {f.receiver?.pseudo[0]?.toUpperCase()}
                  </div>
                  <div className="social__sent-info">
                    <div className="social__sent-name">{f.receiver?.pseudo}</div>
                    <div className="social__sent-status">{t('social.pending')}</div>
                  </div>
                  <button onClick={() => removeFriend(f)} className="social__sent-cancel">
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
