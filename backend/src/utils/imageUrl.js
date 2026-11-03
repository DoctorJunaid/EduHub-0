/**
 * Utility functions for handling and normalizing user/student image URLs,
 * including Google Drive, Dropbox, and cloud storage sharing links.
 */

export function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/open\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i,
    /drive\.google\.com\/thumbnail\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i,
    /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
  ];
  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  }

  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace(/[?&]dl=0/, '?raw=1');
  }

  return trimmed;
}

export default normalizeImageUrl;

