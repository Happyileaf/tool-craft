/**
 * JSDoc / TSDoc 文档注释块生成与解析纯函数。
 *
 * 生成方向：函数签名（支持 TS 类型注解、可选参数、默认值、剩余参数、泛型、async）
 *   → 标准 JSDoc 或 TSDoc 注释块；
 * 解析方向：既有注释块 → 结构化摘要 / 标签，并可与函数签名做一致性比对。
 *
 * 本模块只做词法与规则处理，不发起任何网络请求、不触碰 DOM。
 */

/** 函数签名中的单个参数 */
export interface SignatureParam {
  /** 参数名（不含 ... 与 ?） */
  name: string;
  /** TS 类型注解原文，未注解时为 undefined */
  type?: string;
  /** 是否可选（显式 ? 或带默认值） */
  optional: boolean;
  /** 是否剩余参数 ...rest */
  rest: boolean;
  /** 默认值原文（若有） */
  defaultValue?: string;
}

/** 解析后的函数签名结构 */
export interface ParsedSignature {
  name: string;
  isAsync: boolean;
  /** 泛型类型参数名列表 */
  typeParams: string[];
  params: SignatureParam[];
  /** 返回类型注解原文，未注解时为 undefined */
  returnType?: string;
}

/** 解析后的 @param 标签 */
export interface ParamTag {
  name: string;
  type?: string;
  description: string;
  optional: boolean;
}

/** 解析后的注释块结构 */
export interface ParsedDoc {
  summary: string;
  params: ParamTag[];
  returns?: { type?: string; description: string };
  throws: Array<{ type?: string; description: string }>;
  typeParams: Array<{ name: string; description: string }>;
  /** 未被结构化处理的其他标签 */
  otherTags: Array<{ tag: string; text: string }>;
}

/** 注释块与签名的一致性比对报告 */
export interface DocReport {
  /** 签名存在但注释缺失的参数名 */
  missingParams: string[];
  /** 注释存在但签名没有的参数名 */
  extraParams: string[];
  /** 签名存在但注释缺失的类型参数名 */
  missingTypeParams: string[];
  /** 签名声明了有效返回类型但注释缺少 @returns */
  missingReturns: boolean;
  /** 顺序不一致等非阻断性告警 */
  warnings: string[];
}

const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/;
const VOID_RETURN_TYPES = new Set(['void', 'undefined', 'never']);
const OPENING = '([{<';
const CLOSING = ')]}>';

/** 在尊重括号 / 方括号 / 花括号 / 尖括号嵌套与字符串引号的前提下，查找顶层分隔符位置 */
function findTopLevel(input: string, target: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charAt(i);
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (OPENING.includes(ch)) {
      depth += 1;
    } else if (CLOSING.includes(ch)) {
      depth -= 1;
    } else if (ch === target && depth === 0) {
      return i;
    }
  }
  return -1;
}

/** 按顶层逗号切分（用于参数列表与泛型列表） */
function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charAt(i);
    if (quote) {
      current += ch;
      if (ch === '\\') {
        current += input.charAt(i + 1);
        i += 1;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }
    if (OPENING.includes(ch)) {
      depth += 1;
    } else if (CLOSING.includes(ch)) {
      depth -= 1;
    }
    if (ch === ',' && depth === 0) {
      if (current.trim() !== '') {
        parts.push(current.trim());
      }
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '') {
    parts.push(current.trim());
  }
  return parts;
}

/** 从开括号位置定位匹配的闭括号 */
function matchClosing(text: string, openIndex: number): number {
  const open = text.charAt(openIndex);
  const close = CLOSING.charAt(OPENING.indexOf(open));
  let depth = 0;
  let quote: string | null = null;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === open) {
      depth += 1;
    } else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  throw new Error('括号不配对，无法解析函数签名');
}

/** 解析单个参数声明片段 */
function parseParam(chunk: string): SignatureParam {
  const rest = chunk.startsWith('...');
  const body = rest ? chunk.slice(3).trim() : chunk;

  let defaultValue: string | undefined;
  let head = body;
  const eqIndex = findTopLevel(body, '=');
  if (eqIndex >= 0) {
    defaultValue = body.slice(eqIndex + 1).trim();
    head = body.slice(0, eqIndex).trim();
  }

  let namePart: string;
  let type: string | undefined;
  const colonIndex = findTopLevel(head, ':');
  if (colonIndex >= 0) {
    namePart = head.slice(0, colonIndex).trim();
    type = head.slice(colonIndex + 1).trim();
  } else {
    namePart = head.trim();
  }

  const explicitOptional = namePart.endsWith('?');
  if (explicitOptional) {
    namePart = namePart.slice(0, -1).trim();
  }
  if (!IDENTIFIER_PATTERN.test(namePart)) {
    throw new Error(`无法解析参数名：「${chunk}」`);
  }

  return {
    name: namePart,
    type,
    optional: explicitOptional || defaultValue !== undefined,
    rest,
    defaultValue,
  };
}

/** 提取泛型声明中的类型参数名（去掉 extends 约束与默认值） */
function parseTypeParams(genericContent: string): string[] {
  return splitTopLevelCommas(genericContent).map((declaration) => {
    const match = declaration.match(/^([A-Za-z_$][\w$]*)/);
    if (!match) {
      throw new Error(`无法解析类型参数：「${declaration}」`);
    }
    return match[1] ?? '';
  });
}

/**
 * 解析 JS / TS 函数签名。
 *
 * 支持 function 声明、const 箭头函数、方法简写三种形态，覆盖泛型、async、
 * 可选参数、默认值与剩余参数。
 *
 * @param raw 函数签名原文
 * @returns 结构化签名
 */
export function parseFunctionSignature(raw: string): ParsedSignature {
  const text = raw.trim();
  if (text === '') {
    throw new Error('请粘贴函数签名');
  }

  const isAsync = /\basync\b/.test(text);

  let name: string | undefined;
  const functionMatch = text.match(/\bfunction\s+([A-Za-z_$][\w$]*)/);
  const variableMatch = text.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);
  const methodMatch = text.match(/^([A-Za-z_$][\w$]*)\s*[<(]/);
  if (functionMatch) {
    name = functionMatch[1] ?? '';
  } else if (variableMatch) {
    name = variableMatch[1] ?? '';
  } else if (methodMatch) {
    name = methodMatch[1] ?? '';
  }
  if (!name) {
    throw new Error('无法识别函数名，仅支持 function 声明、const 箭头函数与方法简写');
  }

  const openParen = text.indexOf('(');
  if (openParen < 0) {
    throw new Error('签名中找不到参数列表括号');
  }
  const closeParen = matchClosing(text, openParen);

  // 括号之前若存在尖括号泛型声明则提取
  const typeParams: string[] = [];
  let cursor = openParen - 1;
  while (cursor >= 0 && /\s/.test(text.charAt(cursor))) {
    cursor -= 1;
  }
  if (cursor >= 0 && text.charAt(cursor) === '>') {
    let angleDepth = 0;
    let genericStart = -1;
    for (let i = cursor; i >= 0; i -= 1) {
      if (text.charAt(i) === '>') {
        angleDepth += 1;
      } else if (text.charAt(i) === '<') {
        angleDepth -= 1;
        if (angleDepth === 0) {
          genericStart = i;
          break;
        }
      }
    }
    if (genericStart >= 0) {
      typeParams.push(...parseTypeParams(text.slice(genericStart + 1, cursor)));
    }
  }

  const paramContent = text.slice(openParen + 1, closeParen).trim();
  const params = paramContent === '' ? [] : splitTopLevelCommas(paramContent).map(parseParam);

  // 返回类型：) 之后若有 :，读取到函数体 {、箭头 =>、分号或结尾
  let returnType: string | undefined;
  let scan = closeParen + 1;
  while (scan < text.length && /\s/.test(text.charAt(scan))) {
    scan += 1;
  }
  if (text.charAt(scan) === ':') {
    scan += 1;
    let depth = 0;
    let collected = '';
    let objectTypeOpened = false;
    for (; scan < text.length; scan += 1) {
      const ch = text.charAt(scan);
      if (depth === 0 && (ch === ';' || ch === '=' || ch === ',')) {
        break;
      }
      if (depth === 0 && ch === '>' && text.charAt(scan - 1) === '=') {
        // 箭头 => 终止
        collected = collected.slice(0, -1);
        break;
      }
      if (depth === 0 && ch === '{') {
        // 开头的 { 是对象类型，其余深度为 0 的 { 是函数体
        if (collected.trim() === '' && !objectTypeOpened) {
          objectTypeOpened = true;
          depth += 1;
          collected += ch;
          continue;
        }
        break;
      }
      if (OPENING.includes(ch)) {
        depth += 1;
      } else if (CLOSING.includes(ch)) {
        depth -= 1;
      }
      collected += ch;
    }
    const trimmed = collected.trim();
    if (trimmed !== '') {
      returnType = trimmed;
    }
  }

  return { name, isAsync, typeParams, params, returnType };
}

/** 签名是否声明了需要文档化的返回类型（排除 void/undefined/never） */
export function hasDocumentedReturn(sig: ParsedSignature): boolean {
  return sig.returnType !== undefined && !VOID_RETURN_TYPES.has(sig.returnType);
}

/** JSDoc 风格下 async 函数的返回类型需包一层 Promise */
function effectiveReturnType(sig: ParsedSignature): string {
  const base = sig.returnType ?? '*';
  if (sig.isAsync && !/^Promise\s*</.test(base)) {
    return `Promise<${base}>`;
  }
  return base;
}

export interface GenerateOptions {
  /** 注释方言：jsdoc 带花括号内联类型；tsdoc 不放冗余类型 */
  dialect: 'jsdoc' | 'tsdoc';
  /** 是否生成摘要描述占位行与分隔空行 */
  includeDescription: boolean;
}

/**
 * 由结构化函数签名生成 JSDoc / TSDoc 注释块文本。
 *
 * @param sig 解析后的函数签名
 * @param options 方言与占位选项
 * @returns 可直接粘贴的注释块
 */
export function generateJsdoc(sig: ParsedSignature, options: GenerateOptions): string {
  const lines: string[] = ['/**'];
  if (options.includeDescription) {
    lines.push(' * <在此填写函数摘要描述>');
  }
  const tags: string[] = [];

  if (options.dialect === 'tsdoc') {
    for (const typeParam of sig.typeParams) {
      tags.push(`@typeParam ${typeParam} - <类型参数说明>`);
    }
    for (const param of sig.params) {
      const prefix = param.rest ? '...' : '';
      const optionalNote = param.optional ? '（可选）' : '';
      tags.push(`@param ${prefix}${param.name} - <参数说明>${optionalNote}`);
    }
    if (hasDocumentedReturn(sig)) {
      tags.push('@returns <返回值说明>');
    }
    tags.push('@remarks <补充说明，可选>');
  } else {
    for (const typeParam of sig.typeParams) {
      tags.push(`@template ${typeParam} <类型参数说明>`);
    }
    for (const param of sig.params) {
      const type = param.type ?? '*';
      const target = param.optional ? `[${param.name}]` : param.name;
      tags.push(`@param {${type}} ${target} - <参数说明>`);
    }
    if (hasDocumentedReturn(sig)) {
      tags.push(`@returns {${effectiveReturnType(sig)}} <返回值说明>`);
    }
  }

  if (tags.length > 0) {
    if (options.includeDescription) {
      lines.push(' *');
    }
    for (const tag of tags) {
      lines.push(` * ${tag}`);
    }
  }
  lines.push(' */');
  return lines.join('\n');
}

/** 去除注释块每行的星号前缀 */
function stripStarPrefix(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('*')) {
    return trimmed.slice(1).replace(/^\s/, '');
  }
  return trimmed;
}

/** 解析 @param 标签的类型、名称（含 [] 可选与 ... 剩余写法）与描述 */
function parseParamTag(rest: string): ParamTag {
  let remaining = rest.trim();
  let type: string | undefined;
  const typeMatch = remaining.match(/^\{((?:[^{}]|\{[^{}]*\})*)\}\s*/);
  if (typeMatch) {
    type = (typeMatch[1] ?? '').trim();
    remaining = remaining.slice(typeMatch[0].length);
  }

  const nameMatch = remaining.match(/^(\[\s*)?(\.\.\.)?([A-Za-z_$][\w$]*)(\s*\])?/);
  if (!nameMatch) {
    throw new Error(`无法解析 @param 标签：「${rest}」`);
  }
  const optional = nameMatch[1] !== undefined;
  const name = nameMatch[3] ?? '';
  remaining = remaining.slice(nameMatch[0].length).trim().replace(/^-\s*/, '');

  return { name, type, description: remaining.trim(), optional };
}

/** 解析可选的花括号类型与剩余描述 */
function parseTypeAndDescription(rest: string): { type?: string; description: string } {
  const trimmed = rest.trim();
  const typeMatch = trimmed.match(/^\{((?:[^{}]|\{[^{}]*\})*)\}\s*/);
  if (!typeMatch) {
    return { description: trimmed };
  }
  return {
    type: (typeMatch[1] ?? '').trim(),
    description: trimmed.slice(typeMatch[0].length).trim(),
  };
}

/**
 * 解析 JSDoc / TSDoc 注释块为结构化数据。
 *
 * @param raw 含 `/** ... *\/` 的注释原文
 * @returns 摘要、参数、返回值、异常、类型参数与其他标签
 */
export function parseJsdoc(raw: string): ParsedDoc {
  const blockMatch = raw.match(/\/\*\*([\s\S]*?)\*\//);
  if (!blockMatch) {
    throw new Error('未找到 /** ... */ 形式的文档注释块');
  }

  const logicalLines: Array<{ isTag: boolean; text: string }> = [];
  for (const rawLine of (blockMatch[1] ?? '').split('\n')) {
    const line = stripStarPrefix(rawLine).trim();
    if (line === '') {
      continue;
    }
    if (line.startsWith('@')) {
      logicalLines.push({ isTag: true, text: line });
    } else if (
      logicalLines.length > 0 &&
      logicalLines[logicalLines.length - 1]?.isTag
    ) {
      const previous = logicalLines[logicalLines.length - 1];
      if (previous) {
        previous.text = `${previous.text} ${line}`;
      }
    } else {
      logicalLines.push({ isTag: false, text: line });
    }
  }

  const summaryLines: string[] = [];
  const params: ParamTag[] = [];
  const throws: ParsedDoc['throws'] = [];
  const typeParams: ParsedDoc['typeParams'] = [];
  const otherTags: ParsedDoc['otherTags'] = [];
  let returns: ParsedDoc['returns'];

  for (const entry of logicalLines) {
    if (!entry.isTag) {
      summaryLines.push(entry.text);
      continue;
    }
    const tagMatch = entry.text.match(/^@(\w+)\s*(.*)$/);
    if (!tagMatch) {
      continue;
    }
    const tag = tagMatch[1] ?? '';
    const rest = (tagMatch[2] ?? '').trim();

    if (tag === 'param' || tag === 'arg' || tag === 'argument') {
      params.push(parseParamTag(rest));
    } else if (tag === 'returns' || tag === 'return') {
      returns = parseTypeAndDescription(rest);
    } else if (tag === 'throws' || tag === 'exception') {
      throws.push(parseTypeAndDescription(rest));
    } else if (tag === 'typeParam' || tag === 'template') {
      const nameMatch = rest.match(/^([A-Za-z_$][\w$]*)/);
      if (!nameMatch) {
        throw new Error(`无法解析 @${tag} 标签：「${rest}」`);
      }
      const description = rest.slice(nameMatch[0].length).trim().replace(/^-\s*/, '');
      typeParams.push({ name: nameMatch[1] ?? '', description });
    } else {
      otherTags.push({ tag, text: rest });
    }
  }

  return {
    summary: summaryLines.join(' ').trim(),
    params,
    returns,
    throws,
    typeParams,
    otherTags,
  };
}

/**
 * 比对注释块与函数签名的一致性。
 *
 * @param doc 解析后的注释块
 * @param sig 解析后的函数签名
 * @returns 缺失 / 多余参数与告警清单
 */
export function compareDocWithSignature(doc: ParsedDoc, sig: ParsedSignature): DocReport {
  const signatureNames = sig.params.map((param) => param.name);
  const documentedNames = doc.params.map((param) => param.name);

  const missingParams = signatureNames.filter((name) => !documentedNames.includes(name));
  const extraParams = documentedNames.filter((name) => !signatureNames.includes(name));
  const missingTypeParams = sig.typeParams.filter(
    (name) => !doc.typeParams.some((entry) => entry.name === name),
  );
  const missingReturns = hasDocumentedReturn(sig) && !doc.returns;

  const warnings: string[] = [];
  if (missingParams.length > 0) {
    warnings.push(`注释缺少 @param：${missingParams.join('、')}`);
  }
  if (extraParams.length > 0) {
    warnings.push(`注释存在签名中没有的 @param：${extraParams.join('、')}`);
  }
  if (missingTypeParams.length > 0) {
    warnings.push(`注释缺少类型参数标签：${missingTypeParams.join('、')}`);
  }
  if (missingReturns) {
    warnings.push(`签名声明了返回类型「${sig.returnType}」但注释缺少 @returns`);
  }
  if (missingParams.length === 0 && extraParams.length === 0 && signatureNames.length > 1) {
    const sameOrder = signatureNames.every((name, index) => documentedNames[index] === name);
    if (!sameOrder) {
      warnings.push('@param 顺序与签名参数顺序不一致，建议按签名顺序排列');
    }
  }
  for (const param of sig.params) {
    const documented = doc.params.find((entry) => entry.name === param.name);
    if (documented && param.optional && !documented.optional) {
      warnings.push(`参数「${param.name}」在签名中可选，但注释未用 [${param.name}] 标注`);
    }
  }

  return { missingParams, extraParams, missingTypeParams, missingReturns, warnings };
}
