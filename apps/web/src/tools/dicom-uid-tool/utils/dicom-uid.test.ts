import { describe, it, expect } from 'vitest';
import {
  DICOM_UID_MAX_LENGTH,
  generateDicomUidSet,
  validateDicomUid,
  validateDicomUidBatch,
} from './dicom-uid';

describe('validateDicomUid 合规 UID', () => {
  it('NEMA 标准根 1.2.840.10008 合法且识别为 Well-known', () => {
    const result = validateDicomUid('1.2.840.10008');
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.componentCount).toBe(4);
    expect(result.length).toBe(13);
    expect(result.wellKnown?.prefix).toBe('1.2.840.10008');
  });

  it('传输语法 UID 1.2.840.10008.1.2.1 命中更具体的传输语法前缀', () => {
    const result = validateDicomUid('1.2.840.10008.1.2.1');
    expect(result.valid).toBe(true);
    expect(result.wellKnown?.prefix).toBe('1.2.840.10008.1.2');
    expect(result.wellKnown?.name).toContain('传输语法');
  });

  it('单字符段 "0" 合法（PS3.5 允许单数字 0 component）', () => {
    const result = validateDicomUid('1.2.0.10');
    expect(result.valid).toBe(true);
    expect(result.wellKnown).toBeNull();
  });

  it('自定义组织根生成形态的 UID 合法且不识别为 Well-known', () => {
    const result = validateDicomUid('1.3.6.1.4.1.99999.1700000000000.1');
    expect(result.valid).toBe(true);
    expect(result.wellKnown).toBeNull();
  });

  it('恰好 64 字符的 UID 处于长度边界内，合法', () => {
    // "1."（2 字符）+ 62 位数字 = 64 字符，两段均无前导零
    const uid = `1.${'9'.repeat(62)}`;
    expect(uid).toHaveLength(64);
    const result = validateDicomUid(uid);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(DICOM_UID_MAX_LENGTH);
  });
});

describe('validateDicomUid 违规定位', () => {
  it('空输入返回整体级错误', () => {
    const result = validateDicomUid('   ');
    expect(result.valid).toBe(false);
    expect(result.issues[0]!.componentIndex).toBe(0);
    expect(result.issues[0]!.message).toContain('不能为空');
  });

  it('包含字母等非法字符时报整体级字符集错误', () => {
    const result = validateDicomUid('1.2.840a.10008');
    expect(result.valid).toBe(false);
    const charsetIssue = result.issues.find((issue) => issue.componentIndex === 0);
    expect(charsetIssue!.message).toContain('数字 0-9 与句点');
  });

  it('65 字符超过 64 上限时报长度错误', () => {
    const uid = `1.${'9'.repeat(63)}`;
    expect(uid).toHaveLength(65);
    const result = validateDicomUid(uid);
    expect(result.valid).toBe(false);
    const lengthIssue = result.issues.find((issue) => issue.message.includes('64'));
    expect(lengthIssue).toBeDefined();
  });

  it('多位数 component 前导零定位到具体段号', () => {
    const result = validateDicomUid('1.02.840.10008');
    expect(result.valid).toBe(false);
    const issue = result.issues[0]!;
    expect(issue.componentIndex).toBe(2);
    expect(issue.segment).toBe('02');
    expect(issue.message).toContain('前导零');
  });

  it('首段前导零同样被定位', () => {
    const result = validateDicomUid('01.2.3');
    expect(result.valid).toBe(false);
    expect(result.issues[0]!.componentIndex).toBe(1);
  });

  it('句点开头：第 1 段为空', () => {
    const result = validateDicomUid('.1.2.3');
    expect(result.valid).toBe(false);
    const issue = result.issues.find((item) => item.segment === '');
    expect(issue?.componentIndex).toBe(1);
    expect(issue?.message).toContain('不得以句点开头');
  });

  it('句点结尾：末段为空', () => {
    const result = validateDicomUid('1.2.3.');
    expect(result.valid).toBe(false);
    const issue = result.issues.find((item) => item.segment === '');
    expect(issue?.componentIndex).toBe(4);
    expect(issue?.message).toContain('不得以句点结尾');
  });

  it('连续句点：中间空段', () => {
    const result = validateDicomUid('1.2..3');
    expect(result.valid).toBe(false);
    const issue = result.issues.find((item) => item.segment === '');
    expect(issue?.componentIndex).toBe(3);
    expect(issue?.message).toContain('连续句点');
  });
});

describe('validateDicomUidBatch 批量校验', () => {
  it('逐行统计成功失败并跳过空行', () => {
    const batch = validateDicomUidBatch(['1.2.840.10008', '', '1.02.3', '1.3.6.1.4.1.1'].join('\n'));
    expect(batch.total).toBe(3);
    expect(batch.okCount).toBe(2);
    expect(batch.failCount).toBe(1);
    expect(batch.rows[1]!.line).toBe(3);
    expect(batch.rows[1]!.valid).toBe(false);
    expect(batch.rows[1]!.issues[0]!.componentIndex).toBe(2);
  });
});

describe('generateDicomUidSet counter 模式（固定向量）', () => {
  const baseOptions = {
    root: '1.3.6.1.4.1.99999',
    mode: 'counter' as const,
    sopCount: 2,
    now: 1700000000000,
  };

  it('按 时间戳.计数器 后缀拼出 Study / Series / SOP，且全部通过自检', () => {
    const result = generateDicomUidSet(baseOptions);
    expect(result.error).toBeNull();
    expect(result.studyInstanceUid).toBe('1.3.6.1.4.1.99999.1700000000000.1');
    expect(result.seriesInstanceUid).toBe('1.3.6.1.4.1.99999.1700000000000.2');
    expect(result.sopInstanceUids).toEqual([
      '1.3.6.1.4.1.99999.1700000000000.100',
      '1.3.6.1.4.1.99999.1700000000000.101',
    ]);
    [result.studyInstanceUid, result.seriesInstanceUid, ...result.sopInstanceUids].forEach((uid) => {
      expect(validateDicomUid(uid).valid).toBe(true);
    });
  });

  it('非法组织根直接返回错误且不产生 UID', () => {
    const result = generateDicomUidSet({ ...baseOptions, root: '1.02.3' });
    expect(result.error).toContain('组织根 UID 不合法');
    expect(result.studyInstanceUid).toBe('');
    expect(result.sopInstanceUids).toHaveLength(0);
  });

  it('sopCount 越界返回错误', () => {
    expect(generateDicomUidSet({ ...baseOptions, sopCount: 0 }).error).toContain('1-100');
    expect(generateDicomUidSet({ ...baseOptions, sopCount: 101 }).error).toContain('1-100');
  });

  it('组织根过长导致超限时返回超限错误', () => {
    // 根 60 字符，加上后缀必然超过 64
    const longRoot = `1.${'9'.repeat(58)}`;
    expect(longRoot).toHaveLength(60);
    const result = generateDicomUidSet({ ...baseOptions, root: longRoot });
    expect(result.error).toContain('超过 64');
  });
});

describe('generateDicomUidSet random 模式（注入确定性随机源）', () => {
  // 固定序列：首位返回 0 时应被重抽，验证无前导零逻辑
  const digits = [0, 7, 3, 1, 9, 2, 5, 8, 4, 6, 0, 1, 2, 9, 4, 7, 3, 8, 5, 6, 1, 0, 2, 4];
  let cursor = 0;
  const randomDigit = (): number => digits[cursor++ % digits.length] ?? 0;

  it('10 位随机 component 首位重抽零，结果确定且全部合法', () => {
    cursor = 0;
    const result = generateDicomUidSet({
      root: '1.3.6.1.4.1.99999',
      mode: 'random',
      sopCount: 1,
      randomDigit,
    });
    expect(result.error).toBeNull();
    // Study 后缀：首个随机数 0 被丢弃，随后取 7,3,1,9,2,5,8,4,6,0 → 7319258460，计数器 1
    expect(result.studyInstanceUid).toBe('1.3.6.1.4.1.99999.7319258460.1');
    expect(result.seriesInstanceUid).toBe('1.3.6.1.4.1.99999.1294738561.2');
    expect(result.sopInstanceUids).toEqual(['1.3.6.1.4.1.99999.2407319258.100']);
    [result.studyInstanceUid, result.seriesInstanceUid, ...result.sopInstanceUids].forEach((uid) => {
      const checked = validateDicomUid(uid);
      expect(checked.valid).toBe(true);
      uid.split('.').forEach((segment) => {
        if (segment.length > 1) {
          expect(segment[0]).not.toBe('0');
        }
      });
    });
  });

  it('批量生成的 SOP UID 互不重复', () => {
    cursor = 0;
    const result = generateDicomUidSet({
      root: '1.2.840.10008.999',
      mode: 'random',
      sopCount: 10,
      randomDigit,
    });
    expect(result.error).toBeNull();
    expect(new Set(result.sopInstanceUids).size).toBe(10);
  });
});
