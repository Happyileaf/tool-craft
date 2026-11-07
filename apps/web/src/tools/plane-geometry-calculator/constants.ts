/**
 * 平面解析几何工具的模块切换与默认值
 */

export enum GeometryModule {
  /** 两点参数 */
  TWO_POINTS = 'two-points',
  /** 两直线关系与交点 */
  LINES = 'lines',
  /** 点到直线距离 */
  POINT_LINE = 'point-line',
}

export const MODULE_OPTIONS: { label: string; value: GeometryModule }[] = [
  { label: '两点参数 / 直线方程', value: GeometryModule.TWO_POINTS },
  { label: '两直线关系与交点', value: GeometryModule.LINES },
  { label: '点到直线距离', value: GeometryModule.POINT_LINE },
];
