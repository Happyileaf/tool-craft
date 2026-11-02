/**
 * WIFI 二维码 payload（zxing/WPA 注册的 `WIFI:` MECARD 风格语法）生成与解析纯函数。
 * 规范参考：zxing core `WifiNetworkConfig`，字段顺序 T/S/P/H；
 * 特殊字符 `\`、`;`、`,`、`"`、`:` 必须以反斜杠转义。
 */

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface WifiConfig {
  /** 加密类型：WPA/WPA2/WPA3 统一记 WPA，开放网络记 nopass */
  encryption: WifiEncryption;
  /** SSID（网络名称），不允许为空 */
  ssid: string;
  /** 密码；nopass 时忽略 */
  password: string;
  /** 是否隐藏网络（H:true 时生效，zxing 仅显式输出 true） */
  hidden: boolean;
}

/** 转义表：zxing 规范要求反斜杠、分号、逗号、双引号、冒号均需转义 */
const ESCAPE_CHARS = /[\\;,":]/g;

export function escapeWifiField(value: string): string {
  return value.replace(ESCAPE_CHARS, (ch) => `\\${ch}`);
}

/**
 * 生成 WIFI payload。规则：
 * - SSID 必填（去除首尾空白后非空），否则抛错；
 * - 非 nopass 时密码必填；
 * - 字段顺序固定 T/S/P/H，nopass 省略 P，hidden=false 省略 H；
 * - 以 `;;` 结尾。
 */
export function buildWifiPayload(config: WifiConfig): string {
  const ssid = config.ssid.trim();
  if (ssid === '') {
    throw new Error('网络名称（SSID）不能为空');
  }
  if (config.encryption !== 'nopass' && config.password === '') {
    throw new Error('选择 WPA / WEP 加密时必须填写密码');
  }

  const parts: string[] = [`WIFI:T:${config.encryption}`, `S:${escapeWifiField(ssid)}`];
  if (config.encryption !== 'nopass') {
    parts.push(`P:${escapeWifiField(config.password)}`);
  }
  if (config.hidden) {
    parts.push('H:true');
  }
  return `${parts.join(';')};;`;
}

const FIELD_KEYS = new Set(['T', 'S', 'P', 'H']);
const ENCRYPTIONS: WifiEncryption[] = ['WPA', 'WEP', 'nopass'];

/**
 * 解析 WIFI payload 为结构化配置。校验：
 * - 必须以 `WIFI:` 开头、`;;` 结尾；
 * - 必须含 S 字段且非空；
 * - T 仅允许 WPA / WEP / nopass（缺省按 WPA 处理，与 zxing 默认一致）；
 * - 转义序列非法（末尾孤立反斜杠）时报错。
 */
export function parseWifiPayload(payload: string): WifiConfig {
  const text = payload.trim();
  if (!text.startsWith('WIFI:')) {
    throw new Error('不是有效的 WIFI payload：必须以 WIFI: 开头');
  }
  if (!text.endsWith(';;')) {
    throw new Error('不是有效的 WIFI payload：必须以 ;; 结尾');
  }

  // body：去掉前缀 WIFI: 与结尾 ;;
  const body = text.slice('WIFI:'.length, -';;'.length);
  const fields = new Map<string, string>();

  let i = 0;
  while (i < body.length) {
    // 读取字段名：直到第一个冒号
    const colon = body.indexOf(':', i);
    if (colon === -1) {
      throw new Error('字段格式错误：缺少键值分隔冒号');
    }
    const key = body.slice(i, colon);
    if (!FIELD_KEYS.has(key)) {
      throw new Error(`包含未知字段：${key}`);
    }
    // 读取字段值：直到未转义的分号，同时处理反斜杠转义
    let value = '';
    let j = colon + 1;
    while (j < body.length) {
      const ch = body[j];
      if (ch === '\\') {
        const next = body[j + 1];
        if (next === undefined) {
          throw new Error('转义不完整：值末尾存在孤立的反斜杠');
        }
        value += next;
        j += 2;
        continue;
      }
      if (ch === ';') {
        break;
      }
      value += ch;
      j += 1;
    }
    fields.set(key, value);
    i = j + 1; // 跳过结束分号
  }

  const ssid = fields.get('S') ?? '';
  if (ssid === '') {
    throw new Error('缺少网络名称（S 字段）');
  }
  const encryption = (fields.get('T') || 'WPA') as WifiEncryption;
  if (!ENCRYPTIONS.includes(encryption)) {
    throw new Error(`不支持的加密类型：${encryption}`);
  }
  const password = fields.get('P') ?? '';
  if (encryption !== 'nopass' && password === '') {
    throw new Error('加密网络缺少密码（P 字段）');
  }
  return {
    encryption,
    ssid,
    password,
    hidden: fields.get('H') === 'true',
  };
}
