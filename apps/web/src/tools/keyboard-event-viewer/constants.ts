/**
 * 键盘事件查看器常量
 */

/** 事件历史保留条数 */
export const HISTORY_LIMIT = 20;

/** 速查表分组的中文展示顺序 */
export const GROUP_ORDER: string[] = ['字母', '数字', '功能键', '控制键', '方向键'];

/** 快照表格字段定义（label 与取值键） */
export const SNAPSHOT_FIELDS: { label: string; key: string; legacy?: boolean }[] = [
  { label: 'key', key: 'key' },
  { label: 'code', key: 'code' },
  { label: 'keyCode（已废弃）', key: 'keyCode', legacy: true },
  { label: 'which（已废弃）', key: 'which', legacy: true },
  { label: 'location', key: 'locationName' },
  { label: 'ctrlKey', key: 'ctrlKey' },
  { label: 'altKey', key: 'altKey' },
  { label: 'shiftKey', key: 'shiftKey' },
  { label: 'metaKey', key: 'metaKey' },
  { label: 'repeat', key: 'repeat' },
];
