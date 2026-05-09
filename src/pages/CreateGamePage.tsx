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
    { label: "1h",                   min: 60 },
    { label: "3h",                   min: 180 },
    { label: "24h",                  min: 60 * 24 },
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
        <div className="create-game__nav">
          <Link to="/" className="ch-btn ch-btn--ghost" style={{ padding: 8, borderRadius: 8 }}>
            <Icon name="arrowLeft" size={22} />
          </Link>
          <span className="create-game__step-label">{t('createGame.step')}</span>
        </div>

        <div className="create-game__header">
          <div className="ch-eyebrow" style={{ marginBottom: 8 }}>{t('createGame.newHunt')}</div>
          <h1 className="ch-serif" style={{ fontSize: 36, lineHeight: 1, margin: 0, letterSpacing: "-0.02em" }}
            dangerouslySetInnerHTML={{ __html: t('createGame.howToPlay') }}
          />
        </div>

        <div className="create-game__body">
          {/* Mode */}
          <div>
            <div className="create-game__field-label">{t('createGame.gameMode')}</div>
            <div className="create-game__mode-grid">
              {gameModes.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setMode(o.id)}
                  className={`create-game__mode-btn create-game__mode-btn--${mode === o.id ? 'active' : 'inactive'}`}
                >
                  <Icon name={o.icon} size={20} stroke={1.5} />
                  <div>
                    <div className="create-game__mode-name">{o.label}</div>
                    <div className="create-game__mode-desc">{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {mode === "TEAM" && (
            <>
              <div>
                <div className="create-game__field-label">{t('createGame.teamSize')}</div>
                <div className="create-game__size-grid">
                  {teamSizes.map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setTeamSize(o.v)}
                      className={`create-game__option-btn create-game__option-btn--${teamSize === o.v ? 'active' : 'inactive'}`}
                    >
                      <div className="ch-serif create-game__option-label">{o.label}</div>
                      <div className="create-game__option-sub">{o.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="create-game__field-label">{t('createGame.numTeams')}</div>
                <div className="create-game__num-grid">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumTeams(n)}
                      className={`create-game__option-btn create-game__option-btn--${numTeams === n ? 'active' : 'inactive'}`}
                      style={{ flex: 1 }}
                    >
                      <div className="ch-serif create-game__option-label">{n}</div>
                      <div className="create-game__option-sub">{t(`createGame.teams_${n}`)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Durée */}
          <div>
            <div className="create-game__duration-header">
              <span className="create-game__field-label" style={{ margin: 0 }}>{t('createGame.duration')}</span>
              <span className="create-game__duration-value">{duration.label}</span>
            </div>
            <div className="create-game__duration-list">
              {durations.map((d) => (
                <button
                  key={d.min}
                  onClick={() => setDuration(d)}
                  className={`create-game__duration-btn create-game__duration-btn--${duration.min === d.min ? 'active' : 'inactive'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Palette */}
          <div>
            <div className="create-game__field-label">{t('createGame.colorPalette')}</div>
            <div className="create-game__palette-list">
              {paletteOptions.map((o) => {
                const active = colorPalettes.includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => togglePalette(o.id)}
                    className={`create-game__palette-btn create-game__palette-btn--${active ? 'active' : 'inactive'}`}
                  >
                    <div className="create-game__palette-swatches">
                      {PALETTE_COLORS[o.id].map((c) => (
                        <div
                          key={c}
                          className={`create-game__palette-swatch${!active ? ' create-game__palette-swatch--dimmed' : ''}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <div className="create-game__palette-info">
                      <div className="create-game__palette-name">{o.label}</div>
                      <div className="create-game__palette-desc">{o.desc}</div>
                    </div>
                    <div className={`create-game__palette-check create-game__palette-check--${active ? 'checked' : 'unchecked'}`}>
                      {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ch-ivory)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max joueurs */}
          <div className="ch-card create-game__max-card">
            <div className={`create-game__max-header${mode === "SOLO" ? ' create-game__max-header--with-range' : ''}`}>
              <span style={{ fontSize: 13 }}>{t('createGame.maxPlayers')}</span>
              <span className="ch-serif create-game__max-value">{computedMaxPlayers}</span>
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
              <div className="create-game__max-sub">{numTeams} × {teamSize} {t('createGame.playersPerTeam')}</div>
            )}
          </div>

          {/* Visibilité */}
          <div className="ch-card create-game__visibility-card">
            {visibilityOptions.map((o) => (
              <button
                key={o.id}
                onClick={() => setVisibility(o.id)}
                className={`create-game__visibility-btn create-game__visibility-btn--${visibility === o.id ? 'active' : 'inactive'}`}
              >
                <div className="create-game__visibility-icon">
                  <Icon name={o.icon} size={18} stroke={1.5} />
                </div>
                <div className="create-game__visibility-text">
                  <div className="create-game__visibility-name">{o.label}</div>
                  <div className="create-game__visibility-desc">{o.desc}</div>
                </div>
                <div className={`create-game__visibility-radio create-game__visibility-radio--${visibility === o.id ? 'selected' : 'unselected'}`}>
                  {visibility === o.id && <div className="create-game__visibility-dot" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="create-game__footer">
        <button className="ch-btn create-game__submit-btn" disabled={loading} onClick={submit}>
          {loading ? "…" : t('createGame.create')} <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  );
}
