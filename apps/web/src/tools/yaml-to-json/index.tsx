import React from 'react';
import { ToolComponentProps } from '../../types';
import { Card, Input, Result, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { yamlToJson } from './utils/converter';
import { message } from 'antd';
import styles from './index.module.css';
import { copyToClipboard } from '../../../utils/copy';

interface YamlToJsonProps {
  yaml: string;
  json: string;
  error: string | null;
}

const YamlToJson: React.FC<ToolComponentProps> = ({ tool }) => {
  const [state, setState] = React.useState<YamlToJsonProps>({
    yaml: tool.defaultSampleInput,
    json: '',
    error: null,
  });

  React.useEffect(() => {
    tryConvert(state.yaml);
  }, []);

  const tryConvert = (yaml: string) => {
    try {
      const json = yamlToJson(yaml);
      setState({
        yaml,
        json,
        error: null,
      });
    } catch (e) {
      setState({
        yaml,
        json: '',
        error: (e as Error).message,
      });
    }
  };

  const handleCopy = () => {
    if (state.error) {
      message.error('当前JSON有错误，无法复制');
      return;
    }
    copyToClipboard(state.json);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card title="输入 YAML" className={styles.card}>
        <Input.TextArea
          value={state.yaml}
          onChange={(e) => {
            const yaml = e.target.value;
            setState(prev => ({ ...prev, yaml }));
            tryConvert(yaml);
          }}
          placeholder="在这里输入YAML..."
          rows={12}
          autoSize={{ minRows: 8, maxRows: 20 }}
        />
      </Card>

      <Card
        title="输出 JSON"
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
            title="YAML 解析错误"
            subTitle={state.error}
          />
        ) : (
          <Input.TextArea
            value={state.json}
            readOnly
            rows={12}
            autoSize={{ minRows: 8, maxRows: 20 }}
          />
        )}
      </Card>
    </div>
  );
};

export default YamlToJson;
