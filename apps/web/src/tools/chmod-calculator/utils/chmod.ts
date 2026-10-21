/**
 * Unix 文件权限（chmod）换算纯函数集合，不依赖 DOM 与 React；
 * 仅覆盖基础 9 个权限位（owner / group / other × read / write / execute），
 * 不涉及 setuid / setgid / sticky 特殊位
 */

/** 角色顺序：属主、属组、其他 */
export type PermissionRole = 'owner' | 'group' | 'other';

/** 权限位顺序：读、写、执行 */
export type PermissionKind = 'read' | 'write' | 'execute';

/** 3 类角色 × 3 种权限的勾选网格 */
export type PermissionBits = Record<PermissionRole, Record<PermissionKind, boolean>>;

/** 角色展示顺序 */
export const ROLE_ORDER: PermissionRole[] = ['owner', 'group', 'other'];

/** 权限位展示顺序（read 为符号串最高位） */
export const PERMISSION_ORDER: PermissionKind[] = ['read', 'write', 'execute'];

/** 各权限位对应的八进制权重 */
export const PERMISSION_WEIGHT: Record<PermissionKind, number> = {
  read: 4,
  write: 2,
  execute: 1,
};

/** 生成全部权限位均为关闭状态的网格 */
function emptyBits(): PermissionBits {
  return {
    owner: { read: false, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    other: { read: false, write: false, execute: false },
  };
}

/**
 * 将勾选网格转换为 3 位八进制数字串（如 755）
 *
 * @param bits - 权限勾选网格
 * @returns 形如 `755` 的数字模式
 */
export function bitsToOctal(bits: PermissionBits): string {
  return ROLE_ORDER.map((role) =>
    PERMISSION_ORDER.reduce(
      (sum, kind) => sum + (bits[role][kind] ? PERMISSION_WEIGHT[kind] : 0),
      0,
    ),
  ).join('');
}

/**
 * 将 3 位八进制数字串解析为勾选网格；非法（非数字、越界、位数不符）返回 null
 *
 * @param octal - 形如 `755` 的数字模式
 * @returns 权限勾选网格；非法时为 null
 */
export function octalToBits(octal: string): PermissionBits | null {
  const normalized = octal.trim();
  if (!/^[0-7]{3}$/.test(normalized)) {
    return null;
  }
  const bits = emptyBits();
  ROLE_ORDER.forEach((role, roleIndex) => {
    let value = Number(normalized[roleIndex]);
    PERMISSION_ORDER.forEach((kind) => {
      const weight = PERMISSION_WEIGHT[kind];
      if (value >= weight) {
        bits[role][kind] = true;
        value -= weight;
      }
    });
  });
  return bits;
}

/**
 * 将勾选网格转换为 9 字符符号串（如 rwxr-xr-x），无权限位显示 -
 *
 * @param bits - 权限勾选网格
 * @returns 9 字符符号权限串
 */
export function bitsToSymbolic(bits: PermissionBits): string {
  const symbols: Record<PermissionKind, string> = {
    read: 'r',
    write: 'w',
    execute: 'x',
  };
  return ROLE_ORDER.map((role) =>
    PERMISSION_ORDER.map((kind) => (bits[role][kind] ? symbols[kind] : '-')).join(''),
  ).join('');
}

/**
 * 将 9 字符符号串解析为勾选网格；长度不符或含非 rwx/- 字符时返回 null
 *
 * @param str - 形如 `rwxr-xr-x` 的符号权限串
 * @returns 权限勾选网格；非法时为 null
 */
export function symbolicToBits(str: string): PermissionBits | null {
  const normalized = str.trim();
  if (normalized.length !== 9 || !/^[rwx-]{9}$/.test(normalized)) {
    return null;
  }
  const expectedSymbol: Record<PermissionKind, string> = {
    read: 'r',
    write: 'w',
    execute: 'x',
  };
  const bits = emptyBits();
  ROLE_ORDER.forEach((role, roleIndex) => {
    PERMISSION_ORDER.forEach((kind, kindIndex) => {
      const char = normalized.charAt(roleIndex * 3 + kindIndex);
      bits[role][kind] = char === expectedSymbol[kind];
    });
  });
  if (bitsToSymbolic(bits) !== normalized) {
    return null;
  }
  return bits;
}

/**
 * 依据数字模式与文件名生成 chmod 命令；数字模式非法或文件名含空白时返回 null
 *
 * @param octal - 形如 `755` 的数字模式
 * @param file - 目标文件名
 * @returns 形如 `chmod 755 myfile.txt` 的命令；非法时为 null
 */
export function buildChmodCommand(octal: string, file: string): string | null {
  if (octalToBits(octal) === null) {
    return null;
  }
  const fileName = file.trim();
  if (fileName === '' || /\s/.test(fileName)) {
    return null;
  }
  return `chmod ${octal.trim()} ${fileName}`;
}
