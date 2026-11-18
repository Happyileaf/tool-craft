import { useMemo, useState } from 'react';
import { Alert, Button, Input, Radio, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { ToolComponentProps } from '../loaders';
import { copyToClipboard } from '@/lib/utils';
import {
  DEFAULT_FREQUENCY_SAMPLES,
  DEFAULT_SAMPLES,
  MAX_SAMPLE_COUNT,
  PHASE_UNDEFINED_LABEL,
  type PhaseUnit,
} from './constants';
import {
  analyzeForward,
  analyzeInverse,
  binsToCsv,
  isPowerOfTwo,
  toSingleSidedBins,
  type FrequencyBin,
} from './utils/fft';
import styles from './index.module.css';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

type SpectrumMode = 'double' | 'single';

function formatNumber(value: number): string {
  if (Math.abs(value) < 1e-12) {
    return '0';
  }
  return Number(value.toPrecision(10)).toString();
}

function formatComplex(re: number, im: number): string {
  const real = formatNumber(re);
  if (Math.abs(im) < 1e-12) {
    return real;
  }
  const imag = formatNumber(im);
  const sign = im >= 0 ? '+' : '−';
  return `${real} ${sign} ${imag.replace('-', '')}j`;
}

function ForwardPanel() {
  const [samples, setSamples] = useState(DEFAULT_SAMPLES);
  const [spectrumMode, setSpectrumMode] = useState<SpectrumMode>('double');
  const [phaseUnit, setPhaseUnit] = useState<PhaseUnit>('radian');

  const computed = useMemo(() => {
    try {
      const result = analyzeForward(samples);
      return { data: result, error: null as string | null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }, [samples]);

  const bins: FrequencyBin[] = useMemo(() => {
    if (!computed.data) {
      return [];
    }
    return spectrumMode === 'single'
      ? toSingleSidedBins(computed.data.result.bins)
      : computed.data.result.bins;
  }, [computed.data, spectrumMode]);

  const sampleCount = computed.data?.input.length ?? 0;
  const usesFft = sampleCount > 0 && isPowerOfTwo(sampleCount);

  const columns = [
    { title: 'k', dataIndex: 'k', width: 64 },
    {
      title: '归一化频率',
      dataIndex: 'normalizedFreq',
      width: 110,
      render: (value: number) => <Text className={styles.mono}>{formatNumber(value)}</Text>,
    },
    {
      title: 'Re',
      dataIndex: 're',
      render: (value: number) => <Text className={styles.mono}>{formatNumber(value)}</Text>,
    },
    {
      title: 'Im',
      dataIndex: 'im',
      render: (value: number) => <Text className={styles.mono}>{formatNumber(value)}</Text>,
    },
    {
      title: '幅度',
      dataIndex: 'magnitude',
      render: (value: number) => <Text className={styles.mono} strong>{formatNumber(value)}</Text>,
    },
    {
      title: `相位（${phaseUnit === 'radian' ? '弧度' : '角度'}）`,
      dataIndex: 'phase',
      render: (value: number | null) =>
        value === null ? (
          <Text type="secondary">{PHASE_UNDEFINED_LABEL}</Text>
        ) : (
          <Text className={styles.mono}>
            {formatNumber(phaseUnit === 'degree' ? (value * 180) / Math.PI : value)}
          </Text>
        ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3 className={styles.title}>时域采样序列（N ≤ {MAX_SAMPLE_COUNT}，支持实数与 a+bi 复数）</h3>
        <TextArea
          value={samples}
          onChange={(event) => setSamples(event.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
          spellCheck={false}
          className={styles.inputArea}
        />
        <p className={styles.hint}>
          支持逗号 / 空格 / 换行分隔；复数写法如 1+2i、3-4j、i、-i、5j。N 为 2 的幂时使用 radix-2
          Cooley–Tukey FFT（O(N log N)），否则回退朴素 DFT（O(N²)）。
        </p>
      </div>

      {computed.error ? (
        <Alert className={styles.errorBox} type="error" showIcon message="序列解析失败" description={computed.error} />
      ) : computed.data ? (
        <>
          <div className={styles.card}>
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>采样点数 N</span>
                <span className={styles.metaValue}>{sampleCount}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>算法</span>
                <span className={styles.metaValue}>
                  <Tag color={usesFft ? 'blue' : 'orange'}>{computed.data.result.algorithm}</Tag>
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>复杂度</span>
                <span className={styles.metaValue}>{computed.data.result.complexity}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>FFT→IFFT 往返最大误差</span>
                <span className={styles.metaValue}>
                  <Text className={styles.mono} type={computed.data.result.reconstructionError < 1e-9 ? 'success' : 'warning'}>
                    {formatNumber(computed.data.result.reconstructionError)}
                  </Text>
                </span>
              </div>
            </div>

            <Space wrap style={{ marginBottom: 12 }}>
              <Radio.Group
                value={spectrumMode}
                onChange={(event) => setSpectrumMode(event.target.value as SpectrumMode)}
                optionType="button"
                buttonStyle="solid"
                options={[
                  { value: 'double', label: '双边谱（N 个 bin）' },
                  { value: 'single', label: '单边谱（前 N/2+1，幅度 2/N 缩放）' },
                ]}
              />
              <Radio.Group
                value={phaseUnit}
                onChange={(event) => setPhaseUnit(event.target.value as PhaseUnit)}
                optionType="button"
                buttonStyle="solid"
                options={[
                  { value: 'radian', label: '弧度' },
                  { value: 'degree', label: '角度' },
                ]}
              />
            </Space>

            <div className={styles.tableWrap}>
              <Table
                rowKey="k"
                columns={columns}
                dataSource={bins}
                pagination={false}
                size="small"
                scroll={{ x: 640 }}
              />
            </div>

            <div className={styles.copyRow}>
              <Button
                size="small"
                onClick={() => {
                  const csv = binsToCsv(bins, phaseUnit);
                  return void copyToClipboard(csv);
                }}
              >
                复制 CSV
              </Button>
              <Text type="secondary" className={styles.mono}>
                字段：k, normalized_freq, re, im, magnitude, phase
              </Text>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function InversePanel() {
  const [frequency, setFrequency] = useState(DEFAULT_FREQUENCY_SAMPLES);

  const computed = useMemo(() => {
    try {
      const result = analyzeInverse(frequency);
      return { data: result, error: null as string | null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }, [frequency]);

  const columns = [
    { title: 'n', dataIndex: 'n', width: 64 },
    {
      title: '时域复数',
      render: (_: unknown, row: { re: number; im: number }) => (
        <Text className={styles.mono} strong>{formatComplex(row.re, row.im)}</Text>
      ),
    },
    {
      title: 'Re',
      dataIndex: 're',
      render: (value: number) => <Text className={styles.mono}>{formatNumber(value)}</Text>,
    },
    {
      title: 'Im',
      dataIndex: 'im',
      render: (value: number) => <Text className={styles.mono}>{formatNumber(value)}</Text>,
    },
  ];

  const rows = computed.data?.output.map((value, index) => ({ ...value, n: index })) ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3 className={styles.title}>频域序列 X[k]（支持复数，如 0, -2i, 0, 2i）</h3>
        <TextArea
          value={frequency}
          onChange={(event) => setFrequency(event.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
          spellCheck={false}
          className={styles.inputArea}
        />
        <p className={styles.hint}>
          执行 IDFT/IFFT（含 1/N 归一化）。若输入对应实数时域信号（虚部残差低于 1e-10），输出自动取实部。
        </p>
      </div>

      {computed.error ? (
        <Alert className={styles.errorBox} type="error" showIcon message="序列解析失败" description={computed.error} />
      ) : computed.data ? (
        <div className={styles.card}>
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>点数 N</span>
              <span className={styles.metaValue}>{rows.length}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>算法</span>
              <span className={styles.metaValue}>
                <Tag color={isPowerOfTwo(rows.length) ? 'blue' : 'orange'}>{computed.data.algorithm}</Tag>
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>复杂度</span>
              <span className={styles.metaValue}>{computed.data.complexity}</span>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <Table rowKey="n" columns={columns} dataSource={rows} pagination={false} size="small" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DftFftCalculator(_props: ToolComponentProps) {
  return (
    <div className={styles.container}>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        离散傅里叶变换（DFT）与快速傅里叶变换（FFT）教学/工程计算器：N 为 2 的幂时采用 radix-2
        Cooley–Tukey FFT（O(N log N)），否则回退朴素 DFT（O(N²)），最大支持 {MAX_SAMPLE_COUNT}{' '}
        点。全部计算在浏览器本地完成，无网络请求。
      </Paragraph>
      <Tabs
        defaultActiveKey="forward"
        items={[
          { key: 'forward', label: 'DFT / FFT 正变换', children: <ForwardPanel /> },
          { key: 'inverse', label: 'IDFT / IFFT 逆变换', children: <InversePanel /> },
        ]}
      />
    </div>
  );
}
