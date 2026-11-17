import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, LIMITS, type ShapeConfig } from '../constants';
import { generateShape, sanitizeColor, shapeUsesDirection } from './shapes';

function withConfig(overrides: Partial<ShapeConfig>): ShapeConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe('sanitizeColor', () => {
  it('放行命名色与合法十六进制', () => {
    expect(sanitizeColor('red')).toBe('red');
    expect(sanitizeColor('#f00')).toBe('#f00');
    expect(sanitizeColor('#ff0000')).toBe('#ff0000');
    expect(sanitizeColor('#ff000080')).toBe('#ff000080');
  });

  it('非法值回退黑色并做 trim / 小写归一', () => {
    expect(sanitizeColor('expression(1)')).toBe('#000000');
    expect(sanitizeColor('  #ABCDEF ')).toBe('#abcdef');
  });
});

describe('shapeUsesDirection', () => {
  it('仅方向相关形状返回 true', () => {
    expect(shapeUsesDirection('triangle')).toBe(true);
    expect(shapeUsesDirection('arrow')).toBe(true);
    expect(shapeUsesDirection('speech-bubble')).toBe(true);
    expect(shapeUsesDirection('trapezoid')).toBe(true);
    expect(shapeUsesDirection('circle')).toBe(false);
    expect(shapeUsesDirection('octagon')).toBe(false);
  });
});

describe('triangle / arrow（border 方案）', () => {
  it('朝上三角形输出零尺寸与四向边框', () => {
    const output = generateShape(withConfig({ shape: 'triangle', direction: 'up', width: 200, height: 160 }));
    const props = Object.fromEntries(output.declarations.map((d) => [d.property, d.value]));
    expect(props.width).toBe('0');
    expect(props.height).toBe('0');
    expect(props['border-width']).toBe('160px 100px 0 100px');
    expect(props['border-color']).toContain('#3b82f6');
    expect(output.css).toContain('.shape {');
  });

  it('四个方向均生成非空边框声明', () => {
    for (const direction of ['up', 'down', 'left', 'right'] as const) {
      const output = generateShape(withConfig({ shape: 'triangle', direction }));
      expect(output.declarations.some((d) => d.property === 'border-color')).toBe(true);
    }
  });

  it('箭头由矩形杆身与 ::after 三角组成，无重复属性声明', () => {
    const output = generateShape(withConfig({ shape: 'arrow', direction: 'right' }));
    const propNames = output.declarations.map((d) => d.property);
    const props = Object.fromEntries(output.declarations.map((d) => [d.property, d.value]));
    expect(props.background).toBe('#3b82f6');
    expect(props.position).toBe('relative');
    // 主元素每个属性只出现一次，杆身为非零像素尺寸
    expect(new Set(propNames).size).toBe(propNames.length);
    expect(Number.parseInt(props.width ?? '0', 10)).toBeGreaterThan(0);
    // 三角箭头位于 ::after 伪元素规则
    expect(output.css).toContain('.shape::after {');
    expect(output.css).toContain('border-style: solid');
    expect(output.css).toContain('left: 100%');
  });

  it('垂直方向箭头输出竖置杆身', () => {
    const output = generateShape(withConfig({ shape: 'arrow', direction: 'up' }));
    const props = Object.fromEntries(output.declarations.map((d) => [d.property, d.value]));
    expect(Number.parseInt(props.height ?? '0', 10)).toBeGreaterThan(
      Number.parseInt(props.width ?? '0', 10),
    );
    expect(output.css).toContain('bottom: 100%');
  });
});

describe('circle / ellipse（border-radius 方案）', () => {
  it('圆形使用百分比圆角', () => {
    const output = generateShape(withConfig({ shape: 'circle', radius: 50 }));
    const props = Object.fromEntries(output.declarations.map((d) => [d.property, d.value]));
    expect(props['border-radius']).toBe('50%');
    expect(props.width).toBe('200px');
  });

  it('椭圆使用双轴 50% 语法', () => {
    const output = generateShape(withConfig({ shape: 'ellipse' }));
    const props = Object.fromEntries(output.declarations.map((d) => [d.property, d.value]));
    expect(props['border-radius']).toBe('50% / 50%');
  });

  it('radius 越界时被夹取到 0–100', () => {
    const output = generateShape(withConfig({ shape: 'circle', radius: 250 }));
    const props = Object.fromEntries(output.declarations.map((d) => [d.property, d.value]));
    expect(props['border-radius']).toBe(`${LIMITS.maxRadius}%`);
  });
});

describe('speech-bubble（伪元素尖角）', () => {
  it('输出主元素规则与 ::before 尖角规则', () => {
    const output = generateShape(withConfig({ shape: 'speech-bubble', direction: 'down', tailSize: 20 }));
    expect(output.css).toContain('.shape::before {');
    expect(output.css).toContain('border-style: solid');
    expect(output.css).toContain('bottom: -20px');
  });

  it('尖角为 0 时仍生成合法规则', () => {
    const output = generateShape(withConfig({ shape: 'speech-bubble', tailSize: 0 }));
    expect(output.css).toContain('::before');
  });
});

describe('octagon（clip-path 方案）', () => {
  it('cut=0 时退化为矩形四点（首尾对称落在角上）', () => {
    const output = generateShape(withConfig({ shape: 'octagon', cut: 0 }));
    expect(output.previewClipPath).toContain('polygon(');
    // 八个点中四角坐标成对出现 0% 与 100%
    const corners = output.previewClipPath.match(/0% 0%|100% 100%/g);
    expect(corners).not.toBeNull();
  });

  it('cut=20 时八个顶点均在预期百分比上', () => {
    const output = generateShape(withConfig({ shape: 'octagon', cut: 20 }));
    expect(output.previewClipPath).toBe(
      'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
    );
    const props = Object.fromEntries(output.declarations.map((d) => [d.property, d.value]));
    expect(props['clip-path']).toBe(output.previewClipPath);
  });

  it('cut 越界被夹取到 40', () => {
    const output = generateShape(withConfig({ shape: 'octagon', cut: 99 }));
    expect(output.previewClipPath.startsWith('polygon(40% 0%')).toBe(true);
  });
});

describe('trapezoid（clip-path 方案）', () => {
  it('朝上梯形上底居中内缩', () => {
    const output = generateShape(withConfig({ shape: 'trapezoid', topWidth: 50, direction: 'up' }));
    expect(output.previewClipPath).toBe(
      'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
    );
  });

  it('topWidth=100 时退化为矩形', () => {
    const output = generateShape(withConfig({ shape: 'trapezoid', topWidth: 100 }));
    expect(output.previewClipPath).toBe(
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    );
  });

  it('四个方向生成不同的顶点序列', () => {
    const ups = new Set(
      (['up', 'down', 'left', 'right'] as const).map((direction) =>
        generateShape(withConfig({ shape: 'trapezoid', direction, topWidth: 40 })).previewClipPath,
      ),
    );
    expect(ups.size).toBe(4);
  });
});

describe('generateShape 统一入口', () => {
  it('全部形状均返回 css 与实现说明', () => {
    for (const shape of [
      'triangle',
      'arrow',
      'circle',
      'ellipse',
      'speech-bubble',
      'octagon',
      'trapezoid',
    ] as const) {
      const output = generateShape(withConfig({ shape }));
      expect(output.css.length).toBeGreaterThan(20);
      expect(output.method.length).toBeGreaterThan(0);
    }
  });

  it('未知形状抛错', () => {
    expect(() => generateShape(withConfig({ shape: 'hexagon' as ShapeConfig['shape'] }))).toThrow();
  });
});
