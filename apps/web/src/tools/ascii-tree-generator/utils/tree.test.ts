import { describe, expect, it } from 'vitest';
import {
  buildTree,
  countNodes,
  generateTree,
  parsePathLine,
  sortNodes,
  type TreeOptions,
} from './tree';

const DEFAULT_OPTIONS: TreeOptions = {
  sort: 'alpha',
  directoriesOnly: false,
  excludeHidden: false,
  maxDepth: Infinity,
};

describe('parsePathLine', () => {
  it('兼容反斜杠、首尾分隔符与空白', () => {
    expect(parsePathLine('a\\b\\d.ts')).toEqual(['a', 'b', 'd.ts']);
    expect(parsePathLine('/src/main.ts/')).toEqual(['src', 'main.ts']);
    expect(parsePathLine('  src/a.ts  ')).toEqual(['src', 'a.ts']);
  });

  it('空行与仅分隔符返回 null', () => {
    expect(parsePathLine('')).toBeNull();
    expect(parsePathLine('   ')).toBeNull();
    expect(parsePathLine('/ \\ /')).toBeNull();
  });
});

describe('buildTree', () => {
  it('中间缺失目录自动补全、重复路径去重', () => {
    const root = buildTree(['a/b/c.ts', 'a/b/c.ts', 'a/b/d.ts']);
    expect(root.children).toHaveLength(1);
    const a = root.children[0]!;
    expect(a.name).toBe('a');
    expect(a.isDirectory).toBe(true);
    const b = a.children[0]!;
    expect(b.name).toBe('b');
    expect(b.children.map((node) => node.name)).toEqual(['c.ts', 'd.ts']);
  });

  it('同名冲突时含子节点的节点保持为目录', () => {
    const root = buildTree(['x', 'x/y.ts']);
    const x = root.children[0]!;
    expect(x.isDirectory).toBe(true);
    expect(x.children[0]!.name).toBe('y.ts');
  });
});

describe('sortNodes', () => {
  it('字典序时目录优先；输入顺序模式按插入序', () => {
    const root = buildTree(['b.ts', 'dir/z.ts', 'a.ts']);
    const alpha = sortNodes(root.children, 'alpha').map((node) => node.name);
    expect(alpha).toEqual(['dir', 'a.ts', 'b.ts']);
    const inputOrder = sortNodes(root.children, 'input').map((node) => node.name);
    expect(inputOrder).toEqual(['b.ts', 'dir', 'a.ts']);
  });
});

describe('generateTree', () => {
  it('基本渲染：连接字符正确且无多余竖线', () => {
    const output = generateTree('src/a.ts\nsrc/b.ts\npackage.json\n', DEFAULT_OPTIONS);
    expect(output).toBe(
      ['├── src', '│   ├── a.ts', '│   └── b.ts', '└── package.json', ''].join('\n'),
    );
  });

  it('根名标题行', () => {
    const output = generateTree('a.ts', { ...DEFAULT_OPTIONS, rootName: 'my-project' });
    expect(output.split('\n')[0]).toBe('my-project');
  });

  it('竖线在最后的目录下不再延续', () => {
    const output = generateTree(
      'src/a.ts\nREADME.md\n',
      { ...DEFAULT_OPTIONS, sort: 'input' },
    );
    expect(output).toBe(['├── src', '│   └── a.ts', '└── README.md', ''].join('\n'));
  });

  it('深度限制后深层显示 …', () => {
    const output = generateTree('a/b/c/d.ts', { ...DEFAULT_OPTIONS, maxDepth: 2 });
    expect(output).toBe(['└── a', '    └── b', '        └── …', ''].join('\n'));
  });

  it('过滤隐藏条目', () => {
    const output = generateTree('.env\nsrc/.secret.ts\nsrc/app.ts', {
      ...DEFAULT_OPTIONS,
      excludeHidden: true,
    });
    expect(output).not.toContain('.env');
    expect(output).not.toContain('.secret.ts');
    expect(output).toContain('app.ts');
  });

  it('仅目录模式', () => {
    const output = generateTree('src/a.ts\nREADME.md', {
      ...DEFAULT_OPTIONS,
      directoriesOnly: true,
    });
    expect(output).toContain('src');
    expect(output).not.toContain('a.ts');
    expect(output).not.toContain('README.md');
  });

  it('空输入输出空字符串', () => {
    expect(generateTree('', DEFAULT_OPTIONS)).toBe('');
    expect(generateTree('\n  \n/', DEFAULT_OPTIONS)).toBe('');
  });
});

describe('countNodes', () => {
  it('统计目录与文件数', () => {
    const root = buildTree(['src/a.ts', 'src/b.ts', 'package.json']);
    expect(countNodes(root.children)).toEqual({ directories: 1, files: 3 });
  });
});
