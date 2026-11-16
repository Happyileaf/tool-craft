'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, message } from 'antd';
import {
  parseFen,
  renderUnicodeBoard,
  renderAsciiBoard,
  type ParsedFen,
  type Color,
} from './utils/fen';
import {
  VIEW_OPTIONS,
  RENDER_OPTIONS,
  SAMPLE_FENS,
  DEFAULT_FEN,
  type ViewPerspective,
  type BoardRenderMode,
} from './constants';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

type ParseOutcome =
  | { kind: 'ok'; data: ParsedFen }
  | { kind: 'error'; errorMessage: string };

const WARNING_TAG_COLOR: Record<string, string> = {
  NO_WHITE_KING: 'red',
  NO_BLACK_KING: 'red',
  MULTI_WHITE_KING: 'red',
  MULTI_BLACK_KING: 'red',
  PAWN_ON_RANK_1: 'orange',
  PAWN_ON_RANK_8: 'orange',
  EP_SIDE_MISMATCH: 'orange',
  EP_SQUARE_OCCUPIED: 'orange',
  EP_NO_PAWN: 'orange',
};

const FenParser: React.FC<ToolComponentProps> = () => {
  const [fenInput, setFenInput] = React.useState<string>(DEFAULT_FEN);
  const [view, setView] = React.useState<ViewPerspective>('w');
  const [renderMode, setRenderMode] = React.useState<BoardRenderMode>('unicode');

  const outcome = React.useMemo<ParseOutcome>(() => {
    if (fenInput.trim() === '') return { kind: 'error', errorMessage: 'FEN 输入为空' };
    try {
      return { kind: 'ok', data: parseFen(fenInput) };
    } catch (error) {
      return { kind: 'error', errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }, [fenInput]);

  const boardLines = React.useMemo(() => {
    if (outcome.kind !== 'ok') return [];
    const perspective: Color = view;
    return renderMode === 'unicode'
      ? renderUnicodeBoard(outcome.data.board, perspective)
      : renderAsciiBoard(outcome.data.board, perspective);
  }, [outcome, view, renderMode]);

  const asciiLines = React.useMemo(() => {
    if (outcome.kind !== 'ok') return [];
    return renderAsciiBoard(outcome.data.board, view);
  }, [outcome, view]);

  const handleCopyFen = () => {
    if (outcome.kind !== 'ok') {
      message.warning('当前 FEN 存在结构错误，无可复制的规范化结果');
      return;
    }
    copyToClipboard(outcome.data.normalizedFen);
    message.success('规范化 FEN 已复制');
  };

  const handleCopyBoard = () => {
    if (asciiLines.length === 0) {
      message.warning('当前 FEN 存在结构错误，无可复制的棋盘');
      return;
    }
    copyToClipboard(asciiLines.join('\n'));
    message.success('ASCII 棋盘已复制');
  };

  const detailRows =
    outcome.kind === 'ok'
      ? [
          { key: 'side', label: '走子方', value: outcome.data.sideToMove === 'w' ? '白方（w）' : '黑方（b）' },
          { key: 'castling', label: '易位权利', value: outcome.data.castling },
          { key: 'ep', label: '吃过路兵目标格', value: outcome.data.enPassant },
          { key: 'half', label: '半回合计数', value: String(outcome.data.halfmove) },
          { key: 'full', label: '回合数', value: String(outcome.data.fullmove) },
          { key: 'count', label: '棋子总数', value: String(outcome.data.pieceCount) },
        ]
      : [];

  return (
    <div className={styles.container}>
      <Card
        title="国际象棋 FEN 局面解析与棋盘可视化器（结构校验 / Unicode 棋盘 / 标准序列化）"
        extra={
          <Space>
            <Button size="small" onClick={handleCopyFen}>
              复制规范化 FEN
            </Button>
            <Button size="small" onClick={handleCopyBoard}>
              复制 ASCII 棋盘
            </Button>
          </Space>
        }
      >
        <p className={styles.hint}>
          输入 FEN 字符串（布局 / 走子方 / 易位权利 / 吃过路兵目标格 / 半回合 / 回合数，后两个字段可省略），工具在浏览器本地完成结构校验、合法性警告、规范化序列化与 8×8
          棋盘渲染。结构错误阻断渲染，合法性警告不阻断。
        </p>

        <Space wrap style={{ marginBottom: 8 }}>
          {SAMPLE_FENS.map((sample) => (
            <Button key={sample.label} size="small" onClick={() => setFenInput(sample.fen)}>
              {sample.label}
            </Button>
          ))}
        </Space>

        <Input.TextArea
          value={fenInput}
          onChange={(event) => setFenInput(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
          spellCheck={false}
          className={styles.mono}
        />

        <Space wrap size="middle" style={{ marginTop: 12 }}>
          <Radio.Group
            optionType="button"
            value={view}
            options={VIEW_OPTIONS}
            onChange={(event) => setView(event.target.value as ViewPerspective)}
          />
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={renderMode}
            options={RENDER_OPTIONS}
            onChange={(event) => setRenderMode(event.target.value as BoardRenderMode)}
          />
        </Space>

        {outcome.kind === 'error' ? (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 16 }}
            message="FEN 结构错误（阻断渲染）"
            description={outcome.errorMessage}
          />
        ) : (
          <>
            {outcome.data.countsDefaulted ? (
              <Alert
                type="info"
                showIcon
                style={{ marginTop: 16 }}
                message="输入仅含 4 个字段，已按规范补全半回合计数 0、回合数 1"
              />
            ) : null}

            {outcome.data.warnings.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                message={`合法性警告 ${outcome.data.warnings.length} 条（不阻断渲染）`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {outcome.data.warnings.map((warning) => (
                      <li key={warning.code} style={{ marginBottom: 4 }}>
                        <Tag color={WARNING_TAG_COLOR[warning.code] ?? 'gold'}>{warning.code}</Tag>
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                }
              />
            ) : (
              <Alert
                type="success"
                showIcon
                style={{ marginTop: 16 }}
                message="结构校验通过，无合法性警告"
              />
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div className={styles.board}>{boardLines.join('\n')}</div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div className={styles.detailGrid}>
                  {detailRows.map((row) => (
                    <div key={row.key} className={styles.detailItem}>
                      <div className={styles.detailLabel}>{row.label}</div>
                      <div className={styles.detailValue}>{row.value}</div>
                    </div>
                  ))}
                </div>
                <Card size="small" style={{ marginTop: 12 }} title="规范化 FEN（易位按 KQkq 排序）">
                  <code className={styles.mono}>{outcome.data.normalizedFen}</code>
                </Card>
              </div>
            </div>

            <Card size="small" style={{ marginTop: 16 }} title="字段明细">
              <Table
                size="small"
                pagination={false}
                columns={[
                  { title: '字段', dataIndex: 'label', key: 'label', width: 180 },
                  { title: '值', dataIndex: 'value', key: 'value' },
                ]}
                dataSource={detailRows}
              />
            </Card>
          </>
        )}

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 16 }}
          message="本工具只做 FEN 结构与静态合法性校验，不推断走子合法性（将军 / 将杀、易位通路是否被阻挡、兵链规则等）。Unicode 棋盘在非等宽字体下可能错位，可切换 ASCII 棋盘作为稳定回退。"
        />
      </Card>
    </div>
  );
};

export default FenParser;
