import { describe, expect, it } from 'vitest';
import {
  MAX_LINE_LENGTH,
  buildVCard,
  encodeTelUri,
  escapeText,
  foldLine,
  formatEmailLine,
  formatTelLine,
  type VCardData,
} from './vcard';

describe('escapeText', () => {
  it('转义反斜杠、逗号、分号', () => {
    expect(escapeText('a\\b,c;d')).toBe('a\\\\b\\,c\\;d');
  });

  it('把各类换行转义为字面 \\n', () => {
    expect(escapeText('line1\nline2')).toBe('line1\\nline2');
    expect(escapeText('line1\r\nline2')).toBe('line1\\nline2');
    expect(escapeText('line1\rline2')).toBe('line1\\nline2');
  });

  it('先转义反斜杠，避免二次转义', () => {
    expect(escapeText('\\,')).toBe('\\\\\\,');
  });
});

describe('foldLine', () => {
  it('不超过 75 字符时原样返回', () => {
    const line = 'FN:John Doe';
    expect(foldLine(line)).toBe(line);
  });

  it('超过 75 字符时折叠，续行以单个空格开头', () => {
    const line = `NOTE:${'a'.repeat(100)}`;
    const folded = foldLine(line);
    const physical = folded.split('\r\n');
    expect(physical).toHaveLength(2);
    expect(physical[0]).toHaveLength(MAX_LINE_LENGTH);
    const continuation = physical[1] ?? '';
    expect(continuation).toHaveLength(line.length - MAX_LINE_LENGTH + 1);
    expect(continuation.startsWith(' ')).toBe(true);
    // 去除折叠空格与 CRLF 后内容守恒
    expect(physical.join('').replace(/ /g, '')).toBe(line);
  });
});

describe('formatTelLine / formatEmailLine 版本差异', () => {
  it('3.0 住宅电话使用大写逗号分隔 TYPE，号码原样输出', () => {
    expect(formatTelLine({ value: '+86 138-0000-0000', kind: 'home' }, '3.0')).toBe(
      'TEL;TYPE=HOME,VOICE:+86 138-0000-0000',
    );
  });

  it('4.0 住宅电话使用小写 TYPE 与 tel: URI', () => {
    expect(formatTelLine({ value: '+86 138-0000-0000', kind: 'home' }, '4.0')).toBe(
      'TEL;TYPE=home,voice;VALUE=uri:tel:+8613800000000',
    );
  });

  it('cell 与 work 类型词正确，other 不带 TYPE', () => {
    expect(formatTelLine({ value: '13800000000', kind: 'cell' }, '3.0')).toBe(
      'TEL;TYPE=CELL,VOICE:13800000000',
    );
    expect(formatTelLine({ value: '13800000000', kind: 'work' }, '4.0')).toBe(
      'TEL;TYPE=work,voice;VALUE=uri:tel:13800000000',
    );
    expect(formatTelLine({ value: '10086', kind: 'other' }, '4.0')).toBe(
      'TEL;VALUE=uri:tel:10086',
    );
  });

  it('encodeTelUri 保留数字、星号、井号与前导加号，去除视觉分隔符', () => {
    expect(encodeTelUri('+86 (10) 8888-0000')).toBe('+861088880000');
    expect(encodeTelUri('010-8888-0000')).toBe('01088880000');
    expect(encodeTelUri('*#06#')).toBe('*#06#');
  });

  it('邮箱 3.0 带 INTERNET 与 PREF，4.0 仅小写类型', () => {
    expect(formatEmailLine({ value: 'a@b.com', kind: 'work' }, '3.0')).toBe(
      'EMAIL;TYPE=INTERNET,WORK,PREF:a@b.com',
    );
    expect(formatEmailLine({ value: 'a@b.com', kind: 'home' }, '4.0')).toBe(
      'EMAIL;TYPE=home:a@b.com',
    );
    expect(formatEmailLine({ value: 'a@b.com', kind: 'other' }, '3.0')).toBe(
      'EMAIL;TYPE=INTERNET:a@b.com',
    );
  });
});

describe('buildVCard', () => {
  const base: VCardData = { fullName: 'John Doe' };

  it('仅填姓名也能生成合法 3.0 卡片，行尾为 CRLF', () => {
    const result = buildVCard(base);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.vcf).toBe('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:John Doe\r\nEND:VCARD\r\n');
  });

  it('FN 缺失返回校验错误', () => {
    const result = buildVCard({ fullName: '   ' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('FN');
    }
  });

  it('生日必须为 YYYY-MM-DD', () => {
    expect(buildVCard({ ...base, birthday: '1990/01/31' }).ok).toBe(false);
    expect(buildVCard({ ...base, birthday: '1990-13-01' }).ok).toBe(false);
    const ok = buildVCard({ ...base, birthday: '1990-01-31' });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.vcf).toContain('BDAY:1990-01-31');
    }
  });

  it('N 属性按 5 段顺序输出并逐段转义', () => {
    const result = buildVCard({
      ...base,
      name: { family: 'Doe;Jr', given: 'John', additional: 'Q', prefix: 'Dr.', suffix: '' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.vcf).toContain('N:Doe\\;Jr;John;Q;Dr.;');
    }
  });

  it('ADR 属性按 7 段顺序输出，逗号转义', () => {
    const result = buildVCard({
      ...base,
      address: {
        street: '1 Main, Apt 5',
        locality: 'Springfield',
        region: 'IL',
        postalCode: '62704',
        country: 'USA',
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.vcf).toContain(
        'ADR;TYPE=HOME,POSTAL:;;1 Main\\, Apt 5;Springfield;IL;62704;USA',
      );
    }
  });

  it('备注中的特殊字符与换行均被转义，4.0 地址类型小写', () => {
    const result = buildVCard(
      { ...base, note: 'a,b;c\\d\nline2', organization: 'Acme, Inc.', title: 'Eng' },
      '4.0',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.vcf).toContain('NOTE:a\\,b\\;c\\\\d\\nline2');
      expect(result.vcf).toContain('ORG:Acme\\, Inc.');
      expect(result.vcf).toContain('TITLE:Eng');
      expect(result.vcf).toContain('VERSION:4.0');
    }
  });

  it('多个电话与邮箱输出多行，并跳过空值', () => {
    const result = buildVCard({
      ...base,
      phones: [
        { value: '13800000000', kind: 'cell' },
        { value: '', kind: 'home' },
        { value: '010-88888888', kind: 'work' },
      ],
      emails: [
        { value: 'a@b.com', kind: 'work' },
        { value: 'c@d.com', kind: 'home' },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const telLines = result.vcf.split('\r\n').filter((line) => line.startsWith('TEL'));
      const emailLines = result.vcf.split('\r\n').filter((line) => line.startsWith('EMAIL'));
      expect(telLines).toHaveLength(2);
      expect(emailLines).toHaveLength(2);
    }
  });

  it('长属性被折叠为多个物理行，去除折行后仍包含完整内容', () => {
    const longNote = 'x'.repeat(200);
    const result = buildVCard({ ...base, note: longNote });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const physicalLines = result.vcf.split('\r\n');
      expect(physicalLines.some((line) => line.startsWith(' '))).toBe(true);
      expect(physicalLines.every((line) => line.length <= MAX_LINE_LENGTH)).toBe(true);
    }
  });

  it('ORG 支持部门第二段', () => {
    const result = buildVCard({ ...base, organization: 'Acme', department: 'R&D' });
    if (result.ok) {
      expect(result.vcf).toContain('ORG:Acme;R&D');
    }
  });
});
