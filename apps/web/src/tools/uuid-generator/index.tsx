import React from 'react';
import { ToolComponentProps } from '../../types';
import { Card, Button, Input, Radio, Space } from 'antd';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { generateUuid } from './utils/generator';
import styles from './index.module.css';
import { copyToClipboard } from '../../../utils/copy';

const UuidGenerator: React.FC<ToolComponentProps> = ({ tool }) => {
  const [count, setCount] = React.useState<number>(1);
  const [uuids, setUuids] = React.useState<string[]>([]);

  const generateNew = () => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUuid());
    }
    setUuids(newUuids);
  };

  React.useEffect(() => {
    generateNew();
  }, []);

  const handleCopy = () => {
    if (uuids.length === 0) {
      message.warning('没有生成的UUID可复制');
      return;
    }
    const text = uuids.join('\n');
    copyToClipboard(text);
    message.success('复制成功');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.controlsCard}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <span>生成数量：</span>
            <Radio.Group
              value={count}
              onChange={(e) => setCount(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value={1}>1</Radio.Button>
              <Radio.Button value={5}>5</Radio.Button>
              <Radio.Button value={10}>10</Radio.Button>
              <Radio.Button value={20}>20</Radio.Button>
            </Radio.Group>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={generateNew}
            >
              重新生成
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              复制全部
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="生成结果" className={styles.resultCard}>
        <Input.TextArea
          value={uuids.join('\n')}
          readOnly
          rows={Math.max(count + 2, 5)}
          autoSize={{ minRows: 5, maxRows: 25 }}
        />
      </Card>
    </div>
  );
};

export default UuidGenerator;
