// src/engine/themeEffects.ts
// Random theme effect generator

import { generateRandomBuff, getBuffDescription, type BuffDefinition } from './buffSystem';

export interface ThemeEffect {
  buff: BuffDefinition;
  description: string;
  descriptionZh: string;
}

// Generate 2-3 random effects for a theme
export function generateThemeEffects(): ThemeEffect[] {
  const effectCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 effects
  const effects: ThemeEffect[] = [];
  
  // 50% chance for buff, 50% for debuff
  const buffCount = Math.floor(Math.random() * effectCount);
  const debuffCount = effectCount - buffCount;
  
  // Generate buffs
  for (let i = 0; i < buffCount; i++) {
    const buff = generateRandomBuff('buff');
    effects.push({
      buff,
      description: getBuffDescription(buff, 'en'),
      descriptionZh: getBuffDescription(buff, 'zh'),
    });
  }
  
  // Generate debuffs
  for (let i = 0; i < debuffCount; i++) {
    const debuff = generateRandomBuff('debuff');
    effects.push({
      buff: debuff,
      description: getBuffDescription(debuff, 'en'),
      descriptionZh: getBuffDescription(debuff, 'zh'),
    });
  }
  
  return effects;
}
