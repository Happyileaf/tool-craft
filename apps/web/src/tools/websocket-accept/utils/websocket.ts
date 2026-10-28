/**
 * RFC 6455 WebSocket 握手 Sec-WebSocket-Accept 计算与校验（零新增依赖）
 *
 * 规则（RFC 6455 §1.3 / §4.2.2）：
 *   Sec-WebSocket-Accept = BASE64(SHA-1(Sec-WebSocket-Key + GUID))
 *   GUID = 258EAFA5-E914-47DA-95CA-C5AB0DC85B11
 *
 * SHA-1 与 Base64 均使用平台内置能力（Web Crypto / atob / btoa），不引入新依赖。
 * 本模块不触碰 DOM 与 React，错误以结果对象返回而非抛出。
 */

export type WsMode = 'compute' | 'verify';

/** RFC 6455 §1.3 规定的固定服务端 GUID */
export const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/** 合法 Sec-WebSocket-Key：16 字节随机数的 Base64 编码（22 个字符 + 2 个等号） */
const KEY_PATTERN = /^[A-Za-z0-9+/]{22}==$/;

/** 字节数组转标准 Base64 字符串 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export interface AcceptResult {
  /** 计算出的 Accept 值；校验失败或输入非法时为空串 */
  accept: string;
  valid: boolean;
  error: string | null;
}

/** 计算单个 Key 对应的 Sec-WebSocket-Accept；先校验 Key 合法性 */
export async function computeAccept(keyInput: string): Promise<AcceptResult> {
  const key = keyInput.trim();
  if (key.length === 0) {
    return { accept: '', valid: false, error: '内容不能为空' };
  }
  if (!KEY_PATTERN.test(key)) {
    return {
      accept: '',
      valid: false,
      error:
        'Sec-WebSocket-Key 必须是 16 字节随机数的 Base64 编码（长度 24，形如 xxxxxxxxxxxxxxxxxxxxxx==）',
    };
  }
  // {22}== 形态的 Base64 解码后恒为 16 字节，无需再校验长度
  const data = new TextEncoder().encode(key + WEBSOCKET_GUID);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return { accept: bytesToBase64(new Uint8Array(digest)), valid: true, error: null };
}

/**
 * 校验单对 Key / Accept 是否匹配。
 * @returns match 表示给定 Accept 与重算值是否一致；expected 为重算出的正确值
 */
export async function verifyPair(
  keyInput: string,
  givenAcceptInput: string,
): Promise<{ match: boolean; expected: string; error: string | null }> {
  const givenAccept = givenAcceptInput.trim();
  const computed = await computeAccept(keyInput);
  if (computed.error) {
    return { match: false, expected: '', error: computed.error };
  }
  if (givenAccept.length === 0) {
    return { match: false, expected: computed.accept, error: '缺少待校验的 Accept 值' };
  }
  return {
    match: givenAccept === computed.accept,
    expected: computed.accept,
    error: givenAccept === computed.accept ? null : 'Accept 与按 Key 重算的结果不匹配',
  };
}

export interface BatchResult {
  output: string;
  warnings: string[];
}

/**
 * 多行批量处理：
 * - compute 模式：每行一个 Key，输出对应 Accept；
 * - verify 模式：每行「Key 空白 Accept」，输出「匹配」或「不匹配（正确值：…）」。
 * 非法行原样保留并逐行标注行号。
 */
export async function processLines(input: string, mode: WsMode): Promise<BatchResult> {
  const outputs: string[] = [];
  const warnings: string[] = [];
  const lines = input.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex] ?? '';
    const lineNo = lineIndex + 1;
    if (line.trim() === '') {
      outputs.push('');
      continue;
    }

    if (mode === 'compute') {
      const result = await computeAccept(line);
      if (result.error) {
        warnings.push(`第 ${lineNo} 行：${result.error}`);
        outputs.push(line);
      } else {
        outputs.push(result.accept);
      }
      continue;
    }

    const parts = line.trim().split(/\s+/);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      warnings.push(`第 ${lineNo} 行：校验模式每行需为「Key 空白 Accept」两个字段`);
      outputs.push(line);
      continue;
    }
    const result = await verifyPair(parts[0], parts[1]);
    if (result.error && result.expected === '') {
      warnings.push(`第 ${lineNo} 行：${result.error}`);
      outputs.push(line);
    } else if (result.match) {
      outputs.push('匹配');
    } else {
      warnings.push(`第 ${lineNo} 行：Accept 不匹配`);
      outputs.push(`不匹配（正确值：${result.expected}）`);
    }
  }

  return { output: outputs.join('\n'), warnings };
}
