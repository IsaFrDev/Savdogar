
/**
 * Extracts dominant colors from an image URL or File object and harmonizes them.
 */
export async function extractColorsFromImage(imageSource: string | File): Promise<{ primary: string; secondary: string }> {
    return new Promise((resolve, _reject) => {
        const img = new Image();

        if (imageSource instanceof File) {
            img.src = URL.createObjectURL(imageSource);
        } else {
            img.src = imageSource;
        }

        img.crossOrigin = "Anonymous";

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve({ primary: '#6366F1', secondary: '#8B5CF6' });
                return;
            }

            const maxDimension = 100;
            const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colorCounts: Record<string, number> = {};

            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2], a = imageData[i + 3];

                // Skip transparent or extreme pixels
                if (a < 125 || (r > 245 && g > 245 && b > 245) || (r < 10 && g < 10 && b < 10)) continue;

                const hex = rgbToHex(r, g, b);
                colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            }

            const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);

            let primaryHex = '#6366F1';
            if (sortedColors.length > 0) primaryHex = sortedColors[0][0];

            // 1. Harmonize Primary (Make it "Premium")
            let primaryHsl = rgbToHsl(hexToRgb(primaryHex)!);

            // Ensure color is not too muddy/gray (Saturation >= 40%)
            if (primaryHsl.s < 0.4) primaryHsl.s = Math.min(0.6, primaryHsl.s + 0.3);

            // Ensure not too dark or too light (Luminance between 30% and 70%)
            if (primaryHsl.l < 0.3) primaryHsl.l = 0.4;
            if (primaryHsl.l > 0.7) primaryHsl.l = 0.6;

            const finalPrimary = hslToHex(primaryHsl.h, primaryHsl.s, primaryHsl.l);

            // 2. Generate Harmonized Secondary
            let finalSecondary: string;

            if (sortedColors.length > 5) {
                // Try to find a good existing secondary from the image
                let bestSecondary = '#8B5CF6';
                let maxDist = 0;

                for (let i = 1; i < Math.min(sortedColors.length, 10); i++) {
                    const testHex = sortedColors[i][0];
                    const dist = colorDistance(finalPrimary, testHex);
                    if (dist > maxDist && dist < 200) { // Distinct but not total clash
                        maxDist = dist;
                        bestSecondary = testHex;
                    }
                }

                // Harmonize the found secondary to match primary's premium feel
                const sHsl = rgbToHsl(hexToRgb(bestSecondary)!);
                sHsl.s = primaryHsl.s; // Match saturation for harmony
                sHsl.l = primaryHsl.l; // Match luminance for consistency
                finalSecondary = hslToHex(sHsl.h, sHsl.s, sHsl.l);
            } else {
                // Generate using Analogous harmony (+30 degrees)
                const sH = (primaryHsl.h + 30) % 360;
                finalSecondary = hslToHex(sH, primaryHsl.s, primaryHsl.l);
            }

            if (imageSource instanceof File) URL.revokeObjectURL(img.src);
            resolve({ primary: finalPrimary, secondary: finalSecondary });
        };

        img.onerror = () => resolve({ primary: '#6366F1', secondary: '#8B5CF6' });
    });
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHsl({ r, g, b }: { r: number, g: number, b: number }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hue2rgb = (t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        r = hue2rgb(h / 360 + 1 / 3);
        g = hue2rgb(h / 360);
        b = hue2rgb(h / 360 - 1 / 3);
    }
    return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

function colorDistance(hex1: string, hex2: string): number {
    const rgb1 = hexToRgb(hex1), rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 0;
    return Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
}
