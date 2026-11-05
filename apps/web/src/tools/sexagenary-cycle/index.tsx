'use client';

import React from 'react';
import { Alert, Button, Card, Input, InputNumber, Radio, Tag, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  buildCycleTable,
  ganzhiToYearsBatch,
  yearsToGanzhiBatch,
  type SexagenaryDirection,
  type SexagenaryResult,
} from './utils/sexagenary';
import {
  DEFAULT_FORWARD_INPUT,
  DEFAULT_RANGE_FROM,
  DEFAULT_RANGE_TO,
  DEFAULT_REVERSE_INPUT,
  DIRECTION_OPTIONS,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const SexagenaryCycle: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [direction, setDirection] = React.useState<SexagenaryDirection>('year-to-ganzhi');
  const [input, setInput] = React.useState(defaultInput || DEFAULT_FORWARD_INPUT);
  const [fromYear, setFromYear] = React.useState<number>(DEFAULT_RANGE_FROM);
  const [toYear, setToYear] = React.useState<number>(DEFAULT_RANGE_TO);

  const cycleTable = React.useMemo(() => buildCycleTable(), []);

  const results = React.useMemo<SexagenaryResult[]>(() => {
    if (input.trim() === '') return [];
    if (direction === 'year-to-ganzhi') {
      return yearsToGanzhiBatch(input);
    }
    return ganzhiToYearsBatch(input, fromYear, toYear);
  }, [input, direction, fromYear, toYear]);

  const handleDirectionChange = (next: SexagenaryDirection) => {
    setDirection(next);
    setInput((current) =>
      current.trim() === '' || current === DEFAULT_FORWARD_INPUT || current === DEFAULT_REVERSE_INPUT
        ? next === 'year-to-ganzhi'
          ? DEFAULT_FORWARD_INPUT
          : DEFAULT_REVERSE_INPUT
        : current,
    );
  };

  const validResults = results.filter((result) => result.valid);
  const outputText = validResults
    .map((result) => (direction === 'year-to-ganzhi' ? result.output : result.years.join(', ')))
    .filter((line) => line !== '')
    .join('\n');

  const handleCopy = () => {
    if (!outputText) {
      message.error('暂无可复制的结果');
      return;
    }
    copyToClipboard(outputText);
    message.success(`已复制 ${validResults.length} 条转换结果`);
  };

  const activeOption = DIRECTION_OPTIONS.find((option) => option.value === direction);

  return (
    <div className={styles.container}>
      <Card size="small" title="转换方向">
        <div className={styles.controls}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={direction}
            options={DIRECTION_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            onChange={(e) => handleDirectionChange(e.target.value as SexagenaryDirection)}
          />
          <span className={styles.hint}>{activeOption?.hint}，支持每行一条批量处理</span>
        </div>
      </Card>

      <Alert
        type="warning"
        showIcon
        message="口径说明：本工具按公历年整体对应（year-based）换算，公元 4 年为甲子年；传统干支纪年实际以立春（或民间以春节）为岁首，年初岁末的精确排盘可能与本结果相差一年。"
      />

      <div className={styles.panels}>
        <Card className={styles.card} title="输入（每行一条）">
          {direction === 'ganzhi-to-year' ? (
            <div className={styles.rangeControls}>
              <span className={styles.rangeLabel}>查询区间</span>
              <InputNumber
                value={fromYear}
                onChange={(value) => typeof value === 'number' && setFromYear(value)}
                controls={false}
                placeholder="起始年"
              />
              <span className={styles.rangeLabel}>至</span>
              <InputNumber
                value={toYear}
                onChange={(value) => typeof value === 'number' && setToYear(value)}
                controls={false}
                placeholder="结束年"
              />
            </div>
          ) : null}
          <Input.TextArea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            spellCheck={false}
            className={styles.editor}
            autoSize={{ minRows: 10, maxRows: 20 }}
            placeholder={
              direction === 'year-to-ganzhi'
                ? '每行一个公历年，公元前可用「前 72」形式…'
                : '每行一个六十甲子序号（1–60）或干支组合（如 甲子）…'
            }
          />
        </Card>

        <Card
          className={styles.card}
          title="转换结果"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          }
        >
          {results.length === 0 ? (
            <Alert type="info" showIcon message="请输入需要转换的内容" />
          ) : (
            <div className={styles.resultList}>
              {results.map((result, index) =>
                result.valid ? (
                  direction === 'year-to-ganzhi' && result.info ? (
                    <div className={styles.resultRow} key={index}>
                      <span className={styles.year}>{result.info.year}</span>
                      <span className={styles.ganzhi}>{result.info.ganzhi}</span>
                      <span className={styles.parts}>
                        <Tag color="blue">第 {result.info.cycleIndex} 甲子</Tag>
                        <Tag>生肖 {result.info.zodiac}</Tag>
                        <Tag>五行 {result.info.element}</Tag>
                        <Tag>{result.info.polarity}</Tag>
                      </span>
                    </div>
                  ) : (
                    <div className={styles.resultRow} key={index}>
                      <span className={styles.yearList}>
                        {result.years.length > 0 ? result.years.join(', ') : result.output}
                      </span>
                    </div>
                  )
                ) : (
                  <div className={`${styles.resultRow} ${styles.resultRowError}`} key={index}>
                    第 {index + 1} 行无效：{result.error}
                  </div>
                ),
              )}
            </div>
          )}
          {results.length > 0 ? (
            <p className={styles.summary}>
              共 {results.length} 条，成功 {validResults.length} 条，失败 {results.length - validResults.length} 条
            </p>
          ) : null}
        </Card>
      </div>

      <Card size="small" title="六十甲子循环表（序号 1–60）">
        <div className={styles.cycleGrid}>
          {cycleTable.map((item) => (
            <div className={styles.cycleCell} key={item.cycleIndex}>
              <span className={styles.cycleIndex}>{item.cycleIndex}</span>
              <span className={styles.cycleGanzhi}>{item.ganzhi}</span>
              <span className={styles.cycleZodiac}>
                {item.zodiac} · {item.element}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SexagenaryCycle;
