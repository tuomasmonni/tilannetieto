/**
 * SVG-ikonit karttataphtumille
 * Jokainen ikoni on 40x40px, optimoitu karttanäkymään
 */

// Onnettomuus - punainen kolmio huutomerkillä
export const accidentIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <path d="M20 4L36 34H4L20 4Z" fill="#ef4444" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <text x="20" y="28" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="Arial">!</text>
</svg>
`;

// Häiriö - oranssi ympyrä salamalla
export const disruptionIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#f97316" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <path d="M22 8L14 22h6l-2 10 8-14h-6l2-10z" fill="white"/>
</svg>
`;

// Tietyö - keltainen neliö lapiolla
export const roadworkIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect x="6" y="6" width="28" height="28" rx="4" fill="#eab308" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <path d="M15 12v16M25 12v16M12 20h16" stroke="#000000" stroke-width="3" stroke-linecap="round"/>
</svg>
`;

// Sää - sininen ympyrä lumihiutaleella
export const weatherIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#06b6d4" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <path d="M20 8v24M8 20h24M12 12l16 16M28 12L12 28" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <circle cx="20" cy="20" r="4" fill="white"/>
</svg>
`;

// Juna - vihreä ympyrä junalla
export const trainIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#22c55e" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <rect x="12" y="10" width="16" height="16" rx="3" fill="white"/>
  <rect x="14" y="12" width="12" height="6" rx="1" fill="#22c55e"/>
  <circle cx="15" cy="24" r="2" fill="#22c55e"/>
  <circle cx="25" cy="24" r="2" fill="#22c55e"/>
  <path d="M14 28l-2 4M26 28l2 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

// Kamera - sininen ympyrä kameralla
export const cameraIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#3b82f6" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <rect x="10" y="14" width="20" height="14" rx="2" fill="white"/>
  <circle cx="20" cy="21" r="5" fill="#3b82f6"/>
  <circle cx="20" cy="21" r="2" fill="white"/>
  <rect x="15" y="10" width="10" height="4" rx="1" fill="white"/>
</svg>
`;

// Poliisi - violetti ympyrä tähdellä
export const policeIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#6366f1" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <path d="M20 8l2.5 7.5H30l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5-6-4.5h7.5z" fill="white"/>
</svg>
`;

// Tulipalo - punainen ympyrä liekillä
export const fireIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#dc2626" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <path d="M20 8c0 4-4 6-4 10 0 4 2 6 4 8 2-2 4-4 4-8 0-4-4-6-4-10z" fill="#fbbf24"/>
  <path d="M20 14c0 2-2 3-2 5 0 2 1 3 2 4 1-1 2-2 2-4 0-2-2-3-2-5z" fill="#f97316"/>
</svg>
`;

// Bussi - vihreä ympyrä bussilla (joukkoliikenne)
export const busIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#10b981" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <rect x="12" y="10" width="16" height="18" rx="3" fill="white"/>
  <rect x="14" y="12" width="12" height="7" rx="1" fill="#10b981"/>
  <circle cx="15" cy="25" r="1.5" fill="#10b981"/>
  <circle cx="25" cy="25" r="1.5" fill="#10b981"/>
  <rect x="11" y="18" width="2" height="4" rx="0.5" fill="white"/>
  <rect x="27" y="18" width="2" height="4" rx="0.5" fill="white"/>
</svg>
`;

// Lämpömittari - violetti ympyrä lämpömittarilla (tiesää)
export const thermometerIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#8b5cf6" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <rect x="17" y="8" width="6" height="18" rx="3" fill="white"/>
  <circle cx="20" cy="28" r="4" fill="white"/>
  <rect x="19" y="14" width="2" height="12" fill="#ef4444"/>
  <circle cx="20" cy="28" r="2.5" fill="#ef4444"/>
</svg>
`;

// Lumihiutale - syaani ympyrä lumihiutaleella
export const snowflakeIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#a5f3fc" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <path d="M20 8v24M8 20h24M12 12l16 16M28 12L12 28" stroke="#0e7490" stroke-width="2" stroke-linecap="round"/>
  <circle cx="20" cy="20" r="3" fill="#0e7490"/>
</svg>
`;

// Jää - sininen ympyrä jääkiteellä
export const iceIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow-ice" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#38bdf8" stroke="#ffffff" stroke-width="2" filter="url(#shadow-ice)"/>
  <path d="M20 8v24M14 11l6 4 6-4M14 29l6-4 6 4M8 20h24M11 14l4 6-4 6M29 14l-4 6 4 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="20" cy="20" r="2.5" fill="white"/>
</svg>
`;

// Hot Lips
export const hotlipsIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="shadow-hl" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter></defs>
  <circle cx="20" cy="20" r="16" fill="#e53935" stroke="#ffffff" stroke-width="2" filter="url(#shadow-hl)"/>
  <path d="M20 30c-5-4-8-7-8-11 0-3 2-5 4-5 1.5 0 3 1 4 2.5C21 15 22.5 14 24 14c2 0 4 2 4 5 0 4-3 7-8 11z" fill="white"/>
</svg>
`;

// Oletus - harmaa ympyrä
export const defaultIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
    </filter>
  </defs>
  <circle cx="20" cy="20" r="16" fill="#666666" stroke="#ffffff" stroke-width="2" filter="url(#shadow)"/>
  <circle cx="20" cy="20" r="6" fill="white"/>
</svg>
`;

// Kaikki ikonit mappina
export const mapIcons: Record<string, string> = {
  accident: accidentIcon,
  disruption: disruptionIcon,
  roadwork: roadworkIcon,
  weather: weatherIcon,
  train: trainIcon,
  camera: cameraIcon,
  police: policeIcon,
  fire: fireIcon,
  bus: busIcon,
  thermometer: thermometerIcon,
  snowflake: snowflakeIcon,
  ice: iceIcon,
  hotlips: hotlipsIcon,
  default: defaultIcon,
};

/**
 * Muunna SVG-string Mapbox-yhteensopivaksi kuvaksi
 */
export function svgToImage(svg: string, size: number = 40): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(size, size);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Lataa kaikki ikonit Mapbox-karttaan
 */
export async function loadMapIcons(map: any): Promise<void> {
  console.log('Loading map icons...');

  for (const [name, svg] of Object.entries(mapIcons)) {
    const iconName = `event-${name}`;

    if (map.hasImage(iconName)) {
      console.log(`Icon ${iconName} already loaded`);
      continue;
    }

    try {
      const img = await svgToImage(svg);
      map.addImage(iconName, img, { sdf: false });
      console.log(`Loaded icon: ${iconName}`);
    } catch (error) {
      console.error(`Failed to load icon ${iconName}:`, error);
    }
  }

  console.log('All map icons loaded');
}
