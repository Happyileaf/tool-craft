/**
 * chmod 权限换算工具内常量
 */
import type { PermissionKind, PermissionRole } from './utils/chmod';

/** 数字模式最大长度（3 位八进制） */
export const OCTAL_MAX_LENGTH = 3;

/** 符号串最大长度（3 角色 × 3 权限） */
export const SYMBOLIC_MAX_LENGTH = 9;

/** 默认数字模式（755） */
export const DEFAULT_OCTAL = '755';

/** 默认目标文件名 */
export const DEFAULT_FILE_NAME = 'myfile.txt';

/** 角色中文标签 */
export const ROLE_LABELS: Record<PermissionRole, string> = {
  owner: '属主（Owner）',
  group: '属组（Group）',
  other: '其他（Other）',
};

/** 权限位中文标签 */
export const PERMISSION_LABELS: Record<PermissionKind, string> = {
  read: '读（r）',
  write: '写（w）',
  execute: '执行（x）',
};
