/**
 * HTTP/2 帧解析器的静态表格数据
 */

/** 帧类型速查表（RFC 7540 §11） */
export const FRAME_TYPE_REFERENCE: ReadonlyArray<{ code: string; name: string; note: string }> = [
  { code: '0x0', name: 'DATA', note: '请求 / 响应的应用数据载荷' },
  { code: '0x1', name: 'HEADERS', note: 'HPACK 压缩的首部块（本工具不解压）' },
  { code: '0x2', name: 'PRIORITY', note: '流优先级与依赖' },
  { code: '0x3', name: 'RST_STREAM', note: '异常终止单条流，携带 4 字节错误码' },
  { code: '0x4', name: 'SETTINGS', note: '连接级参数协商，ACK 标志置位时载荷为空' },
  { code: '0x5', name: 'PUSH_PROMISE', note: '服务器推送的预留流' },
  { code: '0x6', name: 'PING', note: '连接活性测量，载荷固定 8 字节' },
  { code: '0x7', name: 'GOAWAY', note: '优雅关闭连接，含最后流标识与错误码' },
  { code: '0x8', name: 'WINDOW_UPDATE', note: '流量控制窗口增量，载荷固定 4 字节' },
  { code: '0x9', name: 'CONTINUATION', note: 'HEADERS 首部块的续帧' },
];
