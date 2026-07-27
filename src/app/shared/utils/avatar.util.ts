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
