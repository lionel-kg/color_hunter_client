import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { Icon } from "../components/Icon";
import { TabBar } from "../components/TabBar";
import { StatusChip } from "../components/StatusChip";
import { useDownload } from "../hooks/useDownload";
import type { Friendship, Grid, GridVisibility } from "../types/api";

const SERVER = "http://lionelkg.com:4000";
function gridImgUrl(url: string) {
  return url.startsWith("http") ? url : SERVER + url;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { download, downloading } = useDownload();

  useEffect(() => {
    api
      .get<Grid[]>("/grids/me")
      .then((r) => setGrids(r.data))
      .catch(() => {});
    api
      .get<Friendship[]>("/users/friends")
      .then((r) =>
        setFriendCount(r.data.filter((f) => f.status === "ACCEPTED").length),
      )
      .catch(() => {});
  }, []);

  async function toggleVisibility(grid: Grid) {
    const next: GridVisibility =
      grid.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setUpdatingId(grid.id);
    try {
      await api.patch(`/grids/${grid.id}/visibility`, { visibility: next });
      setGrids((prev) =>
        prev.map((g) => (g.id === grid.id ? { ...g, visibility: next } : g)),
      );
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  }

  if (!user) return null;

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 100 }}>
        <header className="ch-topbar">
          <Link
            to="/"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="arrowLeft" size={22} />
          </Link>
          <Link
            to="/settings"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Icon name="settings" size={20} />
          </Link>
        </header>

        <div style={{ padding: "12px 24px 0", textAlign: "center" }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C99B7E, #94A186)",
              margin: "0 auto 14px",
              border: "3px solid var(--ch-ivory)",
              boxShadow: "var(--ch-shadow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--ch-serif)",
              fontSize: 36,
              color: "var(--ch-ivory)",
            }}
          >
            {user.pseudo[0].toUpperCase()}
          </div>
          <div
            className="ch-serif"
            style={{ fontSize: 26, lineHeight: 1, margin: "0 0 4px" }}
          >
            {user.pseudo}
          </div>
          <div style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>
            @{user.pseudo}
            {user.city ? ` · ${user.city}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            <span className="ch-pill">
              <Icon name={user.isProfilePrivate ? "lock" : "globe"} size={11} />
              {user.isProfilePrivate ? "Profil privé" : "Profil public"}
            </span>
            <StatusChip status={user.status} demandStatus={user.demandStatus} />
          </div>
        </div>

        <div
          style={{
            padding: "20px 20px 0",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {[
            { v: "—", l: "photos", to: null },
            { v: String(grids.length), l: "grilles", to: null },
            {
              v: friendCount !== null ? String(friendCount) : "—",
              l: "amis",
              to: "/social",
            },
          ].map((s, i) => {
            const inner = (
              <>
                <div
                  className="ch-serif"
                  style={{ fontSize: 22, lineHeight: 1 }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ch-ink-mute)",
                    marginTop: 4,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.l}
                </div>
              </>
            );
            return s.to ? (
              <Link
                key={i}
                to={s.to}
                className="ch-card"
                style={{
                  padding: 12,
                  textAlign: "center",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                {inner}
              </Link>
            ) : (
              <div
                key={i}
                className="ch-card"
                style={{ padding: 12, textAlign: "center" }}
              >
                {inner}
              </div>
            );
          })}
        </div>

        {grids.length > 0 && (
          <div style={{ padding: "24px 20px 0" }}>
            <h3
              className="ch-serif"
              style={{
                fontSize: 22,
                margin: "0 0 12px",
                letterSpacing: "-0.01em",
              }}
            >
              Mes grilles
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {grids.map((grid) => (
                <div
                  key={grid.id}
                  className="ch-card"
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  <img
                    src={gridImgUrl(grid.imageUrl)}
                    alt="Grille"
                    style={{ width: "100%", display: "block" }}
                  />
                  <div
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>
                        {grid.game?.inviteCode ?? "—"} ·{" "}
                        {grid.game?.mode === "TEAM" ? "Équipe" : "Solo"}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}
                      >
                        {new Date(grid.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <button
                        onClick={() => toggleVisibility(grid)}
                        disabled={updatingId === grid.id}
                        className="ch-pill"
                        style={{
                          cursor: "pointer",
                          border: "none",
                          background: "var(--ch-cream-2)",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon
                          name={grid.visibility === "PUBLIC" ? "globe" : "lock"}
                          size={11}
                        />
                        {grid.visibility === "PUBLIC" ? "Publique" : "Privée"}
                      </button>
                      <button
                        onClick={() =>
                          download(
                            gridImgUrl(grid.imageUrl),
                            "grille-color-hunt.jpg",
                          )
                        }
                        disabled={downloading}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--ch-ink-mute)",
                          display: "flex",
                          padding: 4,
                        }}
                      >
                        <Icon name="download" size={16} />
                      </button>
                    </div>
                  </div>
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
