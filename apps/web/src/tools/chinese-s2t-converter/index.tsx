'use client';

import React from 'react';
import { Alert, Button, Card, Empty, Input, Radio, Space, Statistic, message } from 'antd';
import { ClearOutlined, CopyOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import type { ToolComponentProps } from '../loaders';
import { DEFAULT_TEXT } from './constants';
import { convertChinese, type Direction, type Variant } from './utils/converter';
import styles from './index.module.css';

const DIRECTION_LABEL: Record<Direction, string> = {
  s2t: '简体 → 繁体',
  t2s: '繁体 → 简体',
};

const VARIANT_OPTIONS: Array<{ label: string; value: Variant }> = [
  { label: '通用繁体', value: 'standard' },
  { label: '台湾用词', value: 'taiwan' },
  { label: '香港用词', value: 'hongkong' },
];

/**
 * 简繁中文转换器：基于词组级 + 单字级静态映射在浏览器本地双向转换，
 * 支持通用 / 台湾 / 香港三种地区用词变体
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认文本
 * @returns 简繁转换工具界面
 */
const ChineseS2TConverter: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [text, setText] = React.useState<string>(defaultInput || DEFAULT_TEXT);
  const [direction, setDirection] = React.useState<Direction>('s2t');
  const [variant, setVariant] = React.useState<Variant>('standard');

  const result = React.useMemo(
    () => convertChinese(text, direction, variant),
    [text, direction, variant],
  );

  const swap = () => {
    setDirection((prev) => (prev === 's2t' ? 't2s' : 's2t'));
    setText(result.text);
  };

  const copyResult = () => {
    if (!result.text) {
      return;
    }
    void copyToClipboard(result.text);
    message.success('已复制转换结果');
  };

  return (
    <div className={styles.container}>
      <Alert
        type="info"
        showIcon
        message="词组级简繁转换，本地零上传"
        description={
          <div>
            转换先做词组最长匹配（如「理发 → 理髮」「牛肉面 → 牛肉麵」），再做单字兜底，
            避免「发 / 面 / 干 / 松」等一对多字的常见误转；台湾 / 香港变体额外替换地区用词（如软件→軟體、公交車→巴士）。
            繁体转简体为合并式转换（發 / 髮 → 发），这是简繁关系的固有特性。全部计算在浏览器本地完成。
          </div>
        }
      />

      <Card title="输入">
        <div className={styles.formColumn}>
          <Space wrap>
            <Radio.Group
              value={direction}
              onChange={(event) => setDirection(event.target.value as Direction)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: DIRECTION_LABEL.s2t, value: 's2t' },
                { label: DIRECTION_LABEL.t2s, value: 't2s' },
              ]}
            />
            <Button icon={<SwapOutlined />} onClick={swap}>
              交换方向并以结果回填
            </Button>
          </Space>
          <span className={styles.label}>地区用词变体（仅影响转换中的地区词替换）</span>
          <Radio.Group
            value={variant}
            onChange={(event) => setVariant(event.target.value as Variant)}
            optionType="button"
            options={VARIANT_OPTIONS}
          />
          <Input.TextArea
            className={styles.mono}
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoSize={{ minRows: 6, maxRows: 16 }}
            spellCheck={false}
            placeholder="粘贴需要转换的中文文本…"
          />
          <Space wrap>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                setText(defaultInput || DEFAULT_TEXT);
                setDirection('s2t');
                setVariant('standard');
              }}
            >
              载入样例
            </Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setText('')}>
              清空
            </Button>
          </Space>
        </div>
      </Card>

      <Card title="统计">
        <div className={styles.statRow}>
          <Statistic title="输入字符数" value={result.stat.inputLength} />
          <Statistic title="输出字符数" value={result.stat.outputLength} />
          <Statistic title="替换次数" value={result.stat.replacements} />
        </div>
      </Card>

      <Card
        title="转换结果"
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
            复制结果
          </Button>
        }
      >
        {result.text ? (
          <div className={styles.resultBox}>{result.text}</div>
        ) : (
          <Empty description="输入文本后实时输出转换结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
};

export default ChineseS2TConverter;
