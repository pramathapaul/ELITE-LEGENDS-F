const POSITION_COLORS = {
  Goalkeeper: '2ecc71',
  Defender: '3498db',
  Midfielder: '9b59b6',
  Forward: 'e94560',
};

function getFallbackUrl(player) {
  const name = player?.name || 'Player';
  const color = POSITION_COLORS[player?.position] || 'f2ca50';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=200&bold=true&font-size=0.35`;
}

export function getPlayerImageUrl(player) {
  if (!player) return '';

  const status = player.imageStatus || '';

  if (player.image && status === 'ready') {
    if (player.image.startsWith('http')) return player.image;
    if (player.image.startsWith('/uploads') || player.image.startsWith('/players')) return player.image;
  }

  return getFallbackUrl(player);
}
