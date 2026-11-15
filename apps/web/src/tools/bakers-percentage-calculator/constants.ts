export const DEFAULT_FLOUR_GRAMS = 1000;

export interface PresetIngredient {
  name: string;
  grams: number;
}

export interface PresetRecipe {
  key: string;
  label: string;
  description: string;
  ingredients: PresetIngredient[];
}

export const DEFAULT_INGREDIENTS: PresetIngredient[] = [
  { name: '水', grams: 650 },
  { name: '盐', grams: 20 },
  { name: '细砂糖', grams: 50 },
  { name: '干酵母', grams: 10 },
];

export const PRESET_RECIPES: PresetRecipe[] = [
  {
    key: 'lean',
    label: '基础法棍面团',
    description: '面粉 100% / 水 70% / 盐 2% / 酵母 1%',
    ingredients: [
      { name: '水', grams: 700 },
      { name: '盐', grams: 20 },
      { name: '干酵母', grams: 10 },
    ],
  },
  {
    key: 'toast',
    label: '日式吐司',
    description: '面粉 100% / 水 65% / 盐 1.8% / 糖 6% / 黄油 5% / 酵母 1.2%',
    ingredients: [
      { name: '水', grams: 650 },
      { name: '盐', grams: 18 },
      { name: '细砂糖', grams: 60 },
      { name: '黄油', grams: 50 },
      { name: '干酵母', grams: 12 },
    ],
  },
  {
    key: 'bagel',
    label: '贝果面团',
    description: '面粉 100% / 水 55% / 盐 2% / 糖 3% / 酵母 0.8%',
    ingredients: [
      { name: '水', grams: 550 },
      { name: '盐', grams: 20 },
      { name: '细砂糖', grams: 30 },
      { name: '干酵母', grams: 8 },
    ],
  },
  {
    key: 'sourdough',
    label: '酸种乡村面包',
    description: '面粉 100% / 水 75% / 盐 2% / 酸种 20%',
    ingredients: [
      { name: '水', grams: 750 },
      { name: '盐', grams: 20 },
      { name: '酸种', grams: 200 },
    ],
  },
];

export const SCALE_TARGETS = [
  { value: 'flour', label: '按目标面粉重量' },
  { value: 'factor', label: '按缩放倍数' },
  { value: 'totalWeight', label: '按目标面团总重' },
] as const;

export const MOLD_SHAPES = [
  { value: 'round', label: '圆模（按直径平方）' },
  { value: 'square', label: '方模（按边长平方）' },
  { value: 'height', label: '同底面积改高度' },
] as const;

export const DEFAULT_MOLD_ORIGINAL = 20;
export const DEFAULT_MOLD_NEW = 25;
