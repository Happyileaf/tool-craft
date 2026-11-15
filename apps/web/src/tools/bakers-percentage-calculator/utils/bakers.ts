export type IngredientKind = 'water' | 'salt' | 'yeast' | 'other';

export interface RecipeIngredientInput {
  name: string;
  /** 克数，按克数录入时使用 */
  grams?: number | null;
  /** 烘焙百分比，按百分比录入时使用 */
  percent?: number | null;
}

export interface RecipeRow {
  name: string;
  grams: number;
  percent: number;
  kind: IngredientKind;
}

export interface RecipeAnalysis {
  flourGrams: number;
  rows: RecipeRow[];
  /** 含面粉基准的总百分比 */
  totalPercent: number;
  totalWeight: number;
  hydration: number;
  saltPercent: number;
  yeastPercent: number;
}

export interface ScaledRecipe {
  factor: number;
  flourGrams: number;
  rows: RecipeRow[];
  totalWeight: number;
}

export type ScaleTarget = 'flour' | 'factor' | 'totalWeight';

export type MoldShape = 'round' | 'square' | 'height';

/**
 * 按名称识别配料类型，用于计算含水量、盐与酵母比例
 */
export function classifyIngredient(name: string): IngredientKind {
  const text = name.trim().toLowerCase();
  if (/水|water/.test(text)) {
    return 'water';
  }
  if (/盐|salt/.test(text)) {
    return 'salt';
  }
  if (/酵母|yeast|老面|酸种|酵种/.test(text)) {
    return 'yeast';
  }
  return 'other';
}

/**
 * 分析配方：以面粉重量为 100% 基准，换算每种配料的克数与烘焙百分比
 */
export function analyzeRecipe(
  flourGrams: number,
  ingredients: RecipeIngredientInput[],
): RecipeAnalysis {
  if (!Number.isFinite(flourGrams) || flourGrams <= 0) {
    throw new Error('面粉重量必须大于 0');
  }
  const rows: RecipeRow[] = ingredients.map((ingredient) => {
    const name = ingredient.name.trim() || '未命名配料';
    let grams: number;
    if (ingredient.grams !== null && ingredient.grams !== undefined) {
      if (!Number.isFinite(ingredient.grams) || ingredient.grams < 0) {
        throw new Error(`配料「${name}」的克数必须为不小于 0 的数值`);
      }
      grams = ingredient.grams;
    } else if (ingredient.percent !== null && ingredient.percent !== undefined) {
      if (!Number.isFinite(ingredient.percent) || ingredient.percent < 0) {
        throw new Error(`配料「${name}」的百分比必须为不小于 0 的数值`);
      }
      grams = (flourGrams * ingredient.percent) / 100;
    } else {
      throw new Error(`请为配料「${name}」填写克数或百分比`);
    }
    return {
      name,
      grams,
      percent: (grams / flourGrams) * 100,
      kind: classifyIngredient(name),
    };
  });

  const totalIngredientPercent = rows.reduce((sum, row) => sum + row.percent, 0);
  const totalWeight = flourGrams + rows.reduce((sum, row) => sum + row.grams, 0);
  const hydration = rows
    .filter((row) => row.kind === 'water')
    .reduce((sum, row) => sum + row.percent, 0);
  const saltPercent = rows
    .filter((row) => row.kind === 'salt')
    .reduce((sum, row) => sum + row.percent, 0);
  const yeastPercent = rows
    .filter((row) => row.kind === 'yeast')
    .reduce((sum, row) => sum + row.percent, 0);

  return {
    flourGrams,
    rows,
    totalPercent: 100 + totalIngredientPercent,
    totalWeight,
    hydration,
    saltPercent,
    yeastPercent,
  };
}

/**
 * 按面粉重量、缩放倍数或目标总重缩放配方
 */
export function scaleRecipe(
  analysis: RecipeAnalysis,
  target: ScaleTarget,
  value: number,
): ScaledRecipe {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('缩放目标必须大于 0');
  }
  let factor: number;
  if (target === 'flour') {
    factor = value / analysis.flourGrams;
  } else if (target === 'factor') {
    factor = value;
  } else {
    factor = value / analysis.totalWeight;
  }
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new Error('无法得到有效的缩放倍数');
  }
  const flourGrams = analysis.flourGrams * factor;
  return {
    factor,
    flourGrams,
    rows: analysis.rows.map((row) => ({
      ...row,
      grams: row.grams * factor,
    })),
    totalWeight: analysis.totalWeight * factor,
  };
}

/**
 * 计算模具换算倍数：圆模按直径平方，方模按边长平方，同底面积改高度按高度比
 */
export function moldFactor(
  shape: MoldShape,
  originalSize: number,
  newSize: number,
): number {
  if (!Number.isFinite(originalSize) || originalSize <= 0) {
    throw new Error('原模具尺寸必须大于 0');
  }
  if (!Number.isFinite(newSize) || newSize <= 0) {
    throw new Error('新模具尺寸必须大于 0');
  }
  if (shape === 'round' || shape === 'square') {
    return (newSize / originalSize) ** 2;
  }
  return newSize / originalSize;
}

/**
 * 四舍五入到 0.1 克
 */
export function roundGrams(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 10) / 10;
}

/**
 * 格式化百分比，保留一位小数
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return `${(Math.round(value * 10) / 10).toFixed(1)}%`;
}
