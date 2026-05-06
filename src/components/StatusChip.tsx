import type { DemandStatus, UserStatus } from '../types/api';

// Mapping per cahier des charges §6
function resolve(status: UserStatus, demandStatus: DemandStatus) {
  if (status === 'SUPPRIME') return { bg: '#E8D4D4', fg: '#8C4242', txt: 'Utilisateur supprimé' };
  if (status === 'DESACTIVATE') return { bg: '#D8DDE4', fg: '#4A5A6E', txt: 'Utilisateur désactivé' };
  if (demandStatus === 'VALIDEE') return { bg: '#D6E0D2', fg: '#4D6741', txt: 'Demande de suppression validée' };
  if (demandStatus === 'EN_COURS' || status === 'DEPART')
    return { bg: '#EFE4D3', fg: '#8B6E3C', txt: 'Demande de suppression en cours' };
  return null;
}

interface Props {
  status: UserStatus;
  demandStatus: DemandStatus;
}

export function StatusChip({ status, demandStatus }: Props) {
  const m = resolve(status, demandStatus);
  if (!m) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
      background: m.bg, color: m.fg, fontFamily: 'var(--ch-sans)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: m.fg }} />
      {m.txt}
    </span>
  );
}
