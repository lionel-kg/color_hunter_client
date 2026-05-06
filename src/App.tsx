import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
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

function Protected({ children }: { children: React.ReactNode }) {
  const access = useAuthStore(s => s.access);
  if (!access) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/games/new" element={<Protected><CreateGamePage /></Protected>} />
      <Route path="/games/:id/lobby" element={<Protected><LobbyPage /></Protected>} />
      <Route path="/games/:id/grid" element={<Protected><GridBuilderPage /></Protected>} />
      <Route path="/games/:id" element={<Protected><GameRoomPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
      <Route path="/social" element={<Protected><SocialPage /></Protected>} />
      <Route path="/users/:userId" element={<Protected><UserProfilePage /></Protected>} />
      <Route path="/chat/:friendId" element={<Protected><ChatPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
