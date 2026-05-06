import { TOWERS } from '../engine/data';

type TowerAssetMap = Partial<Record<keyof typeof TOWERS, string>>;

interface VisualAssetConfig {
  towers: TowerAssetMap;
  enemiesByName: Record<string, string>;
  enemiesByIcon: Record<string, string>;
}

// Drop your GIF files into public/assets/gifs and update paths here.
// Example: '/assets/gifs/towers/basic_rifle.gif'
export const VISUAL_ASSETS: VisualAssetConfig = {
  towers: {
    BASIC_RIFLE: '',
    BASIC_CANNON: '',
    BASIC_SNIPER: '',
    BASIC_SHOTGUN: '',
    BASIC_FREEZE: '',
    BASIC_BURN: '',
    BASIC_STUN: '',
    BASIC_HEAL: '',
    CHAIN_LIGHTNING: '',
    PENETRATOR: '',
    GATLING: '',
    ARTILLERY: '',
    EXPLOSIVE: '',
    LASER_BEAM: '',
    INFERNO: '',
    POISON_TOWER: '',
    SLOW_FIELD: '',
    STUN_TOWER: '',
    VORTEX: '',
    PUSHER: '',
    DAMAGE_BUFF: '',
    SPEED_BUFF: '',
    RANGE_BUFF: '',
    HEALER: '',
    BOOMERANG: '',
    MINE_LAYER: '',
    ORBITAL: '',
    EXECUTIONER: '',
    BANKER: '',
    WEAKEN: '',
    SUMMONER: ''
  },
  enemiesByName: {},
  enemiesByIcon: {}
};

const normalizeEnemyName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, '_');

export const getTowerGifAsset = (towerKey: string): string | undefined => {
  return VISUAL_ASSETS.towers[towerKey as keyof typeof TOWERS];
};

export const getEnemyGifAsset = (
  enemyName?: string,
  enemyIcon?: string
): string | undefined => {
  if (enemyName) {
    const byName = VISUAL_ASSETS.enemiesByName[normalizeEnemyName(enemyName)];
    if (byName) return byName;
  }
  if (enemyIcon) {
    const byIcon = VISUAL_ASSETS.enemiesByIcon[enemyIcon];
    if (byIcon) return byIcon;
  }
  return undefined;
};
