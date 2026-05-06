import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Icon } from "../components/Icon";
import type { ColorPalette } from "../types/api";

const PALETTE_OPTIONS: { id: ColorPalette; label: string; desc: string; colors: string[] }[] = [
  { id: "PRIMARY",   label: "Primaires",   desc: "Rouge · Jaune · Bleu",           colors: ["#FF3B3B", "#FFD600", "#0088FF"] },
  { id: "SECONDARY", label: "Secondaires", desc: "Vert · Violet · Magenta",        colors: ["#2ECC71", "#7B61FF", "#E040FB"] },
  { id: "TERTIARY",  label: "Tertiaires",  desc: "Orange · Cyan · Rose · …",       colors: ["#FF7A00", "#00C9A7", "#FF2D78"] },
];

export function CreateGamePage() {
  const [mode, setMode] = useState<"SOLO" | "TEAM">("TEAM");
  const [teamSize, setTeamSize] = useState(2);
  const [duration, setDuration] = useState<{ label: string; min: number }>({
    label: "24h",
    min: 60 * 24,
  });
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>(["PRIMARY"]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePalette = (p: ColorPalette) => {
    setColorPalettes(prev =>
      prev.includes(p)
        ? prev.length > 1 ? prev.filter(x => x !== p) : prev  // garder au moins 1
        : [...prev, p]
    );
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/games", {
        mode,
        teamSize,
        durationMin: duration.min,
        maxPlayers,
        visibility,
        colorPalettes,
      });
      navigate(`/games/${data.id}/lobby`);
    } finally {
      setLoading(false);
    }
  };

  const durations = [
    { label: "1h", min: 60 },
    { label: "3h", min: 180 },
    { label: "24h", min: 60 * 24 },
    { label: "3 jours", min: 60 * 24 * 3 },
    { label: "1 semaine", min: 60 * 24 * 7 },
  ];

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 120 }}>
        <header className="ch-topbar">
          <Link
            to="/"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ch-ink)",
            }}
          >
            <Icon name="arrowLeft" size={22} />
          </Link>
          <span style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>
            Étape 1 / 1
          </span>
        </header>

        <div style={{ padding: "8px 24px 24px" }}>
          <div className="ch-eyebrow" style={{ marginBottom: 8 }}>
            Nouvelle chasse
          </div>
          <h1
            className="ch-serif"
            style={{
              fontSize: 36,
              lineHeight: 1,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Comment veux-tu <em>jouer</em> ?
          </h1>
        </div>

        <div
          style={{
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ch-ink-mute)",
                marginBottom: 8,
                padding: "0 4px",
              }}
            >
              MODE DE JEU
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                {
                  id: "SOLO" as const,
                  label: "Solo",
                  desc: "1 couleur · 9 photos",
                  icon: "user" as const,
                },
                {
                  id: "TEAM" as const,
                  label: "Équipe",
                  desc: "Coopération",
                  icon: "users" as const,
                },
              ].map((o) => (
                <button
                  key={o.id}
                  onClick={() => setMode(o.id)}
                  style={{
                    background:
                      mode === o.id ? "var(--ch-ink)" : "var(--ch-ivory)",
                    color: mode === o.id ? "var(--ch-ivory)" : "var(--ch-ink)",
                    border:
                      "1px solid " +
                      (mode === o.id ? "var(--ch-ink)" : "var(--ch-line)"),
                    borderRadius: 14,
                    padding: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontFamily: "var(--ch-sans)",
                  }}
                >
                  <Icon name={o.icon} size={20} stroke={1.5} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {o.label}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.65 }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {mode === "TEAM" && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ch-ink-mute)",
                  marginBottom: 8,
                  padding: "0 4px",
                }}
              >
                TAILLE D'ÉQUIPE
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {[
                  { v: 1, label: "1 vs 1", sub: "duel" },
                  { v: 2, label: "Duos", sub: "grille de 8" },
                  { v: 3, label: "Trios", sub: "3 × 3 photos" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setTeamSize(o.v)}
                    style={{
                      background:
                        teamSize === o.v
                          ? "var(--ch-cream-3)"
                          : "var(--ch-ivory)",
                      border:
                        "1px solid " +
                        (teamSize === o.v ? "var(--ch-ink)" : "var(--ch-line)"),
                      borderRadius: 14,
                      padding: "12px 8px",
                      cursor: "pointer",
                      fontFamily: "var(--ch-sans)",
                    }}
                  >
                    <div className="ch-serif" style={{ fontSize: 18 }}>
                      {o.label}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ch-ink-mute)" }}>
                      {o.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                padding: "0 4px",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>
                DURÉE
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ch-ink)",
                  fontWeight: 500,
                }}
              >
                {duration.label}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {durations.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setDuration(d)}
                  style={{
                    flexShrink: 0,
                    padding: "8px 14px",
                    borderRadius: 999,
                    background:
                      duration.label === d.label
                        ? "var(--ch-ink)"
                        : "var(--ch-ivory)",
                    color:
                      duration.label === d.label
                        ? "var(--ch-ivory)"
                        : "var(--ch-ink-soft)",
                    border:
                      "1px solid " +
                      (duration.label === d.label
                        ? "var(--ch-ink)"
                        : "var(--ch-line)"),
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "var(--ch-sans)",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--ch-ink-mute)", marginBottom: 8, padding: "0 4px" }}>
              PALETTE DE COULEURS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PALETTE_OPTIONS.map((o) => {
                const active = colorPalettes.includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => togglePalette(o.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                      fontFamily: "var(--ch-sans)", textAlign: "left",
                      background: active ? "var(--ch-ivory)" : "transparent",
                      border: "1.5px solid " + (active ? "var(--ch-ink)" : "var(--ch-line)"),
                    }}
                  >
                    <div style={{ display: "flex", gap: 4 }}>
                      {o.colors.map((c) => (
                        <div key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c, opacity: active ? 1 : 0.35 }} />
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}>{o.desc}</div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, border: "1.5px solid " + (active ? "var(--ch-ink)" : "var(--ch-line-2)"),
                      background: active ? "var(--ch-ink)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ch-ivory)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12l5 5 9-11"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ch-card" style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13 }}>Joueurs maximum</span>
              <span className="ch-serif" style={{ fontSize: 24 }}>
                {maxPlayers}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={9}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--ch-ink-mute)",
                marginTop: 4,
              }}
            >
              <span>2</span>
              <span>9</span>
            </div>
          </div>

          <div className="ch-card" style={{ padding: 4 }}>
            {[
              {
                id: "PRIVATE" as const,
                icon: "lock" as const,
                label: "Privée",
                desc: "Sur invitation seulement",
              },
              {
                id: "PUBLIC" as const,
                icon: "globe" as const,
                label: "Publique",
                desc: "Visible dans les chasses ouvertes",
              },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setVisibility(o.id)}
                style={{
                  width: "100%",
                  background:
                    visibility === o.id ? "var(--ch-cream-2)" : "transparent",
                  border: "none",
                  borderRadius: 14,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  fontFamily: "var(--ch-sans)",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--ch-cream-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={o.icon} size={18} stroke={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}>
                    {o.desc}
                  </div>
                </div>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border:
                      "1.5px solid " +
                      (visibility === o.id
                        ? "var(--ch-ink)"
                        : "var(--ch-line-2)"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {visibility === o.id && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--ch-ink)",
                      }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 20px 32px",
          background:
            "linear-gradient(to top, var(--ch-cream) 70%, transparent)",
        }}
      >
        <button
          className="ch-btn"
          disabled={loading}
          onClick={submit}
          style={{ width: "100%", padding: 16, fontSize: 15 }}
        >
          {loading ? "…" : "Créer la chasse"}{" "}
          <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  );
}
