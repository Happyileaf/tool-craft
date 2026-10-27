'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, InputNumber, Radio, Space, Tag, message } from 'antd';
import {
  RandomModeEnum,
  RANDOM_MODE_LABELS,
  MAX_OUTPUT_COUNT,
  DEFAULT_MIN,
  DEFAULT_MAX,
  DEFAULT_INTEGER_COUNT,
  DEFAULT_PICK_COUNT,
  DEFAULT_GROUP_COUNT,
  DEFAULT_CANDIDATES,
} from './constants';
import {
  randomIntegers,
  sampleItems,
  splitIntoGroups,
  shuffle,
  parseLines,
} from './utils/random';
import styles from './index.module.css';

/** 执行结果，携带错误信息或文本结果 */
interface RunState {
  error?: string;
  lines?: string[];
  groups?: string[][];
}

/**
 * 密码学安全随机工具：基于 crypto.getRandomValues 的无偏随机整数、
 * 抽签、随机分组与列表洗牌，全部在浏览器本地完成
 *
 * @returns 随机工具交互界面
 */
const SecureRandomPicker: React.FC<ToolComponentProps> = () => {
  const [mode, setMode] = React.useState<RandomModeEnum>(RandomModeEnum.INTEGER);
  const [min, setMin] = React.useState(DEFAULT_MIN);
  const [max, setMax] = React.useState(DEFAULT_MAX);
  const [integerCount, setIntegerCount] = React.useState<number>(Number(DEFAULT_INTEGER_COUNT));
  const [allowDuplicates, setAllowDuplicates] = React.useState(true);
  const [candidates, setCandidates] = React.useState(DEFAULT_CANDIDATES);
  const [pickCount, setPickCount] = React.useState<number>(Number(DEFAULT_PICK_COUNT));
  const [groupCount, setGroupCount] = React.useState<number>(Number(DEFAULT_GROUP_COUNT));
  const [result, setResult] = React.useState<RunState | null>(null);

  const run = () => {
    try {
      if (mode === RandomModeEnum.INTEGER) {
        const minValue = Number(min);
        const maxValue = Number(max);
        if (!Number.isSafeInteger(minValue) || !Number.isSafeInteger(maxValue)) {
          throw new Error('最小值与最大值必须是安全整数');
        }
        if (minValue > maxValue) {
          throw new Error('最小值不能大于最大值');
        }
        if (maxValue - minValue + 1 > 0x100000000) {
          throw new Error('区间过宽（不能超过 2³² 个整数）');
        }
        if (!Number.isInteger(integerCount) || integerCount < 1 || integerCount > MAX_OUTPUT_COUNT) {
          throw new Error(`生成数量需为 1–${MAX_OUTPUT_COUNT} 的整数`);
        }
        const values = randomIntegers(minValue, maxValue, integerCount, allowDuplicates);
        setResult({ lines: values.map(String) });
        return;
      }

      const items = parseLines(candidates);
      if (items.length === 0) {
        throw new Error('候选名单为空，请每行填写一个候选项');
      }

      if (mode === RandomModeEnum.PICK) {
        if (!Number.isInteger(pickCount) || pickCount < 1) {
          throw new Error('抽取数量需为正整数');
        }
        if (pickCount > items.length) {
          throw new Error(`抽取数量不能超过候选数量（${items.length}）`);
        }
        setResult({ lines: sampleItems(items, pickCount) });
        return;
      }

      if (mode === RandomModeEnum.GROUP) {
        if (!Number.isInteger(groupCount) || groupCount < 1) {
          throw new Error('组数需为正整数');
        }
        if (groupCount > items.length) {
          throw new Error(`组数不能超过候选数量（${items.length}）`);
        }
        setResult({ groups: splitIntoGroups(items, groupCount) });
        return;
      }

      setResult({ lines: shuffle(items) });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  const copyResult = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('结果已复制'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const resultText = result?.groups
    ? result.groups.map((group, index) => `第 ${index + 1} 组：${group.join(', ')}`).join('\n')
    : result?.lines?.join('\n') ?? '';

  return (
    <div className={styles.container}>
      <Card title="密码学安全随机工具（抽签 / 分组 / 洗牌）">
        <Radio.Group
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as RandomModeEnum);
            setResult(null);
          }}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: RANDOM_MODE_LABELS[RandomModeEnum.INTEGER], value: RandomModeEnum.INTEGER },
            { label: RANDOM_MODE_LABELS[RandomModeEnum.PICK], value: RandomModeEnum.PICK },
            { label: RANDOM_MODE_LABELS[RandomModeEnum.GROUP], value: RandomModeEnum.GROUP },
            { label: RANDOM_MODE_LABELS[RandomModeEnum.SHUFFLE], value: RandomModeEnum.SHUFFLE },
          ]}
        />

        {mode === RandomModeEnum.INTEGER ? (
          <div className={styles.controls}>
            <Space wrap>
            <span className={styles.label}>区间</span>
            <InputNumber value={min} onChange={(value) => setMin(String(value ?? ''))} style={{ width: 130 }} addonBefore="最小" />
            <InputNumber value={max} onChange={(value) => setMax(String(value ?? ''))} style={{ width: 130 }} addonBefore="最大" />
            <span className={styles.label}>数量</span>
            <InputNumber min={1} max={MAX_OUTPUT_COUNT} value={integerCount} onChange={(value) => setIntegerCount(Number(value ?? 1))} style={{ width: 110 }} />
            <Checkbox checked={allowDuplicates} onChange={(event) => setAllowDuplicates(event.target.checked)}>
              允许重复
            </Checkbox>
            </Space>
            <p className={styles.hint}>使用 crypto.getRandomValues 拒绝采样，无取模偏置，端点包含。</p>
          </div>
        ) : (
          <div className={styles.controls}>
            {mode === RandomModeEnum.PICK && (
              <Space wrap style={{ marginBottom: 12 }}>
                <span className={styles.label}>抽取数量</span>
                <InputNumber min={1} value={pickCount} onChange={(value) => setPickCount(Number(value ?? 1))} style={{ width: 110 }} />
                <span className={styles.hint}>不放回抽取，结果无重复</span>
              </Space>
            )}
            {mode === RandomModeEnum.GROUP && (
              <Space wrap style={{ marginBottom: 12 }}>
                <span className={styles.label}>分组数量</span>
                <InputNumber min={1} value={groupCount} onChange={(value) => setGroupCount(Number(value ?? 1))} style={{ width: 110 }} />
                <span className={styles.hint}>Fisher–Yates 洗牌后尽量均分，组大小相差至多 1</span>
              </Space>
            )}
            <Input.TextArea
              value={candidates}
              onChange={(event) => setCandidates(event.target.value)}
              rows={8}
              placeholder="每行一个候选项"
            />
          </div>
        )}

        <Button type="primary" onClick={run} style={{ marginTop: 16 }}>
          生成随机结果
        </Button>

        {result?.error ? (
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="输入有误" description={result.error} />
        ) : null}

        {(result?.lines || result?.groups) && (
          <Card size="small" title="结果" style={{ marginTop: 16 }} extra={<Button size="small" onClick={() => copyResult(resultText)}>复制</Button>}>
            {result.lines ? (
              <div className={styles.tagList}>
                {result.lines.map((line, index) => (
                  <Tag key={`${index}-${line}`} className={styles.resultTag}>{line}</Tag>
                ))}
              </div>
            ) : (
              <div className={styles.groupList}>
                {result.groups?.map((group, index) => (
                  <div key={index} className={styles.group}>
                    <div className={styles.groupTitle}>第 {index + 1} 组（{group.length} 人）</div>
                    <div className={styles.tagList}>
                      {group.map((item, itemIndex) => (
                        <Tag key={`${itemIndex}-${item}`} className={styles.resultTag}>{item}</Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </Card>
    </div>
  );
};

export default SecureRandomPicker;
