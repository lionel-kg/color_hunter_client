import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { Icon } from '../components/Icon';
import { StatusChip } from '../components/StatusChip';
import type { User } from '../types/api';

export function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
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
    if (!confirm('Demander la suppression du compte ?')) return;
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
        <header className="ch-topbar">
          <Link to="/profile" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="arrowLeft" size={22} /></Link>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Paramètres</span>
          <span style={{ width: 22 }} />
        </header>

        <div style={{ padding: '8px 24px 16px' }}>
          <h1 className="ch-serif" style={{ fontSize: 32, lineHeight: 1, margin: 0 }}>Réglages</h1>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div className="ch-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div className="ch-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>{me.pseudo[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{me.pseudo}</div>
              <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)' }}>{me.email}</div>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="ch-eyebrow" style={{ marginBottom: 8, padding: '0 4px' }}>Confidentialité</div>
            <div className="ch-card" style={{ padding: 4 }}>
              <button onClick={togglePrivate} style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--ch-sans)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>Profil privé</div>
                  <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)', marginTop: 2 }}>Seuls tes amis voient ton activité</div>
                </div>
                <div style={{
                  width: 38, height: 22, borderRadius: 999,
                  background: me.isProfilePrivate ? 'var(--ch-ink)' : 'var(--ch-cream-3)',
                  position: 'relative', transition: 'background 0.15s',
                }}>
                  <div style={{
                    position: 'absolute', top: 2,
                    left: me.isProfilePrivate ? 18 : 2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--ch-ivory)',
                    transition: 'left 0.15s',
                  }} />
                </div>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="ch-eyebrow" style={{ marginBottom: 8, padding: '0 4px' }}>Compte</div>
            <div className="ch-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Suppression du compte</div>
                  <div style={{ fontSize: 11, color: 'var(--ch-ink-mute)', marginTop: 2 }}>État actuel</div>
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
                  Demander la suppression d'un utilisateur
                </button>
              )}
              {showCancelButton && (
                <button onClick={cancelDeletion} disabled={busy} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid var(--ch-line-2)', color: 'var(--ch-ink-soft)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ch-sans)' }}>
                  Annuler la demande
                </button>
              )}
            </div>
          </div>

          <button onClick={logout} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'transparent', border: 'none', color: 'var(--ch-ink-mute)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ch-sans)' }}>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
