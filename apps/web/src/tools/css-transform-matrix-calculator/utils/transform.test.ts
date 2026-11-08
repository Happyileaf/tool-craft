import { describe, it, expect } from "vitest";
import {
  identity,
  multiply,
  translate,
  scale,
  rotateZ,
  skew,
  compose,
  parseMatrix,
  toCssMatrix2d,
  toCssMatrix3d,
  decompose,
  transformPoint,
  formatNumber,
  radToDeg,
  degToRad,
  is2D,
  stepsToCss,
} from "./transform";
import type { TransformStep } from "./transform";

const approx = (got: number, want: number, eps = 1e-9) =>
  Math.abs(got - want) < eps;

describe("identity and multiply", () => {
  it("identity is the neutral element", () => {
    const m = translate(3, 4);
    const r = multiply(identity(), m);
    expect(r).toEqual(m);
  });

  it("multiplies two translation matrices by adding offsets", () => {
    const r = multiply(translate(1, 2), translate(10, 20));
    expect(r[12]).toBe(11);
    expect(r[13]).toBe(22);
  });

  it("respects non-commutative order: rotation then translate differs", () => {
    const rt = multiply(translate(10, 0), rotateZ(Math.PI / 2));
    const tr = multiply(rotateZ(Math.PI / 2), translate(10, 0));
    // 先旋转后平移：平移向量被旋转
    expect(approx(tr[12], 0)).toBe(true);
    expect(approx(tr[13], 10)).toBe(true);
    // 先平移后旋转：平移保持
    expect(rt[12]).toBe(10);
    expect(rt[13]).toBe(0);
  });
});

describe("2D transform builders", () => {
  it("rotate(90deg) maps (1,0) to (0,1)", () => {
    const m = rotateZ(Math.PI / 2);
    const [x, y] = transformPoint(m, 1, 0);
    expect(approx(x, 0)).toBe(true);
    expect(approx(y, 1)).toBe(true);
  });

  it("skew matches CSS matrix(1, tanY, tanX, 1, 0, 0)", () => {
    const m = skew(degToRad(20), 0);
    // skewX 20° → 第一列下方元素 tan(20°)
    expect(approx(m[4], Math.tan(degToRad(20)))).toBe(true);
    expect(m[1]).toBe(0);
  });

  it("scale doubles coordinates", () => {
    const [x, y] = transformPoint(scale(2, 3), 4, 5);
    expect(x).toBe(8);
    expect(y).toBe(15);
  });
});

describe("compose and CSS output", () => {
  it("composes translate → rotate → scale in CSS left-to-right order", () => {
    const steps: TransformStep[] = [
      { kind: "translate", values: [20, 10] },
      { kind: "rotate", values: [degToRad(30)] },
      { kind: "scale", values: [1.5, 1.5] },
    ];
    const m = compose(steps);
    // CSS transform: translate(20px,10px) rotate(30deg) scale(1.5)
    // 点 (1,1) 先缩放 →(1.5,1.5)，再旋转 30°，再平移
    const c = Math.cos(degToRad(30));
    const s = Math.sin(degToRad(30));
    const [x, y] = transformPoint(m, 1, 1);
    expect(approx(x, 20 + 1.5 * (c - s))).toBe(true);
    expect(approx(y, 10 + 1.5 * (s + c))).toBe(true);
  });

  it("renders readable CSS function string with degrees", () => {
    const css = stepsToCss([
      { kind: "translate", values: [20, 10] },
      { kind: "rotate", values: [degToRad(30)] },
    ]);
    expect(css).toBe("translate(20px, 10px) rotate(30deg)");
  });

  it("emits matrix() for 2D and matrix3d() for 3D", () => {
    const m2 = compose([{ kind: "rotate", values: [degToRad(45)] }]);
    expect(is2D(m2)).toBe(true);
    expect(toCssMatrix2d(m2)).toMatch(/^matrix\(/);
    expect(toCssMatrix3d(m2)).toMatch(/^matrix3d\(/);
    expect(toCssMatrix3d(m2).split(",").length).toBe(16);

    const m3 = compose([{ kind: "rotateX", values: [degToRad(45)] }]);
    expect(is2D(m3)).toBe(false);
    expect(toCssMatrix2d(m3)).toBeNull();
  });
});

describe("parseMatrix", () => {
  it("parses a 6-value 2D matrix", () => {
    const { matrix, kind } = parseMatrix("matrix(1, 0, 0, 1, 20, 10)");
    expect(kind).toBe("matrix");
    expect(matrix[12]).toBe(20);
    expect(matrix[13]).toBe(10);
    expect(matrix[0]).toBe(1);
  });

  it("round-trips 2D matrix through parse and toCssMatrix2d", () => {
    const src = "matrix(1.299038, 0.75, -0.75, 1.299038, 20, 10)";
    const { matrix } = parseMatrix(src);
    expect(toCssMatrix2d(matrix)).toContain("1.299038");
  });

  it("parses a 16-value matrix3d", () => {
    const nums = identity().join(", ");
    const { kind } = parseMatrix(`matrix3d(${nums})`);
    expect(kind).toBe("matrix3d");
  });

  it("throws with field position on illegal token", () => {
    expect(() => parseMatrix("matrix(1, a, 0, 1, 0, 0)")).toThrow(/第 2 个参数/);
  });

  it("throws on wrong arity and unknown form", () => {
    expect(() => parseMatrix("matrix(1, 0, 0)")).toThrow(/6 个参数/);
    expect(() => parseMatrix("matrix3d(1, 0)")).toThrow(/16 个参数/);
    expect(() => parseMatrix("translate(1px)")).toThrow(/无法识别/);
  });
});

describe("decompose", () => {
  it("recovers translate / rotate / scale from a composed 2D matrix", () => {
    const m = compose([
      { kind: "translate", values: [12, -7] },
      { kind: "rotate", values: [degToRad(35)] },
      { kind: "scale", values: [2, 2] },
    ]);
    const d = decompose(m);
    expect(d.dimension).toBe("2d");
    if (d.dimension !== "2d") return;
    expect(approx(d.translateX, 12, 1e-8)).toBe(true);
    expect(approx(d.translateY, -7, 1e-8)).toBe(true);
    expect(approx(d.scaleX, 2, 1e-8)).toBe(true);
    expect(approx(d.rotate, 35, 1e-8)).toBe(true);
  });

  it("recovers skewX from a skewed matrix", () => {
    const m = skew(degToRad(18), 0);
    const d = decompose(m);
    if (d.dimension !== "2d") throw new Error("should be 2d");
    expect(approx(d.skewX, 18, 1e-8)).toBe(true);
  });

  it("flags 3D matrices and extracts ZYX euler angles", () => {
    const m = compose([
      { kind: "translate", values: [1, 2, 3] },
      { kind: "rotateX", values: [degToRad(40)] },
    ]);
    const d = decompose(m);
    expect(d.dimension).toBe("3d");
    if (d.dimension !== "3d") return;
    expect(approx(d.translateZ, 3)).toBe(true);
    expect(approx(d.rotateX, 40, 1e-8)).toBe(true);
  });
});

describe("transformPoint", () => {
  it("applies affine map with translation", () => {
    const [x, y] = transformPoint(translate(5, -5), 0, 0);
    expect(x).toBe(5);
    expect(y).toBe(-5);
  });

  it("leaves origin fixed under pure rotation/scale", () => {
    const m = multiply(rotateZ(1.234), scale(3, 3));
    const [x, y] = transformPoint(m, 0, 0);
    expect(x).toBe(0);
    expect(y).toBe(0);
  });
});

describe("helpers", () => {
  it("formatNumber strips -0 and float tail", () => {
    expect(formatNumber(-0)).toBe("0");
    expect(formatNumber(1.0000004)).toBe("1");
    expect(formatNumber(0.30000000000000004)).toBe("0.3");
  });

  it("rad/deg conversions are inverse", () => {
    expect(radToDeg(degToRad(270))).toBe(270);
  });
});
