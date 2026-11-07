/**
 * DKIM DNS TXT 记录拼装与标签语法校验纯函数（零依赖，依据 RFC 6376）
 *
 * 记录形如：<selector>._domainkey.<domain>  TXT  "v=DKIM1; k=rsa; p=<base64pub>"
 * 标签（tag）由 key=value 组成，分号分隔；value 中出现分号、控制字符等需报错。
 */

export type DkimKeyType = "rsa" | "ed25519";

export interface DkimInput {
  /** 选择器（selector），如 default / s1 */
  selector: string;
  /** 签名域（domain），如 example.com */
  domain: string;
  /** 公钥算法 */
  keyType: DkimKeyType;
  /** PEM 或裸 Base64 公钥（p= 标签内容） */
  publicKey: string;
  /** 可选：granularity（g=），多数场景留空 */
  granularity: string;
  /** 可选：备注（t=y 测试模式） */
  testing: boolean;
  /** 可选：子域授权策略（t=s 禁止子域） */
  subdomainStrict: boolean;
  /** 可选：备注 n= */
  note: string;
}

export interface DkimResult {
  /** 完整 DNS 名称 */
  dnsName: string;
  /** TXT 记录值（单字符串，255 字节分段另给） */
  recordValue: string;
  /** 按 RFC 4408 / 1035 拆出的 255 字符分段（含引号，便于 BIND 粘贴） */
  chunks: string[];
  /** 公钥长度（解码后字节数，仅 Base64 合法时给出） */
  publicKeyBytes: number | null;
  errors: string[];
  warnings: string[];
}

const SELECTOR_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const DOMAIN_REGEX =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
/** tag value 禁止：分号、等号、ASCII 控制字符 */
const SAFE_VALUE_REGEX = /^[^\x00-\x1f;=]*$/;

/** 从 PEM 包裹中提取纯 Base64；若本身就是裸 Base64 则原样返回（去空白） */
export function extractBase64(publicKey: string): string {
  const noPem = publicKey
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "");
  return noPem.replace(/\s+/g, "");
}

/** 校验单个 tag 的 value 是否符合 RFC 6376 语法 */
export function isSafeTagValue(value: string): boolean {
  return SAFE_VALUE_REGEX.test(value);
}

/**
 * 将 TXT 记录按 255 字符切分（RFC 1035 单字符串长度上限），
 * 每段用双引号包裹，多段以空格连接。
 */
export function splitTxtChunks(recordValue: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < recordValue.length; i += 255) {
    chunks.push(`"${recordValue.slice(i, i + 255)}"`);
  }
  return chunks;
}

export function generateDkimRecord(input: DkimInput): DkimResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const selector = input.selector.trim();
  const domain = input.domain.trim().toLowerCase();
  const base64 = extractBase64(input.publicKey);

  if (!selector) {
    errors.push("选择器（selector）不能为空");
  } else if (!SELECTOR_REGEX.test(selector)) {
    errors.push(
      `选择器「${selector}」非法：仅允许字母、数字与连字符，且不能以连字符开头/结尾`,
    );
  }
  if (!domain) {
    errors.push("签名域（domain）不能为空");
  } else if (!DOMAIN_REGEX.test(domain)) {
    errors.push(`签名域「${domain}」不是合法域名`);
  }
  if (!base64) {
    errors.push("公钥内容不能为空（支持 PEM 包裹或裸 Base64）");
  } else if (!BASE64_REGEX.test(base64) || base64.length % 4 !== 0) {
    errors.push(
      "公钥不是合法的 Base64（请检查是否误含页眉、空格或换行以外的字符）",
    );
  }

  if (input.granularity && !isSafeTagValue(input.granularity)) {
    errors.push(
      "granularity（g=）含分号、等号或控制字符，违反 RFC 6376 tag 语法",
    );
  }
  if (input.note && !isSafeTagValue(input.note)) {
    errors.push("备注（n=）含分号、等号或控制字符，违反 RFC 6376 tag 语法");
  }

  let publicKeyBytes: number | null = null;
  if (base64 && BASE64_REGEX.test(base64) && base64.length % 4 === 0) {
    try {
      publicKeyBytes =
        (base64.length / 4) * 3 -
        (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
      if (input.keyType === "rsa" && publicKeyBytes < 128) {
        warnings.push(
          `RSA 公钥解码后仅 ${publicKeyBytes} 字节，低于 1024 位（128 字节），建议至少 2048 位`,
        );
      }
    } catch {
      errors.push("公钥 Base64 解码失败");
    }
  }

  const dnsName =
    errors.length === 0 && selector && domain
      ? `${selector}._domainkey.${domain}`
      : "";

  const tags: string[] = ["v=DKIM1", `k=${input.keyType}`, `p=${base64}`];
  if (input.granularity) {
    tags.push(`g=${input.granularity.trim()}`);
  }
  if (input.note) {
    tags.push(`n=${input.note.trim()}`);
  }
  const tFlags: string[] = [];
  if (input.testing) {
    tFlags.push("y");
  }
  if (input.subdomainStrict) {
    tFlags.push("s");
  }
  if (tFlags.length > 0) {
    tags.push(`t=${tFlags.join(":")}`);
  }
  const recordValue = tags.join("; ");

  if (recordValue.length > 255) {
    warnings.push(
      `记录值长 ${recordValue.length} 字符，超过单段 255 上限，已自动拆分为多个带引号字符串（DNS 发布时需保留分段）`,
    );
  }

  return {
    dnsName,
    recordValue: errors.length === 0 ? recordValue : "",
    chunks: errors.length === 0 ? splitTxtChunks(recordValue) : [],
    publicKeyBytes,
    errors,
    warnings,
  };
}
