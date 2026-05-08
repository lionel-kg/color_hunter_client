import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from './stores/auth';
import { useNotificationsStore } from './stores/notifications';
import { SERVER_URL } from './lib/config';
import type { Notification } from './types/api';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateGamePage } from './pages/CreateGamePage';
import { LobbyPage } from './pages/LobbyPage';
import { GameRoomPage } from './pages/GameRoomPage';
import { GridBuilderPage } from './pages/GridBuilderPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SocialPage } from './pages/SocialPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ChatPage } from './pages/ChatPage';
import { FeedPage } from './pages/FeedPage';
import { AppShell } from './components/AppShell';

function Protected({ children }: { children: React.ReactNode }) {
  const access = useAuthStore(s => s.access);
  if (!access) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

// Singleton socket partagé dans l'app
let globalSocket: ReturnType<typeof io> | null = null;

function useGlobalSocket() {
  const access = useAuthStore(s => s.access);
  const { addNotification, addUnread, load } = useNotificationsStore();

  useEffect(() => {
    if (!access) {
      globalSocket?.disconnect();
      globalSocket = null;
      return;
    }

    globalSocket = io(SERVER_URL, { auth: { token: access }, transports: ['websocket'] });

    globalSocket.on('notification:new', (notif: Notification) => {
      addNotification(notif);
    });

    globalSocket.on('dm:message', (msg) => {
      addUnread(msg);
    });

    globalSocket.on('friend:request', () => {
      load();
    });

    return () => {
      globalSocket?.disconnect();
      globalSocket = null;
    };
  }, [access]);
}

export function getSocket() {
  return globalSocket;
}

export function App() {
  useGlobalSocket();

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      {/* Pages avec topbar globale (cloche + avatar) */}
      <Route path="/" element={<Protected><AppShell><DashboardPage /></AppShell></Protected>} />
      <Route path="/games/new" element={<Protected><AppShell><CreateGamePage /></AppShell></Protected>} />
      <Route path="/feed" element={<Protected><AppShell><FeedPage /></AppShell></Protected>} />
      <Route path="/social" element={<Protected><AppShell><SocialPage /></AppShell></Protected>} />
      <Route path="/profile" element={<Protected><AppShell><ProfilePage /></AppShell></Protected>} />
      <Route path="/settings" element={<Protected><AppShell><SettingsPage /></AppShell></Protected>} />
      <Route path="/users/:userId" element={<Protected><AppShell><UserProfilePage /></AppShell></Protected>} />
      {/* Pages avec header contextuel propre */}
      <Route path="/games/:id/lobby" element={<Protected><LobbyPage /></Protected>} />
      <Route path="/games/:id/grid" element={<Protected><GridBuilderPage /></Protected>} />
      <Route path="/games/:id" element={<Protected><GameRoomPage /></Protected>} />
      <Route path="/chat/:friendId" element={<Protected><ChatPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
