import { Icon } from './Icon';
import { AddFriendButton } from './AddFriendButton';
import type { GameParticipant } from '../types/api';

interface Props {
  participants: GameParticipant[];
  meId: string | undefined;
  creatorId: string;
  onClose: () => void;
}

export function ParticipantsPanel({ participants, meId, creatorId, onClose }: Props) {
  return (
    <>
      <div onClick={onClose} className="participants-panel__backdrop" />

      <div className="participants-panel__sheet">
        <div className="participants-panel__header">
          <span className="participants-panel__title">Chasseurs</span>
          <button onClick={onClose} className="participants-panel__close-btn">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="participants-panel__list">
          {participants.map((p) => (
            <div key={p.id} className="participants-panel__row">
              <div className="ch-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                {p.user.pseudo[0]?.toUpperCase()}
              </div>
              <div className="participants-panel__row-info">
                <div className="participants-panel__row-name">
                  {p.user.pseudo}
                  {p.userId === meId && (
                    <span className="participants-panel__you-label">(toi)</span>
                  )}
                  {p.userId === creatorId && (
                    <span className="ch-pill" style={{ fontSize: 9, padding: '2px 6px' }}>HÔTE</span>
                  )}
                </div>
              </div>
              <AddFriendButton userId={p.userId} meId={meId} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
