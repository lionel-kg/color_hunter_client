import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io as socketIO, Socket } from 'socket.io-client';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { Icon } from '../components/Icon';
import { SERVER_URL } from '../lib/config';
import type { DirectMessage } from '../types/api';

interface FriendInfo { id: string; pseudo: string; }

export function ChatPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const me = useAuthStore(s => s.user);
  const [friend, setFriend] = useState<FriendInfo | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Charger profil ami + historique
  useEffect(() => {
    if (!friendId) return;
    api.get<{ id: string; pseudo: string }>(`/users/${friendId}/profile`)
      .then(r => setFriend({ id: r.data.id, pseudo: r.data.pseudo }))
      .catch(() => {});
    api.get<DirectMessage[]>(`/messages/${friendId}`)
      .then(r => setMessages(r.data))
      .catch(() => {});
  }, [friendId]);

  // Socket
  useEffect(() => {
    const socket = socketIO(SERVER_URL, {
      auth: { token: useAuthStore.getState().access },
    });
    socketRef.current = socket;
    socket.on('dm:message', (msg: DirectMessage) => {
      if (
        (msg.senderId === friendId && msg.receiverId === me?.id) ||
        (msg.senderId === me?.id && msg.receiverId === friendId)
      ) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return () => { socket.disconnect(); };
  }, [friendId, me?.id]);

  // Scroll en bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed || !friendId) return;
    socketRef.current?.emit('dm:send', { receiverId: friendId, text: trimmed });
    setText('');
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="ch-screen ch-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="ch-topbar" style={{ flexShrink: 0 }}>
        <Link to="/social" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="arrowLeft" size={22} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ch-avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
            {friend?.pseudo[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{friend?.pseudo ?? '…'}</span>
        </div>
        <div />
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ch-ink-mute)', fontSize: 13, marginTop: 40 }}>
            Début de la conversation avec {friend?.pseudo}
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === me?.id;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '8px 12px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? 'var(--ch-ink)' : 'var(--ch-cream-2)',
                color: isMe ? 'var(--ch-ivory)' : 'var(--ch-ink)',
                fontSize: 14,
                lineHeight: 1.45,
                wordBreak: 'break-word',
              }}>
                {msg.text}
                <div style={{
                  fontSize: 10,
                  marginTop: 4,
                  opacity: 0.55,
                  textAlign: 'right',
                }}>
                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0,
        padding: '10px 12px',
        borderTop: '1px solid var(--ch-line)',
        background: 'var(--ch-ivory)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message…"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            border: '1.5px solid var(--ch-line)',
            borderRadius: 12,
            padding: '9px 12px',
            fontSize: 14,
            fontFamily: 'var(--ch-sans)',
            background: 'var(--ch-cream-2)',
            color: 'var(--ch-ink)',
            outline: 'none',
            lineHeight: 1.4,
            maxHeight: 120,
            overflowY: 'auto',
          }}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          style={{
            width: 40, height: 40,
            borderRadius: 12,
            border: 'none',
            background: text.trim() ? 'var(--ch-ink)' : 'var(--ch-line)',
            color: 'var(--ch-ivory)',
            cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  );
}
