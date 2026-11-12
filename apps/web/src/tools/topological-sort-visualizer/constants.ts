/**
 * 拓扑排序可视化器的静态配置与示例数据
 */
import { MAX_NODES } from './utils/toposort';

/** 文本域默认示例：经典课程依赖 DAG */
export const DEFAULT_GRAPH_INPUT = `A -> B
A -> C
B -> D
C -> D
B -> E
D -> E`;

/** 示例预设 */
export const GRAPH_PRESETS: { label: string; input: string }[] = [
  {
    label: '课程依赖 DAG',
    input: DEFAULT_GRAPH_INPUT,
  },
  {
    label: '含环图',
    input: 'A -> B\nB -> C\nC -> A\nC -> D',
  },
  {
    label: '自环与孤立节点',
    input: 'X -> X\nA -> B\nLONE',
  },
  {
    label: '重复边',
    input: 'A -> B\nA -> B\nB -> C\nA -> C',
  },
];

/** 输入区说明文案 */
export const INPUT_HINT = `每行一条有向边，支持 A -> B、A → B、A => B、A,B 四种写法；
单独一行写节点名表示孤立节点；空行忽略；节点上限 ${MAX_NODES} 个。`;
