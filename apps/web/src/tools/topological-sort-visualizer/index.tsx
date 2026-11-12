'use client';

import React from 'react';
import type { ToolComponentProps } from '../loaders';
import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Statistic,
  Table,
  Tag,
} from 'antd';
import {
  DEFAULT_GRAPH_INPUT,
  GRAPH_PRESETS,
  INPUT_HINT,
} from './constants';
import { analyzeGraph, type TopoResult } from './utils/toposort';
import styles from './index.module.css';

/** 取错误信息字符串 */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 把节点序列渲染为 节点 → 节点 的拓扑链 */
function OrderChain({ order }: { order: string[] }) {
  if (order.length === 0) {
    return <span className={styles.hint}>（无可用序列）</span>;
  }
  return (
    <div className={styles.orderChain}>
      {order.map((node, index) => (
        <React.Fragment key={`${node}-${index}`}>
          {index > 0 ? <span className={styles.arrow}>→</span> : null}
          <Tag color="blue" className={styles.nodeTag}>
            {node}
          </Tag>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * 有向图拓扑排序与环检测可视化器：
 * 输入边列表文本，输出 Kahn 入度算法与 DFS 后序两种拓扑序、
 * 逐步记录、入度/邻接表只读视图与环路径。
 * 全部计算为主线程瞬时纯函数，无网络请求、无 Worker。
 *
 * @returns 拓扑排序交互界面
 */
const TopologicalSortVisualizer: React.FC<ToolComponentProps> = () => {
  const [raw, setRaw] = React.useState<string>(DEFAULT_GRAPH_INPUT);

  const outcome = React.useMemo<{ result?: TopoResult; error?: string }>(() => {
    try {
      return { result: analyzeGraph(raw) };
    } catch (error) {
      return { error: toMessage(error) };
    }
  }, [raw]);

  const result = outcome.result;

  const tableData = React.useMemo(() => {
    if (!result) {
      return [];
    }
    return result.nodes.map((node) => ({
      key: node,
      node,
      indegree: result.indegree[node] ?? 0,
      successors: (result.adjacency[node] ?? []).join(', ') || '—',
    }));
  }, [result]);

  return (
    <div className={styles.container}>
      <Card title="图输入（边列表）">
        <div className={styles.formColumn}>
          <span className={styles.label}>每行一条有向边或一个孤立节点</span>
          <Input.TextArea
            className={styles.textArea}
            rows={9}
            spellCheck={false}
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />
          <p className={styles.hint}>{INPUT_HINT}</p>
        </div>
        <div className={styles.presetRow}>
          {GRAPH_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="small"
              onClick={() => setRaw(preset.input)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </Card>

      {outcome.error ? (
        <Alert
          type="error"
          showIcon
          message="图解析失败"
          description={outcome.error}
        />
      ) : null}

      {result ? (
        <>
          <Card>
            <div className={styles.statGrid}>
              <Statistic title="节点数" value={result.nodes.length} />
              <Statistic title="边数（去重后）" value={result.edgeCount} />
              <Statistic
                title="结构结论"
                valueRender={() =>
                  result.status === 'acyclic' ? (
                    <Tag color="success">有向无环图 DAG</Tag>
                  ) : (
                    <Tag color="error">存在环</Tag>
                  )
                }
              />
            </div>

            {result.duplicateEdges.length > 0 ? (
              <Alert
                style={{ marginTop: 8 }}
                type="warning"
                showIcon
                message={`检测到 ${result.duplicateEdges.length} 条重复边，已自动去重，不影响排序结果`}
              />
            ) : null}

            {result.status === 'cyclic' && result.cycle ? (
              <Alert
                style={{ marginTop: 8 }}
                type="error"
                showIcon
                message="环检测结果"
                description={
                  <div>
                    <span>
                      闭合环边：
                      <code className={styles.mono}>
                        {result.cycle.closingEdge.from} →{' '}
                        {result.cycle.closingEdge.to}
                      </code>
                    </span>
                    <div className={styles.cyclePath}>
                      {result.cycle.path.map((node, index) => (
                        <React.Fragment key={`${node}-cycle-${index}`}>
                          {index > 0 ? (
                            <span className={styles.arrow}>→</span>
                          ) : null}
                          <Tag color="error" className={styles.nodeTag}>
                            {node}
                          </Tag>
                        </React.Fragment>
                      ))}
                      <span className={styles.arrow}>→</span>
                      <Tag color="error" className={styles.nodeTag}>
                        {result.cycle.path[0]}
                      </Tag>
                    </div>
                    <p className={styles.hint} style={{ marginTop: 8 }}>
                      Kahn 结果仅包含环外节点；DFS 拓扑序在有环时不可用。
                    </p>
                  </div>
                }
              />
            ) : null}
          </Card>

          <Card title="Kahn 入度算法结果">
            <OrderChain order={result.kahnOrder} />
            <p className={styles.hint} style={{ marginTop: 8 }}>
              每步选取一个当前入度为 0 的节点出队，并松弛其全部出边；零入度节点按首次出现顺序 FIFO
              处理，同层节点彼此无先后约束。
            </p>
          </Card>

          <Card title="DFS 后序逆序结果">
            <OrderChain order={result.dfsOrder} />
            <p className={styles.hint} style={{ marginTop: 8 }}>
              深度优先遍历完成节点（着黑色）的逆后序即为合法拓扑序；与 Kahn
              结果不同但同样满足全部偏序约束。
            </p>
          </Card>

          <Card title="入度表与邻接表（只读）">
            <div className={styles.tableWrap}>
              <Table
                size="small"
                pagination={false}
                dataSource={tableData}
                columns={[
                  { title: '节点', dataIndex: 'node', key: 'node' },
                  {
                    title: '初始入度',
                    dataIndex: 'indegree',
                    key: 'indegree',
                  },
                  {
                    title: '后继节点（邻接表）',
                    dataIndex: 'successors',
                    key: 'successors',
                    render: (value: string) => (
                      <span className={styles.mono}>{value}</span>
                    ),
                  },
                ]}
              />
            </div>
            <Space style={{ marginTop: 8 }} wrap>
              <span className={styles.hint}>
                DFS 着色事件 {result.dfsSteps.length} 步 · Kahn 出队{' '}
                {result.kahnSteps.length} 步
              </span>
            </Space>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default TopologicalSortVisualizer;
