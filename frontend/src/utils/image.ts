import config from '../config';

/**
 * Resolves an image URL that may be a relative path (/static/uploads/...)
 * or already an absolute URL (http://...).
 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${config.IMAGE_BASE_URL}${url}`;
}
