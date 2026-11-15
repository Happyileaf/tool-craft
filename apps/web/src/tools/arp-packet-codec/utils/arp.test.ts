import { describe, expect, it } from 'vitest';
import {
  buildArp,
  buildLayout,
  formatHardwareAddress,
  formatProtocolAddress,
  parseArp,
} from './arp';

const REQUEST =
  '00 01 08 00 06 04 00 01 00 11 22 33 44 55 C0 A8 01 01 00 00 00 00 00 00 C0 A8 01 02';
const REPLY =
  '00 01 08 00 06 04 00 02 00 11 22 33 44 55 C0 A8 01 01 AA BB CC DD EE FF C0 A8 01 02';

describe('parseArp', () => {
  it('解析标准 ARP 请求字段', () => {
    const result = parseArp(REQUEST);
    expect(result.ok).toBe(true);
    const packet = result.packet!;
    expect(packet.hardwareType).toBe(1);
    expect(packet.protocolType).toBe(0x0800);
    expect(packet.hardwareLength).toBe(6);
    expect(packet.protocolLength).toBe(4);
    expect(packet.operation).toBe(1);
    expect(formatHardwareAddress(packet.senderHardware)).toBe('00:11:22:33:44:55');
    expect(formatProtocolAddress(packet.senderProtocol)).toBe('192.168.1.1');
    expect(formatHardwareAddress(packet.targetHardware)).toBe('00:00:00:00:00:00');
    expect(formatProtocolAddress(packet.targetProtocol)).toBe('192.168.1.2');
    expect(result.warnings).toEqual([]);
  });

  it('识别 ARP Reply 操作码', () => {
    const result = parseArp(REPLY);
    expect(result.ok).toBe(true);
    expect(result.packet!.operation).toBe(2);
    expect(formatHardwareAddress(result.packet!.targetHardware)).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('长度不足时给出需要字节数', () => {
    const short = REQUEST.split(' ').slice(0, 27).join(' ');
    const result = parseArp(short);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('应为 28 字节');
  });

  it('非 IPv4 协议类型给出告警', () => {
    const result = parseArp(REQUEST.replace('08 00', '86 DD'));
    expect(result.ok).toBe(true);
    expect(result.warnings.join('')).toContain('0x86DD');
  });

  it('HLEN/PLEN 与长度不符时定位错误', () => {
    const result = parseArp('00 01 08 00 06 04 00 01');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('HLEN=6');
    expect(result.error).toContain('28');
  });

  it('多余字节告警并忽略', () => {
    const result = parseArp(`${REQUEST} DE AD`);
    expect(result.ok).toBe(true);
    expect(result.warnings.join('')).toContain('多出 2 字节');
  });

  it('非法十六进制字符报错并定位', () => {
    const result = parseArp('00 01 08 0G');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('第 11 个字符');
  });
});

describe('buildArp', () => {
  it('构造 28 字节请求且可解析回原文', () => {
    const built = buildArp({
      operation: 1,
      senderMac: '00:11:22:33:44:55',
      senderIp: '192.168.1.1',
      targetMac: '00:00:00:00:00:00',
      targetIp: '192.168.1.2',
    });
    expect(built.ok).toBe(true);
    expect(built.bytes).toHaveLength(28);
    expect(built.compact).toBe(REQUEST.replace(/ /g, ''));
    const parsed = parseArp(built.hex!);
    expect(parsed.ok).toBe(true);
    expect(parsed.packet!.operation).toBe(1);
    expect(formatProtocolAddress(parsed.packet!.targetProtocol)).toBe('192.168.1.2');
  });

  it('构造广播请求并提示广播含义', () => {
    const built = buildArp({
      operation: 1,
      senderMac: '00:11:22:33:44:55',
      senderIp: '192.168.1.1',
      targetMac: 'FF:FF:FF:FF:FF:FF',
      targetIp: '192.168.1.2',
    });
    expect(built.ok).toBe(true);
    expect(built.warnings.join('')).toContain('广播');
  });

  it('支持不带分隔符的 MAC 写法', () => {
    const built = buildArp({
      operation: 2,
      senderMac: '001122334455',
      senderIp: '10.0.0.1',
      targetMac: 'aabbccddeeff',
      targetIp: '10.0.0.2',
    });
    expect(built.ok).toBe(true);
    expect(built.bytes).toHaveLength(28);
  });

  it('拒绝非法 MAC 与 IP 并指明字段', () => {
    const badMac = buildArp({
      operation: 1,
      senderMac: '00:11:22',
      senderIp: '192.168.1.1',
      targetMac: 'FF:FF:FF:FF:FF:FF',
      targetIp: '192.168.1.2',
    });
    expect(badMac.ok).toBe(false);
    expect(badMac.error).toContain('发送方 MAC');

    const badIp = buildArp({
      operation: 1,
      senderMac: '00:11:22:33:44:55',
      senderIp: '192.168.1.256',
      targetMac: 'FF:FF:FF:FF:FF:FF',
      targetIp: '192.168.1.2',
    });
    expect(badIp.ok).toBe(false);
    expect(badIp.error).toContain('发送方 IP');
  });
});

describe('字节布局', () => {
  it('字段偏移连续且总长 28', () => {
    const packet = parseArp(REQUEST).packet!;
    const rows = buildLayout(packet);
    expect(rows[0]?.offset).toBe(0);
    expect(rows.at(-1)?.name).toContain('Target Protocol Address');
    const total = rows.reduce((sum, row) => sum + row.length, 0);
    expect(total).toBe(28);
  });
});
