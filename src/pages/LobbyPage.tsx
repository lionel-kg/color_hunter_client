import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { io as socketIO, Socket } from "socket.io-client";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { SERVER_URL } from "../lib/config";
import { Icon } from "../components/Icon";
import { AddFriendButton } from "../components/AddFriendButton";
import type { Game, GameParticipant } from "../types/api";

interface ChatMsg {
  userId: string;
  pseudo: string;
  message: string;
  at: number;
}

const TEAM_COLORS = ["#FF3B3B", "#0088FF", "#2ECC71", "#FFD600", "#7B61FF", "#FF7A00"];

function TeamPanel({ game, onUpdate, readOnly = false }: { game: Game; onUpdate?: (g: Game) => void; readOnly?: boolean }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const teamSlots: number[] = Array.from({ length: game.numTeams }, (_, i) => i);

  const participantsByTeam = (teamIndex: number | null): GameParticipant[] => {
    if (teamIndex === null) {
      return (game.participants ?? []).filter(p => !p.teamId);
    }
    const teamId = game.teams?.[teamIndex]?.id;
    return (game.participants ?? []).filter(p => p.teamId === teamId);
  };

  const assign = async (userId: string, teamIndex: number) => {
    if (readOnly || !onUpdate) return;
    setBusy(true);
    try {
      const currentAssignments = (game.participants ?? [])
        .filter(p => p.teamId)
        .map(p => ({
          userId: p.userId,
          teamIndex: (game.teams ?? []).findIndex(t => t.id === p.teamId),
        }))
        .filter(a => a.teamIndex >= 0);

      const filtered = currentAssignments.filter(a => a.userId !== userId);
      filtered.push({ userId, teamIndex });

      const { data } = await api.post<Game>(`/games/${game.id}/teams`, { assignments: filtered });
      onUpdate(data);
    } catch { } finally { setBusy(false); }
  };

  const randomize = async () => {
    if (readOnly || !onUpdate) return;
    setBusy(true);
    try {
      const { data } = await api.post<Game>(`/games/${game.id}/teams`, { random: true });
      onUpdate(data);
    } catch { } finally { setBusy(false); }
  };

  const unassigned = participantsByTeam(null);

  return (
    <div style={{ padding: "20px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>{t('lobby.teams')}</span>
        {!readOnly && (
          <button
            onClick={randomize}
            disabled={busy}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, background: "var(--ch-ink)", color: "var(--ch-ivory)", border: "none", fontSize: 11, fontFamily: "var(--ch-sans)", cursor: "pointer" }}
          >
            <Icon name="sparkle" size={12} />
            {t('lobby.randomize')}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {teamSlots.map((teamIndex) => {
          const members = participantsByTeam(teamIndex);
          const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
          return (
            <div key={teamIndex} className="ch-card" style={{ padding: 12, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 8, letterSpacing: "0.05em" }}>
                {t('lobby.teamN', { n: teamIndex + 1 })}
              </div>
              {members.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", fontStyle: "italic" }}>—</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {members.map(p => (
                    <ParticipantRow
                      key={p.id}
                      participant={p}
                      teamSlots={teamSlots}
                      currentTeamIndex={teamIndex}
                      onAssign={(ti) => assign(p.userId, ti)}
                      busy={busy}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {unassigned.length > 0 && (
          <div className="ch-card" style={{ padding: 12, borderLeft: "3px solid var(--ch-line-2)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ch-ink-mute)", marginBottom: 8, letterSpacing: "0.05em" }}>
              {t('lobby.unassigned')}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {unassigned.map(p => (
                <ParticipantRow
                  key={p.id}
                  participant={p}
                  teamSlots={teamSlots}
                  currentTeamIndex={null}
                  onAssign={(ti) => assign(p.userId, ti)}
                  busy={busy}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantRow({
  participant,
  teamSlots,
  currentTeamIndex,
  onAssign,
  busy,
  readOnly = false,
}: {
  participant: GameParticipant;
  teamSlots: number[];
  currentTeamIndex: number | null;
  onAssign: (teamIndex: number) => void;
  busy: boolean;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const otherSlots = teamSlots.filter(i => i !== currentTeamIndex);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
      <div className="ch-avatar" style={{ width: 26, height: 26, fontSize: 11, flexShrink: 0 }}>
        {participant.user.pseudo[0]?.toUpperCase()}
      </div>
      <span style={{ fontSize: 12, flex: 1 }}>{participant.user.pseudo}</span>
      {!readOnly && otherSlots.length > 0 && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(o => !o)}
            disabled={busy}
            style={{ background: "var(--ch-cream-2)", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontFamily: "var(--ch-sans)", color: "var(--ch-ink-soft)" }}
          >
            {t('lobby.assignTo')} ▾
          </button>
          {open && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--ch-ivory)", border: "1px solid var(--ch-line)", borderRadius: 10, padding: 4, zIndex: 10, minWidth: 110, boxShadow: "var(--ch-shadow)" }}>
              {otherSlots.map(ti => (
                <button
                  key={ti}
                  onClick={() => { onAssign(ti); setOpen(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", background: "none", border: "none", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "var(--ch-sans)" }}
                >
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: TEAM_COLORS[ti % TEAM_COLORS.length], marginRight: 6 }} />
                  {t('lobby.teamN', { n: ti + 1 })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LobbySettingsPanel({ game, onUpdate, onClose }: { game: Game; onUpdate: (g: Game) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const isTeam = game.mode === "TEAM";

  const [teamSize, setTeamSize] = useState(game.teamSize);
  const [numTeams, setNumTeams] = useState(game.numTeams);
  const [durationMin, setDurationMin] = useState(game.durationMin);
  const [maxPlayers, setMaxPlayers] = useState(game.maxPlayers);
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">(game.visibility as "PRIVATE" | "PUBLIC");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const computedMax = isTeam ? numTeams * teamSize : maxPlayers;

  const durations = [
    { label: "1h", min: 60 },
    { label: "3h", min: 180 },
    { label: "24h", min: 60 * 24 },
    { label: t('createGame.days_3'), min: 60 * 24 * 3 },
    { label: t('createGame.week_1'), min: 60 * 24 * 7 },
  ];

  const save = async () => {
    setBusy(true);
    setSaved(false);
    try {
      const { data } = await api.patch<Game>(`/games/${game.id}`, {
        teamSize: isTeam ? teamSize : undefined,
        numTeams: isTeam ? numTeams : undefined,
        maxPlayers: computedMax,
        durationMin,
        visibility,
      });
      onUpdate(data);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch { } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} className="ch-card" style={{ width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", borderRadius: "20px 20px 0 0", padding: 0, background: "var(--ch-ivory)" }}>
        <div style={{ position: "sticky", top: 0, background: "var(--ch-ivory)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--ch-line)" }}>
          <span className="ch-serif" style={{ fontSize: 18 }}>{t('lobby.settings')}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ch-ink-mute)", padding: 4, display: "flex" }}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

        {isTeam && (
          <>
            <div>
              <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", marginBottom: 8 }}>{t('lobby.settingsSize')}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[2, 3].map(v => (
                  <button key={v} onClick={() => setTeamSize(v)} style={{ flex: 1, padding: "8px 6px", borderRadius: 12, background: teamSize === v ? "var(--ch-cream-3)" : "var(--ch-ivory)", border: "1px solid " + (teamSize === v ? "var(--ch-ink)" : "var(--ch-line)"), cursor: "pointer", fontFamily: "var(--ch-sans)", fontSize: 12 }}>
                    {v === 2 ? t('createGame.duos') : t('createGame.trios')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", marginBottom: 8 }}>{t('lobby.settingsNumTeams')}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[2, 3, 4].map(n => (
                  <button key={n} onClick={() => setNumTeams(n)} style={{ flex: 1, padding: "8px 6px", borderRadius: 12, background: numTeams === n ? "var(--ch-cream-3)" : "var(--ch-ivory)", border: "1px solid " + (numTeams === n ? "var(--ch-ink)" : "var(--ch-line)"), cursor: "pointer", fontFamily: "var(--ch-sans)", fontSize: 13, fontWeight: 500 }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}>{t('lobby.settingsMaxPlayers')}</span>
              <span className="ch-serif" style={{ fontSize: 20 }}>{computedMax}</span>
            </div>
          </>
        )}

        {!isTeam && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}>{t('lobby.settingsMaxPlayers')}</span>
              <span className="ch-serif" style={{ fontSize: 20 }}>{maxPlayers}</span>
            </div>
            <input type="range" min={2} max={20} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", marginBottom: 8 }}>{t('lobby.settingsDuration')}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {durations.map(d => (
              <button key={d.min} onClick={() => setDurationMin(d.min)} style={{ padding: "6px 12px", borderRadius: 999, background: durationMin === d.min ? "var(--ch-ink)" : "var(--ch-ivory)", color: durationMin === d.min ? "var(--ch-ivory)" : "var(--ch-ink-soft)", border: "1px solid " + (durationMin === d.min ? "var(--ch-ink)" : "var(--ch-line)"), fontSize: 12, cursor: "pointer", fontFamily: "var(--ch-sans)" }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", marginBottom: 8 }}>{t('lobby.settingsVisibility')}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["PRIVATE", "PUBLIC"] as const).map(v => (
              <button key={v} onClick={() => setVisibility(v)} style={{ flex: 1, padding: "8px 6px", borderRadius: 12, background: visibility === v ? "var(--ch-cream-3)" : "var(--ch-ivory)", border: "1px solid " + (visibility === v ? "var(--ch-ink)" : "var(--ch-line)"), cursor: "pointer", fontFamily: "var(--ch-sans)", fontSize: 12 }}>
                {v === "PRIVATE" ? t('createGame.private') : t('createGame.public')}
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={busy} className="ch-btn" style={{ width: "100%", padding: 12, fontSize: 13 }}>
          {saved ? t('lobby.settingsSaved') : busy ? "…" : t('lobby.save')}
        </button>
        </div>
      </div>
    </div>
  );
}

export function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const [game, setGame] = useState<Game | null>(null);
  const [starting, setStarting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    api.get<Game>(`/games/${id}`).then((r) => setGame(r.data)).catch(() => {});
    const socket = socketIO(SERVER_URL, { auth: { token: useAuthStore.getState().access } });
    socketRef.current = socket;
    socket.emit("game:join", { gameId: id });
    socket.on("game:joined", (updatedGame: Game) => setGame(updatedGame));
    socket.on("game:started", (updatedGame: Game) => {
      setGame(updatedGame);
      navigate(`/games/${id}`);
    });
    socket.on("game:dissolved", () => {
      navigate('/');
    });
    socket.on("game:chat", (msg: ChatMsg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { socket.emit("game:leave", { gameId: id }); socket.disconnect(); };
  }, [id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = () => {
    const trimmed = draft.trim();
    if (!trimmed || !id) return;
    socketRef.current?.emit("game:chat", { gameId: id, message: trimmed });
    setDraft("");
  };

  if (!game) return <div style={{ padding: 32 }}>{t('lobby.loading')}</div>;

  const start = async () => {
    setStarting(true);
    try { await api.post(`/games/${game.id}/start`); navigate(`/games/${game.id}`); }
    finally { setStarting(false); }
  };

  const dissolve = async () => {
    if (!confirm(t('lobby.dissolveConfirm'))) return;
    await api.delete(`/games/${game.id}`);
    navigate('/');
  };

  const leave = async () => {
    if (!confirm(t('lobby.leaveConfirm'))) return;
    await api.delete(`/games/${game.id}/leave`);
    navigate('/');
  };

  const isHost = game.creatorId === me?.id;
  const isTeam = game.mode === "TEAM";
  const copyCode = () => { navigator.clipboard.writeText(game.inviteCode).catch(() => {}); };

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 30 }}>
        <header className="ch-topbar">
          <Link to="/" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ch-ink)" }}>
            <Icon name="x" size={22} />
          </Link>
          <span className="ch-pill">{t('lobby.salon')}</span>
          {isHost && (
            <button onClick={() => setShowSettings(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", color: showSettings ? "var(--ch-ink)" : "var(--ch-ink-mute)", padding: 4 }}>
              <Icon name="settings" size={18} />
            </button>
          )}
        </header>

        <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
          <div className="ch-eyebrow" style={{ marginBottom: 10 }}>{t('lobby.salon').toUpperCase()}</div>
          <h1 className="ch-serif" style={{ fontSize: 32, lineHeight: 1, margin: 0, letterSpacing: "-0.02em" }}
            dangerouslySetInnerHTML={{ __html: t('lobby.waitingHunters') }}
          />
        </div>

        <div style={{ padding: "24px 20px 0" }}>
          <div className="ch-card" style={{ padding: 24, textAlign: "center", background: "var(--ch-paper)" }}>
            <div className="ch-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>{t('lobby.inviteCode')}</div>
            <div className="ch-serif" style={{ fontSize: 56, letterSpacing: "0.04em", lineHeight: 1, margin: "4px 0" }}>
              {game.inviteCode}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button onClick={copyCode} style={{ padding: "8px 14px", background: "var(--ch-cream-2)", border: "none", borderRadius: 999, fontSize: 12, fontFamily: "var(--ch-sans)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="copy" size={14} /> {t('lobby.copy')}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>{t('lobby.hunters')}</h3>
            <span style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>
              {game.participants?.length ?? 0} / {game.maxPlayers}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {game.participants?.map((p) => (
              <div key={p.id} className="ch-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div className="ch-avatar" style={{ width: 36, height: 36 }}>
                  {p.user.pseudo[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {p.user.pseudo}
                    {p.userId === me?.id && ` ${t('lobby.you')}`}
                    {p.userId === game.creatorId && (
                      <span className="ch-pill" style={{ fontSize: 9, padding: "2px 6px" }}>{t('lobby.host')}</span>
                    )}
                  </div>
                </div>
                <AddFriendButton userId={p.userId} meId={me?.id} />
              </div>
            ))}
          </div>
        </div>

        {isTeam && (
          <TeamPanel
            game={game}
            onUpdate={isHost ? setGame : undefined}
            readOnly={!isHost}
          />
        )}

        {isHost && showSettings && (
          <LobbySettingsPanel
            game={game}
            onUpdate={setGame}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Chat temps réel — non persistant */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontSize: 12, color: "var(--ch-ink-mute)", marginBottom: 8 }}>{t('lobby.chat')}</div>
          <div className="ch-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 180, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", fontStyle: "italic", margin: "auto" }}>
                  {t('lobby.chatEmpty')}
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.userId === me?.id;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && (
                        <span style={{ fontSize: 10, color: "var(--ch-ink-mute)", marginBottom: 2, paddingLeft: 4 }}>{msg.pseudo}</span>
                      )}
                      <div style={{
                        maxWidth: "75%",
                        padding: "6px 10px",
                        borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        background: isMe ? "var(--ch-ink)" : "var(--ch-cream-2)",
                        color: isMe ? "var(--ch-ivory)" : "var(--ch-ink)",
                        fontSize: 12,
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
            <div style={{ display: "flex", borderTop: "1px solid var(--ch-line)", padding: "8px 10px", gap: 8, alignItems: "center" }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder={t('lobby.chatPlaceholder')}
                style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, fontFamily: "var(--ch-sans)", outline: "none", color: "var(--ch-ink)" }}
              />
              <button
                onClick={sendChat}
                disabled={!draft.trim()}
                style={{ background: "none", border: "none", cursor: "pointer", color: draft.trim() ? "var(--ch-ink)" : "var(--ch-ink-mute)", padding: 4, display: "flex" }}
              >
                <Icon name="arrowRight" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
          {isHost ? (
            <>
              <button className="ch-btn" disabled={starting} onClick={start} style={{ width: "100%", padding: 16 }}>
                {starting ? "…" : t('lobby.start')} <Icon name="sparkle" size={16} />
              </button>
              {!isTeam && (
                <p style={{ fontSize: 11, color: "var(--ch-ink-mute)", textAlign: "center", margin: 0 }}>
                  {t('lobby.colorsNote')}
                </p>
              )}
              <button onClick={dissolve} style={{ width: "100%", padding: 12, borderRadius: 14, background: "transparent", border: "none", color: "var(--ch-danger, #e53e3e)", fontSize: 13, cursor: "pointer", fontFamily: "var(--ch-sans)" }}>
                {t('lobby.dissolve')}
              </button>
            </>
          ) : (
            <button onClick={leave} style={{ width: "100%", padding: 12, borderRadius: 14, background: "transparent", border: "1px solid var(--ch-line)", color: "var(--ch-ink-mute)", fontSize: 13, cursor: "pointer", fontFamily: "var(--ch-sans)" }}>
              {t('lobby.leave')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
