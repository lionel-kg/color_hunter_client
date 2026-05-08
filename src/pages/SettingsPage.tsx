import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { Icon } from '../components/Icon';
import { StatusChip } from '../components/StatusChip';
import { LangSwitch } from '../components/AppShell';
import type { User } from '../types/api';

export function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const { t } = useTranslation();
  const [me, setMe] = useState<User | null>(user);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<User>('/users/me').then(r => { setMe(r.data); setUser(r.data); }).catch(() => {});
  }, [setUser]);

  const togglePrivate = async () => {
    if (!me) return;
    const updated = !me.isProfilePrivate;
    const { data } = await api.patch<User>('/users/me', { isProfilePrivate: updated });
    setMe({ ...me, ...data });
    setUser({ ...me, ...data });
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
          <Link to="/profile" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={22} />
          </Link>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{t('settings.title')}</span>
          <span style={{ width: 22 }} />
        </div>

        <div style={{ padding: '8px 24px 16px' }}>
          <h1 className="ch-serif" style={{ fontSize: 32, lineHeight: 1, margin: 0 }}>{t('settings.heading')}</h1>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div className="ch-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div className="ch-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>{me.pseudo[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{me.pseudo}</div>
              <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)' }}>{me.email}</div>
            </div>
          </div>

          {/* Langue */}
          <div style={{ marginBottom: 18 }}>
            <div className="ch-eyebrow" style={{ marginBottom: 8, padding: '0 4px' }}>{t('settings.language').toUpperCase()}</div>
            <div className="ch-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13 }}>{t('settings.language')}</span>
              <LangSwitch />
            </div>
          </div>

          {/* Confidentialité */}
          <div style={{ marginBottom: 18 }}>
            <div className="ch-eyebrow" style={{ marginBottom: 8, padding: '0 4px' }}>{t('settings.privacy').toUpperCase()}</div>
            <div className="ch-card" style={{ padding: 4 }}>
              <button onClick={togglePrivate} style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--ch-sans)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{t('settings.privateProfile')}</div>
                  <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)', marginTop: 2 }}>{t('settings.privateProfileDesc')}</div>
                </div>
                <div style={{ width: 38, height: 22, borderRadius: 999, background: me.isProfilePrivate ? 'var(--ch-ink)' : 'var(--ch-cream-3)', position: 'relative', transition: 'background 0.15s' }}>
                  <div style={{ position: 'absolute', top: 2, left: me.isProfilePrivate ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: 'var(--ch-ivory)', transition: 'left 0.15s' }} />
                </div>
              </button>
            </div>
          </div>

          {/* Compte */}
          <div style={{ marginBottom: 18 }}>
            <div className="ch-eyebrow" style={{ marginBottom: 8, padding: '0 4px' }}>{t('settings.account').toUpperCase()}</div>
            <div className="ch-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t('settings.deletionTitle')}</div>
                  <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)', marginTop: 2 }}>{t('settings.deletionStatus')}</div>
                </div>
                <StatusChip status={me.status} demandStatus={me.demandStatus} />
              </div>
              {msg && (
                <div style={{ background: 'var(--ch-cream-2)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'var(--ch-ink-soft)', lineHeight: 1.5, marginBottom: 12 }}>
                  {msg}
                </div>
              )}
              {showRequestButton && (
                <button onClick={requestDeletion} disabled={busy} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid var(--ch-line-2)', color: 'var(--ch-danger)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ch-sans)' }}>
                  {t('settings.requestDeletion')}
                </button>
              )}
              {showCancelButton && (
                <button onClick={cancelDeletion} disabled={busy} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid var(--ch-line-2)', color: 'var(--ch-ink-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ch-sans)' }}>
                  {t('settings.cancelDeletion')}
                </button>
              )}
            </div>
          </div>

          <button onClick={logout} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'transparent', border: 'none', color: 'var(--ch-ink-mute)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ch-sans)' }}>
            {t('settings.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
