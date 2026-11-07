import { describe, it, expect } from 'vitest';
import {
  createDefaultInput,
  generateDmarcRecord,
  parseDmarcRecord,
  splitTxtChunks,
  validateDmarcRecord,
  type DmarcInput,
} from './dmarc';

describe('generateDmarcRecord 生成', () => {
  it('最小记录只含版本与策略', () => {
    const input: DmarcInput = {
      ...createDefaultInput(),
      rua: '',
      pct: null,
    };
    const result = generateDmarcRecord(input);
    expect(result.errors).toEqual([]);
    expect(result.dnsName).toBe('_dmarc.example.com');
    expect(result.recordValue).toBe('v=DMARC1; p=none');
  });

  it('全标签记录按 RFC 顺序拼装', () => {
    const input: DmarcInput = {
      domain: 'example.com',
      policy: 'quarantine',
      subdomainPolicy: 'reject',
      rua: 'mailto:rua@example.com',
      ruf: 'mailto:ruf@example.com',
      adkim: 's',
      aspf: 's',
      fo: ['1', 'd'],
      pct: 50,
      rf: 'iodef',
      ri: 86400,
    };
    const result = generateDmarcRecord(input);
    expect(result.errors).toEqual([]);
    expect(result.recordValue).toBe(
      'v=DMARC1; p=quarantine; sp=reject; rua=mailto:rua@example.com; ruf=mailto:ruf@example.com; adkim=s; aspf=s; fo=1:d; pct=50; rf=iodef; ri=86400',
    );
  });

  it('默认宽松对齐与 pct=100 不输出冗余标签', () => {
    const result = generateDmarcRecord(createDefaultInput());
    expect(result.recordValue).not.toContain('adkim=');
    expect(result.recordValue).not.toContain('aspf=');
    expect(result.recordValue).not.toContain('pct=');
  });

  it('非法域名、策略与越界百分比收集错误且不产出记录', () => {
    const input: DmarcInput = {
      ...createDefaultInput(),
      domain: 'not a domain',
      policy: 'block' as DmarcInput['policy'],
      pct: 120,
    };
    const result = generateDmarcRecord(input);
    expect(result.recordValue).toBe('');
    expect(result.errors.some((each) => each.includes('合法域名'))).toBe(true);
    expect(result.errors.some((each) => each.includes('p= 取值非法'))).toBe(true);
    expect(result.errors.some((each) => each.includes('pct='))).toBe(true);
  });

  it('非法 rua 地址报错，多个地址规范化为逗号分隔', () => {
    const bad = generateDmarcRecord({ ...createDefaultInput(), rua: 'invalid-address' });
    expect(bad.errors.some((each) => each.includes('rua='))).toBe(true);

    const multi = generateDmarcRecord({
      ...createDefaultInput(),
      rua: 'mailto:a@x.com , mailto:b@y.com',
    });
    expect(multi.recordValue).toContain('rua=mailto:a@x.com,mailto:b@y.com');
  });

  it('监控模式与灰度百分比给出警告', () => {
    const monitored = generateDmarcRecord(createDefaultInput());
    expect(monitored.warnings.some((each) => each.includes('p=none'))).toBe(true);

    const grayscale = generateDmarcRecord({ ...createDefaultInput(), policy: 'reject', pct: 10 });
    expect(grayscale.warnings.some((each) => each.includes('pct=10'))).toBe(true);
  });
});

describe('splitTxtChunks 分段', () => {
  it('短记录单段带引号', () => {
    expect(splitTxtChunks('v=DMARC1; p=none')).toEqual(['"v=DMARC1; p=none"']);
  });

  it('超长记录按 255 字符拆分', () => {
    const longValue = `v=DMARC1; p=none; rua=mailto:${'a'.repeat(300)}@example.com`;
    const chunks = splitTxtChunks(longValue);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]!.length).toBe(257); // 255 内容 + 两个引号
  });
});

describe('parseDmarcRecord 解析', () => {
  it('容忍外层引号与多余空白并保留顺序', () => {
    const parsed = parseDmarcRecord(' "v=DMARC1; p=reject ;  rua=mailto:a@b.com" ');
    expect(parsed.orderedTags).toEqual(['v', 'p', 'rua']);
    expect(parsed.tags.get('p')).toBe('reject');
  });

  it('结构性错误抛异常', () => {
    expect(() => parseDmarcRecord('   ')).toThrow('为空');
    expect(() => parseDmarcRecord('v=DMARC1; broken')).toThrow('key=value');
    expect(() => parseDmarcRecord('v=DMARC1; v=DMARC1')).toThrow('重复');
  });
});

describe('validateDmarcRecord 校验', () => {
  it('合法全标签记录通过并输出规范化形式', () => {
    const record = 'v=DMARC1; p=quarantine; sp=none; rua=mailto:a@b.com; adkim=s; pct=50';
    const result = validateDmarcRecord(record);
    expect(result.errors).toEqual([]);
    expect(result.normalized).toBe('v=DMARC1; p=quarantine; sp=none; rua=mailto:a@b.com; adkim=s; pct=50');
  });

  it('缺少版本与策略报错', () => {
    const result = validateDmarcRecord('rua=mailto:a@b.com');
    expect(result.errors.some((each) => each.includes('v=DMARC1'))).toBe(true);
    expect(result.errors.some((each) => each.includes('p='))).toBe(true);
    expect(result.normalized).toBeNull();
  });

  it('非法枚举与越界值报错', () => {
    const result = validateDmarcRecord('v=DMARC1; p=block; fo=x; pct=200; adkim=q');
    expect(result.errors.some((each) => each.includes('p= 取值非法'))).toBe(true);
    expect(result.errors.some((each) => each.includes('fo='))).toBe(true);
    expect(result.errors.some((each) => each.includes('pct= 越界'))).toBe(true);
    expect(result.errors.some((each) => each.includes('adkim='))).toBe(true);
  });

  it('未知标签与缺失 rua 仅警告', () => {
    const result = validateDmarcRecord('v=DMARC1; p=none; xcustom=1');
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((each) => each.includes('未知标签 xcustom'))).toBe(true);
    expect(result.warnings.some((each) => each.includes('rua='))).toBe(true);
  });

  it('非法报告地址报错', () => {
    const result = validateDmarcRecord('v=DMARC1; p=none; ruf=not-an-email');
    expect(result.errors.some((each) => each.includes('ruf='))).toBe(true);
  });

  it('生成 → 校验往返一致', () => {
    const generated = generateDmarcRecord({
      ...createDefaultInput(),
      policy: 'reject',
      ruf: 'mailto:forensics@example.com',
      fo: ['d'],
    });
    const validation = validateDmarcRecord(generated.recordValue);
    expect(validation.errors).toEqual([]);
    expect(validation.normalized).toBe(generated.recordValue);
  });
});
