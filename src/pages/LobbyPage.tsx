import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { Icon } from '../components/Icon';
import { AddFriendButton } from '../components/AddFriendButton';
import type { Game } from '../types/api';

export function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const me = useAuthStore(s => s.user);
  const [game, setGame] = useState<Game | null>(null);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = () => api.get<Game>(`/games/${id}`).then(r => { if (!cancelled) setGame(r.data); }).catch(() => {});
    load();
    const t = setInterval(load, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [id]);

  // Navigation temps réel quand la partie démarre
  useEffect(() => {
    if (!id) return;
    const socket = socketIO('http://localhost:4000', { auth: { token: useAuthStore.getState().access } });
    socket.emit('game:join', { gameId: id });
    socket.on('game:started', () => navigate(`/games/${id}`));
    return () => {
      socket.emit('game:leave', { gameId: id });
      socket.disconnect();
    };
  }, [id]);

  if (!game) return <div style={{ padding: 32 }}>Chargement…</div>;

  const start = async () => {
    setStarting(true);
    try {
      await api.post(`/games/${game.id}/start`);
      navigate(`/games/${game.id}`);
    } finally {
      setStarting(false);
    }
  };

  const isHost = game.creatorId === me?.id;

  const copyCode = () => {
    navigator.clipboard.writeText(game.inviteCode).catch(() => {});
  };

  return (
    <div className="ch-screen ch-app" style={{ minHeight: '100vh' }}>
      <div className="ch-scroll" style={{ paddingBottom: 30 }}>
        <header className="ch-topbar">
          <Link to="/" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ch-ink)' }}><Icon name="x" size={22} /></Link>
          <span className="ch-pill">Salon</span>
        </header>

        <div style={{ padding: '20px 24px 0', textAlign: 'center' }}>
          <div className="ch-eyebrow" style={{ marginBottom: 10 }}>SALON</div>
          <h1 className="ch-serif" style={{ fontSize: 32, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>
            On attend les <em>chasseurs</em>…
          </h1>
        </div>

        <div style={{ padding: '24px 20px 0' }}>
          <div className="ch-card" style={{ padding: 24, textAlign: 'center', background: 'var(--ch-paper)' }}>
            <div className="ch-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>CODE D'INVITATION</div>
            <div className="ch-serif" style={{ fontSize: 56, letterSpacing: '0.04em', lineHeight: 1, margin: '4px 0' }}>{game.inviteCode}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={copyCode} style={{ padding: '8px 14px', background: 'var(--ch-cream-2)', border: 'none', borderRadius: 999, fontSize: 12, fontFamily: 'var(--ch-sans)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="copy" size={14} /> Copier
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>Chasseurs présents</h3>
            <span style={{ fontSize: 12, color: 'var(--ch-ink-mute)' }}>{game.participants?.length ?? 0} / {game.maxPlayers}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {game.participants?.map(p => (
              <div key={p.id} className="ch-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ch-avatar" style={{ width: 36, height: 36 }}>{p.user.pseudo[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {p.user.pseudo}{p.userId === me?.id && ' (toi)'}
                    {p.userId === game.creatorId && <span className="ch-pill" style={{ fontSize: 9, padding: '2px 6px' }}>HÔTE</span>}
                  </div>
                </div>
                <AddFriendButton userId={p.userId} meId={me?.id} />
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div style={{ padding: '20px 20px 8px' }}>
            <button className="ch-btn" disabled={starting} onClick={start} style={{ width: '100%', padding: 16 }}>
              {starting ? '…' : 'Démarrer la chasse'} <Icon name="sparkle" size={16} />
            </button>
            <p style={{ fontSize: 11, color: 'var(--ch-ink-mute)', textAlign: 'center', marginTop: 10 }}>
              Les couleurs seront tirées au lancement
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
