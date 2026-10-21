import { describe, expect, it } from 'vitest';
import {
  BCRYPT_MAX_COST,
  BCRYPT_MIN_COST,
  detectHash,
  HashConfidenceEnum,
  type HashCandidate,
} from './hash-detect';

/** 取候选数组首项并断言存在，避免下标访问的 undefined 类型噪声 */
function firstOf(candidates: HashCandidate[]): HashCandidate {
  const first = candidates[0];
  expect(first).toBeDefined();
  return first as HashCandidate;
}

describe('detectHash 哈希类型识别', () => {
  it('32 位十六进制首选 MD5（high），并列出 NTLM/MD4（low）等长候选', () => {
    const candidates = detectHash('d41d8cd98f00b204e9800998ecf8427e');
    expect(candidates).toHaveLength(3);
    expect(firstOf(candidates).name).toBe('MD5');
    expect(firstOf(candidates).confidence).toBe(HashConfidenceEnum.HIGH);
    expect(candidates.slice(1).map((item) => item.name).sort()).toEqual([
      'MD4',
      'NTLM',
    ]);
    expect(
      candidates
        .slice(1)
        .every((item) => item.confidence === HashConfidenceEnum.LOW),
    ).toBe(true);
    expect(candidates[1]?.note).toContain('无法');
  });

  it('40 位识别为 SHA-1（high）', () => {
    const first = firstOf(detectHash('da39a3ee5e6b4b0d3255bfef95601890afd80709'));
    expect(first.name).toBe('SHA-1');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('56 位识别为 SHA-224（high）', () => {
    const first = firstOf(
      detectHash('d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f'),
    );
    expect(first.name).toBe('SHA-224');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('64 位识别为 SHA-256（high）', () => {
    const first = firstOf(
      detectHash(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ),
    );
    expect(first.name).toBe('SHA-256');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('96 位识别为 SHA-384（high）', () => {
    const first = firstOf(
      detectHash(
        '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b',
      ),
    );
    expect(first.name).toBe('SHA-384');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('128 位识别为 SHA-512（high）', () => {
    const first = firstOf(
      detectHash(
        'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
      ),
    );
    expect(first.name).toBe('SHA-512');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('8 位十六进制给出 CRC32（low）并注明可能为截断摘要', () => {
    const first = firstOf(detectHash('deadbeef'));
    expect(first.name).toBe('CRC32');
    expect(first.confidence).toBe(HashConfidenceEnum.LOW);
    expect(first.note).toContain('截断');
  });

  it('识别 $2b$ 前缀的标准 bcrypt（high，cost 在合法范围）', () => {
    const first = firstOf(
      detectHash('$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW'),
    );
    expect(first.name).toBe('bcrypt');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
    expect(first.note).toContain('cost=12');
  });

  it('识别 $2a$ / $2y$ 前缀的 bcrypt 变体', () => {
    const body = 'R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
    expect(firstOf(detectHash(`$2a$10$${body}`)).name).toBe('bcrypt');
    expect(firstOf(detectHash(`$2y$10$${body}`)).name).toBe('bcrypt');
  });

  it('bcrypt cost 超出常见范围时降级为 medium', () => {
    const body = 'R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
    const first = firstOf(detectHash(`$2b$03$${body}`));
    expect(first.name).toBe('bcrypt');
    expect(first.confidence).toBe(HashConfidenceEnum.MEDIUM);
    expect(first.note).toContain(String(BCRYPT_MIN_COST));
    expect(first.note).toContain(String(BCRYPT_MAX_COST));
  });

  it('识别 $6$ 前缀的 SHA-512 crypt', () => {
    const body86 = 'abcdefghijklmnopqrstuvwxyz'.repeat(3) + 'abcdefgh';
    const first = firstOf(detectHash(`$6$saltsalt$${body86}`));
    expect(first.name).toBe('SHA-512 crypt');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('识别带 rounds 参数的 $5$ SHA-256 crypt 并在说明中引用轮数', () => {
    const first = firstOf(
      detectHash(
        '$5$rounds=5000$saltsalt$abcdefghijklmnopqrstuvwxyzabcdefghijklmnopq',
      ),
    );
    expect(first.name).toBe('SHA-256 crypt');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
    expect(first.note).toContain('rounds=5000');
  });

  it('识别不带 rounds 的 $5$ SHA-256 crypt', () => {
    const first = firstOf(
      detectHash('$5$saltsalt$abcdefghijklmnopqrstuvwxyzabcdefghijklmnopq'),
    );
    expect(first.name).toBe('SHA-256 crypt');
    expect(first.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('识别 $1$ MD5 crypt 与 $apr1$ Apache MD5 crypt', () => {
    const md5crypt = firstOf(detectHash('$1$saltsalt$abcdefghijklmnopqrstuv'));
    expect(md5crypt.name).toBe('MD5 crypt');
    expect(md5crypt.confidence).toBe(HashConfidenceEnum.HIGH);
    const apr1 = firstOf(detectHash('$apr1$saltsalt$abcdefghijklmnopqrstuv'));
    expect(apr1.name).toBe('Apache MD5 crypt（apr1）');
    expect(apr1.confidence).toBe(HashConfidenceEnum.HIGH);
  });

  it('大写十六进制与首尾空白可正常归一识别', () => {
    expect(firstOf(detectHash('D41D8CD98F00B204E9800998ECF8427E')).name).toBe(
      'MD5',
    );
    expect(
      firstOf(detectHash('  da39a3ee5e6b4b0d3255bfef95601890afd80709\n'))
        .name,
    ).toBe('SHA-1');
    expect(
      firstOf(
        detectHash(
          '\t$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW ',
        ),
      ).name,
    ).toBe('bcrypt');
  });

  it('非 hex 且无 crypt 前缀、未知长度 hex、空输入均返回空数组', () => {
    expect(detectHash('not-a-hash-value')).toEqual([]);
    expect(detectHash('abc123')).toEqual([]);
    expect(detectHash('')).toEqual([]);
    expect(detectHash('   ')).toEqual([]);
    expect(detectHash('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toEqual([]);
  });

  it('crypt 结构残缺（前缀正确但哈希体长度不足）不返回候选', () => {
    expect(detectHash('$2b$12$short')).toEqual([]);
    expect(detectHash('$6$saltsalt$short')).toEqual([]);
  });
});
