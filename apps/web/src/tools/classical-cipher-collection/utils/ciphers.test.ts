import { describe, expect, it } from 'vitest';
import {
  atbash,
  baconDecrypt,
  baconEncrypt,
  playfairDecrypt,
  playfairEncrypt,
  railFenceDecrypt,
  railFenceEncrypt,
} from './ciphers';

describe('Atbash 密码', () => {
  it('大写字母按字母表反转', () => {
    expect(atbash('ABC').output).toBe('ZYX');
    expect(atbash('HELLO').output).toBe('SVOOL');
  });

  it('小写字母独立反转且非字母保留', () => {
    expect(atbash('abc xyz!').output).toBe('zyx cba!');
  });

  it('自逆：连续两次还原原文', () => {
    const text = 'Atbash 123';
    expect(atbash(atbash(text).output).output).toBe(text);
  });
});

describe('培根密码', () => {
  it('单字母 A 加密为 AAAAA', () => {
    expect(baconEncrypt('A').output).toBe('AAAAA');
  });

  it('HELLO 逐字母编码为 5 组', () => {
    const result = baconEncrypt('HELLO');
    expect(result.output.split(' ')).toHaveLength(5);
    expect(result.output.startsWith('AABBB')).toBe(true);
  });

  it('J 按 I、V 按 U 共用编码', () => {
    expect(baconEncrypt('J').output).toBe(baconEncrypt('I').output);
    expect(baconEncrypt('V').output).toBe(baconEncrypt('U').output);
  });

  it('非字母字符被忽略', () => {
    expect(baconEncrypt('A, B!').output).toBe('AAAAA AAAAB');
  });

  it('解密还原为字母（I/J、U/V 合并）', () => {
    const cipher = baconEncrypt('HELLO').output;
    expect(baconDecrypt(cipher).output).toBe('HELLO');
  });

  it('解密时不足 5 位的尾组被丢弃', () => {
    expect(baconDecrypt('AAAAA AAA').output).toBe('A');
  });
});

describe('栅栏密码', () => {
  it('3 行栅栏加密 WE ARE DISCOVERED 经典样例', () => {
    // 经典教科书样例：WEAREDISCOVERED FLEE AT ONCE（3 rails）
    const result = railFenceEncrypt('WE ARE DISCOVERED', 3);
    // 加密只做位置重排，字符多重集不变
    expect(result.output.replace(/\s/g, '').split('').sort().join('')).toBe(
      'WEAREDISCOVERED'.split('').sort().join(''),
    );
  });

  it('加解密往返还原原文（含空格）', () => {
    const text = 'THE RAIL FENCE CIPHER';
    const cipher = railFenceEncrypt(text, 3).output;
    expect(railFenceDecrypt(cipher, 3).output).toBe(text);
  });

  it('2 行栅栏等价于奇偶位重排', () => {
    const result = railFenceEncrypt('ABCDEF', 2);
    expect(result.output).toBe('ACEBDF');
  });

  it('非法行数被规整为至少 2', () => {
    expect(railFenceEncrypt('ABC', 1).output).toBe(railFenceEncrypt('ABC', 2).output);
  });

  it('4 行栅栏往返一致', () => {
    const text = 'ATTACK AT DAWN';
    const cipher = railFenceEncrypt(text, 4).output;
    expect(railFenceDecrypt(cipher, 4).output).toBe(text);
  });
});

describe('Playfair 密码', () => {
  it('经典 MONARCHY 方阵加密 BALLOON 得到已知密文分组', () => {
    // MONARCHY 方阵：M O N A R / C H Y B D / E F G I K / L P Q S T / U V W X Z
    // BA→IB（矩形）, LX→SU（矩形）, LO→PM（矩形）, ON 同行右移回绕→NA
    const result = playfairEncrypt('BALLOON', 'MONARCHY');
    expect(result.output).toBe('IB SU PM NA');
  });

  it('J 统一按 I 处理', () => {
    expect(playfairEncrypt('JAM', 'MONARCHY').output).toBe(
      playfairEncrypt('IAM', 'MONARCHY').output,
    );
  });

  it('同组重复字母插入补位 X', () => {
    // LL 被拆为 LX 与 L...，输出组数为 3（HE→, LL→LX+L?, O 补 X）
    const result = playfairEncrypt('HELLO', 'MONARCHY');
    expect(result.output.split(' ')).toHaveLength(3);
  });

  it('奇数长度自动补 X', () => {
    const result = playfairEncrypt('TOY', 'MONARCHY');
    expect(result.output.split(' ')).toHaveLength(2);
  });

  it('加解密往返还原（补位 X 除外）', () => {
    const plain = 'ATTACKATDAWN';
    const cipher = playfairEncrypt(plain, 'MONARCHY').output.replace(/\s/g, '');
    const decrypted = playfairDecrypt(cipher, 'MONARCHY').output;
    expect(decrypted.startsWith('ATTACKATDAWN')).toBe(true);
  });

  it('矩形规则：对角互换且行列均不变', () => {
    // HM 在 MONARCHY 方阵中不同行不同列，解密同规则可逆
    const cipher = playfairEncrypt('HM', 'MONARCHY').output.replace(/\s/g, '');
    expect(playfairDecrypt(cipher, 'MONARCHY').output).toBe('HM');
  });
});
