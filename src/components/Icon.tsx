import type { CSSProperties } from 'react';

type IconName =
  | 'home' | 'plus' | 'camera' | 'grid' | 'user' | 'archive' | 'settings'
  | 'bell' | 'arrowRight' | 'arrowLeft' | 'chevronRight' | 'chevronDown' | 'chevronUp'
  | 'upload' | 'image' | 'users' | 'clock' | 'eye' | 'eyeOff' | 'check' | 'x'
  | 'download' | 'share' | 'heart' | 'lock' | 'globe' | 'sparkle' | 'palette'
  | 'copy' | 'search' | 'flash';

interface Props {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
}

const PATHS: Record<IconName, JSX.Element> = {
  home: <><path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  camera: <><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></>,
  archive: <><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11h14V8"/><path d="M10 12h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></>,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  arrowRight: <path d="M5 12h14M13 5l7 7-7 7"/>,
  arrowLeft: <path d="M19 12H5M11 5l-7 7 7 7"/>,
  chevronRight: <path d="M9 6l6 6-6 6"/>,
  chevronDown: <path d="M6 9l6 6 6-6"/>,
  chevronUp: <path d="M18 15l-6-6-6 6"/>,
  upload: <><path d="M12 15V3M7 8l5-5 5 5"/><path d="M3 17v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></>,
  users: <><circle cx="9" cy="8" r="3.5"/><path d="M3 21c.7-3 3-5 6-5s5.3 2 6 5"/><circle cx="17" cy="8" r="3.5" opacity="0.5"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M3 3l18 18"/><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.3M6.3 6.3C3.7 8 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.4 9.4a3 3 0 0 0 4.2 4.2"/></>,
  check: <path d="M5 12l5 5 9-11"/>,
  x: <path d="M6 6l12 12M18 6L6 18"/>,
  download: <><path d="M12 3v13m0 0l-5-5m5 5l5-5"/><path d="M3 17v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3"/></>,
  share: <><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></>,
  heart: <path d="M12 20S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z"/>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v3M21 4.5h-3" opacity="0.6"/></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18c1 0 1.5-.7 1.5-1.5S13 18 13 17s.5-1.5 1.5-1.5H17a4 4 0 0 0 4-4 9 9 0 0 0-9-8.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="15.5" cy="8" r="1"/><circle cx="17" cy="12.5" r="1"/></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
  flash: <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>,
};

export function Icon({ name, size = 20, stroke = 1.6, color = 'currentColor' }: Props) {
  const style: CSSProperties = {
    width: size, height: size, fill: 'none', stroke: color,
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  return <svg viewBox="0 0 24 24" style={style}>{PATHS[name]}</svg>;
}
