import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Icon } from './Icon';
import type { Friendship } from '../types/api';

interface Props {
  userId: string;
  meId: string | undefined;
}

export function AddFriendButton({ userId, meId }: Props) {
  const [friendship, setFriendship] = useState<Friendship | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meId || userId === meId) return;
    api.get<Friendship | null>(`/users/friends/status/${userId}`)
      .then((r) => setFriendship(r.data))
      .catch(() => setFriendship(null));
  }, [userId, meId]);

  if (!meId || userId === meId) return null;
  if (friendship === undefined) return null; // chargement silencieux

  const onRequest = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<Friendship>(`/users/friends/request/${userId}`);
      setFriendship(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const onAccept = async () => {
    if (!friendship) return;
    setLoading(true);
    try {
      const { data } = await api.post<Friendship>(`/users/friends/accept/${friendship.id}`);
      setFriendship(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Déjà amis
  if (friendship?.status === 'ACCEPTED') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ch-sage-deep)', fontWeight: 600 }}>
        <Icon name="check" size={13} /> Ami
      </span>
    );
  }

  // Demande reçue de cet utilisateur → proposer d'accepter
  if (friendship?.status === 'PENDING' && friendship.senderId === userId) {
    return (
      <button
        onClick={onAccept}
        disabled={loading}
        style={btnStyle('var(--ch-clay)')}
      >
        <Icon name="check" size={13} /> Accepter
      </button>
    );
  }

  // Demande déjà envoyée par moi
  if (friendship?.status === 'PENDING' && friendship.senderId === meId) {
    return (
      <span style={{ fontSize: 11, color: 'var(--ch-ink-mute)', fontStyle: 'italic' }}>
        Demande envoyée
      </span>
    );
  }

  // Aucune relation — bouton d'ajout
  return (
    <button onClick={onRequest} disabled={loading} style={btnStyle()}>
      <Icon name="plus" size={13} /> Ajouter
    </button>
  );
}

function btnStyle(bg = 'var(--ch-cream-2)'): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    fontSize: 11,
    fontFamily: 'var(--ch-sans)',
    fontWeight: 600,
    background: bg,
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    color: 'var(--ch-ink)',
  };
}
