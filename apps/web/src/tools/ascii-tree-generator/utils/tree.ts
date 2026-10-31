/**
 * ASCII 文件树生成核心逻辑：路径解析、树构建与 tree 风格文本渲染，纯函数零依赖。
 */

/** 排序方式 */
export type TreeSortMode = 'alpha' | 'input';

/** 树节点（目录含 children，文件不含） */
export interface TreeNode {
  /** 节点名（单层，不含分隔符） */
  name: string;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 子节点（仅目录节点拥有） */
  children: TreeNode[];
  /** 输入顺序序号，input 排序模式使用 */
  order: number;
}

/** 生成选项 */
export interface TreeOptions {
  /** 排序方式：字典序（目录优先）或保持输入顺序 */
  sort: TreeSortMode;
  /** 仅展示目录 */
  directoriesOnly: boolean;
  /** 过滤 . 开头的隐藏条目 */
  excludeHidden: boolean;
  /** 最大展示深度（根层为 1）；Infinity 表示不限制 */
  maxDepth: number;
  /** 根名标题行；为空时不输出 */
  rootName?: string;
}

/** 树统计结果 */
export interface TreeStats {
  directories: number;
  files: number;
}

/**
 * 把单行原始路径规整为分段数组；非法输入（空行、仅分隔符）返回 null。
 * 同时兼容 `/` 与 `\`，去除首尾分隔符与空段。
 *
 * @param line - 原始路径行
 * @returns 路径分段；无法构成路径时返回 null
 */
export function parsePathLine(line: string): string[] | null {
  const normalized = line.replace(/\\/g, '/').trim();
  if (normalized === '') {
    return null;
  }
  const segments = normalized
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment !== '');
  return segments.length > 0 ? segments : null;
}

/**
 * 按选项过滤单个节点是否展示（隐藏条目；仅目录模式在构建子节点时处理）。
 *
 * @param node - 树节点
 * @param options - 生成选项
 * @returns 是否保留
 */
function isNodeVisible(node: TreeNode, options: TreeOptions): boolean {
  if (options.excludeHidden && node.name.startsWith('.')) {
    return false;
  }
  if (options.directoriesOnly && !node.isDirectory) {
    return false;
  }
  return true;
}

/**
 * 在父节点的 children 中按名查找子节点。
 *
 * @param parent - 父目录节点
 * @param name - 子节点名
 * @returns 已有子节点；不存在返回 undefined
 */
function findChild(parent: TreeNode, name: string): TreeNode | undefined {
  return parent.children.find((child) => child.name === name);
}

/**
 * 由路径行列表构建树。中间缺失目录自动补全；重复路径去重；
 * 同名路径若先作为隐式目录、后出现文件，以文件为准。
 *
 * @param lines - 原始路径行
 * @returns 虚拟根节点（其 children 即顶层条目）
 */
export function buildTree(lines: string[]): TreeNode {
  const root: TreeNode = {
    name: '',
    isDirectory: true,
    children: [],
    order: -1,
  };

  let order = 0;
  for (const line of lines) {
    const segments = parsePathLine(line);
    if (!segments) {
      continue;
    }
    let current = root;
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      let child = findChild(current, segment);
      if (!child) {
        child = {
          name: segment,
          // 最后一段视为文件；中间路径段为隐式目录
          isDirectory: !isLast,
          children: [],
          order: order++,
        };
        current.children.push(child);
      } else if (isLast && child.children.length === 0) {
        // 显式终段声明为文件（覆盖此前的隐式目录占位，前提是其下仍无子节点）
        child.isDirectory = false;
      } else if (!isLast) {
        // 后续路径在其下继续嵌套时提升为目录
        child.isDirectory = true;
      }
      current = child;
    });
  }

  return root;
}

/**
 * 递归过滤节点：返回保留下来的子节点数组；目录过滤后若无可见子节点也会被移除。
 *
 * @param node - 当前目录节点
 * @param options - 生成选项
 * @returns 过滤后的子节点
 */
function filterChildren(node: TreeNode, options: TreeOptions): TreeNode[] {
  const result: TreeNode[] = [];
  for (const child of node.children) {
    if (!isNodeVisible(child, options)) {
      continue;
    }
    if (child.isDirectory) {
      const visibleGrandchildren = filterChildren(child, options);
      // 仅目录模式下空目录仍保留；其他模式下过滤光的目录不展示
      if (visibleGrandchildren.length === 0 && !options.directoriesOnly) {
        continue;
      }
      result.push({ ...child, children: visibleGrandchildren });
    } else {
      result.push(child);
    }
  }
  return result;
}

/**
 * 对同层节点排序：字典序时目录优先、名称 localeCompare；输入顺序模式按 order。
 *
 * @param nodes - 同层节点
 * @param mode - 排序方式
 * @returns 排序后的新数组
 */
export function sortNodes(nodes: TreeNode[], mode: TreeSortMode): TreeNode[] {
  const copy = [...nodes];
  if (mode === 'input') {
    copy.sort((a, b) => a.order - b.order);
    return copy;
  }
  copy.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  return copy;
}

/**
 * 统计树中目录与文件数量（传入的应为已过滤的虚拟根 children）。
 *
 * @param nodes - 顶层节点
 * @returns 目录数与文件数
 */
export function countNodes(nodes: TreeNode[]): TreeStats {
  const stats: TreeStats = { directories: 0, files: 0 };
  const walk = (list: TreeNode[]) => {
    list.forEach((node) => {
      if (node.isDirectory) {
        stats.directories += 1;
        walk(node.children);
      } else {
        stats.files += 1;
      }
    });
  };
  walk(nodes);
  return stats;
}

/**
 * 递归渲染单层节点为 tree 风格文本行。
 *
 * @param nodes - 同层节点
 * @param prefix - 当前层前缀（连接竖线 / 空格）
 * @param depth - 当前深度（根层为 1）
 * @param options - 生成选项
 * @param lines - 累积输出行
 */
function renderLevel(
  nodes: TreeNode[],
  prefix: string,
  depth: number,
  options: TreeOptions,
  lines: string[],
): void {
  const sorted = sortNodes(nodes, options.sort);
  sorted.forEach((node, index) => {
    const isLast = index === sorted.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    lines.push(`${prefix}${connector}${node.name}`);

    if (node.isDirectory) {
      if (depth >= options.maxDepth) {
        if (node.children.length > 0) {
          const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
          lines.push(`${childPrefix}└── …`);
        }
        return;
      }
      const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
      renderLevel(node.children, childPrefix, depth + 1, options, lines);
    }
  });
}

/**
 * 解析原始路径文本，返回按选项过滤、排序后的顶层节点（供统计等复用）。
 *
 * @param input - 换行分隔的路径文本
 * @param options - 生成选项
 * @returns 顶层可见节点
 */
export function getVisibleNodes(input: string, options: TreeOptions): TreeNode[] {
  const root = buildTree(input.split(/\r?\n/));
  return sortNodes(filterChildren(root, options), options.sort);
}

/**
 * 由原始路径文本生成 ASCII 树。
 *
 * @param input - 换行分隔的路径文本
 * @param options - 生成选项
 * @returns tree 风格文本（末尾以换行结束）
 */
export function generateTree(input: string, options: TreeOptions): string {
  const lines = input.split(/\r?\n/);
  const root = buildTree(lines);
  const visible = sortNodes(filterChildren(root, options), options.sort);

  const output: string[] = [];
  if (options.rootName && options.rootName.trim() !== '') {
    output.push(options.rootName.trim());
  }
  renderLevel(visible, '', 1, options, output);
  return output.length > 0 ? `${output.join('\n')}\n` : '';
}
