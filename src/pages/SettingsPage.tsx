import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { Icon } from '../components/Icon';
import { StatusChip } from '../components/StatusChip';
import { LangSwitch } from '../components/AppShell';
import { CameraAutocomplete } from '../components/CameraAutocomplete';
import type { User } from '../types/api';

export function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { t } = useTranslation();
  const [me, setMe] = useState<User | null>(user);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cameraModel, setCameraModel] = useState(user?.cameraModel ?? "");
  const [cameraSaved, setCameraSaved] = useState(false);

  useEffect(() => {
    api.get<User>('/users/me').then(r => {
      setMe(r.data);
      setUser(r.data);
      setCameraModel(r.data.cameraModel ?? "");
    }).catch(() => {});
  }, [setUser]);

  const togglePrivate = async () => {
    if (!me) return;
    const updated = !me.isProfilePrivate;
    const { data } = await api.patch<User>('/users/me', { isProfilePrivate: updated });
    setMe({ ...me, ...data });
    setUser({ ...me, ...data });
  };

  const saveCamera = async () => {
    if (!me) return;
    const { data } = await api.patch<User>('/users/me', { cameraModel: cameraModel || null });
    setMe({ ...me, ...data });
    setUser({ ...me, ...data });
    setCameraSaved(true);
    setTimeout(() => setCameraSaved(false), 2000);
  };

  const requestDeletion = async () => {
    if (!confirm(t('settings.requestDeletion') + ' ?')) return;
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await api.post('/users/me/deletion-request');
      setMsg(data.message);
      setMe(m => m ? { ...m, status: data.status, demandStatus: data.demandStatus } : m);
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const cancelDeletion = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete('/users/me/deletion-request');
      setMe(m => m ? { ...m, status: data.status, demandStatus: data.demandStatus } : m);
      setMsg(null);
    } finally {
      setBusy(false);
    }
  };

  if (!me) return null;

  const showRequestButton = me.demandStatus === 'NONE' && me.status === 'ACTIVE';
  const showCancelButton = me.demandStatus === 'EN_COURS';

  return (
    <div className="ch-screen ch-app" style={{ minHeight: '100vh' }}>
      <div className="ch-scroll" style={{ paddingBottom: 60 }}>
        <div className="settings__nav">
          <Link to="/profile" className="settings__nav-back">
            <Icon name="arrowLeft" size={22} />
          </Link>
          <span className="settings__nav-title">{t('settings.title')}</span>
          <span style={{ width: 22 }} />
        </div>

        <div className="settings__header">
          <h1 className="ch-serif settings__title">{t('settings.heading')}</h1>
        </div>

        <div className="settings__body">
          <div className="ch-card settings__identity-card">
            <div className="ch-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>{me.pseudo[0].toUpperCase()}</div>
            <div className="settings__identity-info">
              <div className="settings__identity-name">{me.pseudo}</div>
              <div className="settings__identity-email">{me.email}</div>
            </div>
          </div>

          <div className="settings__section">
            <div className="ch-eyebrow settings__section-label">{t('settings.language').toUpperCase()}</div>
            <div className="ch-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13 }}>{t('settings.language')}</span>
              <LangSwitch />
            </div>
          </div>

          <div className="settings__section">
            <div className="ch-eyebrow settings__section-label">{t('settings.gear').toUpperCase()}</div>
            <div className="ch-card settings__gear-card">
              <div className="settings__gear-label">{t('settings.cameraModel')}</div>
              <CameraAutocomplete
                value={cameraModel}
                onChange={setCameraModel}
                placeholder={t('settings.cameraModelPlaceholder')}
              />
              <button
                className={`settings__gear-save${cameraSaved ? ' settings__gear-save--saved' : ''}`}
                onClick={saveCamera}
                disabled={cameraSaved}
              >
                {cameraSaved ? t('settings.saved') : t('settings.save')}
              </button>
            </div>
          </div>

          <div className="settings__section">
            <div className="ch-eyebrow settings__section-label">{t('settings.privacy').toUpperCase()}</div>
            <div className="ch-card settings__section-card">
              <button onClick={togglePrivate} className="settings__toggle-row">
                <div className="settings__toggle-text">
                  <div className="settings__toggle-label">{t('settings.privateProfile')}</div>
                  <div className="settings__toggle-desc">{t('settings.privateProfileDesc')}</div>
                </div>
                <div className={`settings__toggle-track settings__toggle-track--${me.isProfilePrivate ? 'on' : 'off'}`}>
                  <div className={`settings__toggle-thumb settings__toggle-thumb--${me.isProfilePrivate ? 'on' : 'off'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="settings__section">
            <div className="ch-eyebrow settings__section-label">{t('settings.account').toUpperCase()}</div>
            <div className="ch-card settings__account-card">
              <div className="settings__account-header">
                <div>
                  <div className="settings__account-label">{t('settings.deletionTitle')}</div>
                  <div className="settings__account-desc">{t('settings.deletionStatus')}</div>
                </div>
                <StatusChip status={me.status} demandStatus={me.demandStatus} />
              </div>
              {msg && <div className="settings__message">{msg}</div>}
              {showRequestButton && (
                <button onClick={requestDeletion} disabled={busy} className="settings__deletion-btn settings__deletion-btn--danger">
                  {t('settings.requestDeletion')}
                </button>
              )}
              {showCancelButton && (
                <button onClick={cancelDeletion} disabled={busy} className="settings__deletion-btn settings__deletion-btn--neutral">
                  {t('settings.cancelDeletion')}
                </button>
              )}
            </div>
          </div>

          <button onClick={logout} className="settings__logout-btn">{t('settings.logout')}</button>
        </div>
      </div>
    </div>
  );
}
