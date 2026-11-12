'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Empty, Input, Space, Table, Tag, message } from 'antd';
import { CopyOutlined, RedoOutlined } from '@ant-design/icons';
import {
  SAMPLE_DOCKER_RUN,
  convertDockerRunToCompose,
} from './utils/docker-run';
import { SUPPORTED_OPTIONS } from './constants';
import styles from './index.module.css';

/**
 * docker run → docker-compose.yml 转换器：
 * shell 词法切分（支持引号、转义与行尾续行），把 docker run 选项映射为单个 compose 服务，
 * 手工输出缩进合法的 YAML，未识别选项以告警形式列出。全部解析在浏览器主线程完成。
 *
 * @returns 命令输入与 YAML 预览的双栏界面
 */
const DockerRunToCompose: React.FC<ToolComponentProps> = () => {
  const [command, setCommand] = React.useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const result = React.useMemo(
    () => (command.trim().length > 0 ? convertDockerRunToCompose(command) : null),
    [command],
  );

  const handleCopy = async () => {
    if (result === null || !result.ok) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.yaml);
      messageApi.success('docker-compose.yml 已复制');
    } catch {
      messageApi.error('复制失败，请手动选择预览文本复制');
    }
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <div className={styles.grid}>
        <Card
          title="docker run 命令"
          extra={
            <Space>
              <Button size="small" onClick={() => setCommand(SAMPLE_DOCKER_RUN)}>
                填入示例
              </Button>
              <Button
                size="small"
                icon={<RedoOutlined />}
                onClick={() => setCommand('')}
              >
                清空
              </Button>
            </Space>
          }
        >
          <Input.TextArea
            className={styles.editor}
            rows={18}
            spellCheck={false}
            placeholder="在此粘贴完整的 docker run 命令，支持单/双引号、反斜杠转义与行尾 \ 续行"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
          />
          <p className={styles.hint}>
            一条 docker run 映射为 compose 中的一个服务；服务名取 --name，缺省时由镜像名派生。
            未识别的选项不会中断转换，而会在右侧以告警列出，便于手动补充。
          </p>
        </Card>

        <Card
          title="docker-compose.yml 预览"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              disabled={result === null || !result.ok}
              onClick={handleCopy}
            >
              复制 YAML
            </Button>
          }
        >
          {result === null ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="粘贴命令后实时生成 compose 配置"
            />
          ) : !result.ok ? (
            <Alert type="error" showIcon message="解析失败" description={result.error} />
          ) : (
            <>
              <pre className={styles.preview}>{result.yaml}</pre>
              {result.warnings.length > 0 && (
                <Alert
                  className={styles.warningBox}
                  type="warning"
                  showIcon
                  message={`${result.warnings.length} 条告警`}
                  description={
                    <Space direction="vertical" size={4}>
                      {result.warnings.map((warning) => (
                        <Tag key={warning} color="orange">
                          {warning}
                        </Tag>
                      ))}
                    </Space>
                  }
                />
              )}
            </>
          )}
        </Card>
      </div>

      <Card title="支持的选项映射速查" size="small">
        <Table
          size="small"
          rowKey="option"
          pagination={false}
          dataSource={SUPPORTED_OPTIONS}
          columns={[
            { title: 'docker run 选项', dataIndex: 'option', width: 260 },
            { title: 'compose 字段 / 处理方式', dataIndex: 'compose' },
          ]}
        />
      </Card>
    </div>
  );
};

export default DockerRunToCompose;
