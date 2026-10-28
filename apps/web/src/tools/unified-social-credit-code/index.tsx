'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Descriptions, Input, Space, Tag, message } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, CopyOutlined } from '@ant-design/icons';
import { normalizeUscc, validateUscc, type UsccResult } from './utils/uscc';
import { DEFAULT_USCC } from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 统一社会信用代码（GB 32100-2015）校验与解析：
 * 输入 18 位代码后实时校验字符集与模 31 校验码，并拆解
 * 登记管理部门、机构类别、行政区划、主体标识码四段结构。
 * 全部计算在浏览器本地完成，不发起任何网络请求。
 */
const UnifiedSocialCreditCode: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [code, setCode] = React.useState<string>(defaultInput || DEFAULT_USCC);

  const result: UsccResult = React.useMemo(
    () => validateUscc(code),
    [code],
  );
  const normalized = normalizeUscc(code);

  const handleCopy = async () => {
    if (!normalized) {
      return;
    }
    await copyToClipboard(normalized);
    message.success('代码已复制');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="统一社会信用代码校验与解析（GB 32100-2015）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="输入 18 位统一社会信用代码，如 91110108551385082Q"
            spellCheck={false}
            maxLength={24}
            className={styles.monoOutput}
            addonAfter={
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={!normalized}
              >
                复制
              </Button>
            }
          />

          {normalized ? (
            result.valid ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleFilled />}
                message="校验通过"
                description="长度、字符集与校验码均符合 GB 32100-2015 规则。"
              />
            ) : (
              <Alert
                type="error"
                showIcon
                icon={<CloseCircleFilled />}
                message="校验未通过"
                description={result.error ?? '未知错误'}
              />
            )
          ) : (
            <Alert type="info" showIcon message="等待输入" description="输入后将实时校验并解析" />
          )}

          {normalized.length === 18 && result.parts ? (
            <>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="登记管理部门（第 1 位）">
                  <span className={styles.monoText}>{result.parts.departmentCode}</span>
                  {'　'}
                  {result.parts.departmentName}
                </Descriptions.Item>
                <Descriptions.Item label="机构类别（第 2 位）">
                  <span className={styles.monoText}>{result.parts.categoryCode}</span>
                  {'　'}
                  {result.parts.categoryName}
                </Descriptions.Item>
                <Descriptions.Item label="登记管理机关行政区划码（第 3–8 位）">
                  <span className={styles.monoText}>{result.parts.regionCode}</span>
                  {'　'}
                  {result.parts.provinceName ?? (
                    <span className={styles.hint}>未收录的省级行政区划码</span>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="主体标识码 / 组织机构代码（第 9–17 位）">
                  <span className={styles.monoText}>{result.parts.subjectId}</span>
                </Descriptions.Item>
                <Descriptions.Item label="校验码（第 18 位）">
                  <span className={styles.monoText}>{result.parts.checkCode}</span>
                  {!result.valid && (
                    <span className={styles.hint}>
                      {' '}
                      （正确值应为{' '}
                      <span className={styles.monoText}>
                        {result.parts.expectedCheckCode}
                      </span>
                      ）
                    </span>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <div className={styles.hint}>
                结构分段：
                <Tag color="blue">{normalized.slice(0, 1)}</Tag>
                部门
                <Tag color="geekblue">{normalized.slice(1, 2)}</Tag>
                类别
                <Tag color="purple">{normalized.slice(2, 8)}</Tag>
                行政区划
                <Tag color="cyan">{normalized.slice(8, 17)}</Tag>
                主体标识
                <Tag color={result.valid ? 'green' : 'red'}>
                  {normalized.slice(17, 18)}
                </Tag>
                校验码
              </div>
            </>
          ) : null}

          <div className={styles.hint}>
            代码共 18 位，使用 31 个字符（0-9 与 A-Z 中去除易混淆的 I、O、Z、S、V），
            前 17 位按固定加权因子求和后以 31 为模换算出第 18 位校验码。全部运算在浏览器本地完成，不上传任何信息。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default UnifiedSocialCreditCode;
