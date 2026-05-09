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

  // Trier les amis : ceux avec DMs non lus en premier
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
        <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ch-serif" style={{ fontSize: 20 }}>{t('social.friends')}</span>
          {pendingRequests.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 999,
              background: 'var(--ch-danger, #e05a5a)', color: '#fff',
              fontSize: 11, fontWeight: 700,
            }}>
              {pendingRequests.length}
            </span>
          )}
        </div>

        {/* Demandes reçues */}
        {pendingRequests.length > 0 && (
          <div style={{ padding: '12px 20px 0' }}>
            <div className="ch-eyebrow" style={{ marginBottom: 10 }}>{t('social.receivedRequests')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingRequests.map(f => (
                <div key={f.id} className="ch-card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Link to={`/users/${f.sender?.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div className="ch-avatar" style={{ width: 40, height: 40 }}>
                      {f.sender?.pseudo[0]?.toUpperCase()}
                    </div>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/users/${f.sender?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{f.sender?.pseudo}</div>
                    </Link>
                    <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)' }}>{t('social.wantsToAdd')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => acceptRequest(f)} style={actionBtn('var(--ch-clay)', '#fff')}>
                      {t('social.accept')}
                    </button>
                    <button onClick={() => declineRequest(f)} style={actionBtn('var(--ch-cream-2)', 'var(--ch-ink)')}>
                      {t('social.decline')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amis acceptés */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="ch-eyebrow">{t('social.myFriends')}</div>
            <span style={{ fontSize: 12, color: 'var(--ch-ink-mute)' }}>{accepted.length}</span>
          </div>
          {loading ? (
            <div style={{ fontSize: 13, color: 'var(--ch-ink-mute)', padding: '16px 0' }}>{t('social.loading')}</div>
          ) : accepted.length === 0 ? (
            <div className="ch-card" style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--ch-ink-mute)' }}>
              {t('social.noFriends')}<br />
              <span style={{ fontSize: 12 }}>{t('social.noFriendsHint')}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedAccepted.map(f => {
                const friend = friendUser(f);
                const unreadEntry = unreadMessages.find(e => e.senderId === friend?.id);
                const unreadCount = unreadEntry?.count ?? 0;
                return (
                  <div key={f.id} className="ch-card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, ...(unreadCount > 0 ? { borderLeft: '3px solid var(--ch-clay)' } : {}) }}>
                    <Link to={`/users/${friend?.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      <div className="ch-avatar" style={{ width: 40, height: 40 }}>
                        {friend?.pseudo[0]?.toUpperCase()}
                      </div>
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/users/${friend?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{friend?.pseudo}</div>
                      </Link>
                      {unreadCount > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--ch-clay)', marginTop: 2 }}>
                          {unreadEntry?.lastText?.slice(0, 30)}{(unreadEntry?.lastText?.length ?? 0) > 30 ? '…' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => navigate(`/chat/${friend?.id}`)}
                        style={{ position: 'relative', background: 'var(--ch-clay)', border: 'none', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Icon name="arrowRight" size={12} /> {t('social.message')}
                        {unreadCount > 0 && (
                          <span style={{
                            position: 'absolute', top: -6, right: -6,
                            minWidth: 16, height: 16, borderRadius: 999,
                            background: '#e05a5a', color: '#fff',
                            fontSize: 9, fontWeight: 700, fontFamily: 'var(--ch-sans)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '0 3px',
                          }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </button>
                      <Link
                        to={`/users/${friend?.id}`}
                        style={{ background: 'var(--ch-cream-2)', border: 'none', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 600, textDecoration: 'none', color: 'var(--ch-ink)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Icon name="user" size={12} /> {t('social.profile')}
                      </Link>
                      {confirmRemoveId === f.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--ch-ink-mute)' }}>{t('social.remove')}</span>
                          <button onClick={() => removeFriend(f)} style={{ background: 'var(--ch-danger, #e05a5a)', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                            {t('social.yes')}
                          </button>
                          <button onClick={() => setConfirmRemoveId(null)} style={{ background: 'var(--ch-cream-2)', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: 'var(--ch-ink)', cursor: 'pointer' }}>
                            {t('social.no')}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemoveId(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ch-ink-mute)', padding: 4, display: 'flex' }}>
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

        {/* Demandes envoyées */}
        {sentPending.length > 0 && (
          <div style={{ padding: '20px 20px 0' }}>
            <div className="ch-eyebrow" style={{ marginBottom: 10 }}>{t('social.sentRequests')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sentPending.map(f => (
                <div key={f.id} className="ch-card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ch-avatar" style={{ width: 40, height: 40 }}>
                    {f.receiver?.pseudo[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.receiver?.pseudo}</div>
                    <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)', fontStyle: 'italic' }}>{t('social.pending')}</div>
                  </div>
                  <button onClick={() => removeFriend(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ch-ink-mute)', padding: 4, display: 'flex' }}>
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

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: '5px 10px', fontSize: 11,
    fontFamily: 'var(--ch-sans)', fontWeight: 600,
    background: bg, color, border: 'none',
    borderRadius: 999, cursor: 'pointer',
  };
}
