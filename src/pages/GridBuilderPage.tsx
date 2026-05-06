import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Icon } from "../components/Icon";
import { useDownload } from "../hooks/useDownload";
import type { Game, Grid, GridVisibility, Photo } from "../types/api";

import { SERVER_URL } from "../lib/config";
const SERVER = SERVER_URL;

function photoUrl(p: Photo) {
  return p.cloudinaryUrl.startsWith("http")
    ? p.cloudinaryUrl
    : SERVER + p.cloudinaryUrl;
}

type Step = "build" | "visibility" | "done";

export function GridBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [slots, setSlots] = useState<(Photo | null)[]>(Array(9).fill(null));
  const [visibility, setVisibility] = useState<GridVisibility>("PRIVATE");
  const [step, setStep] = useState<Step>("build");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const { download, downloading } = useDownload();

  // drag state (desktop)
  const dragSource = useRef<
    { kind: "pool"; photo: Photo } | { kind: "slot"; index: number } | null
  >(null);

  // tap-to-place state (mobile)
  const [selected, setSelected] = useState<
    { kind: "pool"; photo: Photo } | { kind: "slot"; index: number } | null
  >(null);

  function onTapPool(photo: Photo) {
    if (selected?.kind === "slot") {
      // Place la photo sélectionnée depuis un slot vers le pool → retire du slot
      setSlots((prev) => {
        const next = [...prev];
        next[selected.index] = null;
        return next;
      });
      setSelected(null);
      return;
    }
    setSelected({ kind: "pool", photo });
  }

  function onTapSlot(index: number) {
    if (!selected) {
      // Sélectionne la photo dans le slot (si occupé)
      if (slots[index]) setSelected({ kind: "slot", index });
      return;
    }
    setSlots((prev) => {
      const next = [...prev];
      if (selected.kind === "pool") {
        next[index] = selected.photo;
      } else {
        // Swap
        const tmp = next[index];
        next[index] = next[selected.index];
        next[selected.index] = tmp;
      }
      return next;
    });
    setSelected(null);
  }

  useEffect(() => {
    if (!id) return;
    api
      .get<Game>(`/games/${id}`)
      .then((r) => setGame(r.data))
      .catch(() => {});
    api
      .get<Photo[]>(`/photos/${id}`)
      .then((r) => setPhotos(r.data))
      .catch(() => {});
  }, [id]);

  // Photos not yet placed in any slot
  const usedIds = new Set(slots.filter(Boolean).map((p) => p!.id));
  const poolPhotos = photos.filter((p) => !usedIds.has(p.id));

  const filled = slots.filter(Boolean).length;
  const canProceed = filled === 9;

  // ── Drag handlers ──────────────────────────────────────────────────

  function onDragStartPool(photo: Photo) {
    dragSource.current = { kind: "pool", photo };
  }

  function onDragStartSlot(index: number) {
    dragSource.current = { kind: "slot", index };
  }

  function onDropSlot(targetIdx: number) {
    const src = dragSource.current;
    if (!src) return;
    setSlots((prev) => {
      const next = [...prev];
      if (src.kind === "pool") {
        // displaced goes back to pool automatically (pool is derived from slots)
        next[targetIdx] = src.photo;
      } else {
        // Swap two slots
        const tmp = next[targetIdx];
        next[targetIdx] = next[src.index];
        next[src.index] = tmp;
      }
      return next;
    });
    dragSource.current = null;
  }

  function onDropPool() {
    const src = dragSource.current;
    if (!src || src.kind === "pool") return;
    setSlots((prev) => {
      const next = [...prev];
      next[src.index] = null;
      return next;
    });
    dragSource.current = null;
  }

  // ── Save ───────────────────────────────────────────────────────────

  async function save() {
    if (!canProceed || !id) return;
    setSaving(true);
    setError(null);
    try {
      const photoIds = slots.map((p) => p!.id);
      const { data } = await api.post<Grid>(`/grids/${id}`, {
        photoIds,
        visibility,
      });
      setGrid(data);
      setStep("done");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }

  if (!game) return <div style={{ padding: 32 }}>Chargement…</div>;

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 110 }}>
        <header className="ch-topbar">
          <Link
            to={`/games/${id}`}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Icon name="arrowLeft" size={22} />
          </Link>
          <span className="ch-serif" style={{ fontSize: 16 }}>
            Ta grille
          </span>
          <span
            className="ch-mono"
            style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}
          >
            {game.inviteCode}
          </span>
        </header>

        {/* ── STEP: build ─────────────────────────────────────────── */}
        {step === "build" && (
          <div style={{ padding: "20px 20px 0" }}>
            <div className="ch-eyebrow" style={{ marginBottom: 6 }}>
              COMPOSE TA GRILLE
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--ch-ink-mute)",
                margin: "0 0 16px",
              }}
            >
              Glisse tes photos dans les 9 cases. Réorganise à volonté.
            </p>

            {/* indication sélection active */}
            {selected && (
              <div style={{ fontSize: 12, color: "var(--ch-clay)", marginBottom: 8, textAlign: "center", fontWeight: 600 }}>
                Photo sélectionnée — tape une case pour la placer
              </div>
            )}

            {/* 3×3 drop grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridAutoRows: "calc((100vw - 40px - 12px) / 3 * 2)",
                gap: 6,
                marginBottom: 20,
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {slots.map((photo, i) => {
                const isSelectedSlot = selected?.kind === "slot" && selected.index === i;
                return (
                  <div
                    key={i}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropSlot(i)}
                    draggable={!!photo}
                    onDragStart={() => photo && onDragStartSlot(i)}
                    onClick={() => onTapSlot(i)}
                    style={{
                      borderRadius: 10,
                      border: isSelectedSlot
                        ? "2.5px solid var(--ch-clay)"
                        : photo ? "none" : "1.5px dashed var(--ch-line-2)",
                      background: photo ? "transparent" : "var(--ch-cream-2)",
                      overflow: "hidden",
                      position: "relative",
                      cursor: "pointer",
                      transition: "box-shadow 0.15s",
                      boxShadow: isSelectedSlot ? "0 0 0 3px var(--ch-clay-light, #e8c4a8)" : "none",
                    }}
                  >
                    {photo ? (
                      <>
                        <img
                          src={photoUrl(photo)}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            opacity: isSelectedSlot ? 0.7 : 1,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            background: "rgba(0,0,0,0.45)",
                            borderRadius: 6,
                            width: 18,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            color: "#fff",
                            fontFamily: "var(--ch-mono)",
                          }}
                        >
                          {i + 1}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          color: selected ? "var(--ch-clay)" : "var(--ch-line-2)",
                        }}
                      >
                        {selected ? "↓" : "+"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pool de photos */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ch-ink-mute)",
                  marginBottom: 8,
                }}
              >
                {poolPhotos.length === 0
                  ? "Toutes les photos sont placées"
                  : `${poolPhotos.length} photo${poolPhotos.length > 1 ? "s" : ""} disponible${poolPhotos.length > 1 ? "s" : ""}`}
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropPool}
              >
                {poolPhotos.map((photo) => {
                  const isSelectedPhoto = selected?.kind === "pool" && selected.photo.id === photo.id;
                  return (
                    <div
                      key={photo.id}
                      draggable
                      onDragStart={() => onDragStartPool(photo)}
                      onClick={() => onTapPool(photo)}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 8,
                        overflow: "hidden",
                        cursor: "pointer",
                        flexShrink: 0,
                        border: isSelectedPhoto ? "2.5px solid var(--ch-clay)" : "2px solid var(--ch-line)",
                        boxShadow: isSelectedPhoto ? "0 0 0 3px var(--ch-clay-light, #e8c4a8)" : "none",
                        opacity: isSelectedPhoto ? 0.8 : 1,
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      <img
                        src={photoUrl(photo)}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  );
                })}
                {poolPhotos.length === 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ch-ink-mute)",
                      fontStyle: "italic",
                    }}
                  >
                    Glisse une photo d'une case vers ici pour la retirer
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: canProceed
                  ? "var(--ch-clay-deep)"
                  : "var(--ch-ink-mute)",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {filled} / 9 cases remplies
            </div>

            <button
              className="ch-btn"
              disabled={!canProceed}
              onClick={() => setStep("visibility")}
              style={{
                width: "100%",
                padding: "14px 0",
                fontSize: 14,
                justifyContent: "center",
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── STEP: visibility ────────────────────────────────────── */}
        {step === "visibility" && (
          <div style={{ padding: "20px 20px 0" }}>
            <div className="ch-eyebrow" style={{ marginBottom: 6 }}>
              VISIBILITÉ DE LA GRILLE
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--ch-ink-mute)",
                margin: "0 0 24px",
              }}
            >
              Choisis qui peut voir ta grille sur ton profil.
            </p>

            {/* Aperçu compact de la grille */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 3,
                marginBottom: 24,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "var(--ch-shadow)",
              }}
            >
              {slots.map((photo, i) => (
                <div key={i} style={{ aspectRatio: "1", overflow: "hidden" }}>
                  {photo && (
                    <img
                      src={photoUrl(photo)}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Toggle visibilité */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 24,
              }}
            >
              {(["PRIVATE", "PUBLIC"] as GridVisibility[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    border: `2px solid ${visibility === v ? "var(--ch-clay)" : "var(--ch-line)"}`,
                    background:
                      visibility === v
                        ? "var(--ch-cream-2)"
                        : "var(--ch-ivory)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Icon name={v === "PUBLIC" ? "globe" : "lock"} size={16} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {v === "PUBLIC" ? "Publique" : "Privée"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ch-ink-mute)",
                      lineHeight: 1.4,
                    }}
                  >
                    {v === "PUBLIC"
                      ? "Visible sur ton profil par tous les utilisateurs."
                      : "Stockée dans ton profil, invisible des autres."}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ch-danger)",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="ch-btn"
                onClick={() => setStep("build")}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  fontSize: 13,
                  justifyContent: "center",
                  background: "var(--ch-ivory)",
                  color: "var(--ch-ink)",
                  border: "1px solid var(--ch-line)",
                }}
              >
                ← Modifier
              </button>
              <button
                className="ch-btn"
                disabled={saving}
                onClick={save}
                style={{
                  flex: 2,
                  padding: "14px 0",
                  fontSize: 14,
                  justifyContent: "center",
                }}
              >
                {saving ? "Création…" : "Créer ma grille"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: done ──────────────────────────────────────────── */}
        {step === "done" && grid && (
          <div style={{ padding: "32px 20px 0", textAlign: "center" }}>
            <div className="ch-eyebrow" style={{ marginBottom: 12 }}>
              GRILLE CRÉÉE
            </div>
            <div
              className="ch-serif"
              style={{ fontSize: 28, marginBottom: 20 }}
            >
              Ta grille est prête ✦
            </div>

            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 20,
                boxShadow: "var(--ch-shadow-lg)",
              }}
            >
              <img
                src={
                  grid.imageUrl.startsWith("http")
                    ? grid.imageUrl
                    : SERVER + grid.imageUrl
                }
                alt="Grille"
                style={{ width: "100%", display: "block" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                className="ch-btn"
                disabled={downloading}
                onClick={() =>
                  download(
                    grid.imageUrl.startsWith("http")
                      ? grid.imageUrl
                      : SERVER + grid.imageUrl,
                    "ma-grille-color-hunt.jpg",
                  )
                }
                style={{
                  flex: 1,
                  padding: "13px 0",
                  fontSize: 13,
                  justifyContent: "center",
                }}
              >
                <Icon name="download" size={14} />{" "}
                {downloading ? "Téléchargement…" : "Télécharger"}
              </button>
              <button
                className="ch-btn"
                onClick={() => navigate("/profile")}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  fontSize: 13,
                  justifyContent: "center",
                  background: "var(--ch-ivory)",
                  color: "var(--ch-ink)",
                  border: "1px solid var(--ch-line)",
                }}
              >
                Voir mon profil
              </button>
            </div>

            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                fontSize: 12,
                color: "var(--ch-ink-mute)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
