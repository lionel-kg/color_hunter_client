export type UserStatus = 'ACTIVE' | 'DEPART' | 'DESACTIVATE' | 'SUPPRIME';
export type DemandStatus = 'NONE' | 'EN_COURS' | 'VALIDEE';

export interface User {
  id: string;
  pseudo: string;
  email: string;
  status: UserStatus;
  demandStatus: DemandStatus;
  isProfilePrivate?: boolean;
  city?: string | null;
  avatarUrl?: string | null;
}

export type GameMode = 'SOLO' | 'TEAM';
export type GameVisibility = 'PUBLIC' | 'PRIVATE';
export type GameStatus = 'LOBBY' | 'RUNNING' | 'FINISHED' | 'CANCELLED';
export type ColorPalette = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';

export interface Game {
  id: string;
  inviteCode: string;
  creatorId: string;
  mode: GameMode;
  teamSize: number;
  numTeams: number;
  maxPlayers: number;
  durationMin: number;
  visibility: GameVisibility;
  status: GameStatus;
  colorPalettes: ColorPalette[];
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  participants?: GameParticipant[];
  teams?: Team[];
  _count?: { photos: number };
}

export interface GameParticipant {
  id: string;
  userId: string;
  teamId: string | null;
  colorHex: string | null;
  colorName: string | null;
  user: { id: string; pseudo: string; avatarUrl?: string | null };
  team?: Team | null;
}

export interface Team {
  id: string;
  gameId: string;
  name: string;
  assignedColorHex: string;
  assignedColorName: string;
}

export type GridVisibility = 'PUBLIC' | 'PRIVATE';

export interface GridPhoto {
  id: string;
  photoId: string;
  gridPosition: number;
  photo: Photo;
}

export interface Grid {
  id: string;
  gameId: string;
  userId: string;
  imageUrl: string;
  visibility: GridVisibility;
  createdAt: string;
  photos: GridPhoto[];
  game?: { inviteCode: string; mode: GameMode };
  user?: { id: string; pseudo: string; avatarUrl?: string | null };
}

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: string;
  sender?: { id: string; pseudo: string; avatarUrl?: string | null };
  receiver?: { id: string; pseudo: string; avatarUrl?: string | null };
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
  sender?: { id: string; pseudo: string };
}

export interface GridLike {
  id: string;
  gridId: string;
  userId: string;
  createdAt: string;
}

export interface GridComment {
  id: string;
  gridId: string;
  userId: string;
  text: string;
  createdAt: string;
  user: { id: string; pseudo: string; avatarUrl?: string | null };
}

export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'GRID_LIKE'
  | 'GRID_COMMENT'
  | 'GAME_STARTED'
  | 'DM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
  actor?: { id: string; pseudo: string; avatarUrl?: string | null } | null;
}

export interface Photo {
  id: string;
  userId: string;
  gameId: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  takenAt: string | null;
  isSelectedForGrid: boolean;
  gridPosition: number | null;
  createdAt: string;
}
