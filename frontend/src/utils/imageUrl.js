/**
 * Utility functions for handling and normalizing user/student image URLs,
 * including Google Drive, Dropbox, and cloud storage sharing links.
 */

/**
 * Extracts the file ID from any format of Google Drive sharing or viewer URL.
 * 
 * Supports:
 * - https://drive.google.com/file/d/{ID}/view?usp=sharing
 * - https://drive.google.com/open?id={ID}
 * - https://drive.google.com/uc?id={ID}
 * - https://drive.google.com/thumbnail?id={ID}
 * - https://lh3.googleusercontent.com/d/{ID}
 * - https://docs.google.com/file/d/{ID}
 * 
 * @param {string} url
 * @returns {string|null} Google Drive file ID or null
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

/**
 * Normalizes any image URL (especially Google Drive & Dropbox sharing links)
 * to a direct, embeddable image URL.
 * 
 * @param {string} url
 * @returns {string} Normalized direct image URL
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    // drive.google.com/thumbnail?id={ID}&sz=w1000 serves high-resolution public images directly
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  }

  // Dropbox share links: change ?dl=0 to ?raw=1
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace(/[?&]dl=0/, '?raw=1');
  }

  return trimmed;
}

/**
 * Returns an ordered array of alternative fallback URLs for Google Drive images
 * in case the primary thumbnail endpoint fails or is blocked.
 * 
 * @param {string} url
 * @returns {string[]} Array of URLs to try
 */
export function getImageFallbackUrls(url) {
  if (!url || typeof url !== 'string') return [];
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return [trimmed];

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return [
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`,
      `https://lh3.googleusercontent.com/d/${driveId}`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
    ];
  }

  return [normalizeImageUrl(trimmed)];
}

export default normalizeImageUrl;

