'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Col, InputNumber, Row, Space, Statistic, Table, Tabs, Tag } from 'antd';
import {
  blockCurve,
  buildSensitivityTable,
  erlangB,
  maximumTrafficForGoS,
  minimumChannelsForGoS,
} from './utils/erlangB';
import { DEFAULT_CHANNELS, DEFAULT_GOS, DEFAULT_TRAFFIC, GOS_LEVELS } from './constants';
import styles from './index.module.css';

const percent = (value: number, digits = 3) => `${(value * 100).toFixed(digits)}%`;

/** 纯 SVG 阻塞率曲线，零图表依赖 */
const BlockChart: React.FC<{ traffic: number; channels: number }> = ({ traffic, channels }) => {
  const points = React.useMemo(() => {
    try {
      return blockCurve(traffic, Math.min(channels, 60));
    } catch {
      return [];
    }
  }, [traffic, channels]);

  if (points.length === 0) {
    return null;
  }
  const width = 720;
  const height = 240;
  const padding = 44;
  const maxB = points[0]?.b ?? 1;
  const path = points
    .map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - (point.b / maxB) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const current = points.find((point) => point.n === Math.min(channels, 60));
  const currentX = current
    ? padding + ((current.n - 1) / (points.length - 1)) * (width - padding * 2)
    : 0;
  const currentY = current
    ? height - padding - (current.b / maxB) * (height - padding * 2)
    : 0;

  return (
    <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="阻塞率随中继线数变化曲线">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgb(0 0 0 / 25%)" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgb(0 0 0 / 25%)" />
      <path d={path} fill="none" stroke="#1677ff" strokeWidth={2} />
      {current && <circle cx={currentX} cy={currentY} r={5} fill="#fa8c16" />}
      <text x={width - padding} y={height - padding + 20} textAnchor="end" fontSize={12} fill="rgb(0 0 0 45%)">
        中继线数 N
      </text>
      <text x={padding - 8} y={padding - 8} textAnchor="end" fontSize={12} fill="rgb(0 0 0 45%)">
        阻塞率 B
      </text>
      <text x={padding} y={height - 8} fontSize={12} fill="rgb(0 0 0 45%)">1</text>
      <text x={width - padding} y={height - 8} textAnchor="end" fontSize={12} fill="rgb(0 0 0 45%)">
        {points.length}
      </text>
    </svg>
  );
};

/**
 * Erlang B 中继线话务量计算器：M/M/c/c 损失制模型的正算与两类反算，
 * 附 N±1 灵敏度对照表与阻塞率曲线，全部数值计算在浏览器本地完成。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const ErlangBCalculator: React.FC<ToolComponentProps> = (_props) => {
  const [traffic, setTraffic] = React.useState(DEFAULT_TRAFFIC);
  const [channels, setChannels] = React.useState(DEFAULT_CHANNELS);
  const [gos, setGos] = React.useState(DEFAULT_GOS);

  const safeTraffic = Number.isFinite(traffic) && traffic > 0 ? traffic : DEFAULT_TRAFFIC;
  const safeChannels = Number.isInteger(channels) && channels > 0 ? channels : DEFAULT_CHANNELS;
  const safeGos = gos > 0 && gos < 1 ? gos : DEFAULT_GOS;

  const block = React.useMemo(() => erlangB(safeTraffic, safeChannels), [safeTraffic, safeChannels]);
  const minChannels = React.useMemo(
    () => minimumChannelsForGoS(safeTraffic, safeGos),
    [safeTraffic, safeGos],
  );
  const maxTraffic = React.useMemo(
    () => maximumTrafficForGoS(safeChannels, safeGos),
    [safeChannels, safeGos],
  );
  const sensitivity = React.useMemo(
    () => buildSensitivityTable(safeTraffic, safeChannels),
    [safeTraffic, safeChannels],
  );

  const sensitivityColumns = [
    { title: '中继线数 N', dataIndex: 'channels', width: 110 },
    {
      title: `当前话务量 ${safeTraffic} Erl 下阻塞率`,
      render: (_: unknown, row: (typeof sensitivity)[number]) => percent(row.blockAtCurrentTraffic),
    },
    {
      title: 'GoS 0.1% 可承载 (Erl)',
      render: (_: unknown, row: (typeof sensitivity)[number]) => row.maxTrafficByGoS[GOS_LEVELS[0]].toFixed(2),
    },
    {
      title: 'GoS 1% 可承载 (Erl)',
      render: (_: unknown, row: (typeof sensitivity)[number]) => row.maxTrafficByGoS[GOS_LEVELS[1]].toFixed(2),
    },
    {
      title: 'GoS 5% 可承载 (Erl)',
      render: (_: unknown, row: (typeof sensitivity)[number]) => row.maxTrafficByGoS[GOS_LEVELS[2]].toFixed(2),
    },
  ];

  return (
    <div className={styles.container}>
      <Tag color="blue">纯浏览器本地数值计算；模型：M/M/c/c 损失制（阻塞即损失、无排队）</Tag>

      <Card size="small" title="输入参数">
        <Row gutter={[16, 12]}>
          <Col xs={24} md={8}>
            <Statistic title="忙时话务量 A（Erlang）" />
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={0.5}
              value={traffic}
              onChange={(value) => value !== null && setTraffic(value)}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="中继线 / 信道数 N" />
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={1}
              value={channels}
              onChange={(value) => value !== null && setChannels(value)}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="目标服务等级 GoS（阻塞率上限）" />
            <InputNumber
              style={{ width: '100%' }}
              min={0.00001}
              max={0.99}
              step={0.005}
              value={gos}
              onChange={(value) => value !== null && setGos(value)}
            />
          </Col>
        </Row>
        <Alert
          style={{ marginTop: 12 }}
          type="info"
          showIcon
          message={`GoS 以小数输入：0.01 = 1%，0.001 = 0.1%；递归式 B(n)=A·B(n-1)/(n+A·B(n-1))，反算用二分查找收敛`}
        />
      </Card>

      <Tabs
        defaultActiveKey="forward"
        items={[
          {
            key: 'forward',
            label: '正算：阻塞概率',
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card>
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Statistic title="阻塞概率 B" value={percent(block)} />
                    </Col>
                    <Col xs={24} md={8}>
                      <Statistic title="每 100 次呼叫预计损失" value={(block * 100).toFixed(2)} suffix="次" />
                    </Col>
                    <Col xs={24} md={8}>
                      <Statistic
                        title={`满足 GoS ${percent(safeGos, 2)} 所需最少中继线`}
                        value={minChannels}
                        suffix="条"
                      />
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title="阻塞率随中继线数变化曲线（橙色点为当前 N）">
                  <BlockChart traffic={safeTraffic} channels={safeChannels} />
                </Card>
              </Space>
            ),
          },
          {
            key: 'reverse',
            label: '反算：容量规划',
            children: (
              <Card>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Statistic
                      title={`话务量 ${safeTraffic} Erl 达到 GoS ${percent(safeGos, 2)} 所需最少 N`}
                      value={minChannels}
                      suffix="条中继线"
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Statistic
                      title={`${safeChannels} 条中继线在 GoS ${percent(safeGos, 2)} 下最大承载`}
                      value={maxTraffic.toFixed(3)}
                      suffix="Erlang"
                    />
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'sensitivity',
            label: 'N±1 灵敏度对照',
            children: (
              <Card size="small">
                <Table
                  size="small"
                  rowKey="channels"
                  columns={sensitivityColumns}
                  dataSource={sensitivity}
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ErlangBCalculator;
