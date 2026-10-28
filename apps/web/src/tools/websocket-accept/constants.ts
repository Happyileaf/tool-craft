import type { WsMode } from './utils/websocket';

export interface ModeOption {
  value: WsMode;
  label: string;
  hint: string;
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'compute',
    label: '计算 Accept',
    hint: '每行一个 Sec-WebSocket-Key，输出 Sec-WebSocket-Accept',
  },
  {
    value: 'verify',
    label: '反向校验',
    hint: '每行「Key Accept」两个字段，判断握手应答是否匹配',
  },
];

export const DEFAULT_INPUT = 'dGhlIHNhbXBsZSBub25jZQ==';
