/**
 * EPC QR Code（SEPA Credit Transfer，EPC069-12 v3.0）负载生成与解析纯函数。
 * 规范：前 3 行为固定头 BCD / 001 / 1 / SCT，之后 8 个业务行，共 12 行，CRLF 分隔。
 */
import { normalizeIban, validateIban } from '../../iban-validator/utils/iban';

/** EPC 表单字段（生成输入） */
export interface EpcForm {
  /** 服务商标识 BIC（版本 2 起可选，8 或 11 位） */
  bic: string;
  /** 收款人名称（必填，≤70） */
  name: string;
  /** 收款人 IBAN（必填，≤34） */
  iban: string;
  /** 金额（欧元，>0；为 0/空时金额行留空） */
  amount: number | null;
  /** 用途代码（4 位大写字母，可选） */
  purposeCode: string;
  /** 结构化债权人引用（与 remittance 二选一，≤35） */
  creditorReference: string;
  /** 普通汇款说明（与 creditorReference 二选一，≤35） */
  remittance: string;
  /** 备注（可选，≤70） */
  note: string;
}

/** 解析后的 EPC 负载 */
export interface EpcPayload {
  bic: string;
  name: string;
  iban: string;
  /** 金额行原文（如 EUR12.34），空字符串表示未设金额 */
  amountText: string;
  purposeCode: string;
  creditorReference: string;
  remittance: string;
  note: string;
}

export interface EpcValidation {
  valid: boolean;
  /** 字段名 → 错误信息 */
  errors: Partial<Record<keyof EpcForm, string>>;
}

const HEADER = ['BCD', '001', '1', 'SCT'];
const LINE_COUNT = 12;
const LIMIT_NAME = 70;
const LIMIT_IBAN = 34;
const LIMIT_AMOUNT = 12; // 含 "EUR" 前缀
const LIMIT_PURPOSE = 4;
const LIMIT_REMIT = 35;
const LIMIT_NOTE = 70;
const LIMIT_BIC = 11;

/** 空表单（UI 初始值） */
export function createEmptyForm(): EpcForm {
  return {
    bic: '',
    name: '',
    iban: '',
    amount: null,
    purposeCode: '',
    creditorReference: '',
    remittance: '',
    note: '',
  };
}

/**
 * 校验表单字段长度、枚举与 IBAN 合法性。
 *
 * @param form - 表单数据
 * @returns 校验结论与逐字段错误
 */
export function validateEpcForm(form: EpcForm): EpcValidation {
  const errors: EpcValidation['errors'] = {};

  const bic = form.bic.trim().toUpperCase();
  if (bic && !/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(bic)) {
    errors.bic = 'BIC 必须为 8 或 11 位字母数字';
  }
  if (bic.length > LIMIT_BIC) {
    errors.bic = `BIC 长度不能超过 ${LIMIT_BIC} 位`;
  }

  if (!form.name.trim()) {
    errors.name = '收款人名称必填';
  } else if (form.name.trim().length > LIMIT_NAME) {
    errors.name = `名称长度不能超过 ${LIMIT_NAME} 字符`;
  }

  const iban = normalizeIban(form.iban);
  if (!iban) {
    errors.iban = 'IBAN 必填';
  } else if (iban.length > LIMIT_IBAN) {
    errors.iban = `IBAN 长度不能超过 ${LIMIT_IBAN} 位`;
  } else {
    const result = validateIban(iban);
    if (!result.valid) {
      errors.iban = result.reason ?? 'IBAN 校验未通过';
    }
  }

  if (form.amount !== null) {
    if (!Number.isFinite(form.amount) || form.amount < 0) {
      errors.amount = '金额必须为不小于 0 的数值';
    } else if (form.amount > 999999999.99) {
      errors.amount = '金额超出 EPC 允许范围';
    } else {
      const amountText = formatAmountLine(form.amount);
      if (amountText.length > LIMIT_AMOUNT) {
        errors.amount = `金额行（含 EUR）不能超过 ${LIMIT_AMOUNT} 字符`;
      }
    }
  }

  const purpose = form.purposeCode.trim().toUpperCase();
  if (purpose && !/^[A-Z0-9]{4}$/.test(purpose)) {
    errors.purposeCode = '用途代码必须为 4 位大写字母/数字';
  }

  if (form.creditorReference.trim() && form.remittance.trim()) {
    errors.creditorReference = '结构化引用与普通汇款说明只能二选一';
    errors.remittance = '结构化引用与普通汇款说明只能二选一';
  }
  if (form.creditorReference.trim().length > LIMIT_REMIT) {
    errors.creditorReference = `引用长度不能超过 ${LIMIT_REMIT} 字符`;
  }
  if (form.remittance.trim().length > LIMIT_REMIT) {
    errors.remittance = `汇款说明长度不能超过 ${LIMIT_REMIT} 字符`;
  }
  if (form.note.trim().length > LIMIT_NOTE) {
    errors.note = `备注长度不能超过 ${LIMIT_NOTE} 字符`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** 金额 → EPC 金额行（EUR + 两位小数） */
function formatAmountLine(amount: number): string {
  return `EUR${amount.toFixed(2)}`;
}

/**
 * 生成 EPC 负载文本（CRLF 分隔、固定 12 行）。
 *
 * @param form - 已通过校验的表单
 * @returns 可直接编码为二维码的负载字符串
 * @throws 表单校验失败时抛出带字段信息的错误
 */
export function generateEpcPayload(form: EpcForm): string {
  const validation = validateEpcForm(form);
  if (!validation.valid) {
    const first = Object.entries(validation.errors)[0];
    throw new Error(first ? `${first[0]}：${first[1]}` : '表单校验失败');
  }

  const amountLine = form.amount !== null && form.amount > 0 ? formatAmountLine(form.amount) : '';
  const lines = [
    ...HEADER,
    form.bic.trim().toUpperCase(),
    form.name.trim(),
    normalizeIban(form.iban),
    amountLine,
    form.purposeCode.trim().toUpperCase(),
    form.creditorReference.trim(),
    form.remittance.trim(),
    form.note.trim(),
  ];

  return lines.join('\r\n');
}

/**
 * 解析 EPC 负载文本（容忍 LF/CRLF 换行）。
 *
 * @param input - 负载字符串
 * @returns 结构化字段
 * @throws 头三行损坏、行数不足或金额格式非法时抛出错误
 */
export function parseEpcPayload(input: string): EpcPayload {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  if (lines.length < LINE_COUNT) {
    throw new Error(`负载行数不足：应为 ${LINE_COUNT} 行，实际 ${lines.length} 行`);
  }

  const [tag, version, charset, identification] = lines;
  if (tag !== 'BCD') {
    throw new Error(`第 1 行必须为 BCD，实际为 "${tag}"`);
  }
  if (version !== '001' && version !== '002') {
    throw new Error(`第 2 行版本必须为 001 或 002，实际为 "${version}"`);
  }
  if (charset !== '1' && charset !== '2') {
    throw new Error(`第 3 行字符集标识必须为 1（UTF-8）或 2，实际为 "${charset}"`);
  }
  if (identification !== 'SCT') {
    throw new Error(`第 4 行必须为 SCT，实际为 "${identification}"`);
  }

  // EPC069-12 固定 12 行（零索引）：0-3 头，4 BIC，5 名称，6 IBAN，
  // 7 金额，8 用途代码，9 债权人引用，10 汇款说明，11 备注
  const amountText = lines[7] ?? '';
  if (amountText && !/^EUR\d+(\.\d{2})$/.test(amountText)) {
    throw new Error(`金额行格式非法（应为 EUR + 两位小数）："${amountText}"`);
  }

  return {
    bic: lines[4] ?? '',
    name: lines[5] ?? '',
    iban: lines[6] ?? '',
    amountText,
    purposeCode: lines[8] ?? '',
    creditorReference: lines[9] ?? '',
    remittance: lines[10] ?? '',
    note: lines[11] ?? '',
  };
}
