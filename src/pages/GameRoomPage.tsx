import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io as socketIO } from "socket.io-client";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { SERVER_URL } from "../lib/config";
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

  useEffect(() => {
    if (!id) return;
    const socket = socketIO(SERVER_URL, {
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
      {revealing && (
        <div
          className="game-room__reveal-overlay"
          style={{ animation: `ch-fade-out 0.4s ease ${SPIN_DURATION_MS - 400}ms both` }}
        >
          <div className="ch-eyebrow game-room__reveal-label">TA COULEUR</div>
          <ColorWheel
            size={240}
            hex={myColor.hex}
            label={myColor.name}
            spinning
            colorPalettes={game.colorPalettes}
          />
          <div className="ch-serif game-room__reveal-sub">La chasse commence…</div>
        </div>
      )}

      <div className="ch-scroll" style={{ paddingBottom: 110 }}>
        <header className="ch-topbar">
          <Link to="/" className="game-room__topbar-back">
            <Icon name="arrowLeft" size={16} />
          </Link>
          <button
            onClick={() => setShowParticipants(true)}
            className="game-room__topbar-participants"
          >
            <Icon name="users" size={16} />
          </button>
          <div className="game-room__topbar-right">
            <span className="ch-pill">
              {game.status === "RUNNING" ? "● En direct" : game.status}
            </span>
            {game.status === "RUNNING" && game.expiresAt && (
              <span className={`ch-mono game-room__countdown game-room__countdown--${countdown.urgent ? "urgent" : "mute"}`}>
                ⏱ {countdown.label}
              </span>
            )}
            {game.status === "RUNNING" && isHost && (
              <button
                onClick={onEnd}
                disabled={ending}
                className={`game-room__end-btn${ending ? " game-room__end-btn--loading" : ""}`}
              >
                {ending ? "…" : "Terminer"}
              </button>
            )}
          </div>
        </header>

        <div className="game-room__color-section">
          <div className="ch-eyebrow" style={{ marginBottom: 8 }}>TA COULEUR</div>
          <div className="game-room__color-wheel">
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

        {game.status !== "FINISHED" && (
          <div className="game-room__harvest">
            <div className="ch-card game-room__harvest-card">
              <div className="game-room__harvest-header">
                <span className="game-room__harvest-title">Ta moisson</span>
                <span className="ch-mono game-room__harvest-count">
                  {photos.length} / {quota}
                </span>
              </div>
              <div className="game-room__harvest-grid">
                {Array.from({ length: quota }).map((_, i) => {
                  const photo = photos[i];
                  return photo ? (
                    <div key={photo.id} className="game-room__harvest-photo">
                      <img
                        src={SERVER_URL + photo.cloudinaryUrl}
                        alt=""
                        className="game-room__harvest-img"
                      />
                      <button
                        onClick={() => onDelete(photo)}
                        disabled={deleting === photo.id}
                        className="game-room__harvest-delete"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ) : (
                    <div key={i} className="game-room__harvest-empty-slot" />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {game.status === "FINISHED" && (
          <div className="game-room__results">
            {!existingGrid && (
              <div className="game-room__results-cta">
                <div className="ch-serif game-room__results-cta-title">La chasse est terminée</div>
                <div className="game-room__results-cta-sub">
                  Compose ta grille et sauvegarde-la sur ton profil.
                </div>
                <Link to={`/games/${id}/grid`} className="game-room__results-cta-link">
                  Composer ma grille →
                </Link>
              </div>
            )}

            {gameGrids.length > 0 && (
              <div className="game-room__grids-list">
                {gameGrids.map((grid) => {
                  const gridUrl = grid.imageUrl.startsWith("http")
                    ? grid.imageUrl
                    : SERVER_URL + grid.imageUrl;
                  return (
                    <div key={grid.id} className="ch-card game-room__grid-result">
                      <div className="game-room__grid-result-header">
                        <div className="ch-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {grid.user?.pseudo[0]?.toUpperCase()}
                        </div>
                        <span className="game-room__grid-result-pseudo">
                          {grid.user?.pseudo}
                          {grid.userId === me?.id && " (toi)"}
                        </span>
                      </div>
                      <img
                        src={gridUrl}
                        alt={`Grille de ${grid.user?.pseudo}`}
                        className="game-room__grid-result-img"
                      />
                      <button
                        className="ch-btn game-room__download-btn"
                        disabled={downloading}
                        onClick={() =>
                          download(
                            gridUrl,
                            `grille-${grid.user?.pseudo ?? "joueur"}-color-hunt.jpg`,
                          )
                        }
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
          <div className="game-room__upload-cta">
            <div className="game-room__upload-card">
              <div className="game-room__upload-icon">
                <Icon name="camera" size={22} />
              </div>
              <div className="game-room__upload-title">Capture ou dépose</div>
              <div className="game-room__upload-sub">
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
                className="ch-btn game-room__upload-btn"
                disabled={uploading || slots === 0}
                onClick={() => fileInput.current?.click()}
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
