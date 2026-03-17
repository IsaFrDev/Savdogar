export const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin;

export const getMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const urlStr = url.toString();
    if (urlStr.startsWith('http')) return urlStr;
    return `${BASE_URL}${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;
};
