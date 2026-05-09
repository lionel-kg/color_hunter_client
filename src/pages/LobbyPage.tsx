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

interface ChatMsg { userId: string; pseudo: string; message: string; at: number; }

const TEAM_COLORS = ["#FF3B3B", "#0088FF", "#2ECC71", "#FFD600", "#7B61FF", "#FF7A00"];

function TeamPanel({ game, onUpdate, readOnly = false }: { game: Game; onUpdate?: (g: Game) => void; readOnly?: boolean }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const teamSlots: number[] = Array.from({ length: game.numTeams }, (_, i) => i);

  const participantsByTeam = (teamIndex: number | null): GameParticipant[] => {
    if (teamIndex === null) return (game.participants ?? []).filter(p => !p.teamId);
    const teamId = game.teams?.[teamIndex]?.id;
    return (game.participants ?? []).filter(p => p.teamId === teamId);
  };

  const assign = async (userId: string, teamIndex: number) => {
    if (readOnly || !onUpdate) return;
    setBusy(true);
    try {
      const currentAssignments = (game.participants ?? [])
        .filter(p => p.teamId)
        .map(p => ({ userId: p.userId, teamIndex: (game.teams ?? []).findIndex(t => t.id === p.teamId) }))
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
    <div className="lobby__teams">
      <div className="lobby__teams-header">
        <span className="lobby__teams-label">{t('lobby.teams')}</span>
        {!readOnly && (
          <button onClick={randomize} disabled={busy} className="lobby__randomize-btn">
            <Icon name="sparkle" size={12} /> {t('lobby.randomize')}
          </button>
        )}
      </div>

      <div className="lobby__teams-list">
        {teamSlots.map((teamIndex) => {
          const members = participantsByTeam(teamIndex);
          const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
          return (
            <div key={teamIndex} className="ch-card lobby__team-card" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="lobby__team-name" style={{ color }}>
                {t('lobby.teamN', { n: teamIndex + 1 })}
              </div>
              {members.length === 0 ? (
                <div className="lobby__team-empty">—</div>
              ) : (
                <div className="lobby__team-members">
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
          <div className="ch-card lobby__team-card" style={{ borderLeft: "3px solid var(--ch-line-2)" }}>
            <div className="lobby__team-name" style={{ color: "var(--ch-ink-mute)" }}>{t('lobby.unassigned')}</div>
            <div className="lobby__team-members">
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

function ParticipantRow({ participant, teamSlots, currentTeamIndex, onAssign, busy, readOnly = false }: {
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
    <div className="lobby__participant-row">
      <div className="ch-avatar" style={{ width: 26, height: 26, fontSize: 11, flexShrink: 0 }}>
        {participant.user.pseudo[0]?.toUpperCase()}
      </div>
      <span className="lobby__participant-name">{participant.user.pseudo}</span>
      {!readOnly && otherSlots.length > 0 && (
        <div style={{ position: "relative" }}>
          <button onClick={() => setOpen(o => !o)} disabled={busy} className="lobby__assign-btn">
            {t('lobby.assignTo')} ▾
          </button>
          {open && (
            <div className="lobby__assign-dropdown">
              {otherSlots.map(ti => (
                <button key={ti} onClick={() => { onAssign(ti); setOpen(false); }} className="lobby__assign-option">
                  <span className="lobby__assign-dot" style={{ background: TEAM_COLORS[ti % TEAM_COLORS.length] }} />
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
    { label: "1h", min: 60 }, { label: "3h", min: 180 }, { label: "24h", min: 60 * 24 },
    { label: t('createGame.days_3'), min: 60 * 24 * 3 }, { label: t('createGame.week_1'), min: 60 * 24 * 7 },
  ];

  const save = async () => {
    setBusy(true); setSaved(false);
    try {
      const { data } = await api.patch<Game>(`/games/${game.id}`, { teamSize: isTeam ? teamSize : undefined, numTeams: isTeam ? numTeams : undefined, maxPlayers: computedMax, durationMin, visibility });
      onUpdate(data);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch { } finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} className="lobby-settings__backdrop">
      <div onClick={e => e.stopPropagation()} className="ch-card lobby-settings__sheet">
        <div className="lobby-settings__sticky-header">
          <span className="ch-serif lobby-settings__title">{t('lobby.settings')}</span>
          <button onClick={onClose} className="lobby-settings__close-btn"><Icon name="x" size={20} /></button>
        </div>
        <div className="lobby-settings__body">
          {isTeam && (
            <>
              <div>
                <div className="lobby-settings__field-label">{t('lobby.settingsSize')}</div>
                <div className="lobby-settings__options-row">
                  {[2, 3].map(v => (
                    <button key={v} onClick={() => setTeamSize(v)} className={`lobby-settings__option-btn lobby-settings__option-btn--${teamSize === v ? 'active' : 'inactive'} lobby-settings__option-btn--text-sm`}>
                      {v === 2 ? t('createGame.duos') : t('createGame.trios')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="lobby-settings__field-label">{t('lobby.settingsNumTeams')}</div>
                <div className="lobby-settings__options-row">
                  {[2, 3, 4].map(n => (
                    <button key={n} onClick={() => setNumTeams(n)} className={`lobby-settings__option-btn lobby-settings__option-btn--${numTeams === n ? 'active' : 'inactive'} lobby-settings__option-btn--text-md`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="lobby-settings__max-row">
                <span className="lobby-settings__max-label">{t('lobby.settingsMaxPlayers')}</span>
                <span className="ch-serif lobby-settings__max-value">{computedMax}</span>
              </div>
            </>
          )}

          {!isTeam && (
            <div>
              <div className="lobby-settings__max-row" style={{ marginBottom: 8 }}>
                <span className="lobby-settings__max-label">{t('lobby.settingsMaxPlayers')}</span>
                <span className="ch-serif lobby-settings__max-value">{maxPlayers}</span>
              </div>
              <input type="range" min={2} max={20} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          )}

          <div>
            <div className="lobby-settings__field-label">{t('lobby.settingsDuration')}</div>
            <div className="lobby-settings__duration-row">
              {durations.map(d => (
                <button key={d.min} onClick={() => setDurationMin(d.min)} className={`lobby-settings__duration-btn lobby-settings__duration-btn--${durationMin === d.min ? 'active' : 'inactive'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="lobby-settings__field-label">{t('lobby.settingsVisibility')}</div>
            <div className="lobby-settings__options-row">
              {(["PRIVATE", "PUBLIC"] as const).map(v => (
                <button key={v} onClick={() => setVisibility(v)} className={`lobby-settings__option-btn lobby-settings__option-btn--${visibility === v ? 'active' : 'inactive'} lobby-settings__option-btn--text-sm`}>
                  {v === "PRIVATE" ? t('createGame.private') : t('createGame.public')}
                </button>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={busy} className="ch-btn lobby-settings__save-btn">
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
    socket.on("game:started", (updatedGame: Game) => { setGame(updatedGame); navigate(`/games/${id}`); });
    socket.on("game:dissolved", () => { navigate('/'); });
    socket.on("game:chat", (msg: ChatMsg) => { setMessages(prev => [...prev, msg]); });
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
          <Link to="/" className="lobby__nav-back"><Icon name="x" size={22} /></Link>
          <span className="ch-pill">{t('lobby.salon')}</span>
          {isHost && (
            <button
              onClick={() => setShowSettings(s => !s)}
              className={`lobby__settings-btn lobby__settings-btn--${showSettings ? 'active' : 'mute'}`}
            >
              <Icon name="settings" size={18} />
            </button>
          )}
        </header>

        <div className="lobby__header">
          <div className="ch-eyebrow" style={{ marginBottom: 10 }}>{t('lobby.salon').toUpperCase()}</div>
          <h1 className="ch-serif lobby__title" dangerouslySetInnerHTML={{ __html: t('lobby.waitingHunters') }} />
        </div>

        <div className="lobby__code-section">
          <div className="ch-card lobby__code-card">
            <div className="ch-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>{t('lobby.inviteCode')}</div>
            <div className="ch-serif lobby__code-value">{game.inviteCode}</div>
            <div className="lobby__code-actions">
              <button onClick={copyCode} className="lobby__copy-btn">
                <Icon name="copy" size={14} /> {t('lobby.copy')}
              </button>
            </div>
          </div>
        </div>

        <div className="lobby__hunters">
          <div className="lobby__hunters-header">
            <h3 className="lobby__hunters-title">{t('lobby.hunters')}</h3>
            <span className="lobby__hunters-count">{game.participants?.length ?? 0} / {game.maxPlayers}</span>
          </div>
          <div className="lobby__hunters-list">
            {game.participants?.map((p) => (
              <div key={p.id} className="ch-card lobby__hunter-card">
                <div className="ch-avatar" style={{ width: 36, height: 36 }}>{p.user.pseudo[0]?.toUpperCase()}</div>
                <div className="lobby__hunter-info">
                  <div className="lobby__hunter-name">
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

        {isTeam && <TeamPanel game={game} onUpdate={isHost ? setGame : undefined} readOnly={!isHost} />}
        {isHost && showSettings && <LobbySettingsPanel game={game} onUpdate={setGame} onClose={() => setShowSettings(false)} />}

        <div className="lobby__chat">
          <div className="lobby__chat-label">{t('lobby.chat')}</div>
          <div className="ch-card lobby__chat-card">
            <div className="lobby__chat-messages">
              {messages.length === 0 ? (
                <div className="lobby__chat-empty">{t('lobby.chatEmpty')}</div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.userId === me?.id;
                  return (
                    <div key={i} className={`lobby__chat-msg lobby__chat-msg--${isMe ? 'mine' : 'theirs'}`}>
                      {!isMe && <span className="lobby__chat-sender">{msg.pseudo}</span>}
                      <div className={`lobby__chat-bubble lobby__chat-bubble--${isMe ? 'mine' : 'theirs'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="lobby__chat-input-row">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder={t('lobby.chatPlaceholder')}
                className="lobby__chat-input"
              />
              <button
                onClick={sendChat}
                disabled={!draft.trim()}
                className={`lobby__chat-send lobby__chat-send--${draft.trim() ? 'active' : 'mute'}`}
              >
                <Icon name="arrowRight" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="lobby__actions">
          {isHost ? (
            <>
              <button className="ch-btn lobby__start-btn" disabled={starting} onClick={start}>
                {starting ? "…" : t('lobby.start')} <Icon name="sparkle" size={16} />
              </button>
              {!isTeam && <p className="lobby__colors-note">{t('lobby.colorsNote')}</p>}
              <button onClick={dissolve} className="lobby__dissolve-btn">{t('lobby.dissolve')}</button>
            </>
          ) : (
            <button onClick={leave} className="lobby__leave-btn">{t('lobby.leave')}</button>
          )}
        </div>
      </div>
    </div>
  );
}
