export const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin;

export const getMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const urlStr = url.toString();
    if (urlStr.startsWith('http')) return urlStr;
    
    // Django media handling: if it's a relative path and doesn't start with /media/
    // we prefix it with MEDIA_URL if BASE_URL doesn't already have it
    let path = urlStr;
    if (!path.startsWith('/') && !path.startsWith('media/')) {
        path = `media/${path}`;
    } else if (path.startsWith('/') && !path.startsWith('/media/')) {
        path = `/media${path}`;
    }
    
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
