/**
 * Sotkanet-indikaattorit (THL)
 *
 * Valitut indikaattorit dashboardiin.
 * Kattava lista: https://sotkanet.fi/sotkanet/fi/taulukko
 */

export interface SotkanetIndicator {
  id: string;
  label: string;
  description: string;
  unit: string;
  colorScale: 'greenToRed' | 'redToGreen' | 'blueToRed';
}

export const SOTKANET_INDICATORS: SotkanetIndicator[] = [
  {
    id: '5641',
    label: 'Sairastavuusindeksi',
    description: 'THL:n ikävakioitu sairastavuusindeksi, koko maa = 100',
    unit: 'indeksi',
    colorScale: 'greenToRed',
  },
  {
    id: '186',
    label: 'Yleiskuolleisuus',
    description: 'Kuolleisuus / 100 000 asukasta',
    unit: '/ 100k as.',
    colorScale: 'greenToRed',
  },
  {
    id: '127',
    label: 'Väestö',
    description: 'Väestö 31.12.',
    unit: 'henkilöä',
    colorScale: 'blueToRed',
  },
  {
    id: '3694',
    label: 'Sydän- ja verisuonitautikuolleisuus',
    description: 'Kuolleisuus verenkiertoelinsairauksiin / 100 000 asukasta',
    unit: '/ 100k as.',
    colorScale: 'greenToRed',
  },
  {
    id: '5643',
    label: 'Syöpäindeksi',
    description: 'Syöpäindeksi, ikävakioitu (koko maa = 100)',
    unit: 'indeksi',
    colorScale: 'greenToRed',
  },
  {
    id: '5659',
    label: 'Alkoholisairastavuus',
    description: 'Alkoholisairastavuusindeksi, ikävakioitu (koko maa = 100)',
    unit: 'indeksi',
    colorScale: 'greenToRed',
  },
];
