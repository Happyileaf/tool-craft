/**
 * 工具目录视图密度枚举，描述工具集合的展示形态
 */
export enum ViewModeEnum {
  /** 卡片网格视图 */
  GRID = 'grid',
  /** 高密度列表视图 */
  LIST = 'list',
}

/**
 * 视图密度名称 Map，键为视图模式枚举值，值为面向用户展示的中文名称
 */
export const ViewModeLabelMap: Record<ViewModeEnum, string> = {
  /** 网格视图 */
  [ViewModeEnum.GRID]: '网格视图',
  /** 列表视图 */
  [ViewModeEnum.LIST]: '列表视图',
};

/**
 * 视图密度选项数据源，顺序与视图模式枚举定义顺序保持一致
 */
export const ViewModeOptions = Object.values(ViewModeEnum).map((value) => ({
  label: ViewModeLabelMap[value],
  value,
}));
