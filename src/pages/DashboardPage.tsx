import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { useNotificationsStore } from "../stores/notifications";
import type { Friendship, Game } from "../types/api";
import { TabBar } from "../components/TabBar";
import { Icon } from "../components/Icon";
import { useCountdown } from "../hooks/useCountdown";

function GameCountdown({ expiresAt }: { expiresAt: string | null }) {
  const { label, urgent } = useCountdown(expiresAt);
  if (!expiresAt) return null;
  return (
    <span className={`ch-mono countdown countdown--${urgent ? 'urgent' : 'mute'}`} style={{ fontSize: 12 }}>
      {label}
    </span>
  );
}

function FeaturedCountdown({ expiresAt }: { expiresAt: string | null }) {
  const { label, urgent } = useCountdown(expiresAt);
  if (!expiresAt) return null;
  return (
    <div className="ch-mono" style={{ fontSize: 13, marginTop: 10, opacity: urgent ? 1 : 0.85, color: urgent ? "#FFB3A7" : "inherit", fontVariantNumeric: "tabular-nums" }}>
      ⏱ {label}
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [games, setGames] = useState<Game[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const {
    pendingRequests,
    unreadMessages,
    load: loadNotifs,
    remove: removeNotif,
    clearUnread,
  } = useNotificationsStore();

  useEffect(() => {
    api.get<Game[]>("/games").then((r) => setGames(r.data)).catch(() => {});
    loadNotifs();
  }, []);

  const liveGame = games.find((g) => g.status === "RUNNING");
  const lobbyGame = games.find((g) => g.status === "LOBBY");
  const featured = liveGame ?? lobbyGame;

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    try {
      const { data } = await api.post<Game>("/games/join", { inviteCode: joinCode.toUpperCase() });
      navigate(data.status === "LOBBY" ? `/games/${data.id}/lobby` : `/games/${data.id}`);
    } catch (err: any) {
      setJoinError(err.response?.data?.error ?? "Erreur");
    }
  };

  const acceptRequest = async (f: Friendship) => {
    try { await api.post(`/users/friends/accept/${f.id}`); removeNotif(f.id); }
    catch { /* ignore */ }
  };

  const declineRequest = async (f: Friendship) => {
    try { await api.delete(`/users/friends/${f.id}`); removeNotif(f.id); }
    catch { /* ignore */ }
  };

  const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
  const today = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 100 }}>

        <div className="dashboard__header">
          <div className="ch-eyebrow dashboard__date">{today}</div>
          <h1 className="ch-serif dashboard__title">
            {t('dashboard.hello', { pseudo: user?.pseudo ?? '' })}<br />
            {t('dashboard.huntAwaits')}
          </h1>
        </div>

        {featured && (
          <div className="dashboard__featured">
            <Link
              to={`/games/${featured.id}${featured.status === "LOBBY" ? "/lobby" : ""}`}
              className="dashboard__featured-card"
            >
              <div className="dashboard__featured-top">
                <span className="dashboard__featured-status">
                  {featured.status === "RUNNING" ? t('dashboard.live') : t('dashboard.waiting')}
                </span>
                <span className="ch-mono dashboard__featured-code">{featured.inviteCode}</span>
              </div>
              <div className="ch-serif dashboard__featured-name">
                {featured.status === "RUNNING" ? t('dashboard.huntRunning') : t('dashboard.lobby')}
              </div>
              <div className="ch-mono dashboard__featured-meta">
                {featured.mode === "TEAM" ? `${t('dashboard.team')} · ${featured.teamSize}` : t('dashboard.solo')}{" "}
                · {featured.maxPlayers} {t('dashboard.maxPlayers')}
              </div>
              {featured.status === "RUNNING" && <FeaturedCountdown expiresAt={featured.expiresAt} />}
            </Link>
          </div>
        )}

        <div className="dashboard__actions">
          <Link to="/games/new" className="ch-btn dashboard__create-btn">
            <Icon name="plus" size={22} stroke={1.8} />
            <div style={{ textAlign: "left" }}>
              <div className="dashboard__create-label">{t('dashboard.createHunt')}</div>
              <div className="dashboard__create-sub">{t('dashboard.soloOrTeam')}</div>
            </div>
          </Link>
          <form onSubmit={join} className="ch-card dashboard__join-card">
            <div className="dashboard__join-label">{t('dashboard.joinCode')}</div>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="4F2KX"
              maxLength={8}
              className="dashboard__join-input"
            />
            {joinError && <div className="dashboard__join-error">{joinError}</div>}
          </form>
        </div>

        <div className="dashboard__hunts">
          <h3 className="ch-serif dashboard__hunts-title">{t('dashboard.myHunts')}</h3>
          {games.length === 0 && (
            <div className="ch-card dashboard__hunts-empty">{t('dashboard.noHunts')}</div>
          )}
          {games.map((g) => (
            <Link
              key={g.id}
              to={`/games/${g.id}${g.status === "LOBBY" ? "/lobby" : ""}`}
              className="ch-card dashboard__hunt-link"
            >
              <div className="dashboard__hunt-thumb" />
              <div className="dashboard__hunt-info">
                <div className="dashboard__hunt-title">
                  {g.inviteCode} · {g.mode === "TEAM" ? t('dashboard.team') : t('dashboard.solo')}
                </div>
                <div className="dashboard__hunt-meta">
                  {g.status.toLowerCase()}
                  {g.status === "RUNNING" && <GameCountdown expiresAt={g.expiresAt} />}
                </div>
              </div>
              <Icon name="chevronRight" size={18} color="var(--ch-ink-mute)" />
            </Link>
          ))}
        </div>
      </div>

      {showNotifs && (
        <>
          <div onClick={() => setShowNotifs(false)} className="notifs-sheet__backdrop" />
          <div className="notifs-sheet__panel">
            <div className="notifs-sheet__header">
              <span className="notifs-sheet__title">{t('dashboard.notifications')}</span>
              <button onClick={() => setShowNotifs(false)} className="notifs-sheet__close-btn">
                <Icon name="x" size={20} />
              </button>
            </div>

            {pendingRequests.length === 0 && unreadMessages.length === 0 ? (
              <div className="notifs-sheet__empty">{t('dashboard.noNotifications')}</div>
            ) : (
              <div className="notifs-sheet__list">
                {unreadMessages.map((entry) => (
                  <div
                    key={entry.senderId}
                    onClick={() => { clearUnread(entry.senderId); navigate(`/chat/${entry.senderId}`); setShowNotifs(false); }}
                    className="notifs-sheet__dm-row"
                  >
                    <div className="ch-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                      {entry.pseudo[0]?.toUpperCase()}
                    </div>
                    <div className="notifs-sheet__dm-info">
                      <div className="notifs-sheet__dm-name">{entry.pseudo}</div>
                      <div className="notifs-sheet__dm-preview">{entry.lastText}</div>
                    </div>
                    <span className="notifs-sheet__dm-count">{entry.count}</span>
                  </div>
                ))}
                {pendingRequests.map((f) => (
                  <div key={f.id} className="notifs-sheet__request-row">
                    <div className="ch-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                      {f.sender?.pseudo[0]?.toUpperCase()}
                    </div>
                    <div className="notifs-sheet__request-info">
                      <div className="notifs-sheet__request-name">{f.sender?.pseudo}</div>
                      <div className="notifs-sheet__request-sub">{t('dashboard.wantsToAdd')}</div>
                    </div>
                    <div className="notifs-sheet__request-actions">
                      <button onClick={() => acceptRequest(f)} className="notifs-sheet__accept-btn">{t('dashboard.accept')}</button>
                      <button onClick={() => declineRequest(f)} className="notifs-sheet__decline-btn">{t('dashboard.decline')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <TabBar />
    </div>
  );
}
