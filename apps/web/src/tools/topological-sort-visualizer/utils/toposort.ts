/**
 * 有向图拓扑排序与环检测纯函数模块。
 * 全部逻辑不触碰 DOM，输入确定则输出确定：
 * 节点按首次出现顺序排列，邻接表按边首次出现顺序排列，
 * Kahn 队列按节点顺序 FIFO 出队，DFS 按节点顺序与邻接顺序遍历。
 */

/** 可交互图规模上限，防止浏览器主线程卡顿 */
export const MAX_NODES = 200;

/** 一条有向边 */
export interface DirectedEdge {
  /** 起点节点名 */
  from: string;
  /** 终点节点名 */
  to: string;
}

/** 解析阶段产物 */
export interface ParsedGraph {
  /** 去重后的边列表，保持首次出现顺序 */
  edges: DirectedEdge[];
  /** 全部节点，按首次出现顺序（含孤立节点由调用方补充，本结构仅含边端点） */
  nodes: string[];
  /** 被去重丢弃的重复边 */
  duplicateEdges: DirectedEdge[];
}

/** Kahn 单步记录：某个零入度节点出队及其松弛的边 */
export interface KahnStep {
  /** 本步入队输出的节点 */
  node: string;
  /** 本步被移除（入度减一）的边 */
  relaxedEdges: DirectedEdge[];
}

/** DFS 单步记录：进入或离开节点 */
export interface DfsStep {
  /** 事件类型，enter 为着灰色入栈，exit 为着黑色出栈 */
  event: 'enter' | 'exit';
  /** 事件节点 */
  node: string;
}

/** 环信息 */
export interface CycleInfo {
  /** 环上节点路径，按环方向排列 */
  path: string[];
  /** 闭合环的最后一条边 */
  closingEdge: DirectedEdge;
}

/** 分析结果 */
export interface TopoResult {
  /** 总体结论：无环或有环 */
  status: 'acyclic' | 'cyclic';
  /** 全部节点（首次出现顺序） */
  nodes: string[];
  /** 邻接表，键为节点名，值为去重后的后继节点数组 */
  adjacency: Record<string, string[]>;
  /** 初始入度表 */
  indegree: Record<string, number>;
  /** 去重后的边总数 */
  edgeCount: number;
  /** Kahn 拓扑序；有环时为只包含环外节点的部分序列 */
  kahnOrder: string[];
  /** Kahn 逐步记录 */
  kahnSteps: KahnStep[];
  /** DFS 逆后序拓扑序；有环时为空数组 */
  dfsOrder: string[];
  /** DFS 着色事件流 */
  dfsSteps: DfsStep[];
  /** 有环时的环路径与闭合边 */
  cycle?: CycleInfo;
  /** 解析时发现的重复边 */
  duplicateEdges: DirectedEdge[];
}

/** 带行号的图解析错误 */
export class GraphParseError extends Error {
  /** 出错行号，从 1 开始 */
  line: number;

  constructor(line: number, message: string) {
    super(`第 ${line} 行：${message}`);
    this.name = 'GraphParseError';
    this.line = line;
  }
}

/** 行内是否出现边分隔符（含中文箭头与胖箭头容错） */
function hasSeparator(line: string): boolean {
  return line.includes('->') || line.includes('→') || line.includes('=>') || line.includes(',');
}

/**
 * 将单行文本切分为一条边的两个端点。
 * 兼容 `A -> B`、`A → B`、`A => B`、`A,B` 以及多余空白。
 *
 * @param line 去除首尾空白后的单行文本
 * @returns 两个端点名称；结构非法（端点缺失或一条边出现多个分隔符）时返回 null
 */
function splitEdgeLine(line: string): [string, string] | null {
  const normalized = line
    .replace(/→/g, '->')
    .replace(/=>/g, '->')
    .trim();

  let parts: string[];
  if (normalized.includes('->')) {
    parts = normalized.split('->');
  } else {
    parts = normalized.split(',');
  }

  if (parts.length !== 2) {
    return null;
  }

  const from = parts[0]?.trim() ?? '';
  const to = parts[1]?.trim() ?? '';
  if (!from || !to) {
    return null;
  }
  return [from, to];
}

/**
 * 解析边列表文本为结构化图数据。
 * 空行忽略；每行必须恰好描述一条边，否则抛出带行号的 GraphParseError；
 * 重复边去重并登记到 duplicateEdges；节点数超过 MAX_NODES 抛错。
 *
 * @param raw 多行边列表原始文本
 * @returns 解析产物
 */
export function parseGraph(raw: string): ParsedGraph {
  const lines = raw.split(/\r?\n/);
  const edges: DirectedEdge[] = [];
  const duplicateEdges: DirectedEdge[] = [];
  const seenNodes: string[] = [];
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();

  const touchNode = (name: string): void => {
    if (!nodeSet.has(name)) {
      if (nodeSet.size >= MAX_NODES) {
        throw new GraphParseError(
          0,
          `节点数超过上限 ${MAX_NODES}，请缩小图规模后重试`,
        );
      }
      nodeSet.add(name);
      seenNodes.push(name);
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }
    const lineNumber = index + 1;

    // 不含任何边分隔符的单行视为孤立节点声明（节点名本身不允许空白）
    if (!hasSeparator(line)) {
      if (/\s/.test(line)) {
        throw new GraphParseError(
          lineNumber,
          '无法识别的行：边定义应形如 `A -> B` 或 `A,B`，孤立节点名不可包含空白',
        );
      }
      touchNode(line);
      return;
    }

    const pair = splitEdgeLine(line);
    if (!pair) {
      throw new GraphParseError(
        lineNumber,
        '无法识别的边定义，应形如 `A -> B` 或 `A,B`，且两侧节点名均不可为空',
      );
    }
    const [from, to] = pair;
    touchNode(from);
    touchNode(to);

    const key = `${from}\u0000${to}`;
    if (edgeSet.has(key)) {
      duplicateEdges.push({ from, to });
      return;
    }
    edgeSet.add(key);
    edges.push({ from, to });
  });

  return { edges, nodes: seenNodes, duplicateEdges };
}

/**
 * 基于解析产物构建邻接表与初始入度表。
 *
 * @param parsed 解析产物
 * @returns 邻接表与入度表
 */
function buildAdjacency(parsed: ParsedGraph): {
  adjacency: Record<string, string[]>;
  indegree: Record<string, number>;
} {
  const adjacency: Record<string, string[]> = {};
  const indegree: Record<string, number> = {};
  parsed.nodes.forEach((node) => {
    adjacency[node] = [];
    indegree[node] = 0;
  });
  parsed.edges.forEach(({ from, to }) => {
    adjacency[from]?.push(to);
    indegree[to] = (indegree[to] ?? 0) + 1;
  });
  return { adjacency, indegree };
}

/**
 * Kahn 入度算法：零入度节点按节点顺序进入 FIFO 队列，
 * 输出拓扑序并记录每一步松弛的边。
 *
 * @param nodes 节点顺序表
 * @param adjacency 邻接表
 * @param indegree 初始入度表（会被复制，不修改入参）
 * @returns 拓扑序与逐步记录
 */
function runKahn(
  nodes: string[],
  adjacency: Record<string, string[]>,
  indegree: Record<string, number>,
): { order: string[]; steps: KahnStep[] } {
  const remaining: Record<string, number> = { ...indegree };
  const queue = nodes.filter((node) => remaining[node] === 0);
  const order: string[] = [];
  const steps: KahnStep[] = [];
  let head = 0;

  while (head < queue.length) {
    const node = queue[head] as string;
    head += 1;
    order.push(node);

    const relaxedEdges: DirectedEdge[] = [];
    (adjacency[node] ?? []).forEach((next) => {
      remaining[next] = (remaining[next] ?? 0) - 1;
      relaxedEdges.push({ from: node, to: next });
      if (remaining[next] === 0) {
        queue.push(next);
      }
    });
    steps.push({ node, relaxedEdges });
  }

  return { order, steps };
}

/**
 * DFS 三色标记：白未访问、灰在栈中、黑已完成。
 * 遇到灰色后继即发现环，沿递归栈切片得到环路径；
 * 无环时逆后序即为合法拓扑序。
 *
 * @param nodes 节点顺序表
 * @param adjacency 邻接表
 * @returns DFS 拓扑序、事件流与环信息（如有）
 */
function runDfs(
  nodes: string[],
  adjacency: Record<string, string[]>,
): { order: string[]; steps: DfsStep[]; cycle?: CycleInfo } {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color: Record<string, number> = {};
  nodes.forEach((node) => {
    color[node] = WHITE;
  });

  const steps: DfsStep[] = [];
  const postorder: string[] = [];
  const stack: string[] = [];
  let cycle: CycleInfo | undefined;

  const visit = (node: string): boolean => {
    color[node] = GRAY;
    stack.push(node);
    steps.push({ event: 'enter', node });

    for (const next of adjacency[node] ?? []) {
      const nextColor = color[next] ?? WHITE;
      if (nextColor === WHITE) {
        if (visit(next)) {
          return true;
        }
      } else if (nextColor === GRAY) {
        const start = stack.indexOf(next);
        cycle = {
          path: stack.slice(start >= 0 ? start : 0),
          closingEdge: { from: node, to: next },
        };
        return true;
      }
    }

    color[node] = BLACK;
    stack.pop();
    postorder.push(node);
    steps.push({ event: 'exit', node });
    return false;
  };

  for (const node of nodes) {
    if ((color[node] ?? WHITE) === WHITE) {
      if (visit(node)) {
        return { order: [], steps, cycle };
      }
    }
  }

  return { order: postorder.reverse(), steps, cycle };
}

/**
 * 解析并分析整张图：一次调用给出双算法拓扑序、逐步记录与环信息。
 *
 * @param raw 多行边列表原始文本
 * @returns 完整分析结果；输入非法时抛出 GraphParseError
 */
export function analyzeGraph(raw: string): TopoResult {
  const parsed = parseGraph(raw);
  const { adjacency, indegree } = buildAdjacency(parsed);
  const kahn = runKahn(parsed.nodes, adjacency, indegree);
  const dfs = runDfs(parsed.nodes, adjacency);
  const cyclic = kahn.order.length < parsed.nodes.length;

  return {
    status: cyclic ? 'cyclic' : 'acyclic',
    nodes: parsed.nodes,
    adjacency,
    indegree,
    edgeCount: parsed.edges.length,
    kahnOrder: kahn.order,
    kahnSteps: kahn.steps,
    dfsOrder: dfs.order,
    dfsSteps: dfs.steps,
    cycle: dfs.cycle,
    duplicateEdges: parsed.duplicateEdges,
  };
}
