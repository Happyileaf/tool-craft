'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, Radio, Tabs } from 'antd';
import {
  add,
  argument,
  complex,
  conjugate,
  div,
  formatComplex,
  fromPolar,
  modulus,
  mul,
  sub,
  toDegrees,
  toPolar,
  toRadians,
  type Complex,
} from './utils/complex';
import { DEFAULT_ARITHMETIC, DEFAULT_CONVERT, DEFAULT_POLAR } from './constants';
import styles from './index.module.css';

type AngleMode = 'degrees' | 'radians';

/** 解析数字输入；空串或非法返回 null */
function parseNumeric(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const NumberField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}> = ({ label, value, onChange, suffix }) => (
  <div className={styles.field}>
    <span className={styles.fieldLabel}>{label}</span>
    <Input
      className={styles.numberInput}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      suffix={suffix}
      inputMode="decimal"
    />
  </div>
);

const ResultCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={styles.resultCard}>
    <div className={styles.resultLabel}>{label}</div>
    <div className={styles.resultValue}>{value}</div>
  </div>
);

/**
 * 复数四则运算与极坐标形式转换器：
 * Tab 1 在 a+bi 与 r(cosθ+i·sinθ)=r·e^{iθ} 间互转；Tab 2 对两个复数做加减乘除，
 * 全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @returns 复数计算交互界面
 */
const ComplexNumberCalculator: React.FC<ToolComponentProps> = () => {
  const [angleMode, setAngleMode] = React.useState<AngleMode>('degrees');

  // 形式转换：直角坐标输入
  const [rectRe, setRectRe] = React.useState<string>(DEFAULT_CONVERT.re);
  const [rectIm, setRectIm] = React.useState<string>(DEFAULT_CONVERT.im);
  // 形式转换：极坐标输入
  const [polarR, setPolarR] = React.useState<string>(DEFAULT_POLAR.r);
  const [polarTheta, setPolarTheta] = React.useState<string>(DEFAULT_POLAR.theta);

  // 四则运算：两个复数
  const [aRe, setARe] = React.useState<string>(DEFAULT_ARITHMETIC.aRe);
  const [aIm, setAIm] = React.useState<string>(DEFAULT_ARITHMETIC.aIm);
  const [bRe, setBRe] = React.useState<string>(DEFAULT_ARITHMETIC.bRe);
  const [bIm, setBIm] = React.useState<string>(DEFAULT_ARITHMETIC.bIm);

  const angleUnit = angleMode === 'degrees' ? '°' : 'rad';

  const formatAngle = React.useCallback(
    (radians: number): string => {
      const value = angleMode === 'degrees' ? toDegrees(radians) : radians;
      return `${Number(value.toFixed(6))} ${angleUnit}`;
    },
    [angleMode, angleUnit],
  );

  const describePolar = React.useCallback(
    (z: Complex): string => {
      const polar = toPolar(z);
      return `r = ${Number(polar.r.toFixed(6))}，θ = ${formatAngle(polar.theta)}`;
    },
    [formatAngle],
  );

  const rectInvalid = parseNumeric(rectRe) === null || parseNumeric(rectIm) === null;
  const rectResult = React.useMemo<Complex | null>(() => {
    const re = parseNumeric(rectRe);
    const im = parseNumeric(rectIm);
    if (re === null || im === null) {
      return null;
    }
    return complex(re, im);
  }, [rectRe, rectIm]);

  const polarInvalid = parseNumeric(polarR) === null || parseNumeric(polarTheta) === null;
  const polarResult = React.useMemo<Complex | null>(() => {
    const r = parseNumeric(polarR);
    const thetaInput = parseNumeric(polarTheta);
    if (r === null || thetaInput === null) {
      return null;
    }
    const theta = angleMode === 'degrees' ? toRadians(thetaInput) : thetaInput;
    return fromPolar(r, theta);
  }, [polarR, polarTheta, angleMode]);

  const arithInvalid =
    parseNumeric(aRe) === null ||
    parseNumeric(aIm) === null ||
    parseNumeric(bRe) === null ||
    parseNumeric(bIm) === null;

  const arithmetic = React.useMemo(() => {
    const ra = parseNumeric(aRe);
    const ia = parseNumeric(aIm);
    const rb = parseNumeric(bRe);
    const ib = parseNumeric(bIm);
    if (ra === null || ia === null || rb === null || ib === null) {
      return null;
    }
    const za = complex(ra, ia);
    const zb = complex(rb, ib);
    let division: { value: Complex | null; error: string | null } = { value: null, error: null };
    try {
      division = { value: div(za, zb), error: null };
    } catch (error) {
      division = { value: null, error: error instanceof Error ? error.message : '除法计算失败' };
    }
    return {
      a: za,
      b: zb,
      sum: add(za, zb),
      difference: sub(za, zb),
      product: mul(za, zb),
      division,
    };
  }, [aRe, aIm, bRe, bIm]);

  const angleSwitch = (
    <Radio.Group
      value={angleMode}
      onChange={(event) => setAngleMode(event.target.value as AngleMode)}
      optionType="button"
      buttonStyle="solid"
      size="small"
    >
      <Radio.Button value="degrees">角度 °</Radio.Button>
      <Radio.Button value="radians">弧度 rad</Radio.Button>
    </Radio.Group>
  );

  return (
    <div className={styles.container}>
      <Card
        title="复数四则运算与极坐标形式转换器"
        extra={angleSwitch}
      >
        <Tabs
          items={[
            {
              key: 'convert',
              label: '形式转换',
              children: (
                <div className={styles.container}>
                  <Card type="inner" title="直角坐标 a + bi → 极坐标 / 指数形式">
                    <div className={styles.numberGrid}>
                      <NumberField label="实部 a" value={rectRe} onChange={setRectRe} />
                      <span className={styles.operatorSymbol}>+</span>
                      <NumberField label="虚部 b" value={rectIm} onChange={setRectIm} suffix="i" />
                    </div>
                    {rectInvalid || !rectResult ? (
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginTop: 12 }}
                        message="请输入有效的实部与虚部数字"
                      />
                    ) : (
                      <div className={styles.resultGrid} style={{ marginTop: 12 }}>
                        <ResultCard label="复数" value={formatComplex(rectResult)} />
                        <ResultCard label="模 |z|" value={String(Number(modulus(rectResult).toFixed(6)))} />
                        <ResultCard label={`辐角 θ（${angleUnit}）`} value={formatAngle(argument(rectResult))} />
                        <ResultCard label="共轭 z̄" value={formatComplex(conjugate(rectResult))} />
                        <ResultCard label="极坐标形式" value={describePolar(rectResult)} />
                        <ResultCard
                          label="指数形式 r·e^(iθ)"
                          value={`${Number(modulus(rectResult).toFixed(6))} · e^(${Number(
                            argument(rectResult).toFixed(6),
                          )}i rad)`}
                        />
                      </div>
                    )}
                  </Card>

                  <Card type="inner" title="极坐标 / 指数形式 → 直角坐标 a + bi">
                    <div className={styles.numberGrid}>
                      <NumberField label="模 r" value={polarR} onChange={setPolarR} />
                      <NumberField
                        label={`辐角 θ（${angleUnit}）`}
                        value={polarTheta}
                        onChange={setPolarTheta}
                        suffix={angleUnit}
                      />
                    </div>
                    {polarInvalid || !polarResult ? (
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginTop: 12 }}
                        message="请输入有效的模与辐角数字"
                      />
                    ) : (
                      <div className={styles.resultGrid} style={{ marginTop: 12 }}>
                        <ResultCard label="直角坐标 a+bi" value={formatComplex(polarResult)} />
                        <ResultCard label="实部 a" value={String(Number(polarResult.re.toFixed(6)))} />
                        <ResultCard label="虚部 b" value={String(Number(polarResult.im.toFixed(6)))} />
                      </div>
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: 'arithmetic',
              label: '四则运算',
              children: (
                <div className={styles.container}>
                  <Card type="inner" title="输入两个复数">
                    <div className={styles.numberGrid}>
                      <span className={styles.operatorSymbol}>z₁ =</span>
                      <NumberField label="实部" value={aRe} onChange={setARe} />
                      <span className={styles.operatorSymbol}>+</span>
                      <NumberField label="虚部" value={aIm} onChange={setAIm} suffix="i" />
                    </div>
                    <div className={styles.numberGrid} style={{ marginTop: 12 }}>
                      <span className={styles.operatorSymbol}>z₂ =</span>
                      <NumberField label="实部" value={bRe} onChange={setBRe} />
                      <span className={styles.operatorSymbol}>+</span>
                      <NumberField label="虚部" value={bIm} onChange={setBIm} suffix="i" />
                    </div>
                  </Card>

                  {arithInvalid || !arithmetic ? (
                    <Alert type="warning" showIcon message="请为两个复数输入有效的实部与虚部" />
                  ) : (
                    <div className={styles.resultGrid}>
                      <ResultCard label="z₁ + z₂" value={formatComplex(arithmetic.sum)} />
                      <ResultCard label="z₁ − z₂" value={formatComplex(arithmetic.difference)} />
                      <ResultCard label="z₁ × z₂" value={formatComplex(arithmetic.product)} />
                      <ResultCard
                        label="z₁ ÷ z₂"
                        value={
                          arithmetic.division.error
                            ? '无法计算'
                            : formatComplex(arithmetic.division.value as Complex)
                        }
                      />
                    </div>
                  )}

                  {arithmetic && !arithmetic.division.error && arithmetic.division.value ? (
                    <div className={styles.resultGrid}>
                      {[
                        ['z₁ + z₂', arithmetic.sum],
                        ['z₁ − z₂', arithmetic.difference],
                        ['z₁ × z₂', arithmetic.product],
                        ['z₁ ÷ z₂', arithmetic.division.value],
                      ].map(([label, value]) => (
                        <ResultCard
                          key={label as string}
                          label={`${label as string} 的极坐标`}
                          value={describePolar(value as Complex)}
                        />
                      ))}
                    </div>
                  ) : null}
                  {arithmetic && arithmetic.division.error ? (
                    <Alert type="error" showIcon message={arithmetic.division.error} />
                  ) : null}
                </div>
              ),
            },
          ]}
        />
        <div className={styles.muted} style={{ marginTop: 12 }}>
          辐角取主值，范围 (−π, π]；零复数辐角约定为 0。所有结果在浏览器本地即时计算，浮点结果保留 6 位小数并去除尾零。
        </div>
      </Card>
    </div>
  );
};

export default ComplexNumberCalculator;
