// Real geography for the world map: approximate longitude/latitude of every place, the outline of
// Emilia-Romagna, the Adriatic coast, the Po, the Via Emilia, the Comacchio lagoons, the hills and the
// Apennines. Coordinates are rounded (a few km): enough for a game map.

// [longitude, latitude]
export const GEO: Record<string, [number, number]> = {
  bologna: [11.34, 44.49], maggiore: [11.36, 44.58], altedo: [11.49, 44.67], ferrara: [11.62, 44.84],
  osteria: [11.53, 44.41], csp: [11.59, 44.4], imola: [11.71, 44.35], riviera: [12.43, 44.17],
  ravenna: [12.2, 44.42], modena: [10.93, 44.65], parma: [10.33, 44.8],
  casalecchio_di_reno: [11.28, 44.48], pontecchio_marconi: [11.27, 44.43], sasso_marconi: [11.25, 44.4], marzabotto: [11.2, 44.34],
  vergato: [11.11, 44.28], porretta_terme: [10.97, 44.16], lizzano_in_belvedere: [10.89, 44.16], corno_alle_scale: [10.84, 44.12],
  zola_predosa: [11.22, 44.49], crespellano: [11.13, 44.51], bazzano: [11.09, 44.5], monteveglio: [11.1, 44.46],
  san_lazzaro_di_savena: [11.41, 44.47], ozzano_dell_emilia: [11.47, 44.44], pianoro: [11.34, 44.39], loiano: [11.33, 44.27], monghidoro: [11.32, 44.22],
  argelato: [11.35, 44.64], san_giorgio_di_piano: [11.38, 44.65], san_pietro_in_casale: [11.4, 44.7], galliera: [11.39, 44.75],
  pieve_di_cento: [11.31, 44.71], cento: [11.28, 44.73], granarolo_dell_emilia: [11.44, 44.55], budrio: [11.53, 44.54], mezzolara: [11.57, 44.56],
  molinella: [11.67, 44.62], marmorta: [11.7, 44.65], malalbergo: [11.53, 44.72], baricella: [11.54, 44.65], poggio_renatico: [11.48, 44.77],
  medicina: [11.64, 44.48], villafontana: [11.62, 44.52], buda: [11.71, 44.5], varignana: [11.5, 44.39], palesio: [11.55, 44.37],
  dozza: [11.63, 44.36], gallo_bolognese: [11.58, 44.45], castel_guelfo_di_bologna: [11.68, 44.43],
  casalfiumanese: [11.63, 44.3], borgo_tossignano: [11.59, 44.28], fontanelice: [11.56, 44.26], castel_del_rio: [11.5, 44.21],
  castel_bolognese: [11.8, 44.32], faenza: [11.88, 44.29], forli: [12.04, 44.22], forlimpopoli: [12.13, 44.19], cesena: [12.24, 44.14],
  savignano_sul_rubicone: [12.4, 44.09], riolo_terme: [11.73, 44.28], casola_valsenio: [11.62, 44.22], brisighella: [11.77, 44.22], fognano: [11.76, 44.19],
  castrocaro_terme: [11.95, 44.18], predappio: [11.98, 44.1], dovadola: [11.89, 44.12], rocca_san_casciano: [11.84, 44.06], portico_di_romagna: [11.78, 44.03],
  bertinoro: [12.13, 44.15], mercato_saraceno: [12.2, 43.96], sarsina: [12.14, 43.92], bagno_di_romagna: [11.96, 43.84], san_piero_in_bagno: [11.98, 43.87],
  cesenatico: [12.4, 44.2], cervia: [12.35, 44.26], milano_marittima: [12.33, 44.29],
  mordano: [11.81, 44.4], massa_lombarda: [11.83, 44.45], lugo: [11.91, 44.42], bagnacavallo: [11.98, 44.42], russi: [12.03, 44.37],
  fusignano: [11.96, 44.47], alfonsine: [11.98, 44.51], sant_alberto: [12.16, 44.54], mandriole: [12.2, 44.58],
  marina_di_ravenna: [12.28, 44.48], punta_marina: [12.3, 44.44], lido_adriano: [12.31, 44.41],
  rimini: [12.57, 44.06], riccione: [12.66, 44.0], misano_adriatico: [12.7, 43.97], cattolica: [12.74, 43.95],
  verucchio: [12.42, 43.98], san_leo: [12.34, 43.9], novafeltria: [12.29, 43.88], pennabilli: [12.27, 43.82],
  santarcangelo_di_romagna: [12.45, 44.06], viserba: [12.53, 44.1], torre_pedrera: [12.5, 44.12], bellaria_igea_marina: [12.47, 44.15],
  san_giovanni_in_marignano: [12.71, 43.93], saludecio: [12.67, 43.88], mondaino: [12.67, 43.85], montegridolfo: [12.7, 43.86],
  bondeno: [11.42, 44.89], finale_emilia: [11.29, 44.83], mirandola: [11.07, 44.89], concordia_sulla_secchia: [10.98, 44.91],
  voghiera: [11.75, 44.76], portomaggiore: [11.81, 44.7], ostellato: [11.94, 44.74], comacchio: [12.19, 44.69],
  porto_garibaldi: [12.24, 44.68], lido_degli_estensi: [12.25, 44.65], lido_di_spina: [12.25, 44.62],
  copparo: [11.83, 44.89], jolanda_di_savoia: [11.98, 44.88], codigoro: [12.11, 44.83], pomposa: [12.18, 44.83], goro: [12.3, 44.85], gorino: [12.36, 44.82],
  formigine: [10.85, 44.57], maranello: [10.87, 44.52], serramazzoni: [10.79, 44.42], pavullo_nel_frignano: [10.83, 44.33], lama_mocogno: [10.73, 44.31],
  sestola: [10.77, 44.23], fanano: [10.8, 44.2], fiorano_modenese: [10.82, 44.54], sassuolo: [10.78, 44.55], scandiano: [10.69, 44.6],
  spilamberto: [11.02, 44.53], vignola: [11.0, 44.48], savignano_sul_panaro: [11.04, 44.46], soliera: [10.92, 44.74], carpi: [10.88, 44.78], novi_di_modena: [10.9, 44.89],
  rubiera: [10.78, 44.65], reggio_emilia: [10.63, 44.7], sant_ilario_d_enza: [10.45, 44.76],
  albinea: [10.6, 44.62], quattro_castella: [10.47, 44.64], canossa: [10.46, 44.58], castelnovo_ne_monti: [10.4, 44.43], cerreto_laghi: [10.23, 44.3],
  correggio: [10.78, 44.77], novellara: [10.73, 44.85], guastalla: [10.66, 44.92], luzzara: [10.69, 44.96], gualtieri: [10.63, 44.9], brescello: [10.52, 44.9],
  fidenza: [10.06, 44.87], fiorenzuola_d_arda: [9.91, 44.93], cadeo: [9.83, 44.97], piacenza: [9.69, 45.05], rottofreno: [9.55, 45.06], castel_san_giovanni: [9.43, 45.06],
  salsomaggiore_terme: [9.98, 44.81], pellegrino_parmense: [9.93, 44.73], bardi: [9.73, 44.63], castell_arquato: [9.87, 44.85], lugagnano_val_d_arda: [9.83, 44.82],
  grazzano_visconti: [9.65, 44.94], vigolzone: [9.67, 44.91], rivergaro: [9.6, 44.91], travo: [9.54, 44.86], bobbio: [9.39, 44.77], ottone: [9.33, 44.62],
  collecchio: [10.22, 44.75], langhirano: [10.27, 44.62], tizzano_val_parma: [10.2, 44.52], corniglio: [10.09, 44.48], lagdei: [10.03, 44.41],
  colorno: [10.38, 44.93], sissa_trecasali: [10.26, 44.96], roccabianca: [10.22, 45.01], zibello: [10.13, 45.02], busseto: [10.04, 44.98],
};

// Outline of the region (clockwise from the west, on the Po near Castel San Giovanni).
const OUTLINE: [number, number][] = [
  [9.2, 45.07], [9.4, 45.12], [9.55, 45.11], [9.75, 45.09], [9.95, 45.07], [10.15, 45.05], [10.3, 45.0], [10.45, 44.95], [10.6, 44.97],
  [10.75, 44.99], [10.9, 44.96], [11.05, 44.95], [11.25, 44.94], [11.45, 44.95], [11.62, 44.97], [11.8, 44.96], [12.0, 44.95], [12.2, 44.92],
  [12.32, 44.92], [12.42, 44.86], [12.38, 44.78], [12.29, 44.7], [12.27, 44.6], [12.29, 44.5], [12.32, 44.4], [12.37, 44.27], [12.46, 44.17],
  [12.56, 44.08], [12.66, 44.01], [12.76, 43.97], [12.74, 43.9], [12.62, 43.86], [12.5, 43.85], [12.38, 43.8], [12.22, 43.76], [12.05, 43.77],
  [11.92, 43.8], [11.8, 43.92], [11.7, 44.02], [11.55, 44.12], [11.4, 44.15], [11.25, 44.14], [11.1, 44.1], [10.95, 44.09], [10.8, 44.11],
  [10.65, 44.16], [10.45, 44.24], [10.25, 44.29], [10.1, 44.36], [9.95, 44.43], [9.75, 44.5], [9.55, 44.55], [9.38, 44.58], [9.25, 44.68],
  [9.15, 44.85], [9.2, 45.07],
];
// The foot of the hills: the Via Emilia, from Piacenza to Rimini.
export const VIA_EMILIA: [number, number][] = [
  [9.43, 45.06], [9.69, 45.05], [9.91, 44.93], [10.06, 44.87], [10.33, 44.8], [10.63, 44.7], [10.93, 44.65], [11.1, 44.56], [11.34, 44.49],
  [11.53, 44.41], [11.71, 44.35], [11.88, 44.29], [12.04, 44.22], [12.24, 44.14], [12.4, 44.09], [12.57, 44.06],
];
// The Po along the northern border, out to its delta.
const PO: [number, number][] = [
  [9.2, 45.09], [9.55, 45.09], [9.75, 45.07], [9.95, 45.05], [10.15, 45.03], [10.3, 44.98], [10.45, 44.93], [10.6, 44.95], [10.75, 44.97],
  [10.9, 44.94], [11.05, 44.93], [11.25, 44.92], [11.45, 44.93], [11.62, 44.95], [11.8, 44.94], [12.0, 44.93], [12.2, 44.9], [12.32, 44.9], [12.42, 44.86],
];
const LON0 = 9.05, LAT0 = 45.2;
/** Map pixels per degree at zoom 1 (longitude shrunk by cos(44.5°)). */
export const KX = 300, KY = 300 / 0.713;
export const GEO_W = Math.round((12.9 - LON0) * KX), GEO_H = Math.round((LAT0 - 43.7) * KY);
export const project = (lon: number, lat: number): [number, number] => [(lon - LON0) * KX, (LAT0 - lat) * KY];

let cached: string | null = null;
/** The region drawn once (web): sea, neighbouring land, plain, hills, mountains, Po, lagoons. */
export function regionImage(scale = 2): string | null {
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = GEO_W * scale;
  c.height = GEO_H * scale;
  const g = c.getContext("2d");
  if (!g) return null;
  g.scale(scale, scale);
  const path = (pts: [number, number][], close = true) => {
    g.beginPath();
    pts.forEach(([lo, la], i) => { const [x, y] = project(lo, la); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  };
  // Neighbouring regions and the Adriatic (everything east of the coast).
  g.fillStyle = "#e9e3cf";
  g.fillRect(0, 0, GEO_W, GEO_H);
  const coastIdx = OUTLINE.findIndex(([lo, la]) => lo === 12.42 && la === 44.86);
  const coast = OUTLINE.slice(coastIdx, OUTLINE.findIndex(([lo, la]) => lo === 12.76) + 1);
  path([[12.42, 45.2], ...coast, [12.76, 43.7], [12.9, 43.7], [12.9, 45.2]]);
  const sea = g.createLinearGradient(project(12.2, 44)[0], 0, GEO_W, 0);
  sea.addColorStop(0, "#7ec8ef");
  sea.addColorStop(1, "#3f9bd8");
  g.fillStyle = sea;
  g.fill();
  // Gentle waves.
  g.strokeStyle = "rgba(255,255,255,0.45)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) {
    const [x, y] = project(12.5 + ((i * 37) % 9) * 0.04, 44.95 - i * 0.045);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 4, x + 12, y); g.quadraticCurveTo(x + 18, y + 4, x + 24, y); g.stroke();
  }
  // The region: plain everywhere, then hills and mountains south of the Via Emilia (clipped inside).
  path(OUTLINE);
  g.save();
  g.clip();
  g.fillStyle = "#d6eaa4";
  g.fillRect(0, 0, GEO_W, GEO_H);
  const band = (from: number, to: number, color: string) => {
    const top = VIA_EMILIA.map(([lo, la]) => [lo, la - from] as [number, number]);
    const bottom = VIA_EMILIA.map(([lo, la]) => [lo, la - to] as [number, number]).reverse();
    path([[9.0, VIA_EMILIA[0][1] - from], ...top, [12.9, VIA_EMILIA[VIA_EMILIA.length - 1][1] - from], [12.9, 43.5], [9.0, 43.5]]);
    void bottom;
    g.fillStyle = color;
    g.fill();
  };
  band(0.03, 0, "#b9dc8c"); // hills
  band(0.15, 0, "#93c47d"); // low mountains
  band(0.27, 0, "#79ad6a"); // Apennine ridge
  // Little peaks along the ridge, snow on the highest ones (Cimone, Corno alle Scale, Cusna).
  for (let lo = 9.45; lo < 12.4; lo += 0.12) {
    const ridge = VIA_EMILIA.reduce((best, p) => (Math.abs(p[0] - lo) < Math.abs(best[0] - lo) ? p : best))[1] - 0.36;
    const [x, y] = project(lo, ridge + ((lo * 7) % 0.08));
    g.fillStyle = "#5f8f55";
    g.beginPath(); g.moveTo(x - 9, y + 8); g.lineTo(x, y - 6); g.lineTo(x + 9, y + 8); g.closePath(); g.fill();
    if ([10.65, 10.77, 10.89, 10.41].some((v) => Math.abs(v - lo) < 0.06)) { g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(x - 3, y - 1); g.lineTo(x, y - 6); g.lineTo(x + 3, y - 1); g.closePath(); g.fill(); }
  }
  // Fields texture in the plain.
  g.strokeStyle = "rgba(120,150,60,0.18)";
  g.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const [x, y] = project(9.4 + ((i * 53) % 300) / 100, 44.95 - ((i * 29) % 40) / 100);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y); g.moveTo(x, y + 3); g.lineTo(x + 14, y + 3); g.stroke();
  }
  // Valli di Comacchio (lagoons).
  g.fillStyle = "#9fd6ef";
  for (const [lo, la, r] of [[12.1, 44.62, 16], [12.03, 44.6, 11], [12.16, 44.58, 9]] as [number, number, number][]) {
    const [x, y] = project(lo, la);
    g.beginPath(); g.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  // Sandy beach along the coast and the region border.
  path(coast, false);
  g.strokeStyle = "#f3dc9a";
  g.lineWidth = 5;
  g.stroke();
  path(OUTLINE);
  g.strokeStyle = "rgba(60,50,30,0.55)";
  g.lineWidth = 2;
  g.stroke();
  // The Po.
  path(PO, false);
  g.strokeStyle = "#4aa3df";
  g.lineWidth = 4;
  g.lineJoin = "round";
  g.stroke();
  cached = c.toDataURL("image/png");
  return cached;
}
