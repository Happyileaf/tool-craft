'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Input, Tag } from 'antd';
import {
  CompareResultEnum,
  checkRange,
  compareVersions,
  parseVersion,
} from './utils/semver';
import {
  COMPARE_RESULT_LABELS,
  DEFAULT_RANGE,
  DEFAULT_RANGE_VERSION,
  DEFAULT_VERSION,
  DEFAULT_VERSION_A,
  DEFAULT_VERSION_B,
} from './constants';
import styles from './index.module.css';

/**
 * 语义化版本解析与比较工具，提供版本校验解析、双版本比较与 npm 风格范围命中判断，
 * 全部运算在浏览器本地完成，不发起任何网络请求
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入，填入版本校验区块
 * @returns 语义化版本解析交互界面
 */
const SemverParser: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [version, setVersion] = React.useState<string>(defaultInput || DEFAULT_VERSION);
  const [versionA, setVersionA] = React.useState(DEFAULT_VERSION_A);
  const [versionB, setVersionB] = React.useState(DEFAULT_VERSION_B);
  const [range, setRange] = React.useState(DEFAULT_RANGE);
  const [rangeVersion, setRangeVersion] = React.useState(DEFAULT_RANGE_VERSION);

  const parsed = React.useMemo(() => parseVersion(version), [version]);
  const comparison = React.useMemo(
    () => compareVersions(versionA, versionB),
    [versionA, versionB],
  );
  const rangeResult = React.useMemo(
    () => checkRange(rangeVersion, range),
    [rangeVersion, range],
  );

  return (
    <div className={styles.container}>
      <Card title="版本校验与解析">
        <div className={styles.row}>
          <span className={styles.label}>版本号：</span>
          <Input
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            placeholder="例如 1.2.3-alpha.1+build.7"
            style={{ maxWidth: 360 }}
          />
          {parsed ? (
            <Tag color="green">合法版本</Tag>
          ) : (
            <Tag color="red">非法版本</Tag>
          )}
        </div>
        {parsed ? (
          <div className={styles.segments}>
            <div className={styles.segment}>
              <div className={styles.segmentKey}>major</div>
              <div className={styles.segmentValue}>{parsed.major}</div>
            </div>
            <div className={styles.segment}>
              <div className={styles.segmentKey}>minor</div>
              <div className={styles.segmentValue}>{parsed.minor}</div>
            </div>
            <div className={styles.segment}>
              <div className={styles.segmentKey}>patch</div>
              <div className={styles.segmentValue}>{parsed.patch}</div>
            </div>
            <div className={styles.segment}>
              <div className={styles.segmentKey}>prerelease</div>
              <div className={styles.segmentValue}>
                {parsed.prerelease.length > 0 ? parsed.prerelease.join('.') : '—'}
              </div>
            </div>
            <div className={styles.segment}>
              <div className={styles.segmentKey}>build</div>
              <div className={styles.segmentValue}>
                {parsed.build.length > 0 ? parsed.build.join('.') : '—'}
              </div>
            </div>
          </div>
        ) : (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="不符合 SemVer 2.0.0 规范"
            description="需为 major.minor.patch 三段式，数字段不允许前导零，可附带 -prerelease 与 +build。"
          />
        )}
      </Card>

      <Card title="版本比较">
        <div className={styles.row}>
          <span className={styles.label}>A：</span>
          <Input
            value={versionA}
            onChange={(event) => setVersionA(event.target.value)}
            placeholder="例如 1.2.10"
            style={{ maxWidth: 220 }}
          />
          <span className={styles.label}>B：</span>
          <Input
            value={versionB}
            onChange={(event) => setVersionB(event.target.value)}
            placeholder="例如 1.3.0"
            style={{ maxWidth: 220 }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          {comparison ? (
            <Tag
              color={
                comparison === CompareResultEnum.EQUAL
                  ? 'blue'
                  : comparison === CompareResultEnum.GREATER
                    ? 'green'
                    : 'orange'
              }
            >
              {COMPARE_RESULT_LABELS[comparison]}
            </Tag>
          ) : (
            <Alert type="error" showIcon message="任一版本号非法，无法比较" />
          )}
        </div>
      </Card>

      <Card title="范围命中判断（npm 风格）">
        <div className={styles.row}>
          <span className={styles.label}>范围：</span>
          <Input
            value={range}
            onChange={(event) => setRange(event.target.value)}
            placeholder="例如 ^1.2.3、>=1.0.0 <2.0.0、1.x"
            style={{ maxWidth: 320 }}
          />
          <span className={styles.label}>版本：</span>
          <Input
            value={rangeVersion}
            onChange={(event) => setRangeVersion(event.target.value)}
            placeholder="例如 1.9.0"
            style={{ maxWidth: 200 }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          {rangeResult.error ? (
            <Alert type="error" showIcon message={rangeResult.error} />
          ) : rangeResult.matched ? (
            <Tag color="green">命中该范围</Tag>
          ) : (
            <Tag color="red">不命中该范围</Tag>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SemverParser;
