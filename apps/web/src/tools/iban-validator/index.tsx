'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Space, Tag, message } from 'antd';
import { BankOutlined, ClearOutlined, CopyOutlined } from '@ant-design/icons';
import {
  formatIbanGroups,
  normalizeIban,
  validateIban,
} from './utils/iban';
import { COUNTRY_NAMES_ZH, DEFAULT_IBAN, IBAN_EXAMPLES } from './constants';
import styles from './index.module.css';

/**
 * IBAN 银行账号校验与格式化：依据 ISO 13616 校验国家码、长度与 mod 97-10 校验位，
 * 识别国家，并在机器格式与 4 位分组格式间互转展示，全部在浏览器本地完成
 *
 * @param props - 工具组件属性
 * @param props.defaultInput - 可选默认输入
 * @returns IBAN 校验交互界面
 */
const IbanValidator: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [raw, setRaw] = React.useState<string>(defaultInput || DEFAULT_IBAN);

  /** 规范化后的机器格式（无空格、大写） */
  const normalized = React.useMemo(() => normalizeIban(raw), [raw]);

  /** 完整校验结果 */
  const result = React.useMemo(() => validateIban(raw), [raw]);

  /** 4 位分组易读格式 */
  const grouped = React.useMemo(() => formatIbanGroups(normalized), [normalized]);

  /** 识别国家的中文名（未收录时回退为国家码本身） */
  const countryName = result.countryCode
    ? (COUNTRY_NAMES_ZH[result.countryCode] ?? result.countryCode)
    : '—';

  /** 复制文本到剪贴板，并给出轻提示 */
  const copyText = (text: string, label: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label}已复制`))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const hasInput = normalized.length > 0;

  return (
    <div className={styles.container}>
      <Card title="IBAN 银行账号校验与格式化（ISO 13616）">
        <p className={styles.hint}>
          输入 IBAN 后自动去除空格与连字符并转大写，依次校验国家码、长度与 mod 97-10
          校验位；账号仅在浏览器本地校验，不会上传。
        </p>
        <Input
          size="large"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="输入 IBAN，可含空格或连字符，如 DE89 3704 0044 0532 0130 00"
          prefix={<BankOutlined />}
          className={styles.ibanInput}
          allowClear
        />
        <Space wrap style={{ marginTop: 12 }}>
          <span className={styles.label}>示例：</span>
          {IBAN_EXAMPLES.map((example) => (
            <Button
              key={example.value}
              size="small"
              onClick={() => setRaw(example.value)}
              danger={example.invalid}
            >
              {example.label}
            </Button>
          ))}
          <Button size="small" icon={<ClearOutlined />} onClick={() => setRaw('')}>
            清空
          </Button>
        </Space>

        <div style={{ marginTop: 16 }}>
          {!hasInput ? (
            <Alert type="info" showIcon message="请输入 IBAN 银行账号" />
          ) : result.valid ? (
            <Alert
              type="success"
              showIcon
              message="IBAN 校验通过"
              description={`账号合法，识别国家 / 地区：${countryName}（${result.countryCode}）。`}
            />
          ) : (
            <Alert
              type="error"
              showIcon
              message="IBAN 校验失败"
              description={result.reason}
            />
          )}
        </div>
      </Card>

      <Card title="校验结果与格式转换">
        <Descriptions size="small" bordered column={1}>
          <Descriptions.Item label="结论">
            <Tag color={result.valid ? 'success' : 'error'}>
              {result.valid ? '合法' : '非法'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="识别国家 / 地区">
            {result.countryCode ? (
              <>
                <Tag color="blue">{result.countryCode}</Tag>
                {countryName}
              </>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="总长度">
            {hasInput ? `${normalized.length} 位` : <span className={styles.muted}>—</span>}
          </Descriptions.Item>
          <Descriptions.Item label="失败原因">
            {result.reason ? (
              <span className={result.valid ? styles.muted : styles.errorText}>{result.reason}</span>
            ) : (
              <span className={styles.muted}>无</span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="机器格式（无空格大写）">
            <Space className={styles.copyRow} wrap>
              <span className={styles.mono}>{normalized || '—'}</span>
              <Button
                size="small"
                type="link"
                icon={<CopyOutlined />}
                disabled={!hasInput}
                onClick={() => copyText(normalized, '机器格式')}
              >
                复制
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="易读格式（4 位分组）">
            <Space className={styles.copyRow} wrap>
              <span className={styles.mono}>{grouped || '—'}</span>
              <Button
                size="small"
                type="link"
                icon={<CopyOutlined />}
                disabled={!hasInput}
                onClick={() => copyText(grouped, '易读格式')}
              >
                复制
              </Button>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default IbanValidator;
