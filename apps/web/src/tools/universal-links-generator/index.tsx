'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Form, Input, Space, Switch, Table, Tabs, Tag, message } from 'antd';
import { CopyOutlined, DownloadOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/lib/utils';
import {
  AASA_DEPLOY_PATH,
  ASSETLINKS_DEPLOY_PATH,
  DEFAULT_AASA_INPUT,
  DEFAULT_ASSETLINKS_INPUT,
  generate,
  type AasaAppEntry,
  type AasaComponent,
} from './utils/universalLinks';
import { DEPLOY_CHECKLIST, PLATFORM_TABS, type PlatformTabKey } from './constants';
import styles from './index.module.css';

/**
 * 跨平台深链关联文件生成器：表单化生成 iOS apple-app-site-association
 * 与 Android assetlinks.json，全部本地拼装与格式校验，零网络请求。
 *
 * @param _props - 工具组件属性（本工具使用内置样例）
 * @returns 工具交互界面
 */
const UniversalLinksGenerator: React.FC<ToolComponentProps> = (_props) => {
  const [activeTab, setActiveTab] = React.useState<PlatformTabKey>('ios');

  const [apps, setApps] = React.useState<AasaAppEntry[]>(DEFAULT_AASA_INPUT.apps.map((entry) => ({ ...entry })));
  const [components, setComponents] = React.useState<AasaComponent[]>(
    DEFAULT_AASA_INPUT.components.map((entry) => ({ ...entry })),
  );
  const [enableWebCredentials, setEnableWebCredentials] = React.useState(DEFAULT_AASA_INPUT.enableWebCredentials);
  const [enableAppClips, setEnableAppClips] = React.useState(DEFAULT_AASA_INPUT.enableAppClips);

  const [packageName, setPackageName] = React.useState(DEFAULT_ASSETLINKS_INPUT.packageName);
  const [fingerprints, setFingerprints] = React.useState<string[]>([...DEFAULT_ASSETLINKS_INPUT.fingerprints]);
  const [enableLoginCredentials, setEnableLoginCredentials] = React.useState(
    DEFAULT_ASSETLINKS_INPUT.enableLoginCredentials,
  );

  const result = React.useMemo(
    () =>
      generate(
        { apps, components, enableWebCredentials, enableAppClips },
        { packageName, fingerprints, enableLoginCredentials },
      ),
    [apps, components, enableWebCredentials, enableAppClips, packageName, fingerprints, enableLoginCredentials],
  );

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    message.success('复制成功');
  };

  const handleDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    message.success(`${fileName} 已开始下载`);
  };

  const updateApp = (index: number, patch: Partial<AasaAppEntry>) => {
    setApps((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const updateComponent = (index: number, patch: Partial<AasaComponent>) => {
    setComponents((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const deployColumns = [
    { title: '检查项', dataIndex: 'title', width: 200 },
    { title: '要求', dataIndex: 'detail' },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="blue">纯浏览器本地生成与校验：iOS Universal Links（AASA）与 Android App Links（assetlinks.json），配置不会上传</Tag>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as PlatformTabKey)}
            items={[
              {
                key: PLATFORM_TABS[0]!.key,
                label: PLATFORM_TABS[0]!.label,
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Form.Item label="appID 条目（Team ID + Bundle ID，可多条）">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {apps.map((entry, index) => (
                            <Space.Compact key={index} style={{ width: '100%' }}>
                              <Input
                                className={styles.mono}
                                style={{ maxWidth: 200 }}
                                placeholder="Team ID（10 位）"
                                value={entry.teamId}
                                spellCheck={false}
                                onChange={(event) => updateApp(index, { teamId: event.target.value })}
                              />
                              <Input
                                className={styles.mono}
                                placeholder="Bundle ID，如 com.example.app"
                                value={entry.bundleId}
                                spellCheck={false}
                                onChange={(event) => updateApp(index, { bundleId: event.target.value })}
                              />
                              <Button
                                icon={<MinusCircleOutlined />}
                                onClick={() => setApps(apps.filter((_, i) => i !== index))}
                              >
                                删除
                              </Button>
                            </Space.Compact>
                          ))}
                          <Button icon={<PlusOutlined />} onClick={() => setApps([...apps, { teamId: '', bundleId: '' }])}>
                            添加 appID
                          </Button>
                        </Space>
                      </Form.Item>

                      <Form.Item label="applinks components 匹配规则（留空的字段不会输出）">
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {components.map((component, index) => (
                            <Card key={index} size="small" type="inner" title={`规则 ${index + 1}`}>
                              <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <Space wrap>
                                  <Input
                                    className={styles.mono}
                                    addonBefore="/"
                                    placeholder="path，如 /help/*"
                                    value={component.path}
                                    spellCheck={false}
                                    style={{ minWidth: 240 }}
                                    onChange={(event) => updateComponent(index, { path: event.target.value })}
                                  />
                                  <Input
                                    className={styles.mono}
                                    addonBefore="?"
                                    placeholder="query，如 q=hello"
                                    value={component.query}
                                    spellCheck={false}
                                    style={{ minWidth: 200 }}
                                    onChange={(event) => updateComponent(index, { query: event.target.value })}
                                  />
                                  <Input
                                    className={styles.mono}
                                    addonBefore="#"
                                    placeholder="fragment"
                                    value={component.fragment}
                                    spellCheck={false}
                                    style={{ minWidth: 160 }}
                                    onChange={(event) => updateComponent(index, { fragment: event.target.value })}
                                  />
                                </Space>
                                <Space wrap>
                                  <Input
                                    placeholder="comment（仅备注，不参与匹配）"
                                    value={component.comment}
                                    style={{ minWidth: 260 }}
                                    onChange={(event) => updateComponent(index, { comment: event.target.value })}
                                  />
                                  <Checkbox
                                    checked={component.exclude}
                                    onChange={(event) => updateComponent(index, { exclude: event.target.checked })}
                                  >
                                    exclude（命中则不打开 App）
                                  </Checkbox>
                                  <Button
                                    size="small"
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => setComponents(components.filter((_, i) => i !== index))}
                                  >
                                    删除规则
                                  </Button>
                                </Space>
                              </Space>
                            </Card>
                          ))}
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() =>
                              setComponents([
                                ...components,
                                { path: '', query: '', fragment: '', comment: '', exclude: false },
                              ])
                            }
                          >
                            添加 component
                          </Button>
                        </Space>
                      </Form.Item>

                      <Space size="large">
                        <Form.Item label="webcredentials 段（密码自动填充）" style={{ marginBottom: 0 }}>
                          <Switch checked={enableWebCredentials} onChange={setEnableWebCredentials} />
                        </Form.Item>
                        <Form.Item label="appclips 段（App Clip 关联）" style={{ marginBottom: 0 }}>
                          <Switch checked={enableAppClips} onChange={setEnableAppClips} />
                        </Form.Item>
                      </Space>
                    </Form>

                    {result.ios.errors.map((error) => (
                      <Alert key={error} type="error" showIcon message={error} />
                    ))}

                    <Card size="small" type="inner" title={<span className={styles.mono}>{AASA_DEPLOY_PATH}</span>}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {result.ios.json ? (
                          <>
                            <pre className={styles.codeBlock}>{result.ios.json}</pre>
                            <Space>
                              <Button icon={<CopyOutlined />} onClick={() => handleCopy(result.ios.json ?? '')}>
                                复制 JSON
                              </Button>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload('apple-app-site-association', result.ios.json ?? '')}
                              >
                                下载文件
                              </Button>
                            </Space>
                          </>
                        ) : (
                          <Alert type="warning" showIcon message="存在校验错误，修正后才会生成 JSON" />
                        )}
                      </Space>
                    </Card>
                  </Space>
                ),
              },
              {
                key: PLATFORM_TABS[1]!.key,
                label: PLATFORM_TABS[1]!.label,
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Form layout="vertical">
                      <Form.Item label="package_name（applicationId）">
                        <Input
                          className={styles.mono}
                          style={{ maxWidth: 360 }}
                          placeholder="com.example.android"
                          value={packageName}
                          spellCheck={false}
                          onChange={(event) => setPackageName(event.target.value)}
                        />
                      </Form.Item>

                      <Form.Item label="SHA-256 签名指纹（32 组两位十六进制、冒号分隔，自动转大写、去重）">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {fingerprints.map((fingerprint, index) => (
                            <Space.Compact key={index} style={{ width: '100%' }}>
                              <Input
                                className={styles.mono}
                                placeholder="AA:BB:CC:...（共 95 字符）"
                                value={fingerprint}
                                spellCheck={false}
                                onChange={(event) =>
                                  setFingerprints(
                                    fingerprints.map((value, i) => (i === index ? event.target.value : value)),
                                  )
                                }
                              />
                              <Button
                                icon={<MinusCircleOutlined />}
                                onClick={() => setFingerprints(fingerprints.filter((_, i) => i !== index))}
                              >
                                删除
                              </Button>
                            </Space.Compact>
                          ))}
                          <Button icon={<PlusOutlined />} onClick={() => setFingerprints([...fingerprints, ''])}>
                            添加指纹
                          </Button>
                        </Space>
                      </Form.Item>

                      <Form.Item label="附加 relation" style={{ marginBottom: 0 }}>
                        <Checkbox
                          checked={enableLoginCredentials}
                          onChange={(event) => setEnableLoginCredentials(event.target.checked)}
                        >
                          同时声明 delegate_permission/common.get_login_credentials
                        </Checkbox>
                      </Form.Item>
                    </Form>

                    {result.android.errors.map((error) => (
                      <Alert key={error} type="error" showIcon message={error} />
                    ))}

                    <Card size="small" type="inner" title={<span className={styles.mono}>{ASSETLINKS_DEPLOY_PATH}</span>}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {result.android.json ? (
                          <>
                            <pre className={styles.codeBlock}>{result.android.json}</pre>
                            <Space>
                              <Button icon={<CopyOutlined />} onClick={() => handleCopy(result.android.json ?? '')}>
                                复制 JSON
                              </Button>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload('assetlinks.json', result.android.json ?? '')}
                              >
                                下载文件
                              </Button>
                            </Space>
                          </>
                        ) : (
                          <Alert type="warning" showIcon message="存在校验错误，修正后才会生成 JSON" />
                        )}
                      </Space>
                    </Card>
                  </Space>
                ),
              },
              {
                key: PLATFORM_TABS[2]!.key,
                label: PLATFORM_TABS[2]!.label,
                children: (
                  <Table
                    size="small"
                    rowKey={(record) => record.title ?? ''}
                    columns={deployColumns}
                    dataSource={DEPLOY_CHECKLIST as unknown as Array<Record<string, string>>}
                    pagination={false}
                  />
                ),
              },
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

export default UniversalLinksGenerator;
