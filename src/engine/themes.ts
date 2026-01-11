// src/engine/themes.ts

export interface Theme {
  id: string;
  name: string;
  bg: string;         // CSS background color
  highGround: string; // Color for placeable tiles
  path: string;       // Color for enemy path
  accent: string;     // UI accent color
  text: string;       // Text color
}

export const THEMES: Theme[] = [
  { id: 'rhine', name: 'Rhine Lab', bg: '#0f172a', highGround: '#1e293b', path: '#334155', accent: '#38bdf8', text: '#e0f2fe' },
  { id: 'kazdel', name: 'Kazdel Ruins', bg: '#2a1208', highGround: '#431407', path: '#572e21', accent: '#f97316', text: '#ffedd5' },
  { id: 'lungmen', name: 'Lungmen Slums', bg: '#170f2a', highGround: '#2e1065', path: '#4c1d95', accent: '#a855f7', text: '#f3e8ff' },
  { id: 'siesta', name: 'Siesta Beach', bg: '#083344', highGround: '#164e63', path: '#fef08a', accent: '#fde047', text: '#f0f9ff' },
  { id: 'laterano', name: 'Laterano Chapel', bg: '#422006', highGround: '#713f12', path: '#fef3c7', accent: '#fbbf24', text: '#fffbeb' },
  { id: 'victoria', name: 'Victoria Storm', bg: '#111827', highGround: '#374151', path: '#6b7280', accent: '#9ca3af', text: '#f3f4f6' },
  { id: 'kjerag', name: 'Kjerag Icefield', bg: '#082f49', highGround: '#0c4a6e', path: '#cffafe', accent: '#22d3ee', text: '#ecfeff' },
  { id: 'sargon', name: 'Sargon Jungle', bg: '#022c22', highGround: '#064e3b', path: '#065f46', accent: '#34d399', text: '#ecfdf5' },
  { id: 'iberia', name: 'Iberia Depths', bg: '#020617', highGround: '#172554', path: '#1e3a8a', accent: '#3b82f6', text: '#dbeafe' },
  { id: 'ursus', name: 'Ursus Tundra', bg: '#262626', highGround: '#404040', path: '#737373', accent: '#a3a3a3', text: '#fafafa' },
  { id: 'yan', name: 'Yan Mountains', bg: '#27272a', highGround: '#44403c', path: '#78716c', accent: '#d6d3d1', text: '#fafaf9' },
  { id: 'siracusa', name: 'Siracusa Rain', bg: '#18181b', highGround: '#27272a', path: '#3f3f46', accent: '#71717a', text: '#f4f4f5' },
  { id: 'minos', name: 'Minos Temple', bg: '#2e1065', highGround: '#4c1d95', path: '#ddd6fe', accent: '#8b5cf6', text: '#f5f3ff' },
  { id: 'bolivar', name: 'Bolivar Plains', bg: '#3f1807', highGround: '#7c2d12', path: '#fdba74', accent: '#ea580c', text: '#fff7ed' },
  { id: 'higashi', name: 'Higashi Shrine', bg: '#450a0a', highGround: '#7f1d1d', path: '#fecaca', accent: '#ef4444', text: '#fef2f2' },
  { id: 'leithanien', name: 'Leithanien Arts', bg: '#2e0a29', highGround: '#500724', path: '#fbcfe8', accent: '#db2777', text: '#fdf2f8' },
  { id: 'sami', name: 'Sami Woods', bg: '#052e16', highGround: '#14532d', path: '#a7f3d0', accent: '#10b981', text: '#ecfdf5' },
  { id: 'aegir', name: 'Aegir Tech', bg: '#000000', highGround: '#1e1b4b', path: '#0284c7', accent: '#00ffff', text: '#e0f2fe' },
  { id: 'durin', name: 'Durin Underground', bg: '#1c1917', highGround: '#292524', path: '#57534e', accent: '#d6d3d1', text: '#fafaf9' },
  { id: 'seaborn', name: 'The Seaborn', bg: '#0b1120', highGround: '#1e293b', path: '#f472b6', accent: '#ec4899', text: '#fce7f3' },
];