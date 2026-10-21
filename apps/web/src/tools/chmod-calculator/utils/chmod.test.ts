import { describe, expect, it } from 'vitest';
import {
  bitsToOctal,
  bitsToSymbolic,
  buildChmodCommand,
  octalToBits,
  symbolicToBits,
  type PermissionBits,
} from './chmod';

/** 构造单个权限位开关的网格 */
function makeBits(
  owner: string,
  group: string,
  other: string,
): PermissionBits {
  const parse = (segment: string) => ({
    read: segment[0] === 'r',
    write: segment[1] === 'w',
    execute: segment[2] === 'x',
  });
  return {
    owner: parse(owner),
    group: parse(group),
    other: parse(other),
  };
}

describe('chmod 权限换算', () => {
  it('bitsToOctal 典型值换算正确', () => {
    expect(bitsToOctal(makeBits('rwx', 'r-x', 'r-x'))).toBe('755');
    expect(bitsToOctal(makeBits('rw-', 'r--', 'r--'))).toBe('644');
    expect(bitsToOctal(makeBits('---', '---', '---'))).toBe('000');
    expect(bitsToOctal(makeBits('rwx', 'rwx', 'rwx'))).toBe('777');
    expect(bitsToOctal(makeBits('r--', '---', '---'))).toBe('400');
  });

  it('bitsToSymbolic 典型值换算正确', () => {
    expect(bitsToSymbolic(makeBits('rwx', 'r-x', 'r-x'))).toBe('rwxr-xr-x');
    expect(bitsToSymbolic(makeBits('rw-', 'r--', 'r--'))).toBe('rw-r--r--');
    expect(bitsToSymbolic(makeBits('---', '---', '---'))).toBe('---------');
    expect(bitsToSymbolic(makeBits('rwx', 'rwx', 'rwx'))).toBe('rwxrwxrwx');
  });

  it('octalToBits 正确解析 755/644/000/777/400', () => {
    expect(octalToBits('755')).toEqual(makeBits('rwx', 'r-x', 'r-x'));
    expect(octalToBits('644')).toEqual(makeBits('rw-', 'r--', 'r--'));
    expect(octalToBits('000')).toEqual(makeBits('---', '---', '---'));
    expect(octalToBits('777')).toEqual(makeBits('rwx', 'rwx', 'rwx'));
    expect(octalToBits('400')).toEqual(makeBits('r--', '---', '---'));
  });

  it('symbolicToBits 正确解析合法符号串', () => {
    expect(symbolicToBits('rwxr-xr-x')).toEqual(makeBits('rwx', 'r-x', 'r-x'));
    expect(symbolicToBits('rw-r--r--')).toEqual(makeBits('rw-', 'r--', 'r--'));
    expect(symbolicToBits('---------')).toEqual(makeBits('---', '---', '---'));
  });

  it('八进制 ⇄ 符号串往返一致', () => {
    for (let value = 0; value <= 511; value += 1) {
      const octal = value.toString(8).padStart(3, '0');
      const bits = octalToBits(octal);
      expect(bits).not.toBeNull();
      const symbolic = bitsToSymbolic(bits as PermissionBits);
      const roundTripBits = symbolicToBits(symbolic);
      expect(bitsToOctal(roundTripBits as PermissionBits)).toBe(octal);
    }
  });

  it('取消 group 的 execute：755 → 745，符号同步为 rwxr--r-x', () => {
    const bits = octalToBits('755') as PermissionBits;
    bits.group.execute = false;
    expect(bitsToOctal(bits)).toBe('745');
    expect(bitsToSymbolic(bits)).toBe('rwxr--r-x');
  });

  it('非法八进制输入返回 null 且不抛异常', () => {
    expect(octalToBits('888')).toBeNull();
    expect(octalToBits('75')).toBeNull();
    expect(octalToBits('7555')).toBeNull();
    expect(octalToBits('abc')).toBeNull();
    expect(octalToBits('')).toBeNull();
    expect(octalToBits('  ')).toBeNull();
    expect(octalToBits('7x5')).toBeNull();
  });

  it('非法符号串返回 null（位数不足 / 含非法字符 / 位置错乱）', () => {
    expect(symbolicToBits('rwxr-xr-')).toBeNull();
    expect(symbolicToBits('rwxr-xr-x-')).toBeNull();
    expect(symbolicToBits('wwwwwwwww')).toBeNull();
    expect(symbolicToBits('xrw-r--r--')).toBeNull();
    expect(symbolicToBits('         ')).toBeNull();
    expect(symbolicToBits('rwx?r-xr-x')).toBeNull();
  });

  it('buildChmodCommand 生成标准命令，非法数字或文件名返回 null', () => {
    expect(buildChmodCommand('755', 'myfile.txt')).toBe('chmod 755 myfile.txt');
    expect(buildChmodCommand(' 644 ', 'deploy.sh')).toBe('chmod 644 deploy.sh');
    expect(buildChmodCommand('888', 'myfile.txt')).toBeNull();
    expect(buildChmodCommand('755', '')).toBeNull();
    expect(buildChmodCommand('755', '  ')).toBeNull();
    expect(buildChmodCommand('755', 'my file.txt')).toBeNull();
  });
});
