import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io as socketIO, Socket } from 'socket.io-client';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { Icon } from '../components/Icon';
import { SERVER_URL } from '../lib/config';
import type { DirectMessage } from '../types/api';

interface FriendInfo { id: string; pseudo: string; }

export function ChatPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const me = useAuthStore(s => s.user);
  const clearUnread = useNotificationsStore(s => s.clearUnread);
  const [friend, setFriend] = useState<FriendInfo | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!friendId) return;
    api.get<{ id: string; pseudo: string }>(`/users/${friendId}/profile`)
      .then(r => setFriend({ id: r.data.id, pseudo: r.data.pseudo }))
      .catch(() => {});
    api.get<DirectMessage[]>(`/messages/${friendId}`)
      .then(r => setMessages(r.data))
      .catch(() => {});
    clearUnread(friendId);
  }, [friendId]);

  useEffect(() => {
    const socket = socketIO(SERVER_URL, { auth: { token: useAuthStore.getState().access } });
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';

  return (
    <div className="ch-screen ch-app chat-page">
      <header className="ch-topbar chat-page__header">
        <Link to="/social" className="chat-page__back-btn">
          <Icon name="arrowLeft" size={22} />
        </Link>
        <div className="chat-page__friend-info">
          <div className="ch-avatar chat-page__friend-avatar">
            {friend?.pseudo[0]?.toUpperCase()}
          </div>
          <span className="chat-page__friend-name">{friend?.pseudo ?? '…'}</span>
        </div>
        <div />
      </header>

      <div className="chat-page__messages">
        {messages.length === 0 && (
          <div className="chat-page__empty-state">
            {t('chat.startConversation', { pseudo: friend?.pseudo })}
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === me?.id;
          return (
            <div key={msg.id} className={`chat-page__message-row chat-page__message-row--${isMe ? 'mine' : 'theirs'}`}>
              <div className={`chat-page__bubble chat-page__bubble--${isMe ? 'mine' : 'theirs'}`}>
                {msg.text}
                <div className="chat-page__bubble-time">
                  {new Date(msg.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-page__input-bar">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('chat.messagePlaceholder')}
          rows={1}
          className="chat-page__textarea"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className={`chat-page__send-btn chat-page__send-btn--${text.trim() ? 'active' : 'disabled'}`}
        >
          <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  );
}
