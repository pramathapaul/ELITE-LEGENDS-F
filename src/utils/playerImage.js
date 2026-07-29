const POSITION_COLORS = {
  Goalkeeper: '#2ecc71',
  Defender: '#3498db',
  Midfielder: '#9b59b6',
  Forward: '#e94560',
};

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://elite-legends-b.onrender.com');

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getFallbackDataUrl(player) {
  const name = player?.name || 'Player';
  const initials = getInitials(name);
  const bg = POSITION_COLORS[player?.position] || '#f2ca50';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="${bg}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0.08"/>
      </radialGradient>
    </defs>
    <rect width="200" height="200" fill="${bg}" opacity="0.06"/>
    <rect width="200" height="200" fill="url(#g)"/>
    <circle cx="100" cy="100" r="64" fill="${bg}" opacity="0.2"/>
    <circle cx="100" cy="100" r="50" fill="${bg}" opacity="0.5"/>
    <text x="100" y="100" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="white">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function getPlayerImageUrl(player) {
  if (!player) return '';

  const status = player.imageStatus || '';

  if (player.image && status === 'ready') {
    if (player.image.startsWith('http')) return player.image;
    if (player.image.startsWith('/uploads') || player.image.startsWith('/players')) {
      return `${API_URL}${player.image}`;
    }
  }

  return getFallbackDataUrl(player);
}
