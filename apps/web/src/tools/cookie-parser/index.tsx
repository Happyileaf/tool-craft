'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { DEFAULT_COOKIE_HEADER, DEFAULT_SET_COOKIE, SAME_SITE_OPTIONS } from './constants';
import {
  parseCookieHeader,
  serializeCookieHeader,
  parseSetCookie,
  buildSetCookie,
  formatCookieDate,
  validateSetCookie,
  type CookiePair,
  type SameSiteValue,
} from './utils/cookie';
import styles from './index.module.css';

/** Set-Cookie 表单状态 */
interface SetCookieForm {
  name: string;
  value: string;
  /** datetime-local 输入框的值，空串表示未设置 */
  expiresLocal: string;
  maxAge: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: '' | SameSiteValue;
}

/** Set-Cookie 表单初始值 */
function createInitialSetCookieForm(): SetCookieForm {
  return {
    name: '',
    value: '',
    expiresLocal: '',
    maxAge: '',
    domain: '',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: '',
  };
}

/** datetime-local 值（按本地时区）转为 GMT 字符串 */
function localToGmt(local: string): string | undefined {
  if (!local) return undefined;
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? undefined : formatCookieDate(date);
}

/** GMT 字符串转为 datetime-local 需要的本地时间值 */
function gmtToLocal(gmt: string | undefined): string {
  if (!gmt) return '';
  const date = new Date(gmt);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * Cookie 字符串解析与生成器：Cookie 请求头双向转换，
 * Set-Cookie 响应头属性表单生成与回填
 *
 * @returns Cookie 工具交互界面
 */
const CookieParser: React.FC<ToolComponentProps> = () => {
  // 区域一：Cookie 请求头
  const [headerInput, setHeaderInput] = React.useState(DEFAULT_COOKIE_HEADER);
  const [decode, setDecode] = React.useState(false);
  const [encode, setEncode] = React.useState(false);
  const [pairs, setPairs] = React.useState<CookiePair[]>(() =>
    parseCookieHeader(DEFAULT_COOKIE_HEADER).pairs,
  );
  const [parseNotices, setParseNotices] = React.useState(
    parseCookieHeader(DEFAULT_COOKIE_HEADER).notices,
  );

  /** 文本框变化时重新解析 */
  const handleHeaderChange = (text: string) => {
    setHeaderInput(text);
    const parsed = parseCookieHeader(text, decode);
    setPairs(parsed.pairs);
    setParseNotices(parsed.notices);
  };

  /** 切换 URL 解码开关后重新解析 */
  const handleDecodeToggle = (checked: boolean) => {
    setDecode(checked);
    const parsed = parseCookieHeader(headerInput, checked);
    setPairs(parsed.pairs);
    setParseNotices(parsed.notices);
  };

  /** 更新表格中某一行 */
  const updatePair = (index: number, patch: Partial<CookiePair>) => {
    setPairs((previous) =>
      previous.map((pair, pairIndex) =>
        pairIndex === index ? { ...pair, ...patch } : pair,
      ),
    );
  };

  const addPair = () => setPairs((previous) => [...previous, { name: '', value: '' }]);

  const removePair = (index: number) =>
    setPairs((previous) => previous.filter((_, pairIndex) => pairIndex !== index));

  const serialized = React.useMemo(() => serializeCookieHeader(pairs, encode), [pairs, encode]);

  const copyText = (text: string, label: string) => {
    if (!text) {
      message.warning('暂无可复制的内容');
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(`${label}已复制`))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const pairColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: '38%',
      render: (_: unknown, _record: CookiePair, index: number) => (
        <Input
          value={pairs[index]?.name ?? ''}
          placeholder="Cookie 名称"
          onChange={(event) => updatePair(index, { name: event.target.value })}
        />
      ),
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (_: unknown, _record: CookiePair, index: number) => (
        <Input
          value={pairs[index]?.value ?? ''}
          placeholder="Cookie 值"
          onChange={(event) => updatePair(index, { value: event.target.value })}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_: unknown, _record: CookiePair, index: number) => (
        <Button
          danger
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removePair(index)}
        />
      ),
    },
  ];

  // 区域二：Set-Cookie 生成器
  const [form, setForm] = React.useState<SetCookieForm>(createInitialSetCookieForm);
  const [setCookieInput, setSetCookieInput] = React.useState(DEFAULT_SET_COOKIE);

  const setCookieOutput = React.useMemo(() => {
    if (!form.name.trim()) return '';
    return buildSetCookie({
      name: form.name,
      value: form.value,
      expires: localToGmt(form.expiresLocal),
      maxAge: form.maxAge.trim() !== '' ? Number(form.maxAge) : undefined,
      domain: form.domain.trim() || undefined,
      path: form.path.trim() || undefined,
      secure: form.secure,
      httpOnly: form.httpOnly,
      sameSite: form.sameSite || undefined,
    });
  }, [form]);

  const setCookieNotices = React.useMemo(() => {
    if (!form.name.trim()) return [];
    return validateSetCookie({
      name: form.name,
      value: form.value,
      secure: form.secure,
      sameSite: form.sameSite || undefined,
      ...(form.expiresLocal ? { expires: localToGmt(form.expiresLocal) } : {}),
      ...(form.maxAge.trim() !== '' ? { maxAge: Number(form.maxAge) } : {}),
    });
  }, [form]);

  /** 把已粘贴的单行 Set-Cookie 回填到表单 */
  const fillFromSetCookie = () => {
    try {
      const fields = parseSetCookie(setCookieInput);
      setForm({
        name: fields.name,
        value: fields.value,
        expiresLocal: gmtToLocal(fields.expires),
        maxAge: typeof fields.maxAge === 'number' ? String(fields.maxAge) : '',
        domain: fields.domain ?? '',
        path: fields.path ?? '/',
        secure: fields.secure ?? false,
        httpOnly: fields.httpOnly ?? false,
        sameSite: fields.sameSite ?? '',
      });
      message.success('已回填到下方表单');
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    }
  };

  const updateForm = (patch: Partial<SetCookieForm>) =>
    setForm((previous) => ({ ...previous, ...patch }));

  return (
    <div className={styles.container}>
      <Card title="Cookie 请求头解析与生成">
        <p className={styles.hint}>
          粘贴 <code>a=1; b=2</code> 形式的 Cookie 请求头，下方表格可直接增删改名值并双向序列化。
        </p>
        <Input.TextArea
          value={headerInput}
          onChange={(event) => handleHeaderChange(event.target.value)}
          rows={3}
          spellCheck={false}
        />
        <Space wrap style={{ marginTop: 8 }}>
          <Checkbox checked={decode} onChange={(event) => handleDecodeToggle(event.target.checked)}>
            解析时 URL 解码值
          </Checkbox>
          <Checkbox checked={encode} onChange={(event) => setEncode(event.target.checked)}>
            序列化时 URL 编码值
          </Checkbox>
          <Button size="small" onClick={() => copyText(serialized, '序列化结果')}>
            复制序列化结果
          </Button>
        </Space>

        {parseNotices.map((notice, index) => (
          <Alert
            key={index}
            style={{ marginTop: 8 }}
            type={notice.level === 'warning' ? 'warning' : 'info'}
            showIcon
            message={notice.message}
          />
        ))}

        <div style={{ marginTop: 12 }}>
          <Table
            size="small"
            pagination={false}
            rowKey={(_, index) => String(index)}
            columns={pairColumns}
            dataSource={pairs}
          />
          <Button style={{ marginTop: 8 }} size="small" icon={<PlusOutlined />} onClick={addPair}>
            新增一行
          </Button>
        </div>

        <div className={styles.outputBlock}>
          <div className={styles.outputLabel}>
            序列化结果
            <Button size="small" type="link" onClick={() => setHeaderInput(serialized)}>
              回填到上方输入框
            </Button>
          </div>
          <code className={styles.outputCode}>{serialized || '（请先在表格中填写名称）'}</code>
        </div>
      </Card>

      <Card title="Set-Cookie 响应头生成与回填">
        <p className={styles.hint}>
          填写属性后即时生成 <code>Set-Cookie</code> 响应头；也可粘贴已有的单行 Set-Cookie 回填表单。
        </p>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={setCookieInput}
            onChange={(event) => setSetCookieInput(event.target.value)}
            placeholder="粘贴已有的 Set-Cookie 单行（可含 Set-Cookie: 前缀）"
            spellCheck={false}
          />
          <Button onClick={fillFromSetCookie}>解析并回填</Button>
        </Space.Compact>

        <div className={styles.formGrid} style={{ marginTop: 16 }}>
          <div>
            <div className={styles.fieldLabel}>名称 Name</div>
            <Input
              value={form.name}
              onChange={(event) => updateForm({ name: event.target.value })}
              placeholder="如 sessionId"
            />
          </div>
          <div>
            <div className={styles.fieldLabel}>值 Value</div>
            <Input
              value={form.value}
              onChange={(event) => updateForm({ value: event.target.value })}
              placeholder="如 3f8a9c2e"
            />
          </div>
          <div>
            <div className={styles.fieldLabel}>Domain</div>
            <Input
              value={form.domain}
              onChange={(event) => updateForm({ domain: event.target.value })}
              placeholder="如 example.com"
            />
          </div>
          <div>
            <div className={styles.fieldLabel}>Path</div>
            <Input
              value={form.path}
              onChange={(event) => updateForm({ path: event.target.value })}
              placeholder="/"
            />
          </div>
          <div>
            <div className={styles.fieldLabel}>Expires（过期时刻）</div>
            <Input
              type="datetime-local"
              value={form.expiresLocal}
              onChange={(event) => updateForm({ expiresLocal: event.target.value })}
            />
          </div>
          <div>
            <div className={styles.fieldLabel}>Max-Age（秒）</div>
            <Input
              value={form.maxAge}
              onChange={(event) => updateForm({ maxAge: event.target.value.replace(/[^\d-]/g, '') })}
              placeholder="如 3600"
            />
          </div>
          <div>
            <div className={styles.fieldLabel}>SameSite</div>
            <Select
              style={{ width: '100%' }}
              value={form.sameSite}
              onChange={(value: '' | SameSiteValue) => updateForm({ sameSite: value })}
              options={SAME_SITE_OPTIONS}
            />
          </div>
          <div className={styles.switchBlock}>
            <Space>
              <Switch
                checked={form.secure}
                onChange={(checked) => updateForm({ secure: checked })}
              />
              <span>Secure</span>
              <Switch
                checked={form.httpOnly}
                onChange={(checked) => updateForm({ httpOnly: checked })}
              />
              <span>HttpOnly</span>
            </Space>
          </div>
        </div>

        {setCookieNotices.map((notice, index) => (
          <Alert
            key={index}
            style={{ marginTop: 12 }}
            type={notice.level === 'warning' ? 'warning' : 'info'}
            showIcon
            message={notice.message}
          />
        ))}

        <div className={styles.outputBlock}>
          <div className={styles.outputLabel}>
            生成结果
            <Space>
              {setCookieOutput ? <Tag color="blue">RFC 6265</Tag> : null}
              <Button size="small" onClick={() => copyText(setCookieOutput, 'Set-Cookie')}>
                复制
              </Button>
              <Button size="small" onClick={() => setForm(createInitialSetCookieForm())}>
                清空表单
              </Button>
            </Space>
          </div>
          <code className={styles.outputCode}>
            {setCookieOutput || 'Set-Cookie: （请先填写名称）'}
          </code>
        </div>
      </Card>
    </div>
  );
};

export default CookieParser;
