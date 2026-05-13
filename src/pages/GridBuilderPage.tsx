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

// En duo (TEAM × 2), la case centrale (index 4) reste vide : grille à 8 photos.
const CENTER_INDEX = 4;
function isDuo(game: Game | null) {
  return game?.mode === "TEAM" && game?.teamSize === 2;
}
function slotCountFor(game: Game | null) {
  return isDuo(game) ? 8 : 9;
}

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

  const dragSource = useRef<
    { kind: "pool"; photo: Photo } | { kind: "slot"; index: number } | null
  >(null);

  const [selected, setSelected] = useState<
    { kind: "pool"; photo: Photo } | { kind: "slot"; index: number } | null
  >(null);

  function isLockedSlot(index: number) {
    return isDuo(game) && index === CENTER_INDEX;
  }

  function onTapPool(photo: Photo) {
    if (selected?.kind === "slot") {
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
    if (isLockedSlot(index)) return;
    if (!selected) {
      if (slots[index]) setSelected({ kind: "slot", index });
      return;
    }
    setSlots((prev) => {
      const next = [...prev];
      if (selected.kind === "pool") {
        next[index] = selected.photo;
      } else {
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

  const usedIds = new Set(slots.filter(Boolean).map((p) => p!.id));
  const poolPhotos = photos.filter((p) => !usedIds.has(p.id));

  const filled = slots.filter(Boolean).length;
  const needed = slotCountFor(game);
  const canProceed = filled === needed;

  function onDragStartPool(photo: Photo) {
    dragSource.current = { kind: "pool", photo };
  }

  function onDragStartSlot(index: number) {
    dragSource.current = { kind: "slot", index };
  }

  function onDropSlot(targetIdx: number) {
    if (isLockedSlot(targetIdx)) {
      dragSource.current = null;
      return;
    }
    const src = dragSource.current;
    if (!src) return;
    setSlots((prev) => {
      const next = [...prev];
      if (src.kind === "pool") {
        next[targetIdx] = src.photo;
      } else {
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

  async function save() {
    if (!canProceed || !id) return;
    setSaving(true);
    setError(null);
    try {
      // En duo, on saute le centre (slot 4) → backend reconstruit le mapping positions
      const photoIds = slots
        .filter((p): p is Photo => p !== null)
        .map((p) => p.id);
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
          <Link to={`/games/${id}`} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrowLeft" size={22} />
          </Link>
          <span className="ch-serif grid-builder__title">Ta grille</span>
          <span className="ch-mono grid-builder__game-code">{game.inviteCode}</span>
        </header>

        {step === "build" && (
          <div className="grid-builder__build">
            <div className="ch-eyebrow" style={{ marginBottom: 6 }}>COMPOSE TA GRILLE</div>
            <p className="grid-builder__build-hint">
              Glisse tes photos dans les {needed} cases. Réorganise à volonté.
            </p>

            {selected && (
              <div className="grid-builder__selection-hint">
                Photo sélectionnée — tape une case pour la placer
              </div>
            )}

            <div
              className="grid-builder__grid"
              onDragOver={(e) => e.preventDefault()}
            >
              {slots.map((photo, i) => {
                const isSelectedSlot = selected?.kind === "slot" && selected.index === i;
                const locked = isLockedSlot(i);
                return (
                  <div
                    key={i}
                    onDragOver={(e) => !locked && e.preventDefault()}
                    onDrop={() => !locked && onDropSlot(i)}
                    draggable={!locked && !!photo}
                    onDragStart={() => !locked && photo && onDragStartSlot(i)}
                    onClick={() => onTapSlot(i)}
                    className={`grid-builder__slot${!photo ? " grid-builder__slot--empty" : ""}${isSelectedSlot ? " grid-builder__slot--selected" : ""}${locked ? " grid-builder__slot--locked" : ""}`}
                    aria-disabled={locked || undefined}
                  >
                    {locked ? (
                      <div className="grid-builder__slot-placeholder grid-builder__slot-placeholder--locked">
                        ✦
                      </div>
                    ) : photo ? (
                      <>
                        <img
                          src={photoUrl(photo)}
                          alt=""
                          className={`grid-builder__slot-img${isSelectedSlot ? " grid-builder__slot-img--dimmed" : ""}`}
                        />
                        <div className="grid-builder__slot-number">{i + 1}</div>
                      </>
                    ) : (
                      <div className={`grid-builder__slot-placeholder grid-builder__slot-placeholder--${selected ? "clay" : "line"}`}>
                        {selected ? "↓" : "+"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid-builder__pool">
              <div className="grid-builder__pool-label">
                {poolPhotos.length === 0
                  ? "Toutes les photos sont placées"
                  : `${poolPhotos.length} photo${poolPhotos.length > 1 ? "s" : ""} disponible${poolPhotos.length > 1 ? "s" : ""}`}
              </div>
              <div
                className="grid-builder__pool-items"
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
                      className={`grid-builder__pool-photo grid-builder__pool-photo--${isSelectedPhoto ? "selected" : "normal"}`}
                    >
                      <img src={photoUrl(photo)} alt="" className="grid-builder__pool-img" />
                    </div>
                  );
                })}
                {poolPhotos.length === 0 && (
                  <div className="grid-builder__pool-empty">
                    Glisse une photo d'une case vers ici pour la retirer
                  </div>
                )}
              </div>
            </div>

            <div className={`grid-builder__progress grid-builder__progress--${canProceed ? "ready" : "mute"}`}>
              {filled} / {needed} cases remplies
            </div>

            <button
              className="ch-btn grid-builder__continue-btn"
              disabled={!canProceed}
              onClick={() => setStep("visibility")}
            >
              Continuer →
            </button>
          </div>
        )}

        {step === "visibility" && (
          <div className="grid-builder__visibility">
            <div className="ch-eyebrow" style={{ marginBottom: 6 }}>VISIBILITÉ DE LA GRILLE</div>
            <p className="grid-builder__visibility-hint">
              Choisis qui peut voir ta grille sur ton profil.
            </p>

            <div className="grid-builder__visibility-preview">
              {slots.map((photo, i) => (
                <div key={i} className="grid-builder__visibility-preview-slot">
                  {photo && (
                    <img
                      src={photoUrl(photo)}
                      alt=""
                      className="grid-builder__visibility-preview-img"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="grid-builder__visibility-options">
              {(["PRIVATE", "PUBLIC"] as GridVisibility[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={`grid-builder__visibility-option grid-builder__visibility-option--${visibility === v ? "selected" : "unselected"}`}
                >
                  <div className="grid-builder__visibility-option-header">
                    <Icon name={v === "PUBLIC" ? "globe" : "lock"} size={16} />
                    <span className="grid-builder__visibility-option-name">
                      {v === "PUBLIC" ? "Publique" : "Privée"}
                    </span>
                  </div>
                  <div className="grid-builder__visibility-option-desc">
                    {v === "PUBLIC"
                      ? "Visible sur ton profil par tous les utilisateurs."
                      : "Stockée dans ton profil, invisible des autres."}
                  </div>
                </button>
              ))}
            </div>

            {error && <div className="grid-builder__error">{error}</div>}

            <div className="grid-builder__visibility-actions">
              <button
                className="ch-btn grid-builder__back-btn"
                onClick={() => setStep("build")}
              >
                ← Modifier
              </button>
              <button
                className="ch-btn grid-builder__save-btn"
                disabled={saving}
                onClick={save}
              >
                {saving ? "Création…" : "Créer ma grille"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && grid && (
          <div className="grid-builder__done">
            <div className="ch-eyebrow" style={{ marginBottom: 12 }}>GRILLE CRÉÉE</div>
            <div className="ch-serif grid-builder__done-title">Ta grille est prête ✦</div>

            <div className="grid-builder__done-preview">
              <img
                src={
                  grid.imageUrl.startsWith("http")
                    ? grid.imageUrl
                    : SERVER + grid.imageUrl
                }
                alt="Grille"
                className="grid-builder__done-img"
              />
            </div>

            <div className="grid-builder__done-actions">
              <button
                className="ch-btn grid-builder__done-download"
                disabled={downloading}
                onClick={() =>
                  download(
                    grid.imageUrl.startsWith("http")
                      ? grid.imageUrl
                      : SERVER + grid.imageUrl,
                    "ma-grille-color-hunt.jpg",
                  )
                }
              >
                <Icon name="download" size={14} />{" "}
                {downloading ? "Téléchargement…" : "Télécharger"}
              </button>
              <button
                className="ch-btn grid-builder__done-profile"
                onClick={() => navigate("/profile")}
              >
                Voir mon profil
              </button>
            </div>

            <button
              className="grid-builder__done-home"
              onClick={() => navigate("/")}
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
