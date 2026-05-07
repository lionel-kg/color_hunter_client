import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { Logo } from "../components/Logo";
import { Icon } from "../components/Icon";

export function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("login");
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === "signup" ? "/auth/signup" : "/auth/login";
      const body =
        mode === "signup" ? { pseudo, email, password } : { email, password };
      const { data } = await api.post(url, body);
      setSession(data);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ch-screen ch-app"
      style={{
        minHeight: "100vh",
        padding: "0 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ paddingTop: 56, position: "relative", height: 220 }}>
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 12,
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "var(--ch-blush)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 4,
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "var(--ch-sage)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 100,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--ch-clay)",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      <Logo size={16} />

      <h1
        className="ch-serif"
        style={{
          fontSize: 44,
          lineHeight: 1,
          margin: "20px 0 8px",
          letterSpacing: "-0.02em",
        }}
      >
        {mode === "signup" ? (
          <>
            Chasse la <em>couleur</em>.
          </>
        ) : (
          <>
            Bon retour, <em>chasseur</em>.
          </>
        )}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "var(--ch-ink-soft)",
          lineHeight: 1.5,
          margin: "0 0 24px",
          maxWidth: 280,
        }}
      >
        {mode === "signup"
          ? "Une couleur. Neuf clichés. Un défi photographique partagé entre amis."
          : "Reprends une chasse en cours ou rejoins celle d'un ami."}
      </p>

      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        {mode === "signup" && (
          <input
            className="ch-input"
            placeholder="Pseudo"
            required
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
        )}
        <input
          className="ch-input"
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div style={{ position: "relative" }}>
          <input
            className="ch-input"
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "signup" ? 8 : 1}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--ch-ink-mute)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
          </button>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: "var(--ch-danger)" }}>{error}</div>
        )}

        <button
          type="submit"
          className="ch-btn"
          disabled={loading}
          style={{ marginTop: 8, padding: "16px 22px" }}
        >
          {loading
            ? "…"
            : mode === "signup"
              ? "Créer mon compte"
              : "Se connecter"}
          <Icon name="arrowRight" size={18} />
        </button>
      </form>

      <p
        style={{
          fontSize: 13,
          color: "var(--ch-ink-mute)",
          textAlign: "center",
          marginTop: "auto",
          paddingBottom: 30,
        }}
      >
        {mode === "signup" ? "Déjà un compte ? " : "Première chasse ? "}
        <button
          type="button"
          onClick={() => setMode((m) => (m === "signup" ? "login" : "signup"))}
          style={{
            background: "none",
            border: "none",
            color: "var(--ch-ink)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            cursor: "pointer",
            font: "inherit",
          }}
        >
          {mode === "signup" ? "Se connecter" : "Créer un compte"}
        </button>
      </p>
    </div>
  );
}
