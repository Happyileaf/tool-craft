/**
 * GEDCOM 5.5.1 族谱文件解析与结构查看（零依赖纯函数）
 *
 * 行结构：`层级 [指针] 标签 [值]`，层级为非负整数，标签大写。
 * 支持：
 *  - 层级树构建（要求层级相对上一条最多 +1，跳号报错但不中断）
 *  - CONC（无分隔拼接）/ CONT（换行拼接）续行
 *  - INDI / FAM 顶层记录提取与 @XREF@ 交叉引用解析
 *  - 未知标签容忍保留；悬空指针告警
 * 不实现 ANSEL 转码：仅识别 CHAR 声明，UTF-8 直接处理。
 */

export interface GedcomNode {
  level: number;
  /** 形如 @I1@ 的交叉引用指针，可能为空 */
  xref: string;
  tag: string;
  /** 标签之后的值（可能是普通值或 @指针@） */
  value: string;
  line: number;
  children: GedcomNode[];
}

export interface GedcomIssue {
  line: number;
  level: 'error' | 'warning';
  message: string;
}

export interface ParseResult {
  /** 顶层（level 0）记录 */
  roots: GedcomNode[];
  issues: GedcomIssue[];
  /** 按 xref 索引的顶层记录（INDI/FAM 等） */
  byXref: Record<string, GedcomNode>;
  individuals: GedcomNode[];
  families: GedcomNode[];
  charEncoding: string | null;
  counts: {
    totalLines: number;
    records: number;
    individuals: number;
    families: number;
  };
}

// 标签后只消费一个分隔空格，值的前导空格按 GEDCOM 5.5.1 保留（CONC 续行依赖此约定）
const LINE_RE = /^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Za-z0-9_]+)(?: (.*))?$/;
const XREF_RE = /^@[^@]+@$/;

/** 在子节点中取第一个指定标签的值 */
export function firstChildValue(node: GedcomNode, tag: string): string | null {
  const child = node.children.find((c) => c.tag === tag);
  return child ? child.value : null;
}

/** 取某标签下的全部子节点 */
export function childrenByTag(node: GedcomNode, tag: string): GedcomNode[] {
  return node.children.filter((c) => c.tag === tag);
}

/** 拼接 NAME（GEDCOM 中姓氏常用 /斜杠/ 包裹），返回全名与去除斜杠的展示名 */
export function formatName(node: GedcomNode): { raw: string; display: string } | null {
  const raw = firstChildValue(node, 'NAME');
  if (raw === null) return null;
  return { raw, display: raw.replace(/\//g, '').replace(/\s+/g, ' ').trim() };
}

/** 读取 BIRT/DEAT 等事件下的 DATE 与 PLAC */
export function readEvent(node: GedcomNode, eventTag: string): { date: string | null; place: string | null } {
  const event = node.children.find((c) => c.tag === eventTag);
  if (!event) return { date: null, place: null };
  return {
    date: firstChildValue(event, 'DATE'),
    place: firstChildValue(event, 'PLAC'),
  };
}

export interface IndividualSummary {
  xref: string;
  name: string | null;
  sex: string | null;
  birth: { date: string | null; place: string | null };
  death: { date: string | null; place: string | null };
  /** 所属家庭（作为子女，FAMC） */
  familyAsChild: string[];
  /** 所属家庭（作为配偶，FAMS） */
  familyAsSpouse: string[];
}

export interface FamilySummary {
  xref: string;
  husband: string | null;
  wife: string | null;
  children: string[];
}

export interface RelationshipView {
  individuals: IndividualSummary[];
  families: FamilySummary[];
  /** 悬空指针告警（引用不存在的记录） */
  dangling: GedcomIssue[];
}

function summarizeIndividual(node: GedcomNode): IndividualSummary {
  const name = formatName(node)?.display ?? null;
  return {
    xref: node.xref,
    name,
    sex: firstChildValue(node, 'SEX'),
    birth: readEvent(node, 'BIRT'),
    death: readEvent(node, 'DEAT'),
    familyAsChild: childrenByTag(node, 'FAMC').map((c) => c.value),
    familyAsSpouse: childrenByTag(node, 'FAMS').map((c) => c.value),
  };
}

export function parseGedcom(text: string): ParseResult {
  const issues: GedcomIssue[] = [];
  // 兼容 CRLF / LF
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const roots: GedcomNode[] = [];
  /** 每个层级当前最近的节点，用于挂接子节点 */
  const stack: GedcomNode[] = [];
  /** 上一个叶子节点，用于 CONC/CONT 续行 */
  let lastLeaf: GedcomNode | null = null;
  let charEncoding: string | null = null;

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    if (rawLine.trim() === '') return;

    const match = LINE_RE.exec(rawLine.trim());
    if (!match) {
      issues.push({ line, level: 'error', message: '行首格式非法，应为：层级 [指针] 标签 [值]' });
      return;
    }
    const level = Number(match[1]);
    const xref = match[2] ?? '';
    const tag = match[3]!.toUpperCase();
    const value = match[4] ?? '';

    // 层级跳号校验：相对栈顶层级最多 +1
    const parentLevel = stack.length > 0 ? stack[stack.length - 1]!.level : -1;
    if (level > parentLevel + 1) {
      issues.push({
        line,
        level: 'error',
        message: `层级跳号：上一层级为 ${parentLevel}，当前直接出现层级 ${level}`,
      });
      // 不中断：仍按能挂接的最近祖先处理
    }

    const node: GedcomNode = { level, xref, tag, value, line, children: [] };

    if (tag === 'CHAR') {
      charEncoding = value;
    }

    // 续行处理：CONC 直接拼接，CONT 先补换行再拼接
    if (tag === 'CONC' || tag === 'CONT') {
      if (lastLeaf) {
        lastLeaf.value += (tag === 'CONT' ? '\n' : '') + value;
      } else {
        issues.push({ line, level: 'warning', message: `${tag} 续行没有可依附的上一条记录` });
      }
      return;
    }

    if (level === 0) {
      roots.push(node);
      stack.length = 0;
      stack.push(node);
    } else {
      // 弹出层级 >= 当前的节点，找到父节点
      while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
        stack.push(node);
      } else {
        issues.push({ line, level: 'error', message: `层级 ${level} 节点缺少层级 0 父记录` });
      }
    }
    lastLeaf = node;
  });

  const byXref: Record<string, GedcomNode> = {};
  roots.forEach((root) => {
    if (root.xref) byXref[root.xref] = root;
  });

  const individuals = roots.filter((r) => r.tag === 'INDI');
  const families = roots.filter((r) => r.tag === 'FAM');

  return {
    roots,
    issues,
    byXref,
    individuals,
    families,
    charEncoding,
    counts: {
      totalLines: lines.filter((l) => l.trim() !== '').length,
      records: roots.length,
      individuals: individuals.length,
      families: families.length,
    },
  };
}

/** 构建人物/家庭关系视图，并检测悬空指针 */
export function buildRelationships(parsed: ParseResult): RelationshipView {
  const dangling: GedcomIssue[] = [];
  const checkRef = (xref: string, line: number) => {
    if (xref && XREF_RE.test(xref) && !parsed.byXref[xref]) {
      dangling.push({ line, level: 'warning', message: `悬空指针：${xref} 未指向任何已定义记录` });
    }
  };

  const individuals = parsed.individuals.map(summarizeIndividual);

  const families: FamilySummary[] = parsed.families.map((fam) => {
    const husband = firstChildValue(fam, 'HUSB');
    const wife = firstChildValue(fam, 'WIFE');
    const children = childrenByTag(fam, 'CHIL').map((c) => c.value);
    [husband, wife, ...children].forEach((ref) => {
      if (ref) checkRef(ref, fam.line);
    });
    return { xref: fam.xref, husband, wife, children };
  });

  // 人物记录中的 FAMC/FAMS 指针也校验
  parsed.individuals.forEach((indi) => {
    ['FAMC', 'FAMS'].forEach((tag) => {
      childrenByTag(indi, tag).forEach((c) => checkRef(c.value, c.line));
    });
  });

  return { individuals, families, dangling };
}

/** 把解析树渲染为层级缩进文本（用于「原始层级树」展示） */
export function renderTree(roots: GedcomNode[]): string {
  const out: string[] = [];
  const walk = (node: GedcomNode) => {
    const head = [
      node.level,
      node.xref ? ` ${node.xref}` : '',
      ` ${node.tag}`,
      node.value ? ` ${node.value}` : '',
    ].join('');
    out.push(head);
    node.children.forEach(walk);
  };
  roots.forEach(walk);
  return out.join('\n');
}
