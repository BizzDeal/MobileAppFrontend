export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getAvatarColor(name: string | null | undefined): string {
  if (!name) return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
  const colors = [
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple
    'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
    'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Amber
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
    'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', // Cyan
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function generateAvatarSvg(name: string | null | undefined): string {
  const initials = getInitials(name);
  
  const gradients = [
    { start: '#3b82f6', end: '#1d4ed8' }, // Blue
    { start: '#8b5cf6', end: '#6d28d9' }, // Purple
    { start: '#10b981', end: '#047857' }, // Emerald
    { start: '#f59e0b', end: '#b45309' }, // Amber
    { start: '#ec4899', end: '#be185d' }, // Pink
    { start: '#06b6d4', end: '#0e7490' }, // Cyan
  ];

  let hash = 0;
  const str = name || 'User';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  const { start, end } = gradients[index];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${start}" />
      <stop offset="100%" stop-color="${end}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g)" />
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="44px" font-weight="600">${initials}</text>
</svg>`;

  if (typeof btoa !== 'undefined') {
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  // Fallback for SSR if btoa is not available
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
