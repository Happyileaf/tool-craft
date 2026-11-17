import type { CaaTag } from './utils/caa';

export const TAG_OPTIONS: ReadonlyArray<{ label: string; value: CaaTag }> = [
  { label: 'issue（授权 CA 签发普通证书）', value: 'issue' },
  { label: 'issuewild（授权 CA 签发通配符证书）', value: 'issuewild' },
  { label: 'iodef（证书事件上报地址）', value: 'iodef' },
];

export const VALIDATION_METHOD_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'dns-01', value: 'dns-01' },
  { label: 'http-01', value: 'http-01' },
  { label: 'tls-alpn-01', value: 'tls-alpn-01' },
];

export const DEFAULT_VALIDATE_TEXT = [
  'example.com. 3600 CAA 0 issue "letsencrypt.org"',
  'example.com. 3600 CAA 0 issuewild "ca.example.net; validationmethods=dns-01"',
  'example.com. 3600 CAA 0 iodef "mailto:security@example.com"',
].join('\n');
