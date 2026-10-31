'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Progress, Statistic, Tag } from 'antd';
import {
  analyzeReadability,
  describeGradeLevel,
  getReadingEaseBand,
} from './utils/readability';
import { RE_SCALE_MAX, SAMPLE_TEXT } from './constants';
import styles from './index.module.css';

/**
 * 英文文本可读性评分器：本地计算 Flesch Reading Ease 与
 * Flesch–Kincaid Grade Level，展示句 / 词 / 音节计数、ASL、ASY 与分级解读。
 * 音节计数采用固定启发式规则，不依赖词典。
 *
 * @returns 可读性评分交互界面
 */
const ReadabilityScore: React.FC<ToolComponentProps> = () => {
  const [text, setText] = React.useState(SAMPLE_TEXT);

  const result = React.useMemo(() => analyzeReadability(text), [text]);

  return (
    <div className={styles.container}>
      <Card
        title="英文文本可读性评分（Flesch Reading Ease / Grade Level）"
        extra={
          <Button size="small" type="text" onClick={() => setText(SAMPLE_TEXT)}>
            恢复样例
          </Button>
        }
      >
        <Input.TextArea
          className={styles.textarea}
          rows={9}
          placeholder="Paste English text here…（仅支持英文）"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <p className={styles.hint}>
          句子按 . ! ? 后接空白切分；单词为字母 / 撇号 / 连字符序列；音节为无词典启发式估计，每个单词至少 1 音节。
        </p>
      </Card>

      {!result ? (
        <Card>
          <Empty description="文本过短：输入至少一个英文单词后开始评分" />
        </Card>
      ) : (
        <>
          <Card>
            <div className={styles.statGrid}>
              <Statistic title="句子数" value={result.sentences} />
              <Statistic title="单词数" value={result.words} />
              <Statistic title="音节数" value={result.syllables} />
              <Statistic
                title="平均句长 ASL"
                value={result.averageSentenceLength}
                precision={2}
                suffix="词"
              />
              <Statistic
                title="平均每词音节 ASY"
                value={result.averageSyllablesPerWord}
                precision={2}
              />
            </div>
          </Card>

          <div className={styles.scoreGrid}>
            <Card title="Flesch Reading Ease" className={styles.scoreCard}>
              <Statistic
                value={result.readingEase}
                precision={2}
                valueStyle={{ color: getReadingEaseBand(result.readingEase).color }}
              />
              <Progress
                percent={Math.min(
                  100,
                  Math.max(0, (result.readingEase / RE_SCALE_MAX) * 100),
                )}
                strokeColor={getReadingEaseBand(result.readingEase).color}
                showInfo={false}
              />
              <div className={styles.bandRow}>
                <Tag color="blue">{getReadingEaseBand(result.readingEase).label}</Tag>
                <span className={styles.bandDesc}>
                  {getReadingEaseBand(result.readingEase).description} ·{' '}
                  {getReadingEaseBand(result.readingEase).schoolLevel}
                </span>
              </div>
            </Card>

            <Card title="Flesch–Kincaid Grade Level" className={styles.scoreCard}>
              <Statistic value={result.gradeLevel} precision={2} suffix="年级" />
              <div className={styles.bandRow}>
                <span className={styles.bandDesc}>{describeGradeLevel(result.gradeLevel)}</span>
              </div>
              <Alert
                type="info"
                showIcon
                message="年级值越低越易读；简短句子与常用短词能降低年级值。"
              />
            </Card>
          </div>

          <Card size="small">
            <pre className={styles.formula}>
              {`ASL = words / sentences = ${result.words} / ${result.sentences}\nASY = syllables / words = ${result.syllables} / ${result.words}\nReading Ease = 206.835 − 1.015 × ASL − 84.6 × ASY\nGrade Level   = 0.39 × ASL + 11.8 × ASY − 15.59`}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReadabilityScore;
