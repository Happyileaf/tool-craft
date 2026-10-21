'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Card, Empty, Input, List, Space, Tag, Typography } from 'antd';
import {
  detectHash,
  HashConfidenceEnum,
  type HashCandidate,
} from './utils/hash-detect';
import { DEFAULT_HASH_INPUT, INPUT_ROWS } from './constants';
import styles from './index.module.css';

const { Text } = Typography;

/** 置信度对应的 Tag 颜色与中文文案 */
const CONFIDENCE_META: Record<
  HashConfidenceEnum,
  { color: string; label: string }
> = {
  [HashConfidenceEnum.HIGH]: { color: 'green', label: '高置信度' },
  [HashConfidenceEnum.MEDIUM]: { color: 'orange', label: '中置信度' },
  [HashConfidenceEnum.LOW]: { color: 'default', label: '低置信度' },
};

/**
 * 哈希类型识别工具，依据散列值的 crypt(3) 前缀结构与十六进制长度
 * 推断候选算法并给出置信度说明，识别全部在浏览器本地完成
 *
 * @returns 哈希类型识别交互界面
 */
const HashTypeIdentifier: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState(DEFAULT_HASH_INPUT);

  const candidates = React.useMemo<HashCandidate[]>(
    () => detectHash(input),
    [input],
  );
  const isEmpty = input.trim() === '';

  return (
    <div className={styles.container}>
      <Card title="哈希类型识别器">
        <Input.TextArea
          className={styles.hashInput}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={INPUT_ROWS}
          placeholder="粘贴一段散列值，自动去除首尾空白、不区分大小写"
          spellCheck={false}
        />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            支持 MD5、SHA-1/224/256/384/512、CRC32 以及 bcrypt、MD5/SHA crypt 等加盐格式；仅依据结构与长度推断，无法逆向确认算法。
          </Text>
        </div>
      </Card>

      {isEmpty ? (
        <Empty
          description={<span className={styles.emptyText}>请输入散列值后开始识别</span>}
        />
      ) : candidates.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          message="无法识别"
          description="不是已知长度的十六进制摘要，也不匹配 crypt 前缀。请检查输入是否完整，或该算法是否不在支持范围内。"
        />
      ) : (
        <Card size="small" title={<Space>候选算法<Tag color="blue">{candidates.length} 个</Tag></Space>}>
          <List
            dataSource={candidates}
            renderItem={(candidate) => {
              const meta = CONFIDENCE_META[candidate.confidence];
              return (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{candidate.name}</span>
                        <Tag color={meta.color}>{meta.label}</Tag>
                      </Space>
                    }
                    description={
                      <span className={styles.candidateNote}>{candidate.note}</span>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default HashTypeIdentifier;
