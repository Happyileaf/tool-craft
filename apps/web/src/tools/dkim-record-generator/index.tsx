"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Radio,
  Space,
  Tag,
  message,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { generateDkimRecord, type DkimKeyType } from "./utils/dkim";
import {
  DEFAULT_DOMAIN,
  DEFAULT_PUBLIC_KEY,
  DEFAULT_SELECTOR,
  KEY_TYPE_OPTIONS,
} from "./constants";
import { copyToClipboard } from "@/lib/utils";
import styles from "./index.module.css";

const DkimRecordGenerator: React.FC<ToolComponentProps> = () => {
  const [selector, setSelector] = React.useState(DEFAULT_SELECTOR);
  const [domain, setDomain] = React.useState(DEFAULT_DOMAIN);
  const [keyType, setKeyType] = React.useState<DkimKeyType>("rsa");
  const [publicKey, setPublicKey] = React.useState("");
  const [granularity, setGranularity] = React.useState("");
  const [note, setNote] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [subdomainStrict, setSubdomainStrict] = React.useState(false);

  const result = React.useMemo(
    () =>
      generateDkimRecord({
        selector,
        domain,
        keyType,
        publicKey: publicKey || DEFAULT_PUBLIC_KEY,
        granularity,
        note,
        testing,
        subdomainStrict,
      }),
    [
      selector,
      domain,
      keyType,
      publicKey,
      granularity,
      note,
      testing,
      subdomainStrict,
    ],
  );

  const handleCopy = () => {
    if (!result.recordValue) {
      message.error("存在配置错误，暂无可复制的记录");
      return;
    }
    copyToClipboard(`${result.dnsName}\tTXT\t${result.chunks.join(" ")}`);
    message.success("已复制 DNS 记录（名称 + TXT 分段）");
  };

  return (
    <div className={styles.container}>
      <div className={styles.panels}>
        <Card className={styles.card} title="DKIM 密钥与标签配置">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Input
              addonBefore="选择器 selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className={styles.editor}
              spellCheck={false}
            />
            <Input
              addonBefore="签名域 domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={styles.editor}
              spellCheck={false}
            />
            <div>
              <div style={{ marginBottom: 6 }}>公钥算法（k=）</div>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={keyType}
                options={KEY_TYPE_OPTIONS}
                onChange={(e) => setKeyType(e.target.value as DkimKeyType)}
              />
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>
                公钥（p=，PEM 包裹或裸 Base64，自动去页眉换行）
              </div>
              <Input.TextArea
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder={DEFAULT_PUBLIC_KEY}
                autoSize={{ minRows: 5, maxRows: 12 }}
                className={styles.editor}
                spellCheck={false}
              />
            </div>
            <Input
              addonBefore="granularity g=（可选）"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className={styles.editor}
              spellCheck={false}
            />
            <Input
              addonBefore="备注 n=（可选）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={styles.editor}
              spellCheck={false}
            />
            <Space>
              <Checkbox
                checked={testing}
                onChange={(e) => setTesting(e.target.checked)}
              >
                测试模式 t=y
              </Checkbox>
              <Checkbox
                checked={subdomainStrict}
                onChange={(e) => setSubdomainStrict(e.target.checked)}
              >
                禁止子域 t=s
              </Checkbox>
            </Space>
          </Space>
        </Card>

        <Card
          className={styles.card}
          title="DNS TXT 记录"
          extra={
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              复制记录
            </Button>
          }
        >
          {result.errors.length > 0 || result.warnings.length > 0 ? (
            <div className={styles.alerts}>
              {result.errors.map((error) => (
                <Alert key={error} type="error" showIcon message={error} />
              ))}
              {result.warnings.map((warning) => (
                <Alert
                  key={warning}
                  type="warning"
                  showIcon
                  message={warning}
                />
              ))}
            </div>
          ) : null}

          {result.recordValue ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  记录名称
                </div>
                <div className={styles.dnsName}>{result.dnsName}</div>
              </div>
              <div className={styles.meta}>
                <Tag color="blue">类型 TXT</Tag>
                {result.publicKeyBytes !== null ? (
                  <Tag color="default">
                    公钥解码 {result.publicKeyBytes} 字节
                  </Tag>
                ) : null}
                <Tag color={result.chunks.length > 1 ? "orange" : "green"}>
                  {result.chunks.length} 个 255 字符分段
                </Tag>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  marginBottom: 4,
                }}
              >
                记录值（RFC 1035 分段，可直接粘贴到 BIND / DNS 控制台）
              </div>
              <pre className={styles.recordBox}>
                {result.chunks.join(' "\n"')}
              </pre>
            </>
          ) : (
            <Alert type="info" showIcon message="请先修正左侧配置错误" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default DkimRecordGenerator;
