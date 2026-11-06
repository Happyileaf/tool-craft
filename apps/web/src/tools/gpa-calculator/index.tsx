'use client';

import React from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ToolComponentProps } from '../loaders';
import {
  AVERAGE_PRECISION,
  GPA_PRECISION,
  LETTER_OPTIONS,
  SAMPLE_COURSES,
} from './constants';
import {
  GpaError,
  SCALE_META,
  SCALE_ORDER,
  calculateTranscript,
  type CourseInput,
  type GpaScaleId,
} from './utils/gpa';
import { copyToClipboard } from '@/lib/utils';
import styles from './index.module.css';

/**
 * 表格行：成绩同时保留数字与等级两种编辑态，由 Select 切换。
 */
interface CourseRow extends CourseInput {
  key: string;
}

/**
 * GPA 平均绩点计算器：可增删课程行，按四套换算口径输出学分加权 GPA、
 * 算术平均分与总学分，全部计算在浏览器本地完成。
 *
 * @param props - 工具组件属性
 * @returns GPA 计算交互界面
 */
const GpaCalculator: React.FC<ToolComponentProps> = () => {
  const [rows, setRows] = React.useState<CourseRow[]>(() =>
    SAMPLE_COURSES.map((course, index) => ({ ...course, key: `row-${index}` })),
  );
  const rowSeq = React.useRef(SAMPLE_COURSES.length);

  /**
   * 更新指定行的字段。
   */
  const updateRow = (key: string, patch: Partial<CourseRow>) => {
    setRows((previous) =>
      previous.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  /**
   * 添加空白课程行。
   */
  const addRow = () => {
    rowSeq.current += 1;
    setRows((previous) => [
      ...previous,
      { key: `row-${rowSeq.current}`, name: '', grade: 80, credits: 1 },
    ]);
  };

  /**
   * 删除指定行。
   */
  const removeRow = (key: string) => {
    setRows((previous) => previous.filter((row) => row.key !== key));
  };

  /**
   * 一键载入示例成绩单。
   */
  const loadSample = () => {
    rowSeq.current = SAMPLE_COURSES.length;
    setRows(SAMPLE_COURSES.map((course, index) => ({ ...course, key: `row-${index}` })));
  };

  const computation = React.useMemo(() => {
    try {
      const { rows: details, summary } = calculateTranscript(rows);
      return { ok: true as const, details, summary };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof GpaError ? error.message : '计算失败，请检查输入',
      };
    }
  }, [rows]);

  /**
   * 复制四口径汇总文本。
   */
  const handleCopy = async () => {
    if (!computation.ok) {
      return;
    }
    const lines = SCALE_ORDER.map((scaleId) => {
      const meta = SCALE_META[scaleId];
      const gpa = computation.summary.scales[scaleId].weightedGpa.toFixed(GPA_PRECISION);
      return `${meta.name}：${gpa} / ${meta.maxPoint}`;
    });
    lines.push(`算术平均分：${computation.summary.arithmeticAverage.toFixed(AVERAGE_PRECISION)}`);
    lines.push(`总学分：${computation.summary.totalCredits}`);
    await copyToClipboard(lines.join('\n'));
    message.success('汇总已复制');
  };

  const columns = [
    {
      title: '课程名（可选）',
      dataIndex: 'name',
      render: (_: unknown, record: CourseRow) => (
        <Input
          value={record.name ?? ''}
          placeholder="如：高等数学"
          onChange={(event) => updateRow(record.key, { name: event.target.value })}
        />
      ),
    },
    {
      title: '成绩（百分制或等级）',
      dataIndex: 'grade',
      width: 260,
      render: (_: unknown, record: CourseRow) => (
        <Space size={8}>
          <InputNumber
            className={styles.gradeInput}
            min={0}
            max={100}
            precision={undefined}
            value={typeof record.grade === 'number' ? record.grade : null}
            placeholder="0–100"
            onChange={(value) => {
              if (value !== null) {
                updateRow(record.key, { grade: value });
              }
            }}
          />
          <Select
            className={styles.gradeInput}
            allowClear
            placeholder="等级"
            value={typeof record.grade === 'string' ? record.grade : undefined}
            options={LETTER_OPTIONS.map((letter) => ({ label: letter, value: letter }))}
            onChange={(value) => {
              updateRow(record.key, { grade: value ?? 80 });
            }}
          />
        </Space>
      ),
    },
    {
      title: '学分',
      dataIndex: 'credits',
      width: 130,
      render: (_: unknown, record: CourseRow) => (
        <InputNumber
          className={styles.creditsInput}
          min={0}
          step={0.5}
          value={record.credits}
          onChange={(value) => updateRow(record.key, { credits: value ?? 0 })}
        />
      ),
    },
    {
      title: '标准 4.0 绩点',
      width: 120,
      render: (_: unknown, __: CourseRow, index: number) =>
        computation.ok ? computation.details[index]!.points['standard-4.0'].toFixed(2) : '—',
    },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: CourseRow) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => removeRow(record.key)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card} title="GPA 平均绩点计算器（4.0 / 4.3 / WES / 百分制四口径 · 学分加权）">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.toolbar}>
            <Button type="primary" icon={<PlusOutlined />} onClick={addRow}>
              添加课程
            </Button>
            <Button onClick={loadSample}>载入示例成绩单</Button>
            <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!computation.ok}>
              复制汇总
            </Button>
          </div>

          <Table
            rowKey="key"
            size="small"
            pagination={false}
            dataSource={rows}
            columns={columns}
          />

          {!computation.ok ? (
            <Alert type="error" showIcon message={computation.message} />
          ) : (
            <>
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="课程数">
                  {computation.summary.courseCount}
                </Descriptions.Item>
                <Descriptions.Item label="总学分">
                  {computation.summary.totalCredits}
                </Descriptions.Item>
                <Descriptions.Item label="算术平均分（百分制）">
                  {computation.summary.arithmeticAverage.toFixed(AVERAGE_PRECISION)}
                </Descriptions.Item>
              </Descriptions>

              <div className={styles.scaleGrid}>
                {SCALE_ORDER.map((scaleId: GpaScaleId) => {
                  const meta = SCALE_META[scaleId];
                  const scale = computation.summary.scales[scaleId];
                  return (
                    <div key={scaleId} className={styles.scaleCard}>
                      <div className={styles.scaleName}>{meta.name}</div>
                      <div className={styles.scaleValue}>
                        {scale.weightedGpa.toFixed(GPA_PRECISION)}
                      </div>
                      <div className={styles.scaleMax}>
                        满分 {meta.maxPoint}
                        {scaleId === 'modified-4.3' && <Tag color="blue" style={{ marginLeft: 8 }}>A+ = 4.3</Tag>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className={styles.hint}>
            加权 GPA = Σ（单课绩点 × 学分）/ Σ 学分；等级成绩先映射为所在百分制段中位分（如 A- → 89），
            再参与 WES 与中国百分制口径换算，链路可在单课绩点列核对。不及格（&lt;60 或 F）按各表 0 绩点处理，学分仍计入分母。
            学分为 0 / 负数、成绩超出 0–100 或等级无法识别时会逐条报错。四套对照表为静态通用规则，
            具体院校可能有自定义口径。所有数据仅保存在当前页面，刷新即清空。
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default GpaCalculator;
