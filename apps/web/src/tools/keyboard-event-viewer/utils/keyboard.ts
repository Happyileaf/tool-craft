/**
 * 键盘事件 / 按键码工具的零依赖纯函数与静态速查数据
 *
 * 组件只负责订阅真实 KeyboardEvent；本表与格式化函数均可在 Node 下单测。
 * keyCode / which 属于已废弃（legacy）属性，仅用于兼容老代码速查。
 */

/** KeyboardEvent.location 取值 */
export const KEY_LOCATION = {
  STANDARD: 0,
  LEFT: 1,
  RIGHT: 2,
  NUMPAD: 3,
} as const;

/** location 码 → 可读名称 */
export function getLocationName(location: number): string {
  switch (location) {
    case KEY_LOCATION.STANDARD:
      return '标准';
    case KEY_LOCATION.LEFT:
      return '左侧';
    case KEY_LOCATION.RIGHT:
      return '右侧';
    case KEY_LOCATION.NUMPAD:
      return '数字小键盘';
    default:
      return `未知(${location})`;
  }
}

/** 速查表条目 */
export interface KeyRow {
  /** 展示用按键名 */
  label: string;
  /** 废弃的 keyCode / which 数值 */
  keyCode: number;
  /** 物理按键 code */
  code: string;
  /** 典型 key 值（未按修饰键时） */
  key: string;
  /** 分组 */
  group: '字母' | '数字' | '功能键' | '控制键' | '方向键';
}

/** A–Z（keyCode 65–90，code 为 KeyA–KeyZ） */
const LETTER_ROWS: KeyRow[] = Array.from({ length: 26 }, (_, index) => {
  const upper = String.fromCharCode(65 + index);
  return {
    label: upper,
    keyCode: 65 + index,
    code: `Key${upper}`,
    key: upper.toLowerCase(),
    group: '字母',
  };
});

/** 主键盘 0–9（keyCode 48–57，code 为 Digit0–Digit9） */
const DIGIT_ROWS: KeyRow[] = Array.from({ length: 10 }, (_, index) => ({
  label: String(index),
  keyCode: 48 + index,
  code: `Digit${index}`,
  key: String(index),
  group: '数字',
}));

/** F1–F12（keyCode 112–123） */
const FUNCTION_ROWS: KeyRow[] = Array.from({ length: 12 }, (_, index) => ({
  label: `F${index + 1}`,
  keyCode: 112 + index,
  code: `F${index + 1}`,
  key: `F${index + 1}`,
  group: '功能键',
}));

/** 常用控制键 */
const CONTROL_ROWS: KeyRow[] = [
  { label: 'Backspace', keyCode: 8, code: 'Backspace', key: 'Backspace', group: '控制键' },
  { label: 'Tab', keyCode: 9, code: 'Tab', key: 'Tab', group: '控制键' },
  { label: 'Enter', keyCode: 13, code: 'Enter', key: 'Enter', group: '控制键' },
  { label: 'Shift', keyCode: 16, code: 'ShiftLeft/Right', key: 'Shift', group: '控制键' },
  { label: 'Ctrl', keyCode: 17, code: 'ControlLeft/Right', key: 'Control', group: '控制键' },
  { label: 'Alt', keyCode: 18, code: 'AltLeft/Right', key: 'Alt', group: '控制键' },
  { label: 'CapsLock', keyCode: 20, code: 'CapsLock', key: 'CapsLock', group: '控制键' },
  { label: 'Esc', keyCode: 27, code: 'Escape', key: 'Escape', group: '控制键' },
  { label: 'Space', keyCode: 32, code: 'Space', key: ' ', group: '控制键' },
  { label: 'Delete', keyCode: 46, code: 'Delete', key: 'Delete', group: '控制键' },
  { label: 'Insert', keyCode: 45, code: 'Insert', key: 'Insert', group: '控制键' },
  { label: 'Home', keyCode: 36, code: 'Home', key: 'Home', group: '控制键' },
  { label: 'End', keyCode: 35, code: 'End', key: 'End', group: '控制键' },
  { label: 'PageUp', keyCode: 33, code: 'PageUp', key: 'PageUp', group: '控制键' },
  { label: 'PageDown', keyCode: 34, code: 'PageDown', key: 'PageDown', group: '控制键' },
];

/** 方向键 */
const ARROW_ROWS: KeyRow[] = [
  { label: '←', keyCode: 37, code: 'ArrowLeft', key: 'ArrowLeft', group: '方向键' },
  { label: '↑', keyCode: 38, code: 'ArrowUp', key: 'ArrowUp', group: '方向键' },
  { label: '→', keyCode: 39, code: 'ArrowRight', key: 'ArrowRight', group: '方向键' },
  { label: '↓', keyCode: 40, code: 'ArrowDown', key: 'ArrowDown', group: '方向键' },
];

/** 完整速查表 */
export const KEY_REFERENCE: KeyRow[] = [
  ...LETTER_ROWS,
  ...DIGIT_ROWS,
  ...FUNCTION_ROWS,
  ...CONTROL_ROWS,
  ...ARROW_ROWS,
];

/**
 * 格式化修饰键组合，固定顺序 Ctrl → Alt → Shift → Meta → 主键
 *
 * @param parts - 组合键各部分信息
 * @returns 形如 `Ctrl+Shift+A` 的字符串
 */
export function formatKeyCombo(parts: {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}): string {
  const segments: string[] = [];
  if (parts.ctrlKey) segments.push('Ctrl');
  if (parts.altKey) segments.push('Alt');
  if (parts.shiftKey) segments.push('Shift');
  if (parts.metaKey) segments.push('Meta');

  const main = parts.key === ' ' ? 'Space' : parts.key;
  if (main && !['Control', 'Alt', 'Shift', 'Meta'].includes(main)) {
    segments.push(main);
  }
  return segments.join('+');
}

/**
 * 过滤速查表（按标签、code、key 或 keyCode 的子串匹配，大小写不敏感）
 *
 * @param query - 过滤关键字
 * @param rows - 待过滤行，默认全表
 * @returns 命中的行
 */
export function filterKeyReference(
  query: string,
  rows: KeyRow[] = KEY_REFERENCE,
): KeyRow[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return rows;
  return rows.filter((row) =>
    [row.label, row.code, row.key, String(row.keyCode)].some((value) =>
      value.toLowerCase().includes(keyword),
    ),
  );
}

/** 快照所需的 KeyboardEvent 字段（结构化类型，便于 Node 下用普通对象单测） */
export interface KeyEventLike {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
}

/** 组件展示用的最近一次按键事件快照（纯数据，便于历史列表渲染） */
export interface KeyEventSnapshot {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  combo: string;
  time: number;
}

/**
 * 从 KeyboardEvent 提取可序列化快照
 *
 * @param event - 浏览器键盘事件
 * @param time - 时间戳（可注入，便于测试）
 * @returns 纯数据快照
 */
export function snapshotKeyEvent(
  event: KeyEventLike,
  time = Date.now(),
): KeyEventSnapshot {
  return {
    key: event.key,
    code: event.code,
    keyCode: event.keyCode,
    which: event.which,
    location: event.location,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    repeat: event.repeat,
    combo: formatKeyCombo({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
    }),
    time,
  };
}
