export enum CipherModeEnum {
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
}

export const MODE_OPTIONS: { label: string; value: CipherModeEnum }[] = [
  { label: '加密（明文 → 密文）', value: CipherModeEnum.ENCRYPT },
  { label: '解密（密文 → 明文）', value: CipherModeEnum.DECRYPT },
];

export const DEFAULT_TEXT = 'Hello, World!';

export const DEFAULT_KEY = 'KEY';

export const DEFAULT_CIPHER = 'Rijvs, Uyvjn!';
