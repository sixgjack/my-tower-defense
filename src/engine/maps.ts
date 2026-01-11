// src/engine/maps.ts

export const MAP_LAYOUTS = [
  // MAP 1: RHINE LAB (Tech/Blue) - Simple winding path
  {
    id: "rhine_01",
    theme: "theme-rhine",
    name: "Sector 01: Entrance",
    width: 8, height: 6,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      ['S', 0, 0, 1, 1, 0, 0, 'B'],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  // MAP 2: KAZDEL (Ruins/Orange) - Two corridors
  {
    id: "kazdel_02",
    theme: "theme-kazdel",
    name: "Sector 02: Ruins",
    width: 8, height: 6,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      ['S', 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 1],
      [1, 1, 'B', 1, 1, 1, 1, 1],
    ]
  },
  // MAP 3: KJERAG (Ice/Cyan) - Zig Zag
  {
    id: "kjerag_03",
    theme: "theme-kjerag",
    name: "Sector 03: Snow Mountain",
    width: 8, height: 6,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      ['S', 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 0, 1, 0, 1, 0, 1],
      [1, 1, 0, 1, 0, 1, 0, 1],
      [1, 1, 0, 0, 0, 1, 0, 'B'],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  // MAP 4: SIESTA (Lava/Red) - The "U" Turn
  {
    id: "siesta_04",
    theme: "theme-siesta",
    name: "Sector 04: Volcano",
    width: 8, height: 6,
    grid: [
      [1, 'S', 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1],
      [1, 'B', 1, 1, 1, 1, 1, 1],
    ]
  },
  // MAP 5: SARGON (Jungle/Green) - Tight choke points
  {
    id: "sargon_05",
    theme: "theme-sargon",
    name: "Sector 05: Deep Jungle",
    width: 8, height: 6,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      ['S', 0, 0, 1, 1, 0, 0, 'B'],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  // MAP 6: LUNGMEN (Neon/Purple) - City Streets
  {
    id: "lungmen_06",
    theme: "theme-lungmen",
    name: "Sector 06: Night City",
    width: 8, height: 6,
    grid: [
      ['S', 0, 1, 1, 1, 1, 0, 'B'],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  // MAP 7: IBERIA (Ocean/Deep Blue) - Coastal
  {
    id: "iberia_07",
    theme: "theme-iberia",
    name: "Sector 07: Coastline",
    width: 8, height: 6,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      ['S', 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 'B'],
    ]
  },
  // MAP 8: LATERANO (Holy/Gold) - The Cross
  {
    id: "laterano_08",
    theme: "theme-laterano",
    name: "Sector 08: Sanctuary",
    width: 8, height: 6,
    grid: [
      [1, 1, 1, 'S', 1, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 'B', 1, 1, 1, 1],
    ]
  },
  // MAP 9: URSUS (Military/Grey) - Trenches
  {
    id: "ursus_09",
    theme: "theme-ursus",
    name: "Sector 09: Frontline",
    width: 8, height: 6,
    grid: [
      ['S', 0, 1, 0, 0, 0, 1, 'B'],
      [1, 0, 1, 0, 1, 0, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  // MAP 10: THE VOID (Glitch/Green) - The End
  {
    id: "void_10",
    theme: "theme-void",
    name: "Sector 10: SYSTEM CORE",
    width: 8, height: 6,
    grid: [
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 'S', 1, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 'B', 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
    ]
  }
];