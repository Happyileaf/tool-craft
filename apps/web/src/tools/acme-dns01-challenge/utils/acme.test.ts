import { describe, expect, it } from 'vitest';
import {
  buildKeyAuthorization,
  buildRecordName,
  bytesToBase64Url,
  generateDns01Challenge,
  normalizeDomain,
  verifyKeyAuthorization,
} from './acme';

/** RFC 8555 风格固定向量（来自验收标准） */
const TOKEN = 'KQqLsiS5j0CONR_eUXTUSUDNVaHODtc-0p646g';
const THUMBPRINT = 'evaGxfADs6pSRb2LAv9IZf17Dt4Ke5Pl2T-t6bPEJqA';
const EXPECTED_KEY_AUTH =
  'KQqLsiS5j0CONR_eUXTUSUDNVaHODtc-0p646g.evaGxfADs6pSRb2LAv9IZf17Dt4Ke5Pl2T-t6bPEJqA';
const EXPECTED_TXT = 'yGqbM4qjEXrWjJ8BzS0ALsMTM362sD_xl7XuPWRaROY';

describe('bytesToBase64Url', () => {
  it('输出无填充、URL 安全字符', () => {
    // 32 字节 0xFB => 标准 Base64 含 +/ 与填充，Base64URL 应全部转换
    const bytes = new Uint8Array(32).fill(0xfb);
    const encoded = bytesToBase64Url(bytes);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    expect(encoded.length).toBe(43);
  });
});

describe('normalizeDomain / buildRecordName', () => {
  it('裸域拼接 _acme-challenge 前缀', () => {
    expect(buildRecordName('example.com').recordName).toBe('_acme-challenge.example.com');
  });

  it('多级子域与末尾点（FQDN）规范化', () => {
    const result = buildRecordName('www.example.com.');
    expect(result.recordName).toBe('_acme-challenge.www.example.com');
    expect(result.normalizedDomain).toBe('www.example.com');
    expect(result.wildcard).toBe(false);
  });

  it('通配符剥离 *. 前缀并标记 wildcard', () => {
    const result = normalizeDomain('*.example.com');
    expect(result.normalized).toBe('example.com');
    expect(result.wildcard).toBe(true);
    expect(buildRecordName('*.example.com').recordName).toBe('_acme-challenge.example.com');
  });

  it('拒绝协议前缀、端口、路径与空输入', () => {
    expect(() => normalizeDomain('http://example.com')).toThrow('协议前缀');
    expect(() => normalizeDomain('example.com:8080')).toThrow('端口');
    expect(() => normalizeDomain('example.com/path')).toThrow('路径');
    expect(() => normalizeDomain('   ')).toThrow('不能为空');
    expect(() => normalizeDomain('not-a-domain')).toThrow('域名格式非法');
  });
});

describe('buildKeyAuthorization', () => {
  it('按 token.thumbprint 拼装固定向量', () => {
    expect(buildKeyAuthorization(TOKEN, THUMBPRINT)).toBe(EXPECTED_KEY_AUTH);
  });

  it('拒绝空值与 Base64URL 字母表外字符', () => {
    expect(() => buildKeyAuthorization('', THUMBPRINT)).toThrow('不能为空');
    expect(() => buildKeyAuthorization('abc+def', THUMBPRINT)).toThrow('非法字符');
    expect(() => buildKeyAuthorization(TOKEN, 'abc/def')).toThrow('非法字符');
    expect(() => buildKeyAuthorization(TOKEN, `${THUMBPRINT}=`)).toThrow('非法字符');
  });
});

describe('generateDns01Challenge', () => {
  it('完整流程产出 RFC 固定 TXT 记录值（43 字符、无 =/+ /）', async () => {
    const result = await generateDns01Challenge('example.com', TOKEN, THUMBPRINT);
    expect(result.keyAuthorization).toBe(EXPECTED_KEY_AUTH);
    expect(result.txtValue).toBe(EXPECTED_TXT);
    expect(result.txtValue.length).toBe(43);
    expect(result.txtValue).not.toMatch(/[+/=]/);
    expect(result.recordName).toBe('_acme-challenge.example.com');
    expect(result.wildcard).toBe(false);
  });

  it('通配符域名结果落在裸域并带标记', async () => {
    const result = await generateDns01Challenge('*.example.com', TOKEN, THUMBPRINT);
    expect(result.recordName).toBe('_acme-challenge.example.com');
    expect(result.wildcard).toBe(true);
    expect(result.txtValue).toBe(EXPECTED_TXT);
  });
});

describe('verifyKeyAuthorization', () => {
  it('合法串通过校验且重算 TXT 与固定向量一致', async () => {
    const result = await verifyKeyAuthorization(EXPECTED_KEY_AUTH);
    expect(result.token).toBe(TOKEN);
    expect(result.accountThumbprint).toBe(THUMBPRINT);
    expect(result.recomputedTxtValue).toBe(EXPECTED_TXT);
  });

  it('拒绝单段、多段、空串与非法字符', async () => {
    await expect(verifyKeyAuthorization('onlyonesegment')).rejects.toThrow('两段');
    await expect(verifyKeyAuthorization('a.b.c')).rejects.toThrow('两段');
    await expect(verifyKeyAuthorization('   ')).rejects.toThrow('不能为空');
    await expect(verifyKeyAuthorization('tok+en.thumbprint')).rejects.toThrow('非法字符');
  });
});
