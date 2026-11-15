export const DEFAULT_POINT_1 = { x: 1, y: 2 };
export const DEFAULT_POINT_2 = { x: 3, y: 6 };

export const DEFAULT_SECOND_LINE = { a: 1, b: -1, c: 1 };
export const DEFAULT_SECOND_POINT_3 = { x: 0, y: 1 };
export const DEFAULT_SECOND_POINT_4 = { x: 2, y: 3 };

export const DEFAULT_DISTANCE_POINT = { x: 0, y: 0 };

export const LINE_INPUT_MODES = [
  { value: 'general', label: '一般式 A / B / C' },
  { value: 'points', label: '两点式' },
] as const;

export const DISTANCE_LINE_TARGETS = [
  { value: 'first', label: '第一条直线' },
  { value: 'second', label: '第二条直线' },
] as const;
