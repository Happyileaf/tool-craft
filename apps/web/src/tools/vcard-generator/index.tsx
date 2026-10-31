'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Radio,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import {
  buildVCard,
  type ContactKind,
  type EmailEntry,
  type PhoneEntry,
  type VCardData,
  type VCardVersion,
} from './utils/vcard';
import { EMAIL_KIND_OPTIONS, PHONE_KIND_OPTIONS, SAMPLE_CARD } from './constants';
import styles from './index.module.css';

/** 空名片初始值 */
function createEmptyCard(): VCardData {
  return {
    fullName: '',
    name: { family: '', given: '', additional: '', prefix: '', suffix: '' },
    title: '',
    organization: '',
    department: '',
    phones: [{ value: '', kind: 'cell' }],
    emails: [{ value: '', kind: 'work' }],
    url: '',
    address: {
      box: '',
      extended: '',
      street: '',
      locality: '',
      region: '',
      postalCode: '',
      country: '',
    },
    birthday: '',
    note: '',
  };
}

/**
 * vCard（VCF）名片生成器：结构化表单 → vCard 3.0 / 4.0 文本，
 * 处理特殊字符转义、N / ADR 分段、多值电话邮箱、75 字符折行与 CRLF 行尾，
 * 支持复制与本地下载 .vcf，全部运算在浏览器主线程完成。
 *
 * @returns vCard 名片生成交互界面
 */
const VCardGenerator: React.FC<ToolComponentProps> = () => {
  const [data, setData] = React.useState<VCardData>(createEmptyCard);
  const [version, setVersion] = React.useState<VCardVersion>('3.0');
  const [messageApi, contextHolder] = message.useMessage();

  const result = React.useMemo(() => buildVCard(data, version), [data, version]);

  /** 浅量更新顶层字段 */
  const patch = React.useCallback(<K extends keyof VCardData>(key: K, value: VCardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** 更新结构化姓名分段 */
  const updateNamePart = (key: keyof NonNullable<VCardData['name']>, value: string) => {
    setData((prev) => ({ ...prev, name: { ...prev.name, [key]: value } }));
  };

  /** 更新地址分段 */
  const updateAddressPart = (
    key: keyof NonNullable<VCardData['address']>,
    value: string,
  ) => {
    setData((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
  };

  const updatePhone = (index: number, patchValue: Partial<PhoneEntry>) => {
    setData((prev) => ({
      ...prev,
      phones: (prev.phones ?? []).map((phone, i) =>
        i === index ? { ...phone, ...patchValue } : phone,
      ),
    }));
  };

  const addPhone = () =>
    setData((prev) => ({
      ...prev,
      phones: [...(prev.phones ?? []), { value: '', kind: 'cell' as ContactKind }],
    }));

  const removePhone = (index: number) =>
    setData((prev) => ({
      ...prev,
      phones: (prev.phones ?? []).filter((_, i) => i !== index),
    }));

  const updateEmail = (index: number, patchValue: Partial<EmailEntry>) => {
    setData((prev) => ({
      ...prev,
      emails: (prev.emails ?? []).map((email, i) =>
        i === index ? { ...email, ...patchValue } : email,
      ),
    }));
  };

  const addEmail = () =>
    setData((prev) => ({
      ...prev,
      emails: [...(prev.emails ?? []), { value: '', kind: 'work' as ContactKind }],
    }));

  const removeEmail = (index: number) =>
    setData((prev) => ({
      ...prev,
      emails: (prev.emails ?? []).filter((_, i) => i !== index),
    }));

  const handleCopy = async () => {
    if (!result.ok) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.vcf);
      messageApi.success('vCard 文本已复制');
    } catch {
      messageApi.error('复制失败，请手动选择预览文本复制');
    }
  };

  const handleDownload = () => {
    if (!result.ok) {
      return;
    }
    const blob = new Blob([result.vcf], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'contact.vcf';
    anchor.click();
    URL.revokeObjectURL(url);
    messageApi.success('contact.vcf 已开始下载');
  };

  return (
    <div className={styles.container}>
      {contextHolder}
      <div className={styles.grid}>
        <Card
          title="名片信息"
          extra={
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={() => setData(createEmptyCard())}
            >
              清空
            </Button>
          }
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Button block icon={<PlusOutlined />} onClick={() => setData(SAMPLE_CARD)}>
              填入样例名片
            </Button>

            <div>
              <p className={styles.sectionTitle}>
                全名 FN <Tag color="red">必填</Tag>
              </p>
              <Input
                placeholder="如：张小明 (Zhang Xiaoming)"
                value={data.fullName}
                onChange={(event) => patch('fullName', event.target.value)}
              />
            </div>

            <div>
              <p className={styles.sectionTitle}>结构化姓名 N（可选，按段输出）</p>
              <Space.Compact block>
                <Input
                  placeholder="姓"
                  value={data.name?.family ?? ''}
                  onChange={(event) => updateNamePart('family', event.target.value)}
                />
                <Input
                  placeholder="名"
                  value={data.name?.given ?? ''}
                  onChange={(event) => updateNamePart('given', event.target.value)}
                />
                <Input
                  placeholder="中间名"
                  value={data.name?.additional ?? ''}
                  onChange={(event) => updateNamePart('additional', event.target.value)}
                />
                <Input
                  placeholder="前缀"
                  value={data.name?.prefix ?? ''}
                  onChange={(event) => updateNamePart('prefix', event.target.value)}
                />
                <Input
                  placeholder="后缀"
                  value={data.name?.suffix ?? ''}
                  onChange={(event) => updateNamePart('suffix', event.target.value)}
                />
              </Space.Compact>
            </div>

            <Space.Compact block>
              <Input
                placeholder="职务 TITLE"
                value={data.title}
                onChange={(event) => patch('title', event.target.value)}
              />
              <Input
                placeholder="组织 ORG"
                value={data.organization}
                onChange={(event) => patch('organization', event.target.value)}
              />
              <Input
                placeholder="部门"
                value={data.department}
                onChange={(event) => patch('department', event.target.value)}
              />
            </Space.Compact>

            <Input
              type="date"
              addonBefore="生日"
              value={data.birthday}
              onChange={(event) => patch('birthday', event.target.value)}
            />

            <div>
              <p className={styles.sectionTitle}>电话 TEL（可多条）</p>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {(data.phones ?? []).map((phone, index) => (
                  <div key={index} className={styles.multiRow}>
                    <Select
                      className={styles.kindSelect}
                      value={phone.kind}
                      options={PHONE_KIND_OPTIONS}
                      onChange={(value: ContactKind) => updatePhone(index, { kind: value })}
                    />
                    <Input
                      placeholder="+86 138-0000-0000"
                      value={phone.value}
                      onChange={(event) => updatePhone(index, { value: event.target.value })}
                    />
                    <Button
                      danger
                      type="text"
                      icon={<MinusCircleOutlined />}
                      disabled={(data.phones ?? []).length <= 1}
                      onClick={() => removePhone(index)}
                    />
                  </div>
                ))}
                <Button block icon={<PlusOutlined />} onClick={addPhone}>
                  添加电话
                </Button>
              </Space>
            </div>

            <div>
              <p className={styles.sectionTitle}>邮箱 EMAIL（可多条）</p>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {(data.emails ?? []).map((email, index) => (
                  <div key={index} className={styles.multiRow}>
                    <Select
                      className={styles.kindSelect}
                      value={email.kind}
                      options={EMAIL_KIND_OPTIONS}
                      onChange={(value: ContactKind) => updateEmail(index, { kind: value })}
                    />
                    <Input
                      placeholder="name@example.com"
                      value={email.value}
                      onChange={(event) => updateEmail(index, { value: event.target.value })}
                    />
                    <Button
                      danger
                      type="text"
                      icon={<MinusCircleOutlined />}
                      disabled={(data.emails ?? []).length <= 1}
                      onClick={() => removeEmail(index)}
                    />
                  </div>
                ))}
                <Button block icon={<PlusOutlined />} onClick={addEmail}>
                  添加邮箱
                </Button>
              </Space>
            </div>

            <Input
              addonBefore="网址"
              placeholder="https://example.com"
              value={data.url}
              onChange={(event) => patch('url', event.target.value)}
            />

            <div>
              <p className={styles.sectionTitle}>地址 ADR（邮政信箱;扩展;街道;城区;区域;邮编;国家）</p>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Input
                  placeholder="街道"
                  value={data.address?.street ?? ''}
                  onChange={(event) => updateAddressPart('street', event.target.value)}
                />
                <Space.Compact block>
                  <Input
                    placeholder="城区 / 市镇"
                    value={data.address?.locality ?? ''}
                    onChange={(event) => updateAddressPart('locality', event.target.value)}
                  />
                  <Input
                    placeholder="省 / 州"
                    value={data.address?.region ?? ''}
                    onChange={(event) => updateAddressPart('region', event.target.value)}
                  />
                  <Input
                    placeholder="邮编"
                    value={data.address?.postalCode ?? ''}
                    onChange={(event) => updateAddressPart('postalCode', event.target.value)}
                  />
                </Space.Compact>
                <Space.Compact block>
                  <Input
                    placeholder="国家"
                    value={data.address?.country ?? ''}
                    onChange={(event) => updateAddressPart('country', event.target.value)}
                  />
                  <Input
                    placeholder="邮政信箱（可选）"
                    value={data.address?.box ?? ''}
                    onChange={(event) => updateAddressPart('box', event.target.value)}
                  />
                  <Input
                    placeholder="扩展地址（可选）"
                    value={data.address?.extended ?? ''}
                    onChange={(event) => updateAddressPart('extended', event.target.value)}
                  />
                </Space.Compact>
              </Space>
            </div>

            <Input.TextArea
              rows={3}
              placeholder="备注 NOTE（逗号、分号、反斜杠与换行会按规范自动转义）"
              value={data.note}
              onChange={(event) => patch('note', event.target.value)}
            />
          </Space>
        </Card>

        <Card
          title="vCard 预览"
          extra={
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              size="small"
              value={version}
              onChange={(event) => setVersion(event.target.value as VCardVersion)}
              options={[
                { label: 'vCard 3.0', value: '3.0' },
                { label: 'vCard 4.0', value: '4.0' },
              ]}
            />
          }
        >
          {result.ok ? (
            <pre className={styles.preview}>{result.vcf}</pre>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="填写姓名后生成预览"
            />
          )}
          {!result.ok && (
            <Alert
              className={styles.errorBox}
              type="warning"
              showIcon
              message={result.error}
            />
          )}
          <div className={styles.actions} style={{ marginTop: 12 }}>
            <Button
              type="primary"
              icon={<CopyOutlined />}
              disabled={!result.ok}
              onClick={handleCopy}
            >
              复制 vCard
            </Button>
            <Button
              icon={<DownloadOutlined />}
              disabled={!result.ok}
              onClick={handleDownload}
            >
              下载 .vcf
            </Button>
          </div>
          <p className={styles.hint}>
            输出遵循 vCard {version} 语法：行尾 CRLF，逻辑行按 75 字符折行（续行以空格开头），文本中的 \ , ;
            与换行已自动转义；全部内容仅在浏览器本地生成。
          </p>
        </Card>
      </div>
    </div>
  );
};

export default VCardGenerator;
