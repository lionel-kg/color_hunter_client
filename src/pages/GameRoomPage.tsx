import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io as socketIO } from "socket.io-client";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { ColorWheel } from "../components/ColorWheel";
import { Icon } from "../components/Icon";
import { ParticipantsPanel } from "../components/ParticipantsPanel";
import type { Game, Grid, Photo } from "../types/api";
import { useCountdown } from "../hooks/useCountdown";
import { useDownload } from "../hooks/useDownload";

const SPIN_DURATION_MS = 2200;

export function GameRoomPage() {
  const { id } = useParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);
  const [game, setGame] = useState<Game | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [existingGrid, setExistingGrid] = useState<Grid | null>(null);
  const [gameGrids, setGameGrids] = useState<Grid[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const prevStatus = useRef<string | null>(null);

  const loadFinishedState = (gameId: string) => {
    api
      .get<Grid[]>(`/grids/game/${gameId}`)
      .then((r) => {
        setGameGrids(r.data);
        const mine = r.data.find((g) => g.userId === me?.id);
        if (mine) setExistingGrid(mine);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!id) return;
    api
      .get<Game>(`/games/${id}`)
      .then((r) => {
        setGame(r.data);
        if (r.data.status === "FINISHED") loadFinishedState(id);
        if (r.data.status === "RUNNING" && !revealed) {
          setRevealing(true);
          setTimeout(() => {
            setRevealing(false);
            setRevealed(true);
          }, SPIN_DURATION_MS);
        }
      })
      .catch(() => {});
    api
      .get<Photo[]>(`/photos/${id}`)
      .then((r) => setPhotos(r.data))
      .catch(() => {});
  }, [id]);

  // Trigger reveal when status transitions to RUNNING (e.g. via polling or socket)
  useEffect(() => {
    if (!game) return;
    if (
      prevStatus.current !== "RUNNING" &&
      game.status === "RUNNING" &&
      !revealed
    ) {
      setRevealing(true);
      setTimeout(() => {
        setRevealing(false);
        setRevealed(true);
      }, SPIN_DURATION_MS);
    }
    prevStatus.current = game.status;
  }, [game?.status]);

  const { download, downloading } = useDownload();
  const countdown = useCountdown(
    game?.status === "RUNNING" ? game.expiresAt : null,
  );

  // Recharge le jeu quand le compte à rebours local atteint 0
  useEffect(() => {
    if (!countdown.expired || !id || game?.status !== "RUNNING") return;
    api
      .get<Game>(`/games/${id}`)
      .then((r) => {
        setGame(r.data);
        if (r.data.status === "FINISHED") loadFinishedState(id);
      })
      .catch(() => {});
  }, [countdown.expired]);

  // Ecoute l'event server game:finished via Socket.io
  useEffect(() => {
    if (!id) return;
    const socket = socketIO("http://lionelkg.com:4000", {
      auth: { token: useAuthStore.getState().access },
    });
    socket.emit("game:join", { gameId: id });
    socket.on("game:finished", ({ gameId }: { gameId: string }) => {
      if (gameId !== id) return;
      api
        .get<Game>(`/games/${id}`)
        .then((r) => {
          setGame(r.data);
          loadFinishedState(id);
        })
        .catch(() => {});
    });
    socket.on("game:grid", ({ gameId }: { gameId: string }) => {
      if (gameId !== id) return;
      loadFinishedState(id);
    });
    return () => {
      socket.emit("game:leave", { gameId: id });
      socket.disconnect();
    };
  }, [id]);

  if (!game) return <div style={{ padding: 32 }}>Chargement…</div>;

  const myParticipant = game.participants?.find((p) => p.userId === me?.id);
  const myColor = myParticipant?.team
    ? {
        hex: myParticipant.team.assignedColorHex,
        name: myParticipant.team.assignedColorName,
      }
    : {
        hex: myParticipant?.colorHex ?? "#C99B7E",
        name: myParticipant?.colorName ?? "Couleur",
      };

  const isHost = game.creatorId === me?.id;

  const onEnd = async () => {
    if (!confirm("Terminer la partie maintenant ?")) return;
    setEnding(true);
    try {
      await api.post(`/games/${game.id}/end`);
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Erreur");
      setEnding(false);
    }
  };

  const onDelete = async (photo: Photo) => {
    setDeleting(photo.id);
    try {
      await api.delete(`/photos/${photo.id}`);
      setPhotos((p) => p.filter((x) => x.id !== photo.id));
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Suppression échouée");
    } finally {
      setDeleting(null);
    }
  };

  function photoQuota(g: Game): number {
    if (g.mode === "SOLO") return 9;
    if (g.teamSize === 3) return 3;
    return 4;
  }

  const quota = game ? photoQuota(game) : 9;
  const slots = Math.max(0, quota - photos.length);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    const toUpload = selected.slice(0, slots);
    setUploading(true);
    try {
      const fd = new FormData();
      toUpload.forEach((f) => fd.append("photos", f));
      const { data } = await api.post<Photo[]>(`/photos/${game.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotos((p) => [...data, ...p]);
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Upload échoué");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div
      className="ch-screen ch-app ch-tinted"
      style={{ minHeight: "100vh", ["--accent" as any]: myColor.hex }}
    >
      {/* Reveal overlay — spins the wheel then fades out */}
      {revealing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "var(--ch-cream)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            animation: `ch-fade-out 0.4s ease ${SPIN_DURATION_MS - 400}ms both`,
          }}
        >
          <div className="ch-eyebrow" style={{ letterSpacing: "0.12em" }}>
            TA COULEUR
          </div>
          <ColorWheel
            size={240}
            hex={myColor.hex}
            label={myColor.name}
            spinning
            colorPalettes={game.colorPalettes}
          />
          <div
            className="ch-serif"
            style={{ fontSize: 14, color: "var(--ch-ink-mute)" }}
          >
            La chasse commence…
          </div>
        </div>
      )}

      <div className="ch-scroll" style={{ paddingBottom: 110 }}>
        <header className="ch-topbar">
          <Link
            to="/"
            style={{
              background: "var(--ch-ivory)",
              border: "1px solid var(--ch-line)",
              borderRadius: 999,
              padding: 8,
              cursor: "pointer",
            }}
          >
            <Icon name="arrowLeft" size={16} />
          </Link>
          <button
            onClick={() => setShowParticipants(true)}
            style={{
              background: "var(--ch-ivory)",
              border: "1px solid var(--ch-line)",
              borderRadius: 999,
              padding: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon name="users" size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="ch-pill">
              {game.status === "RUNNING" ? "● En direct" : game.status}
            </span>
            {game.status === "RUNNING" && game.expiresAt && (
              <span
                className="ch-mono"
                style={{
                  fontSize: 12,
                  color: countdown.urgent
                    ? "var(--ch-danger)"
                    : "var(--ch-ink-mute)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ⏱ {countdown.label}
              </span>
            )}
            {game.status === "RUNNING" && isHost && (
              <button
                onClick={onEnd}
                disabled={ending}
                style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  fontFamily: "var(--ch-sans)",
                  fontWeight: 600,
                  background: "var(--ch-danger, #e05a5a)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  opacity: ending ? 0.6 : 1,
                }}
              >
                {ending ? "…" : "Terminer"}
              </button>
            )}
          </div>
        </header>

        <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
          <div className="ch-eyebrow" style={{ marginBottom: 8 }}>
            TA COULEUR
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <ColorWheel
              size={200}
              hex={myColor.hex}
              label={myColor.name}
              colorPalettes={game.colorPalettes}
            />
          </div>
          <div className="ch-pill" style={{ fontFamily: "var(--ch-mono)" }}>
            {myColor.hex.toUpperCase()}
          </div>
        </div>

        {/* ── Moisson — masquée quand la partie est terminée ── */}
        {game.status !== "FINISHED" && (
          <div style={{ padding: "20px 20px 0" }}>
            <div className="ch-card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Ta moisson
                </span>
                <span
                  className="ch-mono"
                  style={{ fontSize: 12, color: "var(--ch-ink-soft)" }}
                >
                  {photos.length} / {quota}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 6,
                }}
              >
                {Array.from({ length: quota }).map((_, i) => {
                  const photo = photos[i];
                  return photo ? (
                    <div key={photo.id} style={{ position: "relative" }}>
                      <img
                        src={"http://lionelkg.com:4000" + photo.cloudinaryUrl}
                        alt=""
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                          borderRadius: 8,
                          display: "block",
                        }}
                      />
                      <button
                        onClick={() => onDelete(photo)}
                        disabled={deleting === photo.id}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: "none",
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      key={i}
                      style={{
                        aspectRatio: 1,
                        borderRadius: 8,
                        border: "1.5px dashed var(--ch-line-2)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Résultats — visible quand la partie est terminée ── */}
        {game.status === "FINISHED" && (
          <div style={{ padding: "20px 20px 0" }}>
            {/* CTA si l'utilisateur n'a pas encore composé sa grille */}
            {!existingGrid && (
              <div
                style={{
                  borderRadius: 18,
                  padding: "24px 18px",
                  marginBottom: 16,
                  background:
                    "linear-gradient(135deg, #C99B7E 0%, #A8755A 100%)",
                  color: "var(--ch-ivory)",
                  textAlign: "center",
                }}
              >
                <div
                  className="ch-serif"
                  style={{ fontSize: 22, marginBottom: 6 }}
                >
                  La chasse est terminée
                </div>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16 }}>
                  Compose ta grille et sauvegarde-la sur ton profil.
                </div>
                <Link
                  to={`/games/${id}/grid`}
                  style={{
                    display: "inline-block",
                    background: "var(--ch-ivory)",
                    color: "var(--ch-clay-deep)",
                    borderRadius: 999,
                    padding: "10px 24px",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Composer ma grille →
                </Link>
              </div>
            )}

            {/* Grilles de tous les participants */}
            {gameGrids.length > 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {gameGrids.map((grid) => {
                  const gridUrl = grid.imageUrl.startsWith("http")
                    ? grid.imageUrl
                    : "http://lionelkg.com:4000" + grid.imageUrl;
                  return (
                    <div
                      key={grid.id}
                      className="ch-card"
                      style={{ padding: 14 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          className="ch-avatar"
                          style={{ width: 28, height: 28, fontSize: 11 }}
                        >
                          {grid.user?.pseudo[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {grid.user?.pseudo}
                          {grid.userId === me?.id && " (toi)"}
                        </span>
                      </div>
                      <img
                        src={gridUrl}
                        alt={`Grille de ${grid.user?.pseudo}`}
                        style={{
                          width: "100%",
                          borderRadius: 10,
                          display: "block",
                          marginBottom: 10,
                        }}
                      />
                      <button
                        className="ch-btn"
                        disabled={downloading}
                        onClick={() =>
                          download(
                            gridUrl,
                            `grille-${grid.user?.pseudo ?? "joueur"}-color-hunt.jpg`,
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "10px 0",
                          fontSize: 13,
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="download" size={14} />{" "}
                        {downloading ? "Téléchargement…" : "Télécharger"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {game.status === "RUNNING" && (
          <div style={{ padding: "14px 20px 0" }}>
            <div
              style={{
                borderRadius: 18,
                padding: "24px 18px",
                background: "var(--ch-ivory)",
                border: "2px dashed var(--ch-clay)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--ch-cream-2)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Icon name="camera" size={22} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                Capture ou dépose
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ch-ink-mute)",
                  marginTop: 4,
                }}
              >
                Les EXIF sont vérifiés automatiquement
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                onChange={onUpload}
                style={{ display: "none" }}
              />
              <button
                className="ch-btn"
                disabled={uploading || slots === 0}
                onClick={() => fileInput.current?.click()}
                style={{ marginTop: 14, padding: "10px 16px", fontSize: 13 }}
              >
                <Icon name="upload" size={14} />{" "}
                {uploading
                  ? "Envoi…"
                  : slots === 0
                    ? "Quota atteint"
                    : `Importer${slots > 1 ? ` (${slots} restantes)` : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {showParticipants && (
        <ParticipantsPanel
          participants={game.participants ?? []}
          meId={me?.id}
          creatorId={game.creatorId}
          onClose={() => setShowParticipants(false)}
        />
      )}
    </div>
  );
}
