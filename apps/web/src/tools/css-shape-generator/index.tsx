'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  ColorPicker,
  Form,
  InputNumber,
  Radio,
  Segmented,
  Space,
  Typography,
  message,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import {
  DEFAULT_CONFIG,
  DIRECTION_OPTIONS,
  LIMITS,
  SHAPE_OPTIONS,
  type Direction,
  type ShapeConfig,
  type ShapeId,
} from './constants';
import { generateShape, sanitizeColor, shapeUsesDirection } from './utils/shapes';
import styles from './index.module.css';

const { Text } = Typography;

/** 把生成结果中的声明数组转为 React 可直接使用的 style 对象 */
function toReactStyle(declarations: Array<{ property: string; value: string }>): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const { property, value } of declarations) {
    const camel = property.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
    style[camel] = value;
  }
  return style as React.CSSProperties;
}

/**
 * CSS 形状生成器：参数化生成三角形、箭头、圆形、椭圆、气泡、八角形、梯形
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 预留默认输入（本工具内置默认配置，未使用）
 * @returns 形状设计与 CSS 代码界面
 */
const CssShapeGenerator: React.FC<ToolComponentProps> = () => {
  const [config, setConfig] = React.useState<ShapeConfig>(DEFAULT_CONFIG);
  const output = React.useMemo(() => generateShape(config), [config]);
  const previewStyle = React.useMemo(() => toReactStyle(output.declarations), [output]);

  const patch = (partial: Partial<ShapeConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const directionVisible = shapeUsesDirection(config.shape);
  const colorValue = sanitizeColor(config.color);

  const copyCss = () => {
    void copyToClipboard(output.css);
    message.success('已复制 CSS 代码');
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="可视化生成常用 CSS 形状，实时预览并复制 border / border-radius / clip-path 代码"
        description="所有几何坐标由确定性纯函数推导，颜色经过白名单校验防止表达式注入；生成结果与元素尺寸解耦，可直接粘贴到样式表中使用。全程本地计算，无网络请求。"
      />

      <Card title="形状类型">
        <Segmented
          block
          value={config.shape}
          onChange={(value) => patch({ shape: value as ShapeId })}
          options={SHAPE_OPTIONS.map((option) => ({
            label: option.name,
            value: option.id,
          }))}
        />
      </Card>

      <div className={styles.workGrid}>
        <Card title="参数调节">
          <Form layout="vertical" className={styles.controlPanel}>
            <Form.Item label="宽度 (px)">
              <InputNumber
                className={styles.fullWidth}
                min={LIMITS.minSize}
                max={LIMITS.maxSize}
                value={config.width}
                onChange={(value) => patch({ width: value ?? LIMITS.minSize })}
              />
            </Form.Item>
            <Form.Item label="高度 (px)">
              <InputNumber
                className={styles.fullWidth}
                min={LIMITS.minSize}
                max={LIMITS.maxSize}
                value={config.height}
                onChange={(value) => patch({ height: value ?? LIMITS.minSize })}
              />
            </Form.Item>
            <Form.Item label="形状颜色">
              <ColorPicker
                value={colorValue}
                onChange={(color) => patch({ color: color.toHexString() })}
                showText
              />
            </Form.Item>

            {directionVisible && (
              <Form.Item label="朝向">
                <Radio.Group
                  value={config.direction}
                  onChange={(event) => patch({ direction: event.target.value as Direction })}
                  optionType="button"
                  buttonStyle="solid"
                >
                  {DIRECTION_OPTIONS.map((option) => (
                    <Radio.Button key={option.id} value={option.id}>
                      {option.name}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            )}

            {(config.shape === 'circle' || config.shape === 'ellipse') && (
              <Form.Item label="圆角百分比 (%)">
                <InputNumber
                  className={styles.fullWidth}
                  min={LIMITS.minRadius}
                  max={LIMITS.maxRadius}
                  disabled={config.shape === 'ellipse'}
                  value={config.radius}
                  onChange={(value) => patch({ radius: value ?? LIMITS.minRadius })}
                />
              </Form.Item>
            )}

            {config.shape === 'octagon' && (
              <Form.Item label="切角比例 (%)">
                <InputNumber
                  className={styles.fullWidth}
                  min={LIMITS.minCut}
                  max={LIMITS.maxCut}
                  value={config.cut}
                  onChange={(value) => patch({ cut: value ?? LIMITS.minCut })}
                />
              </Form.Item>
            )}

            {config.shape === 'trapezoid' && (
              <Form.Item label="上底宽度 (%)">
                <InputNumber
                  className={styles.fullWidth}
                  min={LIMITS.minTopWidth}
                  max={LIMITS.maxTopWidth}
                  value={config.topWidth}
                  onChange={(value) => patch({ topWidth: value ?? LIMITS.minTopWidth })}
                />
              </Form.Item>
            )}

            {config.shape === 'speech-bubble' && (
              <>
                <Form.Item label="圆角半径 (px)">
                  <InputNumber
                    className={styles.fullWidth}
                    min={LIMITS.minBubbleRadius}
                    max={LIMITS.maxBubbleRadius}
                    value={config.bubbleRadius}
                    onChange={(value) => patch({ bubbleRadius: value ?? LIMITS.minBubbleRadius })}
                  />
                </Form.Item>
                <Form.Item label="尖角大小 (px)">
                  <InputNumber
                    className={styles.fullWidth}
                    min={LIMITS.minTailSize}
                    max={LIMITS.maxTailSize}
                    value={config.tailSize}
                    onChange={(value) => patch({ tailSize: value ?? LIMITS.minTailSize })}
                  />
                </Form.Item>
              </>
            )}

            <Button icon={<ReloadOutlined />} onClick={() => setConfig(DEFAULT_CONFIG)}>
              恢复默认参数
            </Button>
          </Form>
        </Card>

        <Space direction="vertical" size={16} className={styles.fullWidth}>
          <Card
            title="实时预览"
            extra={<Text className={styles.methodTag}>方案：{output.method}</Text>}
          >
            <div className={styles.previewCard}>
              {/* 预览样式来自纯函数生成的受控 CSS 声明，颜色经白名单校验 */}
              <div className={styles.previewShape} style={previewStyle} />
            </div>
          </Card>

          <Card
            title="生成的 CSS"
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={copyCss}>
                复制 CSS
              </Button>
            }
          >
            <pre className={styles.codeBlock}>{output.css}</pre>
          </Card>
        </Space>
      </div>
    </div>
  );
};

export default CssShapeGenerator;
