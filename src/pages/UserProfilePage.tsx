import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { Icon } from "../components/Icon";
import { AddFriendButton } from "../components/AddFriendButton";
import { GridCard } from "../components/GridCard";
import type { Grid } from "../types/api";
import { SERVER_URL } from "../lib/config";

function gridImgUrl(url: string) {
  return url.startsWith("http") ? url : SERVER_URL + url;
}

interface PublicProfile {
  id: string;
  pseudo: string;
  avatarUrl: string | null;
  city: string | null;
  isProfilePrivate: boolean;
  createdAt: string;
  friendCount: number;
  grids: Grid[];
}

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const me = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api.get<PublicProfile>(`/users/${userId}/profile`)
      .then((r) => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div style={{ padding: 32 }}>Chargement…</div>;
  if (!profile) return <div style={{ padding: 32 }}>Utilisateur introuvable.</div>;

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 40 }}>
        <div className="profile__nav">
          <Link to="/social" className="profile__nav-btn">
            <Icon name="arrowLeft" size={22} />
          </Link>
        </div>

        <div className="profile__header">
          <div className="profile__avatar-large">
            {profile.pseudo[0].toUpperCase()}
          </div>
          <div className="ch-serif profile__username">{profile.pseudo}</div>
          <div className="profile__handle">
            @{profile.pseudo}{profile.city ? ` · ${profile.city}` : ""}
          </div>
          <div className="profile__add-friend">
            <AddFriendButton userId={profile.id} meId={me?.id} />
          </div>
        </div>

        <div className="profile__stats profile__stats--2col">
          {[
            { v: String(profile.grids.length), l: "grilles" },
            { v: String(profile.friendCount), l: "amis" },
          ].map((s, i) => (
            <div key={i} className="ch-card profile__stat-card">
              <div className="ch-serif profile__stat-value">{s.v}</div>
              <div className="profile__stat-label">{s.l}</div>
            </div>
          ))}
        </div>

        {profile.grids.length > 0 ? (
          <div className="profile__grids">
            <h3 className="ch-serif profile__grids-title">Grilles de {profile.pseudo}</h3>
            <div className="profile__grids-list">
              {profile.grids.map((grid) => (
                <GridCard
                  key={grid.id}
                  grid={{ ...grid, imageUrl: gridImgUrl(grid.imageUrl), user: { id: profile.id, pseudo: profile.pseudo, avatarUrl: profile.avatarUrl } }}
                  currentUserId={me?.id}
                />
              ))}
            </div>
          </div>
        ) : profile.isProfilePrivate ? (
          <div className="profile__private-notice">
            <div className="ch-card profile__private-card">
              <Icon name="lock" size={20} /><br />
              Ce profil est privé.
            </div>
          </div>
        ) : (
          <div className="profile__private-notice">
            <div className="ch-card profile__empty-card">
              Aucune grille pour l'instant.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
