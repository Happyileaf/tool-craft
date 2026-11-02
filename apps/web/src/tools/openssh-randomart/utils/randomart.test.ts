import { describe, expect, it } from 'vitest';
import { md5Hex } from './md5';
import {
  artFromDigest,
  bishopWalk,
  hexToBytes,
  parseSshBlob,
  randomartFromPublicKey,
  renderArt,
} from './randomart';

const enc = new TextEncoder();

/**
 * 以下三个公钥与 6 张 randomart 全部由沙箱内真实 `ssh-keygen -lv [-E md5]`
 * 生成并逐字节固化，作为黄金向量，确保与 OpenSSH 输出完全一致。
 */
const RSA_PUB =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDM5YfnWMi0NxRYpbUDst0FHDJf6CpJE0L5iEFlw43ndQMLT+EEyadXqt5CAOuOTetnkhUBwoAhbNz4OFCWSe5BVsgBQUA/GAY7eBDXoqPxdnFYy4Uu05vXpb9MwWa7bl0s1ZRWT9PQ3VFHbLZddN1QGYmA9GPr0jdqs0ffRBXhmzpX2ktCyezbnuqrndEA1l9NCfvR71CmGoVbK4qSbcJn7TaNZ7az60SLRmfFXyInd+4Fv0/+OinrnMl0VkC9crGpM3Fjs5JI2syUYbsRVJ1/ZQTs8vWcXQ+CjdGUboWm2s2bUSFTFWmeTouNQpVS9/c9ub2tUhPUQIVzSy3sHdKf test-rsa';

const ED25519_PUB =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIF2d+G0hRw+2gHpUzsYJLiT+BmA1nEU4IPIR+BP6NSmT test-ed';

const ECDSA_PUB =
  'ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBKzUZ+JGdulqK99vZ6c+RqTJIteoyfC1sKd873lTXBt5TnBMD07tUMQVYltMH/Qn8wFAotrBbvZ5/JTFTbnqkPQ= test-ec';

const RSA_SHA256_ART = `+---[RSA 2048]----+
|Xo .o+.o         |
|*+  o+= o        |
|*.o o=.E         |
|=+ =. +.         |
|.+oo....S        |
| .O . o. . .     |
| +ooo.... o      |
|.. + +.  .       |
|.   o..          |
+----[SHA256]-----+`;

const RSA_MD5_ART = `+---[RSA 2048]----+
|. .. oo..        |
|.o  + Oo .       |
|+  o O o  .      |
|..  * +  .       |
| . + E  S        |
|  +    .         |
| . .             |
|                 |
|                 |
+------[MD5]------+`;

const ED25519_SHA256_ART = `+--[ED25519 256]--+
|o  o+=  .. ..    |
|= ..=o=  .o.o    |
| =.o B.o.. ...   |
|o ..E o..  +     |
|. ......S = .    |
| + . o . . o     |
|= + o            |
|.Bo. .           |
|..++o            |
+----[SHA256]-----+`;

const ED25519_MD5_ART = `+--[ED25519 256]--+
|     E .         |
|      o .        |
|     o..         |
|.. .o .o         |
|o . .+. S        |
|. o o.           |
|.+ .             |
|=+. .            |
|B+*=.            |
+------[MD5]------+`;

const ECDSA_SHA256_ART = `+---[ECDSA 256]---+
|       oo=.+ +   |
|        *oB B o +|
|      . oB.+ + *o|
|. . . .o...   + o|
| + + . .S      . |
|  E .   . .   .  |
|         . ..  ..|
|          =  * .o|
|         o =* ++o|
+----[SHA256]-----+`;

const ECDSA_MD5_ART = `+---[ECDSA 256]---+
|O+o..            |
|=o.o             |
|.+  .            |
|. o  .           |
| E .  o S        |
|  =    = .       |
| o    . * .      |
|       . =       |
|      ...        |
+------[MD5]------+`;

function blobOf(pubLine: string): Uint8Array {
  const base64 = pubLine.split(/\s+/)[1]!;
  const binary = atob(base64);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

describe('md5Hex — RFC 1321 已知向量', () => {
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  ])('md5(%j) = %s', (input, expected) => {
    expect(md5Hex(enc.encode(input))).toBe(expected);
  });

  it('RSA 公钥 blob 的 MD5 与 ssh-keygen -E md5 指纹一致', () => {
    expect(md5Hex(blobOf(RSA_PUB))).toBe('562093a36a030c6cb59bd1b6d1184bbb');
  });
});

describe('randomartFromPublicKey — 对齐 ssh-keygen -lv 黄金向量', () => {
  it('RSA / SHA256 图像、摘要、算法与位长完全一致', async () => {
    const info = await randomartFromPublicKey(RSA_PUB);
    expect(info.keyType).toBe('ssh-rsa');
    expect(info.labelType).toBe('RSA');
    expect(info.bits).toBe(2048);
    expect(info.digestAlgo).toBe('SHA256');
    expect(info.digestHex).toBe(
      '9f0281854fb00edab19020b24610833af86c3976a8169f87975b1804f5318e4f',
    );
    expect(info.art).toBe(RSA_SHA256_ART);
  });

  it('RSA / MD5 图像与指纹完全一致', async () => {
    const info = await randomartFromPublicKey(RSA_PUB, 'MD5');
    expect(info.digestAlgo).toBe('MD5');
    expect(info.digestHex).toBe('562093a36a030c6cb59bd1b6d1184bbb');
    expect(info.art).toBe(RSA_MD5_ART);
  });

  it('ED25519 / SHA256 图像完全一致', async () => {
    const info = await randomartFromPublicKey(ED25519_PUB);
    expect(info.keyType).toBe('ssh-ed25519');
    expect(info.labelType).toBe('ED25519');
    expect(info.bits).toBe(256);
    expect(info.digestHex).toBe(
      '146d37e43a2d29a2b94ab2d0fc620b0f7550f1c08932882b7d59c62fd881e3c3',
    );
    expect(info.art).toBe(ED25519_SHA256_ART);
  });

  it('ED25519 / MD5 图像完全一致', async () => {
    const info = await randomartFromPublicKey(ED25519_PUB, 'MD5');
    expect(info.digestHex).toBe('b082889ea2f2e8e2f32b9fd06549560b');
    expect(info.art).toBe(ED25519_MD5_ART);
  });

  it('ECDSA / SHA256 图像完全一致', async () => {
    const info = await randomartFromPublicKey(ECDSA_PUB);
    expect(info.keyType).toBe('ecdsa-sha2-nistp256');
    expect(info.labelType).toBe('ECDSA');
    expect(info.bits).toBe(256);
    expect(info.digestHex).toBe(
      '7087d1263c1d48f9915a6dd65b2299cff5f4fa2b5fae28f6b1e96221208ee1f0',
    );
    expect(info.art).toBe(ECDSA_SHA256_ART);
  });

  it('ECDSA / MD5 图像完全一致', async () => {
    const info = await randomartFromPublicKey(ECDSA_PUB, 'MD5');
    expect(info.digestHex).toBe('2f33ab058f017020684426e039bba5c1');
    expect(info.art).toBe(ECDSA_MD5_ART);
  });

  it('接受多行拼接的 base64 公钥', async () => {
    const base64 = RSA_PUB.split(/\s+/)[1]!;
    const wrapped = `${base64.slice(0, 80)}\n${base64.slice(80)}`;
    const info = await randomartFromPublicKey(wrapped);
    expect(info.art).toBe(RSA_SHA256_ART);
  });

  it('首尾空白与尾随换行不影响结果', async () => {
    const info = await randomartFromPublicKey(`\n\n  ${RSA_PUB}\n  \n`);
    expect(info.art).toBe(RSA_SHA256_ART);
  });
});

describe('parseSshBlob', () => {
  it('识别 RSA 位长', () => {
    expect(parseSshBlob(blobOf(RSA_PUB))).toEqual({
      keyType: 'ssh-rsa',
      labelType: 'RSA',
      bits: 2048,
    });
  });

  it('识别 ED25519', () => {
    expect(parseSshBlob(blobOf(ED25519_PUB))).toEqual({
      keyType: 'ssh-ed25519',
      labelType: 'ED25519',
      bits: 256,
    });
  });

  it('识别 ECDSA nistp256 曲线位长', () => {
    expect(parseSshBlob(blobOf(ECDSA_PUB))).toEqual({
      keyType: 'ecdsa-sha2-nistp256',
      labelType: 'ECDSA',
      bits: 256,
    });
  });

  it('未知算法抛错', () => {
    const fake = new Uint8Array(20);
    const view = new DataView(fake.buffer);
    view.setUint32(0, 12, false);
    fake.set(enc.encode('ssh-unknown-'), 4);
    expect(() => parseSshBlob(fake)).toThrow(/不支持的公钥算法/);
  });

  it('截断 blob 抛错', () => {
    expect(() => parseSshBlob(new Uint8Array([0, 0, 0, 20, 115, 115, 104]))).toThrow();
  });
});

describe('hexToBytes / bishopWalk / renderArt / artFromDigest', () => {
  it('支持冒号与空格分隔并忽略大小写', () => {
    expect(Array.from(hexToBytes('AB:cd  ef'))).toEqual([0xab, 0xcd, 0xef]);
  });

  it('拒绝非十六进制字符', () => {
    expect(() => hexToBytes('zz')).toThrow();
  });

  it('拒绝奇数长度', () => {
    expect(() => hexToBytes('abc')).toThrow();
  });

  it('棋盘为 9 行 17 列且包含唯一起点 S 与终点 E', () => {
    const board = bishopWalk(hexToBytes('562093a36a030c6cb59bd1b6d1184bbb'));
    expect(board).toHaveLength(9);
    expect(board.every((row) => row.join('').length === 17)).toBe(true);
    const flat = board.flat();
    expect(flat.filter((ch) => ch === 'S')).toHaveLength(1);
    expect(flat.filter((ch) => ch === 'E')).toHaveLength(1);
  });

  it('renderArt 共 11 行且每行 19 字符', () => {
    const art = renderArt(
      bishopWalk(new Uint8Array(16)),
      'RSA 2048',
      'MD5',
    );
    const lines = art.split('\n');
    expect(lines).toHaveLength(11);
    expect(lines.every((line) => line.length === 19)).toBe(true);
  });

  it('artFromDigest 拒绝非 16/32 字节摘要', () => {
    expect(() => artFromDigest(new Uint8Array(10), 'RSA 2048')).toThrow();
  });
});

describe('randomartFromPublicKey 错误路径', () => {
  it('空输入抛错', async () => {
    await expect(randomartFromPublicKey('   \n ')).rejects.toThrow();
  });

  it('非法 base64 抛错', async () => {
    await expect(randomartFromPublicKey('@@@@not-base64@@@@')).rejects.toThrow();
  });
});
