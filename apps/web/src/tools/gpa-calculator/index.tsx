'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Input, InputNumber, Select, Space, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ALGORITHM_META,
  ALL_ALGORITHMS,
  calculateGpa,
  type CourseInput,
  type GpaReport,
  type GradeInputType,
} from './utils/gpa';
import { GPA_TOOL_I18N as T } from './constants';
import styles from './index.module.css';

const { Title, Paragraph, Text } = Typography;

/** 表格中可编辑的课程行 */
interface CourseRow {
  key: string;
  name: string;
  credits: number | null;
  gradeType: GradeInputType;
  percent: number | null;
  letter: string;
}

let rowSeq = 0;

/** 生成行唯一 key */
function nextKey(): string {
  rowSeq += 1;
  return `course-${Date.now()}-${rowSeq}`;
}

/** 创建一行空白课程 */
function createRow(partial?: Partial<CourseRow>): CourseRow {
  return {
    key: nextKey(),
    name: '',
    credits: null,
    gradeType: 'percent',
    percent: null,
    letter: '',
    ...partial,
  };
}

/** 首次加载的示例成绩单 */
function createSampleRows(): CourseRow[] {
  return [
    createRow({ name: '高等数学', credits: 3, gradeType: 'percent', percent: 90 }),
    createRow({ name: '大学英语', credits: 2, gradeType: 'percent', percent: 80 }),
    createRow({ name: '专业导论', credits: 1, gradeType: 'letter', letter: 'A' }),
  ];
}

const LETTER_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'].map(
  (value) => ({ label: value, value }),
);

export default function GpaCalculator() {
  const [rows, setRows] = useState<CourseRow[]>(createSampleRows);
  const [report, setReport] = useState<GpaReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 把表格行转换为纯函数输入，过滤完全空白的行 */
  const buildCourses = (): CourseInput[] =>
    rows
      .filter((row) => row.credits !== null || row.percent !== null || row.letter.trim() !== '')
      .map((row) => ({
        name: row.name.trim() || undefined,
        credits: Number(row.credits),
        gradeType: row.gradeType,
        percent: row.gradeType === 'percent' ? Number(row.percent) : undefined,
        letter: row.gradeType === 'letter' ? row.letter : undefined,
      }));

  const handleCalculate = () => {
    try {
      const result = calculateGpa(buildCourses());
      setReport(result);
      setError(null);
    } catch (caught) {
      setReport(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const handleReset = () => {
    setRows(createSampleRows());
    setReport(null);
    setError(null);
  };

  const updateRow = (key: string, patch: Partial<CourseRow>) => {
    setRows((previous) =>
      previous.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (key: string) => {
    setRows((previous) => previous.filter((row) => row.key !== key));
  };

  const addRow = () => {
    setRows((previous) => [...previous, createRow()]);
  };

  const columns = useMemo(
    () => [
      {
        title: T.colName,
        dataIndex: 'name',
        key: 'name',
        width: 200,
        render: (_: unknown, record: CourseRow) => (
          <Input
            placeholder={T.namePlaceholder}
            value={record.name}
            onChange={(event) => updateRow(record.key, { name: event.target.value })}
          />
        ),
      },
      {
        title: T.colCredits,
        dataIndex: 'credits',
        key: 'credits',
        width: 130,
        render: (_: unknown, record: CourseRow) => (
          <InputNumber
            min={0}
            step={0.5}
            style={{ width: '100%' }}
            placeholder="学分"
            value={record.credits}
            onChange={(value) => updateRow(record.key, { credits: value })}
          />
        ),
      },
      {
        title: T.modeLabel,
        dataIndex: 'gradeType',
        key: 'gradeType',
        width: 150,
        render: (_: unknown, record: CourseRow) => (
          <Select
            style={{ width: '100%' }}
            value={record.gradeType}
            onChange={(value: GradeInputType) => updateRow(record.key, { gradeType: value })}
            options={[
              { label: T.modePercent, value: 'percent' },
              { label: T.modeLetter, value: 'letter' },
            ]}
          />
        ),
      },
      {
        title: T.colGrade,
        dataIndex: 'grade',
        key: 'grade',
        width: 180,
        render: (_: unknown, record: CourseRow) =>
          record.gradeType === 'percent' ? (
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder={T.percentPlaceholder}
              value={record.percent}
              onChange={(value) => updateRow(record.key, { percent: value })}
            />
          ) : (
            <Select
              showSearch
              allowClear
              style={{ width: '100%' }}
              placeholder={T.letterPlaceholder}
              value={record.letter || undefined}
              options={LETTER_OPTIONS}
              onChange={(value) => updateRow(record.key, { letter: value ?? '' })}
            />
          ),
      },
      {
        title: T.colAction,
        key: 'action',
        width: 90,
        render: (_: unknown, record: CourseRow) => (
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => removeRow(record.key)}
          >
            {T.removeRow}
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3} className={styles.title}>
          {T.title}
        </Title>
        <Paragraph className={styles.subtitle}>{T.subtitle}</Paragraph>
      </div>

      <div className={styles.panel}>
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          dataSource={rows}
          columns={columns}
          footer={() => (
            <Space wrap>
              <Button type="dashed" icon={<PlusOutlined />} onClick={addRow}>
                {T.addRow}
              </Button>
            </Space>
          )}
        />
        <Space className={styles.actions}>
          <Button type="primary" onClick={handleCalculate}>
            {T.calculate}
          </Button>
          <Button onClick={handleReset}>{T.reset}</Button>
        </Space>
        {error ? (
          <Alert type="error" showIcon message="无法计算" description={error} />
        ) : null}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {T.privacyNote}
        </Text>
      </div>

      {report ? (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.totalCredits}</span>
              <span className={styles.summaryValue}>
                {report.totalCredits}
                <span className={styles.summaryUnit}>学分</span>
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>{T.arithmeticAverage}</span>
              <span className={styles.summaryValue}>
                {report.arithmeticAverage}
                <span className={styles.summaryUnit}>分</span>
              </span>
            </div>
            {report.algorithms.map((item) => (
              <div className={styles.summaryCard} key={item.algorithm}>
                <span className={styles.summaryLabel}>{item.label} 加权 GPA</span>
                <span className={`${styles.summaryValue} ${styles.highlightGpa}`}>
                  {item.weightedGpa.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <Title level={5} style={{ margin: 0 }}>
              {T.compareTitle}
            </Title>
            <Table
              rowKey="algorithm"
              size="small"
              pagination={false}
              dataSource={ALL_ALGORITHMS.map((algorithm) => {
                const result = report.algorithms.find((item) => item.algorithm === algorithm);
                return {
                  algorithm,
                  label: ALGORITHM_META[algorithm].label,
                  description: ALGORITHM_META[algorithm].description,
                  weightedGpa: result?.weightedGpa ?? 0,
                };
              })}
              columns={[
                { title: T.colAlgorithm, dataIndex: 'label', key: 'label', width: 180 },
                {
                  title: T.colWeightedGpa,
                  dataIndex: 'weightedGpa',
                  key: 'weightedGpa',
                  width: 160,
                  render: (value: number) => <span className={styles.mono}>{value.toFixed(4)}</span>,
                },
                { title: T.colDescription, dataIndex: 'description', key: 'description' },
              ]}
            />
          </div>

          <div className={styles.panel}>
            <Title level={5} style={{ margin: 0 }}>
              {T.detailTitle}
            </Title>
            <Table
              rowKey="name"
              size="small"
              pagination={false}
              dataSource={report.algorithms[0]?.courses.map((course, index) => {
                const row: Record<string, string | number> = {
                  key: `${course.name}-${index}`,
                  name: course.name,
                  credits: course.credits,
                  rawGrade: course.rawGrade,
                };
                for (const algorithm of report.algorithms) {
                  const matched = algorithm.courses[index];
                  row[algorithm.algorithm] = matched ? matched.points : '—';
                }
                return row;
              })}
              columns={[
                { title: T.colName, dataIndex: 'name', key: 'name' },
                { title: T.colCredits, dataIndex: 'credits', key: 'credits', width: 90 },
                { title: T.colGrade, dataIndex: 'rawGrade', key: 'rawGrade', width: 120 },
                ...ALL_ALGORITHMS.map((algorithm) => ({
                  title: (
                    <span>
                      {ALGORITHM_META[algorithm].label}
                      <Tag color="blue" style={{ marginLeft: 6 }}>
                        绩点
                      </Tag>
                    </span>
                  ),
                  dataIndex: algorithm,
                  key: algorithm,
                  width: 150,
                  render: (value: string | number) => <span className={styles.mono}>{value}</span>,
                })),
              ]}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
