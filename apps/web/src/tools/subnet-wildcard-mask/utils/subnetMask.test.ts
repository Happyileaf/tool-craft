import { describe, it, expect } from 'vitest';
import { processMask, computeNetwork, processLines } from './subnetMask';

describe('processMask subnet → wildcard', () => {
  it('converts common subnet masks to wildcard masks', () => {
    const cases: Array<[string, string, number]> = [
      ['255.255.255.0', '0.0.0.255', 24],
      ['255.255.255.255', '0.0.0.0', 32],
      ['255.255.0.0', '0.0.255.255', 16],
      ['255.0.0.0', '0.255.255.255', 8],
      ['255.255.255.252', '0.0.0.3', 30],
    ];
    cases.forEach(([subnet, wildcard, prefix]) => {
      const r = processMask(subnet);
      expect(r.valid).toBe(true);
      expect(r.kind).toBe('subnet');
      expect(r.counterpart).toBe(wildcard);
      expect(r.prefix).toBe(prefix);
      expect(r.hostBits).toBe(32 - prefix);
      expect(r.subnetMask).toBe(subnet);
      expect(r.wildcardMask).toBe(wildcard);
    });
  });

  it('treats 0.0.0.0 as /0', () => {
    const r = processMask('0.0.0.0');
    expect(r.valid).toBe(true);
    expect(r.kind).toBe('subnet');
    expect(r.prefix).toBe(0);
    expect(r.counterpart).toBe('255.255.255.255');
  });

  it('normalizes whitespace input', () => {
    const r = processMask('  255.255.255.0  ');
    expect(r.valid).toBe(true);
    expect(r.input).toBe('255.255.255.0');
  });
});

describe('processMask wildcard → subnet', () => {
  it('converts wildcard masks back to subnet masks', () => {
    const r = processMask('0.0.0.255');
    expect(r.valid).toBe(true);
    expect(r.kind).toBe('wildcard');
    expect(r.counterpart).toBe('255.255.255.0');
    expect(r.prefix).toBe(24);
  });

  it('treats 255.255.255.255 as a /0 wildcard', () => {
    const r = processMask('255.255.255.255');
    // 255.255.255.255 is itself a valid /32 subnet first
    expect(r.valid).toBe(true);
    expect(r.prefix).toBe(32);
  });

  it('round-trips a wildcard through both directions', () => {
    const wildcard = processMask('255.255.255.240').counterpart; // 0.0.0.15
    expect(wildcard).toBe('0.0.0.15');
    const back = processMask(wildcard);
    expect(back.kind).toBe('wildcard');
    expect(back.counterpart).toBe('255.255.255.240');
    expect(back.prefix).toBe(28);
  });
});

describe('processMask errors', () => {
  it('rejects non-contiguous masks', () => {
    const r = processMask('255.0.255.0');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/非法掩码/);
  });

  it('rejects out-of-range octets', () => {
    const r = processMask('256.1.1.1');
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/0–255/);
  });

  it('rejects wrong segment count and non-numeric input', () => {
    expect(processMask('255.255.255').error).toMatch(/4 段/);
    expect(processMask('abc').error).toMatch(/4 段/);
    expect(processMask('').error).toMatch(/不能为空/);
  });
});

describe('computeNetwork', () => {
  it('computes network and broadcast for a /24', () => {
    const r = computeNetwork('192.168.1.100', 24);
    expect(r.valid).toBe(true);
    expect(r.networkAddress).toBe('192.168.1.0');
    expect(r.broadcastAddress).toBe('192.168.1.255');
    expect(r.firstHost).toBe('192.168.1.1');
    expect(r.lastHost).toBe('192.168.1.254');
    expect(r.hostCount).toBe('254');
  });

  it('handles /32 and /31 specially', () => {
    const single = computeNetwork('10.0.0.5', 32);
    expect(single.networkAddress).toBe('10.0.0.5');
    expect(single.broadcastAddress).toBe('10.0.0.5');
    expect(single.firstHost).toBe('—');
    expect(single.hostCount).toMatch(/单主机/);

    const p2p = computeNetwork('10.0.0.1', 31);
    expect(p2p.networkAddress).toBe('10.0.0.0');
    expect(p2p.broadcastAddress).toBe('10.0.0.1');
    expect(p2p.hostCount).toMatch(/RFC 3021/);
  });

  it('computes a /16 network correctly', () => {
    const r = computeNetwork('172.16.55.99', 16);
    expect(r.networkAddress).toBe('172.16.0.0');
    expect(r.broadcastAddress).toBe('172.16.255.255');
  });

  it('returns errors for invalid ip or prefix', () => {
    expect(computeNetwork('', 24).error).toMatch(/不能为空/);
    expect(computeNetwork('999.1.1.1', 24).error).toMatch(/0–255/);
    expect(computeNetwork('10.0.0.1', 33).error).toMatch(/0–32/);
  });
});

describe('processLines', () => {
  it('converts multiple lines and keeps blank lines', () => {
    const r = processLines('255.255.255.0\n\n255.255.0.0');
    expect(r.output).toBe('0.0.0.255\n\n0.0.255.255');
    expect(r.warnings).toEqual([]);
  });

  it('keeps invalid lines verbatim with line numbers', () => {
    const r = processLines('255.255.255.0\n255.0.255.0');
    expect(r.output.split('\n')[1]).toBe('255.0.255.0');
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toMatch(/第 2 行/);
  });
});
