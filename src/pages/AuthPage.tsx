import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";
import { Logo } from "../components/Logo";
import { Icon } from "../components/Icon";
import { LangSwitch } from "../components/AppShell";

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
  const { t } = useTranslation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === "signup" ? "/auth/signup" : "/auth/login";
      const body = mode === "signup" ? { pseudo, email, password } : { email, password };
      const { data } = await api.post(url, body);
      setSession(data);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ch-screen ch-app auth-page">
      <div className="auth-page__lang-btn">
        <LangSwitch />
      </div>

      <div className="auth-page__blobs">
        <div className="auth-page__blob auth-page__blob--blush" />
        <div className="auth-page__blob auth-page__blob--sage" />
        <div className="auth-page__blob auth-page__blob--clay" />
      </div>

      <Logo size={16} />

      <h1
        className="ch-serif auth-page__title"
        dangerouslySetInnerHTML={{ __html: mode === "signup" ? t("auth.signupTitle") : t("auth.loginTitle") }}
      />
      <p className="auth-page__subtitle">
        {mode === "signup" ? t("auth.signupSubtitle") : t("auth.loginSubtitle")}
      </p>

      <form onSubmit={submit} className="auth-page__form">
        {mode === "signup" && (
          <input
            className="ch-input"
            placeholder={t("auth.pseudoPlaceholder")}
            required
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
        )}
        <input
          className="ch-input"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="auth-page__password-wrapper">
          <input
            className="ch-input"
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.passwordPlaceholder")}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "signup" ? 8 : 1}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="auth-page__password-toggle"
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
          </button>
        </div>

        {error && <div className="auth-page__error">{error}</div>}

        <button type="submit" className="ch-btn auth-page__submit-btn" disabled={loading}>
          {loading ? "…" : mode === "signup" ? t("auth.createAccount") : t("auth.login")}
          <Icon name="arrowRight" size={18} />
        </button>
      </form>

      <p className="auth-page__footer">
        {mode === "signup" ? t("auth.alreadyAccount") : t("auth.firstHunt")}{" "}
        <button
          type="button"
          onClick={() => setMode((m) => (m === "signup" ? "login" : "signup"))}
          className="auth-page__switch-btn"
        >
          {mode === "signup" ? t("auth.login") : t("auth.createAccount")}
        </button>
      </p>
    </div>
  );
}
