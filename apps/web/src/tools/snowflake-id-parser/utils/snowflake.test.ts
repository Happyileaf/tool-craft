import { describe, it, expect } from 'vitest';
import {
  DISCORD_EPOCH,
  TWITTER_EPOCH,
  buildSnowflake,
  decomposeSnowflake,
  parseEpochInput,
  parseSnowflakeId,
} from './snowflake';

describe('Snowflake 解析', () => {
  it('Discord 官方示例：时间 2016-04-30T11:18:25.796Z，worker=1，序列=7', () => {
    const parts = decomposeSnowflake('175928847299117063', DISCORD_EPOCH);
    expect(new Date(parts.timestamp).toISOString()).toBe('2016-04-30T11:18:25.796Z');
    expect(parts.machineId).toBe(32);
    expect(parts.workerId).toBe(1);
    expect(parts.processId).toBe(0);
    expect(parts.sequence).toBe(7);
    expect(parts.idDecimal).toBe('175928847299117063');
  });

  it('Twitter 纪元下时间按 (id >> 22) + epoch 还原', () => {
    const parts = decomposeSnowflake('120271363363438592', TWITTER_EPOCH);
    const expected = Number((BigInt(120271363363438592) >> BigInt(22)) + TWITTER_EPOCH);
    expect(parts.timestamp).toBe(expected);
    expect(new Date(parts.timestamp).getUTCFullYear()).toBe(2011);
  });

  it('二进制补齐 64 位，十六进制大写', () => {
    const parts = decomposeSnowflake('175928847299117063', DISCORD_EPOCH);
    expect(parts.idBinary).toHaveLength(64);
    expect(parts.idHex).toMatch(/^0x[0-9A-F]+$/);
  });

  it('纪元支持字符串数字', () => {
    const parts = decomposeSnowflake('175928847299117063', '1420070400000');
    expect(parts.timestamp).toBe(Date.parse('2016-04-30T11:18:25.796Z'));
  });
});

describe('反向拼装', () => {
  it('给定时间戳/机器位/序列位拼装后再解析字段一致', () => {
    const timestamp = Date.parse('2024-06-01T08:30:00.000Z');
    const id = buildSnowflake({ timestamp, machineId: 511, sequence: 4095 }, DISCORD_EPOCH);
    const parts = decomposeSnowflake(id, DISCORD_EPOCH);
    expect(parts.timestamp).toBe(timestamp);
    expect(parts.machineId).toBe(511);
    expect(parts.sequence).toBe(4095);
  });

  it('worker/process 5+5 拆分拼装等价于机器位', () => {
    const timestamp = Date.parse('2016-04-30T11:18:25.796Z');
    const id = buildSnowflake({ timestamp, workerId: 1, processId: 0, sequence: 7 }, DISCORD_EPOCH);
    expect(id).toBe('175928847299117063');
  });

  it('机器位与拆分同时指定时抛错', () => {
    expect(() =>
      buildSnowflake({ timestamp: Number(TWITTER_EPOCH) + 1, machineId: 1, workerId: 1 }, TWITTER_EPOCH),
    ).toThrow('不能同时');
  });

  it('时间戳早于纪元、超 41 位范围抛错', () => {
    expect(() => buildSnowflake({ timestamp: Number(TWITTER_EPOCH) - 1 }, TWITTER_EPOCH)).toThrow(
      '早于',
    );
    expect(() => buildSnowflake({ timestamp: Number(TWITTER_EPOCH) + 2 ** 41 }, TWITTER_EPOCH)).toThrow(
      '41 位',
    );
  });

  it('越界机器位与序列号抛错', () => {
    const timestamp = Number(DISCORD_EPOCH) + 1000;
    expect(() => buildSnowflake({ timestamp, machineId: 1024 }, DISCORD_EPOCH)).toThrow('机器');
    expect(() => buildSnowflake({ timestamp, sequence: 4096 }, DISCORD_EPOCH)).toThrow('序列号');
    expect(() => buildSnowflake({ timestamp, workerId: 32 }, DISCORD_EPOCH)).toThrow('worker');
  });
});

describe('非法输入', () => {
  it('含字母、负数、空串拒绝', () => {
    expect(() => parseSnowflakeId('abc')).toThrow('十进制');
    expect(() => parseSnowflakeId('-1')).toThrow('十进制');
    expect(() => parseSnowflakeId('   ')).toThrow('十进制');
    expect(() => parseSnowflakeId('0')).toThrow('大于 0');
  });

  it('超过 2^63-1 拒绝', () => {
    expect(() => parseSnowflakeId('9223372036854775808')).toThrow('64 位');
  });

  it('纪元非法值拒绝', () => {
    expect(() => parseEpochInput('abc')).toThrow('纪元');
    expect(() => parseEpochInput(-1)).toThrow('纪元');
  });
});
