import { describe, expect, it } from 'vitest';
import {
  PORT_ENTRIES,
  getPortRange,
  lookupPort,
  searchPorts,
  tokenizeInput,
  validatePort,
} from './ports';

describe('validatePort', () => {
  it('接受合法端口号（数字 / 字符串 / 带空白）', () => {
    expect(validatePort(0)).toEqual({ ok: true, value: 0 });
    expect(validatePort(65535)).toEqual({ ok: true, value: 65535 });
    expect(validatePort(' 443 ')).toEqual({ ok: true, value: 443 });
  });

  it('拒绝越界与非法输入且不抛异常', () => {
    expect(validatePort(70000).ok).toBe(false);
    expect(validatePort(-1).ok).toBe(false);
    expect(validatePort('abc').ok).toBe(false);
    expect(validatePort('').ok).toBe(false);
    expect(validatePort('80.5').ok).toBe(false);
    expect(validatePort(1.2).ok).toBe(false);
    expect(validatePort('80abc').ok).toBe(false);
  });
});

describe('lookupPort', () => {
  it('精确匹配常用知名端口', () => {
    expect(lookupPort(22)).toMatchObject({ name: 'ssh', protocols: ['tcp'] });
    expect(lookupPort(80)?.name).toBe('http');
    expect(lookupPort(443)?.name).toBe('https');
    expect(lookupPort(3306)?.name).toBe('mysql');
    expect(lookupPort(5432)?.name).toBe('postgresql');
    expect(lookupPort(6379)?.name).toBe('redis');
  });

  it('53 同时覆盖 TCP 与 UDP', () => {
    const dns = lookupPort(53);
    expect(dns).not.toBeNull();
    expect(dns?.protocols).toEqual(['tcp', 'udp']);
  });

  it('未收录端口返回 null', () => {
    expect(lookupPort(65000)).toBeNull();
  });
});

describe('getPortRange', () => {
  it('正确划分三个端口区间', () => {
    expect(getPortRange(22).key).toBe('well-known');
    expect(getPortRange(1023).key).toBe('well-known');
    expect(getPortRange(8080).key).toBe('registered');
    expect(getPortRange(49151).key).toBe('registered');
    expect(getPortRange(65000).key).toBe('dynamic');
    expect(getPortRange(49152).key).toBe('dynamic');
  });
});

describe('searchPorts', () => {
  it('英文服务名命中', () => {
    expect(searchPorts('https').map((entry) => entry.port)).toContain(443);
    expect(searchPorts('postgresql').map((entry) => entry.port)).toContain(5432);
  });

  it('中文关键词命中', () => {
    expect(searchPorts('数据库')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ port: 3306 }),
        expect.objectContaining({ port: 5432 }),
        expect.objectContaining({ port: 6379 }),
        expect.objectContaining({ port: 27017 }),
      ]),
    );
  });

  it('纯数字关键词只返回对应条目或空数组', () => {
    expect(searchPorts('22')).toHaveLength(1);
    expect(searchPorts('65000')).toHaveLength(0);
  });

  it('空关键词返回全部且按端口号升序', () => {
    const all = searchPorts('');
    expect(all).toHaveLength(PORT_ENTRIES.length);
    expect(all.every((entry, index) => index === 0 || entry.port >= all[index - 1]!.port)).toBe(true);
  });

  it('大小写不敏感', () => {
    expect(searchPorts('SSH')[0]?.port).toBe(22);
  });
});

describe('tokenizeInput', () => {
  it('支持换行、空格、逗号、中文逗号、顿号分隔并忽略空段', () => {
    expect(tokenizeInput('22, 80；443， 53\n\n3306、6379')).toEqual([
      '22',
      '80',
      '443',
      '53',
      '3306',
      '6379',
    ]);
    expect(tokenizeInput('  \n ')).toEqual([]);
  });
});
