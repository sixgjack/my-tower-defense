// src/utils/themeHelpers.ts
// Helper functions for theme descriptions and effects
import type { Theme } from '../engine/data';
import { i18n } from './i18n';

/**
 * Get a human-readable description of theme effects
 */
export function getThemeEffectsDescription(theme: Theme): string {
  const effects: string[] = [];
  const lang = i18n.getLanguage();
  
  if (theme.towerCooldownMultiplier) {
    if (theme.towerCooldownMultiplier < 1.0) {
      const percent = Math.round((1 - theme.towerCooldownMultiplier) * 100);
      effects.push(lang === 'zh' 
        ? `砲塔攻擊速度 +${percent}%` 
        : `Tower Attack Speed +${percent}%`);
    } else if (theme.towerCooldownMultiplier > 1.0) {
      const percent = Math.round((theme.towerCooldownMultiplier - 1) * 100);
      effects.push(lang === 'zh' 
        ? `砲塔攻擊速度 -${percent}%` 
        : `Tower Attack Speed -${percent}%`);
    }
  }
  
  if (theme.towerRangeMultiplier) {
    if (theme.towerRangeMultiplier > 1.0) {
      const percent = Math.round((theme.towerRangeMultiplier - 1) * 100);
      effects.push(lang === 'zh' 
        ? `砲塔射程 +${percent}%` 
        : `Tower Range +${percent}%`);
    } else if (theme.towerRangeMultiplier < 1.0) {
      const percent = Math.round((1 - theme.towerRangeMultiplier) * 100);
      effects.push(lang === 'zh' 
        ? `砲塔射程 -${percent}%` 
        : `Tower Range -${percent}%`);
    }
  }
  
  if (theme.towerDamageMultiplier) {
    if (theme.towerDamageMultiplier > 1.0) {
      const percent = Math.round((theme.towerDamageMultiplier - 1) * 100);
      effects.push(lang === 'zh' 
        ? `砲塔傷害 +${percent}%` 
        : `Tower Damage +${percent}%`);
    } else if (theme.towerDamageMultiplier < 1.0) {
      const percent = Math.round((1 - theme.towerDamageMultiplier) * 100);
      effects.push(lang === 'zh' 
        ? `砲塔傷害 -${percent}%` 
        : `Tower Damage -${percent}%`);
    }
  }
  
  if (theme.enemySpeedMultiplier) {
    if (theme.enemySpeedMultiplier > 1.0) {
      const percent = Math.round((theme.enemySpeedMultiplier - 1) * 100);
      effects.push(lang === 'zh' 
        ? `敵人移動速度 +${percent}%` 
        : `Enemy Speed +${percent}%`);
    } else if (theme.enemySpeedMultiplier < 1.0) {
      const percent = Math.round((1 - theme.enemySpeedMultiplier) * 100);
      effects.push(lang === 'zh' 
        ? `敵人移動速度 -${percent}%` 
        : `Enemy Speed -${percent}%`);
    }
  }
  
  if (theme.enemyHpMultiplier) {
    if (theme.enemyHpMultiplier > 1.0) {
      const percent = Math.round((theme.enemyHpMultiplier - 1) * 100);
      effects.push(lang === 'zh' 
        ? `敵人生命值 +${percent}%` 
        : `Enemy HP +${percent}%`);
    } else if (theme.enemyHpMultiplier < 1.0) {
      const percent = Math.round((1 - theme.enemyHpMultiplier) * 100);
      effects.push(lang === 'zh' 
        ? `敵人生命值 -${percent}%` 
        : `Enemy HP -${percent}%`);
    }
  }
  
  if (theme.moneyBonus && theme.moneyBonus > 0) {
    effects.push(lang === 'zh' 
      ? `每擊殺額外金錢 +${theme.moneyBonus}` 
      : `+${theme.moneyBonus} Money per Kill`);
  }
  
  if (effects.length === 0) {
    return lang === 'zh' ? '標準環境，無特殊效果' : 'Standard environment, no special effects';
  }
  
  return effects.join(', ');
}

/**
 * Get theme description (manual description if available, otherwise auto-generated)
 */
export function getThemeDescription(theme: Theme): string {
  const lang = i18n.getLanguage();
  
  if (lang === 'zh' && theme.descriptionZh) {
    return theme.descriptionZh;
  }
  if (theme.description) {
    return theme.description;
  }
  
  // Auto-generate description from effects
  return getThemeEffectsDescription(theme);
}
