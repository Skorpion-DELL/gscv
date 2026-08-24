/**
 * Theme Extractor & Color Synchronizer
 * Projekt Traum - Gregor Skrzeszewski
 * 
 * Automatycznie analizuje tapetę strony głównej (#tm-bg), oblicza kontrastowe
 * barwy bazowe, akcenty (WCAG) i aplikuje zmienne CSS na stronie głównej oraz
 * wewnątrz książeczek (Blog & Lebenslauf).
 */

(function () {
  'use strict';

  // Baza precyzyjnych motywów dla grafik z folderu img/
  const WALLPAPER_PRESETS = {
    // 1. Aktualna tapeta wal1.png (Ciemny grafit / Ciemny łupek & Szampańskie złoto)
    'wal1': {
      bgDark: '#100f0f',
      bgSurfaceGlass: 'rgba(16, 15, 15, 0.88)',
      bgPopupGlass: 'rgba(16, 15, 15, 0.96)',
      accent1: '#d7b784',
      accent2: '#eae2c7',
      accent1Rgb: '215, 183, 132',
      accent2Rgb: '234, 226, 199',
      gradientAccent: 'linear-gradient(135deg, #d7b784 0%, #eae2c7 100%)',
      textPrimary: '#FAF9F6',
      textSecondary: 'hsl(40, 10%, 84%)',
      textMuted: 'hsl(40, 8%, 64%)',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      borderGlassHover: 'rgba(255, 255, 255, 0.25)',
      bookNavyDeep: '#100f0f',
      bookNavyMedium: '#312921',
      bookAccentNavy: 'linear-gradient(135deg, #100f0f, #312921)',
      bookGoldDark: '#d7b784',
      bookGoldLight: '#eae2c7',
      bookGoldGradient: 'linear-gradient(135deg, #d7b784 0%, #eae2c7 50%, #d7b784 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(215, 183, 132, 0.16) 0%, rgba(16, 15, 15, 0) 70%)'
    },
    // 2. Ciepły brąz / Mokate & Miedź
    'mono-brown': {
      bgDark: '#1A120B',
      bgSurfaceGlass: 'rgba(26, 18, 11, 0.90)',
      bgPopupGlass: 'rgba(26, 18, 11, 0.97)',
      accent1: '#D68938',
      accent2: '#F7BC72',
      accent1Rgb: '214, 137, 56',
      accent2Rgb: '247, 188, 114',
      gradientAccent: 'linear-gradient(135deg, #D68938 0%, #F7BC72 100%)',
      textPrimary: '#FFFDF9',
      textSecondary: 'hsl(32, 18%, 85%)',
      textMuted: 'hsl(32, 10%, 65%)',
      borderGlass: 'rgba(255, 240, 220, 0.10)',
      borderGlassHover: 'rgba(255, 240, 220, 0.28)',
      bookNavyDeep: '#140E08',
      bookNavyMedium: '#2B1B10',
      bookAccentNavy: 'linear-gradient(135deg, #140E08, #2B1B10)',
      bookGoldDark: '#D68938',
      bookGoldLight: '#F7BC72',
      bookGoldGradient: 'linear-gradient(135deg, #D68938 0%, #F7BC72 50%, #D68938 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(214, 137, 56, 0.18) 0%, rgba(26, 18, 11, 0) 70%)'
    },
    // 3. Monochromatyczny / Grafit & Platyna
    'mono': {
      bgDark: '#121417',
      bgSurfaceGlass: 'rgba(18, 20, 23, 0.90)',
      bgPopupGlass: 'rgba(18, 20, 23, 0.97)',
      accent1: '#A2B4C7',
      accent2: '#E1E9F0',
      accent1Rgb: '162, 180, 199',
      accent2Rgb: '225, 233, 240',
      gradientAccent: 'linear-gradient(135deg, #A2B4C7 0%, #E1E9F0 100%)',
      textPrimary: '#FFFFFF',
      textSecondary: 'hsl(215, 12%, 85%)',
      textMuted: 'hsl(215, 8%, 65%)',
      borderGlass: 'rgba(255, 255, 255, 0.09)',
      borderGlassHover: 'rgba(255, 255, 255, 0.26)',
      bookNavyDeep: '#0D0F12',
      bookNavyMedium: '#1F242B',
      bookAccentNavy: 'linear-gradient(135deg, #0D0F12, #1F242B)',
      bookGoldDark: '#A2B4C7',
      bookGoldLight: '#E1E9F0',
      bookGoldGradient: 'linear-gradient(135deg, #A2B4C7 0%, #E1E9F0 50%, #A2B4C7 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(162, 180, 199, 0.15) 0%, rgba(18, 20, 23, 0) 70%)'
    },
    // 4. Raum 1 / Piaskowiec & Złocisty dąb
    'raum_1': {
      bgDark: '#1C1510',
      bgSurfaceGlass: 'rgba(28, 21, 16, 0.89)',
      bgPopupGlass: 'rgba(28, 21, 16, 0.96)',
      accent1: '#DA993B',
      accent2: '#F7CF79',
      accent1Rgb: '218, 153, 59',
      accent2Rgb: '247, 207, 121',
      gradientAccent: 'linear-gradient(135deg, #DA993B 0%, #F7CF79 100%)',
      textPrimary: '#FCFBF8',
      textSecondary: 'hsl(35, 15%, 85%)',
      textMuted: 'hsl(35, 10%, 65%)',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      borderGlassHover: 'rgba(255, 255, 255, 0.25)',
      bookNavyDeep: '#150F0C',
      bookNavyMedium: '#2E2017',
      bookAccentNavy: 'linear-gradient(135deg, #150F0C, #2E2017)',
      bookGoldDark: '#DA993B',
      bookGoldLight: '#F7CF79',
      bookGoldGradient: 'linear-gradient(135deg, #DA993B 0%, #F7CF79 50%, #DA993B 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(218, 153, 59, 0.16) 0%, rgba(28, 21, 16, 0) 70%)'
    },
    // 5. Raum 2 / Szmaragd & Ocean Teal
    'raum_2': {
      bgDark: '#0A1A1C',
      bgSurfaceGlass: 'rgba(10, 26, 28, 0.89)',
      bgPopupGlass: 'rgba(10, 26, 28, 0.96)',
      accent1: '#31BCA6',
      accent2: '#7CECDA',
      accent1Rgb: '49, 188, 166',
      accent2Rgb: '124, 236, 218',
      gradientAccent: 'linear-gradient(135deg, #31BCA6 0%, #7CECDA 100%)',
      textPrimary: '#F6FCFA',
      textSecondary: 'hsl(170, 15%, 85%)',
      textMuted: 'hsl(170, 10%, 65%)',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      borderGlassHover: 'rgba(255, 255, 255, 0.25)',
      bookNavyDeep: '#061314',
      bookNavyMedium: '#112B2E',
      bookAccentNavy: 'linear-gradient(135deg, #061314, #112B2E)',
      bookGoldDark: '#31BCA6',
      bookGoldLight: '#7CECDA',
      bookGoldGradient: 'linear-gradient(135deg, #31BCA6 0%, #7CECDA 50%, #31BCA6 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(49, 188, 166, 0.16) 0%, rgba(10, 26, 28, 0) 70%)'
    },
    // 6. Raum 3
    'raum_3': {
      bgDark: '#211d18',
      bgSurfaceGlass: 'rgba(28, 24, 20, 0.88)',
      bgPopupGlass: 'rgba(28, 24, 20, 0.96)',
      accent1: '#d2aa79',
      accent2: '#e7dcc0',
      accent1Rgb: '210, 170, 121',
      accent2Rgb: '231, 220, 192',
      gradientAccent: 'linear-gradient(135deg, #d2aa79 0%, #e7dcc0 100%)',
      textPrimary: '#FAF9F6',
      textSecondary: 'hsl(40, 10%, 84%)',
      textMuted: 'hsl(40, 8%, 64%)',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      borderGlassHover: 'rgba(255, 255, 255, 0.25)',
      bookNavyDeep: '#211d18',
      bookNavyMedium: '#453826',
      bookAccentNavy: 'linear-gradient(135deg, #211d18, #453826)',
      bookGoldDark: '#d2aa79',
      bookGoldLight: '#e7dcc0',
      bookGoldGradient: 'linear-gradient(135deg, #d2aa79 0%, #e7dcc0 50%, #d2aa79 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(210, 170, 121, 0.16) 0%, rgba(28, 24, 20, 0) 70%)'
    },
    // 7. Abstract / Fiolet & Neon Złoto
    'abstract': {
      bgDark: '#110F22',
      bgSurfaceGlass: 'rgba(17, 15, 34, 0.90)',
      bgPopupGlass: 'rgba(17, 15, 34, 0.97)',
      accent1: '#A162F7',
      accent2: '#D6B4FE',
      accent1Rgb: '161, 98, 247',
      accent2Rgb: '214, 180, 254',
      gradientAccent: 'linear-gradient(135deg, #A162F7 0%, #D6B4FE 100%)',
      textPrimary: '#FAF8FD',
      textSecondary: 'hsl(260, 15%, 86%)',
      textMuted: 'hsl(260, 10%, 66%)',
      borderGlass: 'rgba(255, 255, 255, 0.09)',
      borderGlassHover: 'rgba(255, 255, 255, 0.27)',
      bookNavyDeep: '#0B0A17',
      bookNavyMedium: '#1E1B38',
      bookAccentNavy: 'linear-gradient(135deg, #0B0A17, #1E1B38)',
      bookGoldDark: '#A162F7',
      bookGoldLight: '#D6B4FE',
      bookGoldGradient: 'linear-gradient(135deg, #A162F7 0%, #D6B4FE 50%, #A162F7 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(161, 98, 247, 0.16) 0%, rgba(17, 15, 34, 0) 70%)'
    },
    // 8. 6.jpg (Ciepły orzech & Szampan)
    '6.jpg': {
      bgDark: '#201b16',
      bgSurfaceGlass: 'rgba(27, 23, 19, 0.88)',
      bgPopupGlass: 'rgba(27, 23, 19, 0.96)',
      accent1: '#ce9f67',
      accent2: '#e2d3b0',
      accent1Rgb: '206, 159, 103',
      accent2Rgb: '226, 211, 176',
      gradientAccent: 'linear-gradient(135deg, #ce9f67 0%, #e2d3b0 100%)',
      textPrimary: '#FAF9F6',
      textSecondary: 'hsl(40, 10%, 84%)',
      textMuted: 'hsl(40, 8%, 64%)',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      borderGlassHover: 'rgba(255, 255, 255, 0.25)',
      bookNavyDeep: '#201b16',
      bookNavyMedium: '#453523',
      bookAccentNavy: 'linear-gradient(135deg, #201b16, #453523)',
      bookGoldDark: '#ce9f67',
      bookGoldLight: '#e2d3b0',
      bookGoldGradient: 'linear-gradient(135deg, #ce9f67 0%, #e2d3b0 50%, #ce9f67 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(206, 159, 103, 0.16) 0%, rgba(27, 23, 19, 0) 70%)'
    },
    // 9. DE1 / Niemiecka flaga & Złoto
    'de1': {
      bgDark: '#121316',
      bgSurfaceGlass: 'rgba(18, 19, 22, 0.90)',
      bgPopupGlass: 'rgba(18, 19, 22, 0.97)',
      accent1: '#E5A224',
      accent2: '#FCD46A',
      accent1Rgb: '229, 162, 36',
      accent2Rgb: '252, 212, 106',
      gradientAccent: 'linear-gradient(135deg, #E5A224 0%, #FCD46A 100%)',
      textPrimary: '#FFFFFF',
      textSecondary: 'hsl(40, 12%, 85%)',
      textMuted: 'hsl(40, 8%, 65%)',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      borderGlassHover: 'rgba(255, 255, 255, 0.25)',
      bookNavyDeep: '#0D0E10',
      bookNavyMedium: '#212429',
      bookAccentNavy: 'linear-gradient(135deg, #0D0E10, #212429)',
      bookGoldDark: '#E5A224',
      bookGoldLight: '#FCD46A',
      bookGoldGradient: 'linear-gradient(135deg, #E5A224 0%, #FCD46A 50%, #E5A224 100%)',
      bookDeskAccent: 'radial-gradient(circle, rgba(229, 162, 36, 0.16) 0%, rgba(18, 19, 22, 0) 70%)'
    }
  };

  const isIframe = window.self !== window.top;
  let currentPalette = WALLPAPER_PRESETS['wal1'];
  let currentWallpaperUrl = '';

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function findPresetForUrl(url) {
    if (!url) return null;
    const lower = url.toLowerCase();
    for (const key of Object.keys(WALLPAPER_PRESETS)) {
      if (lower.includes(key)) {
        return WALLPAPER_PRESETS[key];
      }
    }
    return null;
  }

  function generatePaletteFromPixels(pixels) {
    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    const vibrantCandidates = [];

    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a < 128) continue;

      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      totalR += r; totalG += g; totalB += b; count++;

      const [h, s, l] = rgbToHsl(r, g, b);
      if (s >= 18 && l >= 20 && l <= 85) {
        const score = s * (1 - Math.abs(l - 55) / 55);
        vibrantCandidates.push({ r, g, b, h, s, l, score });
      }
    }

    if (count === 0) return WALLPAPER_PRESETS['wal1'];

    const avgR = Math.round(totalR / count);
    const avgG = Math.round(totalG / count);
    const avgB = Math.round(totalB / count);
    const [domH, domS, domL] = rgbToHsl(avgR, avgG, avgB);

    let bestAccent;
    if (vibrantCandidates.length > 0) {
      vibrantCandidates.sort((a, b) => b.score - a.score);
      const topPick = vibrantCandidates[Math.floor(vibrantCandidates.length * 0.05)];
      bestAccent = { h: topPick.h, s: Math.max(topPick.s, 50), l: Math.max(48, Math.min(68, topPick.l)) };
    } else {
      bestAccent = { h: (domH + 40) % 360, s: 65, l: 55 };
    }

    let accent1L = Math.max(48, Math.min(68, bestAccent.l));
    let accent1Rgb = hslToRgb(bestAccent.h, Math.max(bestAccent.s, 50), accent1L);

    const accent2H = (bestAccent.h + 8) % 360;
    const accent2L = Math.min(85, accent1L + 18);
    const accent2S = Math.max(40, bestAccent.s - 5);
    const accent2Rgb = hslToRgb(accent2H, accent2S, accent2L);

    const bgDarkH = domH;
    const bgDarkS = Math.min(domS, 30);
    const bgDarkL = Math.max(4, Math.min(12, domL > 50 ? 10 : domL * 0.25));
    const bgDarkRgb = hslToRgb(bgDarkH, bgDarkS, bgDarkL);

    const glassR = Math.max(8, Math.min(30, Math.round(avgR * 0.25)));
    const glassG = Math.max(8, Math.min(30, Math.round(avgG * 0.25)));
    const glassB = Math.max(10, Math.min(30, Math.round(avgB * 0.25)));

    const navyDeepRgb = bgDarkRgb;
    const navyMediumRgb = hslToRgb(bgDarkH, Math.min(50, bgDarkS + 15), Math.min(22, bgDarkL + 10));

    return {
      bgDark: rgbToHex(bgDarkRgb[0], bgDarkRgb[1], bgDarkRgb[2]),
      bgSurfaceGlass: `rgba(${glassR}, ${glassG}, ${glassB}, 0.88)`,
      bgPopupGlass: `rgba(${glassR}, ${glassG}, ${glassB}, 0.96)`,
      accent1: rgbToHex(accent1Rgb[0], accent1Rgb[1], accent1Rgb[2]),
      accent2: rgbToHex(accent2Rgb[0], accent2Rgb[1], accent2Rgb[2]),
      accent1Rgb: `${accent1Rgb[0]}, ${accent1Rgb[1]}, ${accent1Rgb[2]}`,
      accent2Rgb: `${accent2Rgb[0]}, ${accent2Rgb[1]}, ${accent2Rgb[2]}`,
      gradientAccent: `linear-gradient(135deg, ${rgbToHex(accent1Rgb[0], accent1Rgb[1], accent1Rgb[2])} 0%, ${rgbToHex(accent2Rgb[0], accent2Rgb[1], accent2Rgb[2])} 100%)`,
      textPrimary: '#FAF9F6',
      textSecondary: 'hsl(40, 10%, 84%)',
      textMuted: 'hsl(40, 8%, 64%)',
      borderGlass: 'rgba(255, 255, 255, 0.08)',
      borderGlassHover: 'rgba(255, 255, 255, 0.25)',
      bookNavyDeep: rgbToHex(navyDeepRgb[0], navyDeepRgb[1], navyDeepRgb[2]),
      bookNavyMedium: rgbToHex(navyMediumRgb[0], navyMediumRgb[1], navyMediumRgb[2]),
      bookAccentNavy: `linear-gradient(135deg, ${rgbToHex(navyDeepRgb[0], navyDeepRgb[1], navyDeepRgb[2])}, ${rgbToHex(navyMediumRgb[0], navyMediumRgb[1], navyMediumRgb[2])})`,
      bookGoldDark: rgbToHex(accent1Rgb[0], accent1Rgb[1], accent1Rgb[2]),
      bookGoldLight: rgbToHex(accent2Rgb[0], accent2Rgb[1], accent2Rgb[2]),
      bookGoldGradient: `linear-gradient(135deg, ${rgbToHex(accent1Rgb[0], accent1Rgb[1], accent1Rgb[2])} 0%, ${rgbToHex(accent2Rgb[0], accent2Rgb[1], accent2Rgb[2])} 50%, ${rgbToHex(accent1Rgb[0], accent1Rgb[1], accent1Rgb[2])} 100%)`,
      bookDeskAccent: `radial-gradient(circle, rgba(${accent1Rgb[0]}, ${accent1Rgb[1]}, ${accent1Rgb[2]}, 0.16) 0%, rgba(${glassR}, ${glassG}, ${glassB}, 0) 70%)`
    };
  }

  // Aplikowanie do strony głównej
  function applyPaletteToMainDocument(palette) {
    currentPalette = palette;
    const root = document.documentElement;
    root.style.setProperty('--bg-dark', palette.bgDark);
    root.style.setProperty('--bg-surface-glass', palette.bgSurfaceGlass);
    root.style.setProperty('--bg-popup-glass', palette.bgPopupGlass);
    root.style.setProperty('--accent-1', palette.accent1);
    root.style.setProperty('--accent-2', palette.accent2);
    root.style.setProperty('--accent-1-rgb', palette.accent1Rgb);
    root.style.setProperty('--accent-2-rgb', palette.accent2Rgb);
    root.style.setProperty('--gradient-accent', palette.gradientAccent);
    root.style.setProperty('--text-primary', palette.textPrimary);
    root.style.setProperty('--text-secondary', palette.textSecondary);
    root.style.setProperty('--text-muted', palette.textMuted);
    root.style.setProperty('--border-glass', palette.borderGlass);
    root.style.setProperty('--border-glass-hover', palette.borderGlassHover);

    try {
      localStorage.setItem('pt_current_theme', JSON.stringify({ palette, wallpaperUrl: currentWallpaperUrl }));
    } catch (e) { }

    console.log('[ThemeExtractor] Zastosowano motyw:', {
      accent1: palette.accent1,
      accent2: palette.accent2,
      bgDark: palette.bgDark
    });

    broadcastToIframes(palette, currentWallpaperUrl);
  }

  // Aplikowanie bezpośrednio do stylów książeczki (Flipbook)
  function applyPaletteToBook(palette, wallpaperUrl) {
    if (!palette) return;
    currentPalette = palette;
    const root = document.documentElement;

    root.style.setProperty('--navy-deep', palette.bookNavyDeep);
    root.style.setProperty('--navy-medium', palette.bookNavyMedium);
    root.style.setProperty('--gold-dark', palette.bookGoldDark);
    root.style.setProperty('--gold-light', palette.bookGoldLight);
    root.style.setProperty('--gold-gradient', palette.bookGoldGradient);
    root.style.setProperty('--accent-navy', palette.bookAccentNavy);
    root.style.setProperty('--desk-accent', palette.bookDeskAccent);
    root.style.setProperty('--accent-1', palette.accent1);
    root.style.setProperty('--accent-2', palette.accent2);

    if (document.body) {
      document.body.style.backgroundColor = palette.bgDark;
      if (wallpaperUrl) {
        let resolvedUrl = wallpaperUrl;
        if (!wallpaperUrl.startsWith('http') && !wallpaperUrl.startsWith('data:') && !wallpaperUrl.startsWith('file:') && !wallpaperUrl.startsWith('/')) {
          if (!wallpaperUrl.startsWith('../')) {
            resolvedUrl = '../' + wallpaperUrl;
          }
        }
        document.body.style.backgroundImage = `url('${resolvedUrl}')`;
      }
    }

    console.log('[ThemeExtractor-Book] Zaktualizowano styl książeczki:', palette.bookGoldDark);
  }

  // Wysłanie wiadomości postMessage do wszystkich ramek iframe
  function broadcastToIframes(palette, wallpaperUrl) {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      // 1. Próba bezpośredniego dostępu (jeśli ta sama domena / http)
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.documentElement) {
          const root = doc.documentElement;
          root.style.setProperty('--navy-deep', palette.bookNavyDeep);
          root.style.setProperty('--navy-medium', palette.bookNavyMedium);
          root.style.setProperty('--gold-dark', palette.bookGoldDark);
          root.style.setProperty('--gold-light', palette.bookGoldLight);
          root.style.setProperty('--gold-gradient', palette.bookGoldGradient);
          root.style.setProperty('--accent-navy', palette.bookAccentNavy);
          root.style.setProperty('--desk-accent', palette.bookDeskAccent);
          if (doc.body) {
            doc.body.style.backgroundColor = palette.bgDark;
            if (wallpaperUrl) doc.body.style.backgroundImage = `url('${wallpaperUrl}')`;
          }
        }
      } catch (e) { }

      // 2. Wiadomość postMessage (działa zawsze, nawet na file://)
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'SET_THEME',
            palette: palette,
            wallpaperUrl: wallpaperUrl
          }, '*');
        }
      } catch (e) { }
    });
  }

  function extractColorsFromImageUrl(imageUrl, callback) {
    currentWallpaperUrl = imageUrl;

    // Próba ekstrakcji z Canvas
    const img = new Image();
    if (imageUrl.startsWith('http:') || imageUrl.startsWith('https:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = function () {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const sampleSize = 64;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const palette = generatePaletteFromPixels(imageData.data);
        if (callback) callback(palette);
      } catch (err) {
        // Fallback dla file:// gdy Canvas jest blokowany
        const fallbackPreset = findPresetForUrl(imageUrl) || WALLPAPER_PRESETS['wal1'];
        if (callback) callback(fallbackPreset);
      }
    };

    img.onerror = function () {
      const fallbackPreset = findPresetForUrl(imageUrl) || WALLPAPER_PRESETS['wal1'];
      if (callback) callback(fallbackPreset);
    };

    img.src = imageUrl;
  }

  function getWallpaperUrlFromDom() {
    const bgElem = document.getElementById('tm-bg');
    if (!bgElem) return '';

    if (bgElem.style.backgroundImage) {
      const match = bgElem.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
      if (match) return match[1];
    }

    const computedStyle = window.getComputedStyle(bgElem);
    const bgImage = computedStyle.backgroundImage || '';
    const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
    return match ? match[1] : '';
  }

  // Inicjalizacja dla strony głównej (Parent Window)
  function initMain() {
    const wallpaperUrl = getWallpaperUrlFromDom();
    if (wallpaperUrl && wallpaperUrl !== 'none') {
      extractColorsFromImageUrl(wallpaperUrl, function (palette) {
        applyPaletteToMainDocument(palette);
      });
    } else {
      applyPaletteToMainDocument(WALLPAPER_PRESETS['wal1']);
    }

    // Nasłuchiwanie zapytań o motyw od ramek iframe
    window.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'GET_THEME' && event.source) {
        event.source.postMessage({
          type: 'SET_THEME',
          palette: currentPalette,
          wallpaperUrl: currentWallpaperUrl
        }, '*');
      }
    });

    const bgElem = document.getElementById('tm-bg');
    if (bgElem && window.MutationObserver) {
      const observer = new MutationObserver(function () {
        const newUrl = getWallpaperUrlFromDom();
        if (newUrl && newUrl !== currentWallpaperUrl) {
          extractColorsFromImageUrl(newUrl, function (palette) {
            applyPaletteToMainDocument(palette);
          });
        }
      });
      observer.observe(bgElem, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  }

  // Inicjalizacja dla książeczki wewnątrz ramki iframe
  function initChildIframe() {
    // 1. Nasłuchuj wiadomości od okna głównego
    window.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'SET_THEME' && event.data.palette) {
        applyPaletteToBook(event.data.palette, event.data.wallpaperUrl);
      }
    });

    // 2. Zapytaj rodzica o aktualny motyw
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'GET_THEME' }, '*');
      }
    } catch (e) { }

    // 3. Sprawdź zapisany motyw w localStorage
    try {
      const cached = localStorage.getItem('pt_current_theme');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.palette) {
          applyPaletteToBook(parsed.palette, parsed.wallpaperUrl);
          return;
        }
      }
    } catch (e) { }

    // 4. Fallback: wykryj tapetę z body lub użyj domyślnej
    applyPaletteToBook(WALLPAPER_PRESETS['wal1'], '');
  }

  // Globalne API
  window.ThemeExtractor = {
    init: isIframe ? initChildIframe : initMain,
    applyPalette: applyPaletteToMainDocument,
    applyToBook: applyPaletteToBook,
    syncIframes: function () {
      broadcastToIframes(currentPalette, currentWallpaperUrl);
    },
    getPalette: function () { return currentPalette; },
    getPresets: function () { return WALLPAPER_PRESETS; },
    setWallpaper: function (imageUrl) {
      const bgElem = document.getElementById('tm-bg');
      if (bgElem) {
        bgElem.style.backgroundImage = `url('${imageUrl}')`;
      }
      extractColorsFromImageUrl(imageUrl, function (palette) {
        applyPaletteToMainDocument(palette);
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.ThemeExtractor.init);
  } else {
    window.ThemeExtractor.init();
  }

})();
