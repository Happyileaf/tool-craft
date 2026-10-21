'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import {
  bitsToOctal,
  bitsToSymbolic,
  buildChmodCommand,
  octalToBits,
  symbolicToBits,
  PERMISSION_ORDER,
  ROLE_ORDER,
  type PermissionBits,
  type PermissionKind,
  type PermissionRole,
} from './utils/chmod';
import {
  DEFAULT_FILE_NAME,
  DEFAULT_OCTAL,
  OCTAL_MAX_LENGTH,
  PERMISSION_LABELS,
  ROLE_LABELS,
  SYMBOLIC_MAX_LENGTH,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

const { Text } = Typography;

/**
 * chmod 权限换算工具，在勾选网格、3 位八进制数字与 9 字符符号串之间
 * 三向联动换算，并实时生成 chmod 命令；全部运算在浏览器本地完成
 *
 * @returns chmod 权限换算交互界面
 */
const ChmodCalculator: React.FC<ToolComponentProps> = () => {
  const [bits, setBits] = React.useState<PermissionBits>(
    () => octalToBits(DEFAULT_OCTAL) as PermissionBits,
  );
  const [octalInput, setOctalInput] = React.useState(DEFAULT_OCTAL);
  const [symbolicInput, setSymbolicInput] = React.useState('rwxr-xr-x');
  const [octalError, setOctalError] = React.useState(false);
  const [symbolicError, setSymbolicError] = React.useState(false);
  const [fileName, setFileName] = React.useState(DEFAULT_FILE_NAME);

  const octal = bitsToOctal(bits);
  const symbolic = bitsToSymbolic(bits);
  const command = buildChmodCommand(octal, fileName);

  /**
   * 切换某个权限位，并以网格为基准刷新数字与符号表示
   *
   * @param role - 角色
   * @param kind - 权限位
   * @param checked - 是否勾选
   */
  const toggleBit = (
    role: PermissionRole,
    kind: PermissionKind,
    checked: boolean,
  ) => {
    setBits((previous) => ({
      ...previous,
      [role]: { ...previous[role], [kind]: checked },
    }));
    setOctalError(false);
    setSymbolicError(false);
  };

  /**
   * 编辑数字模式；合法 3 位八进制时同步网格，非法时仅提示且不破坏网格
   *
   * @param value - 输入框文本
   */
  const handleOctalChange = (value: string) => {
    const next = value.trim();
    setOctalInput(value);
    const parsed = octalToBits(next);
    if (parsed) {
      setBits(parsed);
      setOctalError(false);
    } else {
      setOctalError(next !== '');
    }
  };

  /**
   * 编辑符号串；合法 9 字符时同步网格，非法时仅提示且不破坏网格
   *
   * @param value - 输入框文本
   */
  const handleSymbolicChange = (value: string) => {
    const next = value.trim();
    setSymbolicInput(value);
    const parsed = symbolicToBits(next);
    if (parsed) {
      setBits(parsed);
      setSymbolicError(false);
    } else {
      setSymbolicError(next !== '');
    }
  };

  /** 失焦时把输入框回填为网格当前的权威值，消除临时非法态 */
  const resetInputs = () => {
    setOctalInput(bitsToOctal(bits));
    setSymbolicInput(bitsToSymbolic(bits));
    setOctalError(false);
    setSymbolicError(false);
  };

  /** 复制生成的 chmod 命令 */
  const handleCopy = async () => {
    if (!command) {
      return;
    }
    await copyToClipboard(command);
    message.success('命令已复制');
  };

  return (
    <div className={styles.container}>
      <Card title="chmod 权限计算器">
        <div className={styles.gridHeader} style={{ marginBottom: 8 }}>
          <div className={styles.gridRow}>
            <span>角色 / 权限</span>
            {PERMISSION_ORDER.map((kind) => (
              <span key={kind}>{PERMISSION_LABELS[kind]}</span>
            ))}
            <span>符号</span>
          </div>
        </div>
        {ROLE_ORDER.map((role) => (
          <div key={role} className={styles.gridRow}>
            <span className={styles.roleLabel}>{ROLE_LABELS[role]}</span>
            {PERMISSION_ORDER.map((kind) => (
              <Checkbox
                key={kind}
                checked={bits[role][kind]}
                onChange={(event) => toggleBit(role, kind, event.target.checked)}
              />
            ))}
            <span className={styles.roleSymbol}>
              {symbolic.slice(ROLE_ORDER.indexOf(role) * 3, ROLE_ORDER.indexOf(role) * 3 + 3)}
            </span>
          </div>
        ))}
      </Card>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small" title="数字模式（八进制）">
            <Input
              value={octalInput}
              onChange={(event) => handleOctalChange(event.target.value)}
              onBlur={resetInputs}
              maxLength={OCTAL_MAX_LENGTH}
              placeholder="如 755"
              className="font-mono"
              status={octalError ? 'error' : undefined}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{octal}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={16}>
          <Card size="small" title="符号模式">
            <Input
              value={symbolicInput}
              onChange={(event) => handleSymbolicChange(event.target.value)}
              onBlur={resetInputs}
              maxLength={SYMBOLIC_MAX_LENGTH}
              placeholder="如 rwxr-xr-x"
              className="font-mono"
              status={symbolicError ? 'error' : undefined}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="blue" style={{ fontFamily: 'monospace' }}>
                {symbolic}
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {octalError || symbolicError ? (
        <Alert
          type="warning"
          showIcon
          message="输入格式不合法"
          description="数字模式须为 3 位 0–7 的八进制数；符号模式须为 9 个字符，且按 r/w/x 顺序使用字母或 -。当前勾选网格保持不变。"
        />
      ) : null}

      <Card
        title="生成的 chmod 命令"
        extra={
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            disabled={!command}
            onClick={handleCopy}
          >
            复制
          </Button>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <label className={styles.fieldLabel} htmlFor="chmod-file-name">
              目标文件名
            </label>
            <Input
              id="chmod-file-name"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="输入文件名（不含空白）"
              className="font-mono"
              style={{ maxWidth: 320 }}
            />
          </div>
          {command ? (
            <div className={styles.commandBox}>
              <Text copyable={false}>{command}</Text>
            </div>
          ) : (
            <Alert
              type="error"
              showIcon
              message="无法生成命令"
              description="请填写不含空白的非空文件名；工具只生成命令文本，不会在任何系统上执行。"
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ChmodCalculator;
