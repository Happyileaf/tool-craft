import { Alert, Button, Card, Checkbox, Input, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState, type SyntheticEvent } from 'react';

import {
  DEFAULT_SAMPLE_INPUT,
  REVERSE_DIRECTION,
  ZH_DIRECTION_LABELS,
  ZhDirectionEnum,
} from './constants';
import styles from './index.module.css';
import { convert } from './utils/zh-script';

interface ZhScriptConverterProps {
  defaultInput?: string;
}

interface SelectionRange {
  start: number;
  end: number;
}

export default function ZhScriptConverter({ defaultInput }: ZhScriptConverterProps) {
  const [input, setInput] = useState(defaultInput ?? DEFAULT_SAMPLE_INPUT);
  const [direction, setDirection] = useState<ZhDirectionEnum>(ZhDirectionEnum.S2T);
  const [regionWords, setRegionWords] = useState(true);
  const [onlySelection, setOnlySelection] = useState(false);
  const [selection, setSelection] = useState<SelectionRange>({ start: 0, end: 0 });
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (onlySelection && selection.end > selection.start) {
      const before = input.slice(0, selection.start);
      const middle = input.slice(selection.start, selection.end);
      const after = input.slice(selection.end);
      const converted = convert(middle, direction, { regionWords });
      return {
        text: `${before}${converted.text}${after}`,
        hits: converted.hits.map((hit) => ({
          ...hit,
          index: hit.index + selection.start,
        })),
        changedChars: converted.changedChars,
      };
    }
    return convert(input, direction, { regionWords });
  }, [direction, input, onlySelection, regionWords, selection.end, selection.start]);

  const hasSelection = selection.end > selection.start;
  const changedPhrases = result.hits.filter((hit) => Array.from(hit.from).length > 1).length;

  const handleSelect = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    setSelection({ start: target.selectionStart, end: target.selectionEnd });
  };

  const handleSwap = () => {
    setInput(result.text);
    setDirection(REVERSE_DIRECTION[direction]);
    setSelection({ start: 0, end: 0 });
  };

  const handleCopy = async () => {
    if (!result.text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const directionOptions = Object.values(ZhDirectionEnum).map((value) => ({
    value,
    label: ZH_DIRECTION_LABELS[value],
  }));

  return (
    <div className={styles.container}>
      <Card>
        <Space wrap size="middle">
          <span className={styles.label}>转换方向</span>
          <Select
            className={styles.directionSelect}
            value={direction}
            options={directionOptions}
            onChange={(value: ZhDirectionEnum) => setDirection(value)}
          />
          <Checkbox
            checked={regionWords}
            onChange={(event) => setRegionWords(event.target.checked)}
          >
            地区用词转换
          </Checkbox>
          <Checkbox
            checked={onlySelection}
            onChange={(event) => setOnlySelection(event.target.checked)}
          >
            仅转换选中片段
          </Checkbox>
        </Space>
        {onlySelection && !hasSelection ? (
          <div className={styles.hint}>当前未选中文本，将转换全文。</div>
        ) : null}
      </Card>

      <div className={styles.panels}>
        <Card title="原文" size="small">
          <Input.TextArea
            className={styles.textarea}
            value={input}
            placeholder="粘贴或输入需要转换的中文文本"
            onChange={(event) => setInput(event.target.value)}
            onSelect={handleSelect}
            allowClear
          />
        </Card>
        <Card
          title="转换结果"
          size="small"
          extra={
            <Button type="link" size="small" onClick={handleCopy}>
              {copied ? '已复制' : '复制'}
            </Button>
          }
        >
          <Input.TextArea
            className={styles.textarea}
            value={result.text}
            readOnly
            placeholder="转换结果会实时显示在这里"
          />
        </Card>
      </div>

      <Card size="small">
        <Space wrap size="large">
          <StatisticItem label="输出字符" value={Array.from(result.text).length} />
          <StatisticItem label="变更字符" value={result.changedChars} />
          <StatisticItem label="替换词条" value={result.hits.length} />
          <StatisticItem label="命中词组" value={changedPhrases} />
          <Button onClick={() => setInput(DEFAULT_SAMPLE_INPUT)}>载入示例</Button>
          <Button onClick={handleSwap} disabled={!result.text}>
            结果转回原文
          </Button>
          <Button onClick={() => setInput('')}>清空</Button>
        </Space>
      </Card>

      <Card title="本次替换明细" size="small">
        {result.hits.length === 0 ? (
          <Typography.Text type="secondary">没有字符或词组发生变化。</Typography.Text>
        ) : (
          <div className={styles.hits}>
            {result.hits.slice(0, 60).map((hit) => (
              <Tag key={`${hit.index}-${hit.from}`} color="blue">
                {hit.index + 1}. {hit.from} → {hit.to}
              </Tag>
            ))}
            {result.hits.length > 60 ? (
              <Typography.Text type="secondary">
                仅展示前 60 条，共 {result.hits.length} 条
              </Typography.Text>
            ) : null}
          </div>
        )}
      </Card>

      <Alert
        type="info"
        showIcon
        message="词库说明"
        description="内置 OpenCC 风格常用字词表，按最长匹配优先转换；不依赖网络请求，纯本地处理。长文本会分块处理并避免切断跨块词条。"
      />
    </div>
  );
}

function StatisticItem({ label, value }: { label: string; value: number }) {
  return (
    <span className={styles.statistic}>
      <span className={styles.statisticLabel}>{label}</span>
      <span className={styles.statisticValue}>{value}</span>
    </span>
  );
}
