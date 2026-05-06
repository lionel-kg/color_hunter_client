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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: 'var(--ch-paper)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Chasseurs</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ch-ink)' }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {participants.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'var(--ch-ivory)',
                borderRadius: 14,
              }}
            >
              <div className="ch-avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                {p.user.pseudo[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {p.user.pseudo}
                  {p.userId === meId && (
                    <span style={{ fontSize: 10, color: 'var(--ch-ink-mute)' }}>(toi)</span>
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
