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
  if (friendship === undefined) return null;

  const onRequest = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<Friendship>(`/users/friends/request/${userId}`);
      setFriendship(data);
    } catch {
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
    } finally {
      setLoading(false);
    }
  };

  if (friendship?.status === 'ACCEPTED') {
    return (
      <span className="add-friend-btn__already-friends">
        <Icon name="check" size={13} /> Ami
      </span>
    );
  }

  if (friendship?.status === 'PENDING' && friendship.senderId === userId) {
    return (
      <button onClick={onAccept} disabled={loading} className="add-friend-btn add-friend-btn--clay">
        <Icon name="check" size={13} /> Accepter
      </button>
    );
  }

  if (friendship?.status === 'PENDING' && friendship.senderId === meId) {
    return (
      <span className="add-friend-btn__pending">Demande envoyée</span>
    );
  }

  return (
    <button onClick={onRequest} disabled={loading} className="add-friend-btn">
      <Icon name="plus" size={13} /> Ajouter
    </button>
  );
}
