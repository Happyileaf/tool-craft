'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Checkbox, Input, Radio, Space, Table, Tabs, Tag, message } from 'antd';
import {
  compareDocWithSignature,
  generateJsdoc,
  parseFunctionSignature,
  parseJsdoc,
} from './utils/jsdoc';
import { SAMPLE_DOCBLOCK, SAMPLE_SIGNATURE } from './constants';
import styles from './index.module.css';

const { TextArea } = Input;

type Dialect = 'jsdoc' | 'tsdoc';

type GenerationResult =
  | { sig: ReturnType<typeof parseFunctionSignature>; block: string }
  | { error: string };

type AnalysisResult =
  | { doc: ReturnType<typeof parseJsdoc>; report?: ReturnType<typeof compareDocWithSignature> }
  | { error: string }
  | null;

/**
 * JSDoc / TSDoc 注释块生成与解析器：
 * 生成页把函数签名转换为标准注释块，解析页把既有注释块结构化并与签名做一致性比对。
 * 全部词法处理在浏览器本地完成。
 *
 * @returns 生成 / 解析双标签页界面
 */
const JsdocTsdocGenerator: React.FC<ToolComponentProps> = () => {
  const [signature, setSignature] = React.useState(SAMPLE_SIGNATURE);
  const [dialect, setDialect] = React.useState<Dialect>('jsdoc');
  const [includeDescription, setIncludeDescription] = React.useState(true);

  const [docBlock, setDocBlock] = React.useState(SAMPLE_DOCBLOCK);
  const [checkSignature, setCheckSignature] = React.useState(SAMPLE_SIGNATURE);

  const generation = React.useMemo<GenerationResult>(() => {
    try {
      const sig = parseFunctionSignature(signature);
      return {
        sig,
        block: generateJsdoc(sig, { dialect, includeDescription }),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [signature, dialect, includeDescription]);

  const analysis = React.useMemo<AnalysisResult>(() => {
    if (docBlock.trim() === '') {
      return null;
    }
    try {
      const doc = parseJsdoc(docBlock);
      if (checkSignature.trim() === '') {
        return { doc };
      }
      const sig = parseFunctionSignature(checkSignature);
      return { doc, report: compareDocWithSignature(doc, sig) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [docBlock, checkSignature]);

  const copy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success('已复制到剪贴板'))
      .catch(() => message.error('复制失败，请手动选择复制'));
  };

  const generatorTab = (
    <div>
      <p className={styles.hint}>
        粘贴函数签名（支持 function 声明、const 箭头函数、方法简写，以及泛型、async、可选参数、默认值与剩余参数），
        工具自动生成对齐的 JSDoc / TSDoc 注释块。
      </p>
      <div className={styles.stack}>
        <div>
          <div className={styles.fieldLabel}>函数签名</div>
          <TextArea
            rows={6}
            value={signature}
            onChange={(event) => setSignature(event.target.value)}
            spellCheck={false}
          />
        </div>
        <Space wrap size={24}>
          <div>
            <div className={styles.fieldLabel}>注释方言</div>
            <Radio.Group
              value={dialect}
              onChange={(event) => setDialect(event.target.value as Dialect)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: 'JSDoc（花括号内联类型）', value: 'jsdoc' },
                { label: 'TSDoc（@typeParam，无冗余类型）', value: 'tsdoc' },
              ]}
            />
          </div>
          <Checkbox
            checked={includeDescription}
            onChange={(event) => setIncludeDescription(event.target.checked)}
          >
            包含摘要描述占位行
          </Checkbox>
        </Space>
      </div>

      <Space style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => setSignature(SAMPLE_SIGNATURE)}>
          重置样例
        </Button>
        <Button size="small" onClick={() => setSignature('')}>
          清空
        </Button>
      </Space>

      {'error' in generation && generation.error ? (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          showIcon
          message="签名解析失败"
          description={generation.error}
        />
      ) : null}

      {'block' in generation && generation.block ? (
        <Card
          size="small"
          style={{ marginTop: 16 }}
          title={
            <Space>
              <Tag color="geekblue">{dialect === 'jsdoc' ? 'JSDoc' : 'TSDoc'}</Tag>
              <span>
                {generation.sig.name}（{generation.sig.params.length} 个参数
                {generation.sig.typeParams.length > 0
                  ? `、${generation.sig.typeParams.length} 个类型参数`
                  : ''}
                ）
              </span>
            </Space>
          }
          extra={<Button size="small" onClick={() => copy(generation.block)}>复制注释块</Button>}
        >
          <pre className={styles.codeOutput}>{generation.block}</pre>
        </Card>
      ) : null}
    </div>
  );

  const parserTab = (
    <div>
      <p className={styles.hint}>
        粘贴既有 JSDoc / TSDoc 注释块，工具提取摘要、@param、@returns、@throws 等标签；
        若同时提供函数签名，将报告缺失 / 多余参数、名称不匹配与返回值标签缺失。
      </p>
      <div className={styles.stack}>
        <div>
          <div className={styles.fieldLabel}>文档注释块</div>
          <TextArea
            rows={10}
            value={docBlock}
            onChange={(event) => setDocBlock(event.target.value)}
            spellCheck={false}
          />
        </div>
        <div>
          <div className={styles.fieldLabel}>函数签名（可选，用于一致性比对）</div>
          <TextArea
            rows={4}
            value={checkSignature}
            onChange={(event) => setCheckSignature(event.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <Space style={{ marginTop: 12 }}>
        <Button size="small" onClick={() => { setDocBlock(SAMPLE_DOCBLOCK); setCheckSignature(SAMPLE_SIGNATURE); }}>
          重置样例
        </Button>
        <Button size="small" onClick={() => { setDocBlock(''); setCheckSignature(''); }}>
          清空
        </Button>
      </Space>

      {analysis && 'error' in analysis ? (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          showIcon
          message="解析失败"
          description={analysis.error}
        />
      ) : null}

      {analysis && 'doc' in analysis
        ? (() => {
            const { doc, report } = analysis;
            return (
        <div className={styles.stack} style={{ marginTop: 16 }}>
          {doc.summary ? (
            <Card size="small" title="摘要">
              {doc.summary}
            </Card>
          ) : null}

          {report ? (
            report.warnings.length === 0 ? (
              <Alert type="success" showIcon message="注释块与函数签名完全一致" />
            ) : (
              <Alert
                type="warning"
                showIcon
                message={`发现 ${report.warnings.length} 项不一致`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {report.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                }
              />
            )
          ) : null}

          {doc.params.length > 0 ? (
            <Table
              size="small"
              pagination={false}
              rowKey="name"
              title={() => '@param 参数标签'}
              dataSource={doc.params}
              columns={[
                { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
                { title: '类型', dataIndex: 'type', key: 'type', width: 160, render: (value) => value ?? '—' },
                { title: '可选', dataIndex: 'optional', key: 'optional', width: 70, render: (value: boolean) => (value ? '是' : '否') },
                { title: '描述', dataIndex: 'description', key: 'description', render: (value) => value || '—' },
              ]}
            />
          ) : null}

          {doc.typeParams.length > 0 ? (
            <Table
              size="small"
              pagination={false}
              rowKey="name"
              title={() => '类型参数标签'}
              dataSource={doc.typeParams}
              columns={[
                { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
                { title: '描述', dataIndex: 'description', key: 'description', render: (value) => value || '—' },
              ]}
            />
          ) : null}

          {doc.returns ? (
            <Card size="small" title="@returns">
              <Space>
                {doc.returns.type ? <Tag>{doc.returns.type}</Tag> : null}
                <span>{doc.returns.description || '—'}</span>
              </Space>
            </Card>
          ) : null}

          {doc.throws.length > 0 ? (
            <Table
              size="small"
              pagination={false}
              rowKey={(record) => `${record.type ?? ''}-${record.description}`}
              title={() => '@throws 异常标签'}
              dataSource={doc.throws}
              columns={[
                { title: '类型', dataIndex: 'type', key: 'type', width: 160, render: (value) => value ?? '—' },
                { title: '描述', dataIndex: 'description', key: 'description', render: (value) => value || '—' },
              ]}
            />
          ) : null}

          {doc.otherTags.length > 0 ? (
            <Card size="small" title="其他标签">
              {doc.otherTags.map((tag) => (
                <div key={tag.tag} className={styles.signatureBox} style={{ marginBottom: 6 }}>
                  @{tag.tag} {tag.text}
                </div>
              ))}
            </Card>
          ) : null}
        </div>
            );
          })()
        : null}
    </div>
  );

  return (
    <div className={styles.container}>
      <Card title="JSDoc / TSDoc 文档注释块生成与解析器（函数签名 ↔ 标准注释块双向转换）">
        <Tabs
          items={[
            { key: 'generate', label: '签名 → 注释块', children: generatorTab },
            { key: 'parse', label: '注释块 → 解析校验', children: parserTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default JsdocTsdocGenerator;
