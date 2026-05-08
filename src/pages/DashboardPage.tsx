import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { io as socketIO } from "socket.io-client";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { SERVER_URL } from "../lib/config";
import { useNotificationsStore } from "../stores/notifications";
import type { DirectMessage, Friendship, Game } from "../types/api";
import { TabBar } from "../components/TabBar";
import { Icon } from "../components/Icon";
import { useCountdown } from "../hooks/useCountdown";

function GameCountdown({ expiresAt }: { expiresAt: string | null }) {
  const { label, urgent } = useCountdown(expiresAt);
  if (!expiresAt) return null;
  return (
    <span
      className="ch-mono"
      style={{
        fontSize: 12,
        color: urgent ? "var(--ch-danger)" : "var(--ch-ink-mute)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {label}
    </span>
  );
}

function FeaturedCountdown({ expiresAt }: { expiresAt: string | null }) {
  const { label, urgent } = useCountdown(expiresAt);
  if (!expiresAt) return null;
  return (
    <div
      className="ch-mono"
      style={{
        fontSize: 13,
        marginTop: 10,
        opacity: urgent ? 1 : 0.85,
        color: urgent ? "#FFB3A7" : "inherit",
        fontVariantNumeric: "tabular-nums",
      }}
    >
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
    add: addNotif,
    remove: removeNotif,
    addUnread,
    clearUnread,
  } = useNotificationsStore();

  useEffect(() => {
    api
      .get<Game[]>("/games")
      .then((r) => setGames(r.data))
      .catch(() => {});
    loadNotifs();
  }, []);

  // Socket global pour les notifs temps réel
  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null);
  useEffect(() => {
    if (!user) return;
    const socket = socketIO(SERVER_URL, {
      auth: { token: useAuthStore.getState().access },
    });
    socketRef.current = socket;
    socket.on("friend:request", (f: Friendship) => addNotif(f));
    socket.on("dm:message", (msg: DirectMessage) => {
      if (msg.senderId !== user?.id) addUnread(msg);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const liveGame = games.find((g) => g.status === "RUNNING");
  const lobbyGame = games.find((g) => g.status === "LOBBY");
  const featured = liveGame ?? lobbyGame;

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    try {
      const { data } = await api.post<Game>("/games/join", {
        inviteCode: joinCode.toUpperCase(),
      });
      navigate(
        data.status === "LOBBY"
          ? `/games/${data.id}/lobby`
          : `/games/${data.id}`,
      );
    } catch (err: any) {
      setJoinError(err.response?.data?.error ?? "Erreur");
    }
  };

  const acceptRequest = async (f: Friendship) => {
    try {
      await api.post(`/users/friends/accept/${f.id}`);
      removeNotif(f.id);
    } catch {
      /* ignore */
    }
  };

  const declineRequest = async (f: Friendship) => {
    try {
      await api.delete(`/users/friends/${f.id}`);
      removeNotif(f.id);
    } catch {
      /* ignore */
    }
  };

  const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 100 }}>


        <div style={{ padding: "12px 20px 4px" }}>
          <div className="ch-eyebrow" style={{ marginBottom: 6 }}>
            {today}
          </div>
          <h1
            className="ch-serif"
            style={{
              fontSize: 38,
              lineHeight: 1,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {t('dashboard.hello', { pseudo: user?.pseudo ?? '' })}<br />
            {t('dashboard.huntAwaits')}
          </h1>
        </div>

        {featured && (
          <div style={{ padding: "24px 20px 0" }}>
            <Link
              to={`/games/${featured.id}${featured.status === "LOBBY" ? "/lobby" : ""}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  borderRadius: 22,
                  padding: 18,
                  background:
                    "linear-gradient(135deg, #C99B7E 0%, #A8755A 100%)",
                  color: "var(--ch-ivory)",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 18px 48px -12px rgba(168,117,90,0.5)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      opacity: 0.85,
                    }}
                  >
                    {featured.status === "RUNNING"
                      ? t('dashboard.live')
                      : t('dashboard.waiting')}
                  </span>
                  <span
                    className="ch-mono"
                    style={{ fontSize: 12, opacity: 0.85 }}
                  >
                    {featured.inviteCode}
                  </span>
                </div>
                <div
                  className="ch-serif"
                  style={{ fontSize: 30, lineHeight: 1.05 }}
                >
                  {featured.status === "RUNNING" ? t('dashboard.huntRunning') : t('dashboard.lobby')}
                </div>
                <div
                  className="ch-mono"
                  style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}
                >
                  {featured.mode === "TEAM"
                    ? `${t('dashboard.team')} · ${featured.teamSize}`
                    : t('dashboard.solo')}{" "}
                  · {featured.maxPlayers} {t('dashboard.maxPlayers')}
                </div>
                {featured.status === "RUNNING" && (
                  <FeaturedCountdown expiresAt={featured.expiresAt} />
                )}
              </div>
            </Link>
          </div>
        )}

        <div
          style={{
            padding: "18px 20px 0",
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr",
            gap: 10,
          }}
        >
          <Link
            to="/games/new"
            className="ch-btn"
            style={{
              padding: 16,
              borderRadius: 16,
              justifyContent: "space-between",
              flexDirection: "column",
              alignItems: "flex-start",
              height: 96,
              textDecoration: "none",
            }}
          >
            <Icon name="plus" size={22} stroke={1.8} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {t('dashboard.createHunt')}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>
                {t('dashboard.soloOrTeam')}
              </div>
            </div>
          </Link>
          <form
            onSubmit={join}
            className="ch-card"
            style={{
              padding: 16,
              height: 96,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}>
              {t('dashboard.joinCode')}
            </div>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="4F2KX"
              maxLength={8}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 22,
                fontFamily: "var(--ch-serif)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--ch-ink)",
              }}
            />
            {joinError && (
              <div style={{ fontSize: 10, color: "var(--ch-danger)" }}>
                {joinError}
              </div>
            )}
          </form>
        </div>

        <div style={{ padding: "28px 20px 0" }}>
          <h3
            className="ch-serif"
            style={{
              fontSize: 22,
              margin: "0 0 12px",
              letterSpacing: "-0.01em",
            }}
          >
            {t('dashboard.myHunts')}
          </h3>
          {games.length === 0 && (
            <div
              className="ch-card"
              style={{ padding: 16, fontSize: 13, color: "var(--ch-ink-mute)" }}
            >
              {t('dashboard.noHunts')}
            </div>
          )}
          {games.map((g) => (
            <Link
              key={g.id}
              to={`/games/${g.id}${g.status === "LOBBY" ? "/lobby" : ""}`}
              className="ch-card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
                padding: 12,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#C99B7E",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {g.inviteCode} · {g.mode === "TEAM" ? t('dashboard.team') : t('dashboard.solo')}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ch-ink-mute)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {g.status.toLowerCase()}
                  {g.status === "RUNNING" && (
                    <GameCountdown expiresAt={g.expiresAt} />
                  )}
                </div>
              </div>
              <Icon name="chevronRight" size={18} color="var(--ch-ink-mute)" />
            </Link>
          ))}
        </div>
      </div>
      {showNotifs && (
        <>
          <div
            onClick={() => setShowNotifs(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.35)",
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 201,
              background: "var(--ch-paper)",
              borderRadius: "20px 20px 0 0",
              padding: "20px 20px 40px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {t('dashboard.notifications')}
              </span>
              <button
                onClick={() => setShowNotifs(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {pendingRequests.length === 0 && unreadMessages.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ch-ink-mute)",
                  textAlign: "center",
                  padding: "24px 0",
                }}
              >
                {t('dashboard.noNotifications')}
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {unreadMessages.map((entry) => (
                  <div
                    key={entry.senderId}
                    onClick={() => { clearUnread(entry.senderId); navigate(`/chat/${entry.senderId}`); setShowNotifs(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px",
                      background: "var(--ch-ivory)",
                      borderRadius: 14,
                      cursor: "pointer",
                    }}
                  >
                    <div className="ch-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                      {entry.pseudo[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{entry.pseudo}</div>
                      <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.lastText}
                      </div>
                    </div>
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 999,
                      background: "var(--ch-clay)", color: "#fff",
                      fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 4px", flexShrink: 0,
                    }}>
                      {entry.count}
                    </span>
                  </div>
                ))}
                {pendingRequests.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      background: "var(--ch-ivory)",
                      borderRadius: 14,
                    }}
                  >
                    <div
                      className="ch-avatar"
                      style={{ width: 36, height: 36, flexShrink: 0 }}
                    >
                      {f.sender?.pseudo[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {f.sender?.pseudo}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}
                      >
                        {t('dashboard.wantsToAdd')}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => acceptRequest(f)}
                        style={{
                          padding: "5px 10px",
                          fontSize: 11,
                          fontFamily: "var(--ch-sans)",
                          fontWeight: 600,
                          background: "var(--ch-clay)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 999,
                          cursor: "pointer",
                        }}
                      >
                        {t('dashboard.accept')}
                      </button>
                      <button
                        onClick={() => declineRequest(f)}
                        style={{
                          padding: "5px 10px",
                          fontSize: 11,
                          fontFamily: "var(--ch-sans)",
                          fontWeight: 600,
                          background: "var(--ch-cream-2)",
                          color: "var(--ch-ink)",
                          border: "none",
                          borderRadius: 999,
                          cursor: "pointer",
                        }}
                      >
                        {t('dashboard.decline')}
                      </button>
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
