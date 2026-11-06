'use client';

import React from 'react';
import { Alert, Badge, Button, Card, Descriptions, Empty, Input, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import { validateEmail, type ValidationResult } from './utils/validator';
import { DEFAULT_EMAIL, EMAIL_EXAMPLES, INPUT_ROWS } from './constants';
import styles from './index.module.css';

const { Text } = Typography;

/**
 * 邮箱地址语法校验与结构解析器：对单个地址做确定性字符级校验，
 * 输出合法结论、逐条原因 / 警告以及 local-part、domain 等结构化部件，
 * 全部在浏览器本地完成、不发起任何网络请求
 *
 * @returns 邮箱校验交互界面
 */
const EmailSyntaxValidator: React.FC<ToolComponentProps> = () => {
  const [input, setInput] = React.useState(DEFAULT_EMAIL);

  const result: ValidationResult = React.useMemo(() => validateEmail(input), [input]);

  return (
    <div className={styles.container}>
      <Card
        title="邮箱地址输入"
        extra={<Tag color="blue">纯本地校验 · 不联网</Tag>}
      >
        <Input.TextArea
          value={input}
          rows={INPUT_ROWS}
          onChange={(event) => setInput(event.target.value)}
          placeholder="粘贴单个邮箱地址，例如 user@example.com"
        />
        <div className={styles.exampleRow} style={{ marginTop: 12 }}>
          {EMAIL_EXAMPLES.map((example) => (
            <Button key={example.label} size="small" onClick={() => setInput(example.value)}>
              {example.label}
            </Button>
          ))}
        </div>
      </Card>

      {input.trim() === '' ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="输入地址后展示校验结果" />
      ) : (
        <Card
          title={
            <Space>
              {result.valid ? (
                <Badge
                  status="success"
                  text={<Text strong>语法合法</Text>}
                />
              ) : (
                <Badge status="error" text={<Text strong type="danger">语法非法</Text>} />
              )}
            </Space>
          }
        >
          {result.valid ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleFilled />}
              message="地址通过语法校验（仅代表格式正确，不代表邮箱真实存在或可投递）"
              style={{ marginBottom: 12 }}
            />
          ) : (
            <Alert
              type="error"
              showIcon
              icon={<CloseCircleFilled />}
              message="发现以下语法问题"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
                  {result.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              }
              style={{ marginBottom: 12 }}
            />
          )}

          {result.warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="警告（不影响语法合法性）"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              }
              style={{ marginBottom: 12 }}
            />
          )}

          {result.parts && (
            <>
              <Descriptions bordered size="small" column={1} title="结构化拆解">
                <Descriptions.Item label="local-part（@ 左侧）">
                  <Text className={styles.mono} copyable>
                    {result.parts.localPart}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="domain（@ 右侧）">
                  <Text className={styles.mono} copyable>
                    {result.parts.domain}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="local-part 形态">
                  <Tag>{result.parts.localType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="domain 形态">
                  <Tag color="geekblue">{result.parts.domainType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否含非 ASCII（IDN）">
                  {result.parts.isIdn ? <Tag color="orange">是 · 需 punycode</Tag> : <Tag>否</Tag>}
                </Descriptions.Item>
              </Descriptions>
              <div className={styles.partGrid} style={{ marginTop: 12 }}>
                <div className={styles.partCard}>
                  <div className={styles.partLabel}>local-part 长度</div>
                  <div className={styles.partValue}>{result.parts.localPart.length} / 64</div>
                </div>
                <div className={styles.partCard}>
                  <div className={styles.partLabel}>地址总长度</div>
                  <div className={styles.partValue}>{input.trim().length} / 254</div>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default EmailSyntaxValidator;
