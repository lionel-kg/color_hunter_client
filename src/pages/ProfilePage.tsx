import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { Icon } from "../components/Icon";
import { TabBar } from "../components/TabBar";
import { StatusChip } from "../components/StatusChip";
import { GridCard } from "../components/GridCard";
import { useDownload } from "../hooks/useDownload";
import type { Friendship, Grid, GridVisibility } from "../types/api";
import { SERVER_URL } from "../lib/config";

function gridImgUrl(url: string) {
  return url.startsWith("http") ? url : SERVER_URL + url;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { t, i18n } = useTranslation();
  const [grids, setGrids] = useState<Grid[]>([]);
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { download, downloading } = useDownload();

  useEffect(() => {
    api.get<Grid[]>("/grids/me").then((r) => setGrids(r.data)).catch(() => {});
    api.get<Friendship[]>("/users/friends")
      .then((r) => setFriendCount(r.data.filter((f) => f.status === "ACCEPTED").length))
      .catch(() => {});
  }, []);

  async function toggleVisibility(grid: Grid) {
    const next: GridVisibility = grid.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setUpdatingId(grid.id);
    try {
      await api.patch(`/grids/${grid.id}/visibility`, { visibility: next });
      setGrids((prev) => prev.map((g) => (g.id === grid.id ? { ...g, visibility: next } : g)));
    } catch { } finally { setUpdatingId(null); }
  }

  if (!user) return null;

  const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
  const stats = [
    { v: "—", l: t('profile.photos'), to: null },
    { v: String(grids.length), l: t('profile.grids'), to: null },
    { v: friendCount !== null ? String(friendCount) : "—", l: t('profile.friends'), to: "/social" },
  ];

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 100 }}>
        <div className="profile__nav">
          <Link to="/" className="profile__nav-btn">
            <Icon name="arrowLeft" size={22} />
          </Link>
          <Link to="/settings" className="profile__nav-btn">
            <Icon name="settings" size={20} />
          </Link>
        </div>

        <div className="profile__header">
          <div className="profile__avatar-large">
            {user.pseudo[0].toUpperCase()}
          </div>
          <div className="ch-serif profile__username">{user.pseudo}</div>
          <div className="profile__handle">@{user.pseudo}{user.city ? ` · ${user.city}` : ""}</div>
          <div className="profile__chips">
            <span className="ch-pill">
              <Icon name={user.isProfilePrivate ? "lock" : "globe"} size={11} />
              {user.isProfilePrivate ? t('profile.privateProfile') : t('profile.publicProfile')}
            </span>
            <StatusChip status={user.status} demandStatus={user.demandStatus} />
          </div>
        </div>

        <div className="profile__stats">
          {stats.map((s, i) => {
            const inner = (
              <>
                <div className="ch-serif profile__stat-value">{s.v}</div>
                <div className="profile__stat-label">{s.l}</div>
              </>
            );
            return s.to ? (
              <Link key={i} to={s.to} className="ch-card profile__stat-card">{inner}</Link>
            ) : (
              <div key={i} className="ch-card profile__stat-card">{inner}</div>
            );
          })}
        </div>

        {grids.length > 0 && (
          <div className="profile__grids">
            <h3 className="ch-serif profile__grids-title">{t('profile.myGrids')}</h3>
            <div className="profile__grids-list">
              {grids.map((grid) => (
                <div key={grid.id} className="profile__grid-item">
                  <GridCard
                    grid={{ ...grid, imageUrl: gridImgUrl(grid.imageUrl), user: { id: user!.id, pseudo: user!.pseudo, avatarUrl: user?.avatarUrl } }}
                    currentUserId={user?.id}
                    ownerActions={
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() => toggleVisibility(grid)}
                          disabled={updatingId === grid.id}
                          className="ch-pill profile__visibility-btn"
                        >
                          <Icon name={grid.visibility === "PUBLIC" ? "globe" : "lock"} size={11} />
                          {grid.visibility === "PUBLIC" ? t('profile.public') : t('profile.private')}
                        </button>
                        <button
                          onClick={() => download(gridImgUrl(grid.imageUrl), "grille-color-hunt.jpg")}
                          disabled={downloading}
                          className="profile__download-btn"
                        >
                          <Icon name="download" size={16} />
                        </button>
                      </div>
                    }
                    metaInfo={
                      <span className="profile__meta-info">
                        {grid.game?.inviteCode ?? "—"} · {grid.game?.mode === "TEAM" ? t('profile.grids') : t('dashboard.solo')} ·{" "}
                        {new Date(grid.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
