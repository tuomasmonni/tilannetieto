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
    id: '3064',
    label: 'Sairastavuusindeksi',
    description: 'THL:n ikävakioitu sairastavuusindeksi, koko maa = 100',
    unit: 'indeksi',
    colorScale: 'greenToRed',
  },
  {
    id: '92',
    label: 'Elinajanodote',
    description: 'Vastasyntyneen elinajanodote (vuosia)',
    unit: 'vuotta',
    colorScale: 'redToGreen',
  },
  {
    id: '127',
    label: 'Väestö',
    description: 'Väestö 31.12.',
    unit: 'henkilöä',
    colorScale: 'blueToRed',
  },
  {
    id: '142',
    label: 'Sydän- ja verisuonitautikuolleisuus',
    description: 'Kuolleisuus verenkiertoelinten sairauksiin / 100 000 as.',
    unit: '/ 100k as.',
    colorScale: 'greenToRed',
  },
  {
    id: '143',
    label: 'Syöpäkuolleisuus',
    description: 'Kuolleisuus kasvaimiin / 100 000 as.',
    unit: '/ 100k as.',
    colorScale: 'greenToRed',
  },
  {
    id: '244',
    label: 'Toimeentulotuki',
    description: 'Toimeentulotukea saaneet 25+ -vuotiaat, % vastaavanikäisestä väestöstä',
    unit: '%',
    colorScale: 'greenToRed',
  },
];
