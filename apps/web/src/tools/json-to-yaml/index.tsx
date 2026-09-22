'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Card, Input, Result, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { jsonToYaml } from './utils/json-to-yaml';
import styles from './index.module.css';
import { copyToClipboard } from '@/lib/utils';

interface JsonToYamlState {
  json: string;
  yaml: string;
  error: string | null;
}

const JsonToYaml: React.FC<ToolComponentProps> = ({ defaultInput }) => {
  const [state, setState] = React.useState<JsonToYamlState>({
    json: defaultInput || '',
    yaml: '',
    error: null,
  });

  React.useEffect(() => {
    tryConvert(state.json);
  }, []);

  const tryConvert = (jsonStr: string) => {
    try {
      if (!jsonStr.trim()) {
        setState({
          json: jsonStr,
          yaml: '',
          error: null,
        });
        return;
      }
      const obj = JSON.parse(jsonStr);
      const yaml = jsonToYaml(obj);
      setState({
        json: jsonStr,
        yaml,
        error: null,
      });
    } catch (e) {
      setState({
        json: jsonStr,
        yaml: '',
        error: (e as Error).message,
      });
    }
  };

  const handleCopy = () => {
    if (state.error) {
      message.error('当前JSON有错误，无法复制');
      return;
    }
    copyToClipboard(state.yaml);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card title="输入 JSON" className={styles.card}>
        <Input.TextArea
          value={state.json}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const json = e.target.value;
            setState(prev => ({ ...prev, json }));
            tryConvert(json);
          }}
          placeholder="在这里输入JSON..."
          rows={12}
          autoSize={{ minRows: 8, maxRows: 20 }}
        />
      </Card>

      <Card
        title="输出 YAML"
        className={styles.card}
        extra={
          !state.error && (
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
            >
              复制结果
            </Button>
          )
        }
      >
        {state.error ? (
          <Result
            status="error"
            title="JSON 解析错误"
            subTitle={state.error}
          />
        ) : (
          <Input.TextArea
            value={state.yaml}
            readOnly
            rows={12}
            autoSize={{ minRows: 8, maxRows: 20 }}
          />
        )}
      </Card>
    </div>
  );
};

export default JsonToYaml;
