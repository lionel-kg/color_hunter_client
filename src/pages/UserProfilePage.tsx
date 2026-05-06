import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { Icon } from "../components/Icon";
import { AddFriendButton } from "../components/AddFriendButton";
import { useDownload } from "../hooks/useDownload";
import type { Grid } from "../types/api";

import { SERVER_URL } from "../lib/config";
const SERVER = SERVER_URL;
function gridImgUrl(url: string) {
  return url.startsWith("http") ? url : SERVER + url;
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
  const { download, downloading } = useDownload();

  useEffect(() => {
    if (!userId) return;
    api
      .get<PublicProfile>(`/users/${userId}/profile`)
      .then((r) => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div style={{ padding: 32 }}>Chargement…</div>;
  if (!profile)
    return <div style={{ padding: 32 }}>Utilisateur introuvable.</div>;

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 40 }}>
        <header className="ch-topbar">
          <Link
            to="/social"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="arrowLeft" size={22} />
          </Link>
        </header>

        {/* Avatar + infos */}
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
            {profile.pseudo[0].toUpperCase()}
          </div>
          <div
            className="ch-serif"
            style={{ fontSize: 26, lineHeight: 1, margin: "0 0 4px" }}
          >
            {profile.pseudo}
          </div>
          <div style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>
            @{profile.pseudo}
            {profile.city ? ` · ${profile.city}` : ""}
          </div>

          <div style={{ marginTop: 12 }}>
            <AddFriendButton userId={profile.id} meId={me?.id} />
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            padding: "20px 20px 0",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
          }}
        >
          {[
            { v: String(profile.grids.length), l: "grilles" },
            { v: String(profile.friendCount), l: "amis" },
          ].map((s, i) => (
            <div
              key={i}
              className="ch-card"
              style={{ padding: 12, textAlign: "center" }}
            >
              <div className="ch-serif" style={{ fontSize: 22, lineHeight: 1 }}>
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
            </div>
          ))}
        </div>

        {/* Grilles */}
        {profile.grids.length > 0 ? (
          <div style={{ padding: "24px 20px 0" }}>
            <h3
              className="ch-serif"
              style={{
                fontSize: 22,
                margin: "0 0 12px",
                letterSpacing: "-0.01em",
              }}
            >
              Grilles de {profile.pseudo}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {profile.grids.map((grid) => (
                <div
                  key={grid.id}
                  className="ch-card"
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={gridImgUrl(grid.imageUrl)}
                      alt="Grille"
                      style={{ width: "100%", display: "block" }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 500 }}>
                          {grid.game?.inviteCode ?? "—"} ·{" "}
                          {grid.game?.mode === "TEAM" ? "Équipe" : "Solo"}
                        </div>
                        <div
                          style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}
                        >
                          {new Date(grid.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>

                      {grid.visibility === "PUBLIC" && (
                        <button
                          onClick={() =>
                            download(
                              gridImgUrl(grid.imageUrl),
                              `grille-${grid.id}.jpg`,
                            )
                          }
                          disabled={downloading}
                          style={{
                            background: "rgba(255,255,255,0.88)",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 10px",
                            cursor: downloading ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--ch-ink)",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
                          }}
                        >
                          <Icon name="download" size={15} />
                          Télécharger
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : profile.isProfilePrivate ? (
          <div style={{ padding: "24px 20px 0", textAlign: "center" }}>
            <div
              className="ch-card"
              style={{ padding: 24, fontSize: 13, color: "var(--ch-ink-mute)" }}
            >
              <Icon name="lock" size={20} />
              <br />
              Ce profil est privé.
            </div>
          </div>
        ) : (
          <div style={{ padding: "24px 20px 0", textAlign: "center" }}>
            <div
              className="ch-card"
              style={{ padding: 20, fontSize: 13, color: "var(--ch-ink-mute)" }}
            >
              Aucune grille pour l'instant.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
