import type { DkimKeyType } from "./utils/dkim";

export interface KeyTypeOption {
  value: DkimKeyType;
  label: string;
}

export const KEY_TYPE_OPTIONS: KeyTypeOption[] = [
  { value: "rsa", label: "RSA（k=rsa，常见 2048 位）" },
  { value: "ed25519", label: "Ed25519（k=ed25519）" },
];

export const DEFAULT_SELECTOR = "s1";
export const DEFAULT_DOMAIN = "example.com";
export const DEFAULT_PUBLIC_KEY =
  "-----BEGIN PUBLIC KEY-----\n粘贴你的 Base64 公钥（PEM 页眉可选）\n-----END PUBLIC KEY-----";
