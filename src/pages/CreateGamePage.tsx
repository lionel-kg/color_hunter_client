import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { Icon } from "../components/Icon";
import type { ColorPalette } from "../types/api";

const PALETTE_COLORS: Record<ColorPalette, string[]> = {
  PRIMARY:   ["#FF3B3B", "#FFD600", "#0088FF"],
  SECONDARY: ["#2ECC71", "#7B61FF", "#E040FB"],
  TERTIARY:  ["#FF7A00", "#00C9A7", "#FF2D78"],
};

export function CreateGamePage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"SOLO" | "TEAM">("TEAM");
  const [teamSize, setTeamSize] = useState(2);
  const [numTeams, setNumTeams] = useState(2);
  const [duration, setDuration] = useState<{ label: string; min: number }>({ label: "24h", min: 60 * 24 });
  const [maxPlayers, setMaxPlayers] = useState(6);

  const computedMaxPlayers = mode === "TEAM" ? numTeams * teamSize : maxPlayers;
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>(["PRIMARY"]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePalette = (p: ColorPalette) => {
    setColorPalettes(prev =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter(x => x !== p) : prev) : [...prev, p]
    );
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/games", { mode, teamSize, numTeams, durationMin: duration.min, maxPlayers: computedMaxPlayers, visibility, colorPalettes });
      navigate(`/games/${data.id}/lobby`);
    } finally { setLoading(false); }
  };

  const paletteOptions = [
    { id: "PRIMARY" as ColorPalette,   label: t('createGame.primary'),   desc: t('createGame.primaryDesc') },
    { id: "SECONDARY" as ColorPalette, label: t('createGame.secondary'), desc: t('createGame.secondaryDesc') },
    { id: "TERTIARY" as ColorPalette,  label: t('createGame.tertiary'),  desc: t('createGame.tertiaryDesc') },
  ];

  const durations = [
    { label: "1h",                  min: 60 },
    { label: "3h",                  min: 180 },
    { label: "24h",                 min: 60 * 24 },
    { label: t('createGame.days_3'), min: 60 * 24 * 3 },
    { label: t('createGame.week_1'), min: 60 * 24 * 7 },
  ];

  const gameModes = [
    { id: "SOLO" as const, label: t('createGame.solo'), desc: t('createGame.soloDesc'), icon: "user" as const },
    { id: "TEAM" as const, label: t('createGame.team'), desc: t('createGame.teamDesc'), icon: "users" as const },
  ];

  const teamSizes = [
    { v: 2, label: t('createGame.duos'), sub: t('createGame.duosGrid') },
    { v: 3, label: t('createGame.trios'), sub: t('createGame.triosGrid') },
  ];

  const visibilityOptions = [
    { id: "PRIVATE" as const, icon: "lock" as const, label: t('createGame.private'), desc: t('createGame.privateDesc') },
    { id: "PUBLIC" as const,  icon: "globe" as const, label: t('createGame.public'),  desc: t('createGame.publicDesc') },
  ];

  return (
    <div className="ch-screen ch-app" style={{ minHeight: "100vh" }}>
      <div className="ch-scroll" style={{ paddingBottom: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
          <Link to="/" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ch-ink)" }}>
            <Icon name="arrowLeft" size={22} />
          </Link>
          <span style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>{t('createGame.step')}</span>
        </div>

        <div style={{ padding: "8px 24px 24px" }}>
          <div className="ch-eyebrow" style={{ marginBottom: 8 }}>{t('createGame.newHunt')}</div>
          <h1 className="ch-serif" style={{ fontSize: 36, lineHeight: 1, margin: 0, letterSpacing: "-0.02em" }}
            dangerouslySetInnerHTML={{ __html: t('createGame.howToPlay') }}
          />
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Mode */}
          <div>
            <div style={{ fontSize: 12, color: "var(--ch-ink-mute)", marginBottom: 8, padding: "0 4px" }}>
              {t('createGame.gameMode')}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {gameModes.map((o) => (
                <button key={o.id} onClick={() => setMode(o.id)} style={{ background: mode === o.id ? "var(--ch-ink)" : "var(--ch-ivory)", color: mode === o.id ? "var(--ch-ivory)" : "var(--ch-ink)", border: "1px solid " + (mode === o.id ? "var(--ch-ink)" : "var(--ch-line)"), borderRadius: 14, padding: 14, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 8, fontFamily: "var(--ch-sans)" }}>
                  <Icon name={o.icon} size={20} stroke={1.5} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{o.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.65 }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Taille équipe + Nombre d'équipes */}
          {mode === "TEAM" && (
            <>
              <div>
                <div style={{ fontSize: 12, color: "var(--ch-ink-mute)", marginBottom: 8, padding: "0 4px" }}>
                  {t('createGame.teamSize')}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {teamSizes.map((o) => (
                    <button key={o.v} onClick={() => setTeamSize(o.v)} style={{ background: teamSize === o.v ? "var(--ch-cream-3)" : "var(--ch-ivory)", border: "1px solid " + (teamSize === o.v ? "var(--ch-ink)" : "var(--ch-line)"), borderRadius: 14, padding: "12px 8px", cursor: "pointer", fontFamily: "var(--ch-sans)" }}>
                      <div className="ch-serif" style={{ fontSize: 18 }}>{o.label}</div>
                      <div style={{ fontSize: 10, color: "var(--ch-ink-mute)" }}>{o.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--ch-ink-mute)", marginBottom: 8, padding: "0 4px" }}>
                  {t('createGame.numTeams')}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[2, 3, 4].map((n) => (
                    <button key={n} onClick={() => setNumTeams(n)} style={{ flex: 1, padding: "10px 8px", borderRadius: 14, background: numTeams === n ? "var(--ch-cream-3)" : "var(--ch-ivory)", border: "1px solid " + (numTeams === n ? "var(--ch-ink)" : "var(--ch-line)"), cursor: "pointer", fontFamily: "var(--ch-sans)" }}>
                      <div className="ch-serif" style={{ fontSize: 18 }}>{n}</div>
                      <div style={{ fontSize: 10, color: "var(--ch-ink-mute)" }}>{t(`createGame.teams_${n}`)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Durée */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 12, color: "var(--ch-ink-mute)" }}>{t('createGame.duration')}</span>
              <span style={{ fontSize: 12, color: "var(--ch-ink)", fontWeight: 500 }}>{duration.label}</span>
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {durations.map((d) => (
                <button key={d.min} onClick={() => setDuration(d)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 999, background: duration.min === d.min ? "var(--ch-ink)" : "var(--ch-ivory)", color: duration.min === d.min ? "var(--ch-ivory)" : "var(--ch-ink-soft)", border: "1px solid " + (duration.min === d.min ? "var(--ch-ink)" : "var(--ch-line)"), fontSize: 13, cursor: "pointer", fontFamily: "var(--ch-sans)" }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Palette */}
          <div>
            <div style={{ fontSize: 12, color: "var(--ch-ink-mute)", marginBottom: 8, padding: "0 4px" }}>
              {t('createGame.colorPalette')}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {paletteOptions.map((o) => {
                const active = colorPalettes.includes(o.id);
                return (
                  <button key={o.id} onClick={() => togglePalette(o.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, cursor: "pointer", fontFamily: "var(--ch-sans)", textAlign: "left", background: active ? "var(--ch-ivory)" : "transparent", border: "1.5px solid " + (active ? "var(--ch-ink)" : "var(--ch-line)") }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {PALETTE_COLORS[o.id].map((c) => (
                        <div key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c, opacity: active ? 1 : 0.35 }} />
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}>{o.desc}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: "1.5px solid " + (active ? "var(--ch-ink)" : "var(--ch-line-2)"), background: active ? "var(--ch-ink)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ch-ivory)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max joueurs */}
          <div className="ch-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: mode === "SOLO" ? 12 : 0 }}>
              <span style={{ fontSize: 13 }}>{t('createGame.maxPlayers')}</span>
              <span className="ch-serif" style={{ fontSize: 24 }}>{computedMaxPlayers}</span>
            </div>
            {mode === "SOLO" && (
              <>
                <input type="range" min={2} max={20} value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} style={{ width: "100%" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ch-ink-mute)", marginTop: 4 }}>
                  <span>2</span><span>20</span>
                </div>
              </>
            )}
            {mode === "TEAM" && (
              <div style={{ fontSize: 11, color: "var(--ch-ink-mute)", marginTop: 4 }}>
                {numTeams} × {teamSize} {t('createGame.playersPerTeam')}
              </div>
            )}
          </div>

          {/* Visibilité */}
          <div className="ch-card" style={{ padding: 4 }}>
            {visibilityOptions.map((o) => (
              <button key={o.id} onClick={() => setVisibility(o.id)} style={{ width: "100%", background: visibility === o.id ? "var(--ch-cream-2)" : "transparent", border: "none", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "var(--ch-sans)", textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ch-cream-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={o.icon} size={18} stroke={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ch-ink-mute)" }}>{o.desc}</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid " + (visibility === o.id ? "var(--ch-ink)" : "var(--ch-line-2)"), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {visibility === o.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ch-ink)" }} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px 32px", background: "linear-gradient(to top, var(--ch-cream) 70%, transparent)" }}>
        <button className="ch-btn" disabled={loading} onClick={submit} style={{ width: "100%", padding: 16, fontSize: 15 }}>
          {loading ? "…" : t('createGame.create')} <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  );
}
