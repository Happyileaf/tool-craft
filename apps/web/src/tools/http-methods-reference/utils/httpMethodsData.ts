/**
 * HTTP 标准请求方法静态数据（依据 RFC 9110 / RFC 9111 / RFC 5789）。
 * 全部为构建时常量，不发起任何网络请求。
 */

/** 请求体支持度：yes 有明确语义、no 禁止/无意义、undefined 协议未定义语义 */
export type BodySupport = 'yes' | 'no' | 'undefined';

/** 单个 HTTP 方法条目 */
export interface HttpMethodEntry {
  /** 方法名（大写） */
  method: string;
  /** 中文名 */
  name: string;
  /** 英文名 */
  nameEn: string;
  /** 语义说明 */
  semantics: string;
  /** Safe：只读，不应改变服务端状态 */
  safe: boolean;
  /** Idempotent：多次相同请求与单次请求效果相同 */
  idempotent: boolean;
  /** 响应是否可缓存 */
  cacheable: boolean;
  /** 请求体支持度 */
  body: BodySupport;
  /** RFC 来源 */
  rfc: string;
  /** 典型场景 */
  useCases: string[];
  /** 请求示例（纯文本，不实际发送） */
  requestExample: string;
  /** 响应示例（纯文本） */
  responseExample: string;
  /** 常见搭配状态码 */
  commonStatuses: number[];
  /** 常见误用 / 注意事项 */
  pitfalls: string[];
  /** 搜索关键字 */
  keywords: string[];
}

/** 专题对比条目 */
export interface MethodComparison {
  id: string;
  title: string;
  titleEn: string;
  summary: string;
  sideA: { label: string; points: string[]; example: string };
  sideB: { label: string; points: string[]; example: string };
  keywords: string[];
}

/** 9 个 HTTP/1.1 标准方法（含 PATCH） */
export const HTTP_METHODS: HttpMethodEntry[] = [
  {
    method: 'GET',
    name: '获取资源',
    nameEn: 'Resource Retrieval',
    semantics: '请求目标资源的当前表示，是最常用的只读方法；带条件或范围头时可演化为条件请求 / 部分请求。',
    safe: true,
    idempotent: true,
    cacheable: true,
    body: 'undefined',
    rfc: 'RFC 9110 §9.3.1',
    useCases: ['读取网页、图片、API 资源', '带查询参数的检索与过滤', '条件请求（If-None-Match）与范围请求'],
    requestExample: 'GET /users/123 HTTP/1.1\nHost: api.example.com\nAccept: application/json',
    responseExample: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":123,"name":"Ada"}',
    commonStatuses: [200, 304, 404, 406],
    pitfalls: ['不要用 GET 执行写操作（如 /delete?id=1），违反 safe 语义且可能被预取/爬虫触发', 'GET 的 payload 没有通用语义，参数应放在查询串'],
    keywords: ['读取', '查询', '安全', '幂等', '缓存', 'safe', 'idempotent'],
  },
  {
    method: 'HEAD',
    name: '获取响应头',
    nameEn: 'Header-Only Retrieval',
    semantics: '与 GET 语义相同，但服务器只返回响应头与状态行，不返回消息体；用于检查元数据而不传输实体。',
    safe: true,
    idempotent: true,
    cacheable: true,
    body: 'no',
    rfc: 'RFC 9110 §9.3.2',
    useCases: ['检查资源是否存在或是否被修改', '下载前探测 Content-Length / Content-Type', '缓存有效性校验'],
    requestExample: 'HEAD /reports/2026.pdf HTTP/1.1\nHost: api.example.com',
    responseExample: 'HTTP/1.1 200 OK\nContent-Type: application/pdf\nContent-Length: 2481932',
    commonStatuses: [200, 304, 404],
    pitfalls: ['响应不得携带消息体；若 HEAD 经过不支持的代理，需防止其错误地返回实体', '与 GET 一样可能被缓存，缓存键与 GET 共享'],
    keywords: ['头', '元数据', '探测', '安全', '幂等', '缓存', 'safe', 'idempotent'],
  },
  {
    method: 'POST',
    name: '提交处理',
    nameEn: 'Resource Processing / Create',
    semantics: '请求服务器将请求体中的表示作为目标资源的下属处理：创建子资源、提交表单、触发任意业务动作，语义由资源自身定义。',
    safe: false,
    idempotent: false,
    cacheable: true,
    body: 'yes',
    rfc: 'RFC 9110 §9.3.3',
    useCases: ['创建新资源（服务端分配 URI）', '提交表单、上传文件', '执行非 CRUD 的业务动作（支付、下单）'],
    requestExample: 'POST /users HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\n\n{"name":"Ada"}',
    responseExample: 'HTTP/1.1 201 Created\nLocation: /users/124\n\n{"id":124,"name":"Ada"}',
    commonStatuses: [200, 201, 202, 204, 400, 409, 422],
    pitfalls: ['重复提交可能创建多份资源，需要幂等键（Idempotency-Key）防重', 'POST 响应默认不可缓存，只有显式 Cache-Control/Expires 时才可缓存'],
    keywords: ['创建', '提交', '新增', '非幂等', '不安全', 'not idempotent'],
  },
  {
    method: 'PUT',
    name: '整体替换资源',
    nameEn: 'Full Resource Replacement',
    semantics: '用请求体中的表示整体替换目标 URI 的当前资源；若 URI 不存在且客户端有权决定 URI，可创建资源。',
    safe: false,
    idempotent: true,
    cacheable: false,
    body: 'yes',
    rfc: 'RFC 9110 §9.3.4',
    useCases: ['客户端指定 URI 的资源创建', '用完整新表示替换资源（全量更新）', '配置项覆盖式写入'],
    requestExample: 'PUT /users/124 HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\n\n{"id":124,"name":"Ada L."}',
    responseExample: 'HTTP/1.1 204 No Content',
    commonStatuses: [200, 201, 204, 400, 409, 422],
    pitfalls: ['PUT 是整体替换：省略的字段应被清空而非保留，部分更新请用 PATCH', '多次相同 PUT 结果一致（幂等），但 PUT 创建时需客户端掌握 URI'],
    keywords: ['替换', '更新', '全量', '幂等', 'idempotent', '不安全'],
  },
  {
    method: 'DELETE',
    name: '删除资源',
    nameEn: 'Resource Deletion',
    semantics: '请求服务器删除目标 URI 与资源之间的关联；后续对该 URI 的访问通常返回 404/410。',
    safe: false,
    idempotent: true,
    cacheable: false,
    body: 'undefined',
    rfc: 'RFC 9110 §9.3.5',
    useCases: ['删除指定资源', '取消订阅、移除关联关系', '软删除场景下标记资源失效'],
    requestExample: 'DELETE /users/124 HTTP/1.1\nHost: api.example.com',
    responseExample: 'HTTP/1.1 204 No Content',
    commonStatuses: [200, 202, 204, 404, 409],
    pitfalls: ['重复 DELETE 结果应一致：第二次返回 404 仍符合幂等定义', '删除是危险操作，应配合鉴权、确认机制与审计日志'],
    keywords: ['删除', '移除', '幂等', 'idempotent', '不安全'],
  },
  {
    method: 'CONNECT',
    name: '建立隧道',
    nameEn: 'Tunnel Establishment',
    semantics: '请求与目标服务器建立隧道（通常是 TLS over TCP），代理在建立后只做字节透传，是 HTTPS 正向代理的基础。',
    safe: false,
    idempotent: false,
    cacheable: false,
    body: 'undefined',
    rfc: 'RFC 9110 §9.3.6',
    useCases: ['正向代理上的 HTTPS 隧道（CONNECT host:443）', 'WebSocket 等需要 TCP 透传的场景'],
    requestExample: 'CONNECT api.example.com:443 HTTP/1.1\nHost: api.example.com:443',
    responseExample: 'HTTP/1.1 200 Connection Established',
    commonStatuses: [200, 405, 407, 502],
    pitfalls: ['开放 CONNECT 的代理可能被利用为流量转发跳板，需严格限制目标端口与鉴权', '普通应用服务器一般不实现该方法，多由代理处理'],
    keywords: ['隧道', '代理', 'tunnel', 'proxy', '非幂等'],
  },
  {
    method: 'OPTIONS',
    name: '查询通信选项',
    nameEn: 'Communication Options Query',
    semantics: '请求目标资源或服务器支持的通信选项；响应头 Allow 列出允许的方法，也是 CORS 预检请求使用的方法。',
    safe: true,
    idempotent: true,
    cacheable: false,
    body: 'undefined',
    rfc: 'RFC 9110 §9.3.7',
    useCases: ['CORS 预检（带 Access-Control-Request-* 头）', '查询资源允许的方法集合（Allow 头）', '探测服务器能力'],
    requestExample: 'OPTIONS /users HTTP/1.1\nHost: api.example.com\nOrigin: https://web.example.com\nAccess-Control-Request-Method: POST',
    responseExample: 'HTTP/1.1 204 No Content\nAllow: GET, POST, OPTIONS\nAccess-Control-Allow-Origin: https://web.example.com',
    commonStatuses: [200, 204],
    pitfalls: ['预检请求不应携带业务凭据之外的实体，也不应触发副作用', '复杂请求每次跨域可能触发预检，注意其性能开销与缓存（Access-Control-Max-Age）'],
    keywords: ['预检', 'cors', '跨域', 'allow', '安全', '幂等', 'safe', 'idempotent'],
  },
  {
    method: 'TRACE',
    name: '回环诊断',
    nameEn: 'Loop-Back Diagnostic',
    semantics: '请求服务器将收到的请求消息原样回显，用于诊断代理链对请求的改写；成功响应的 Content-Type 为 message/http。',
    safe: true,
    idempotent: true,
    cacheable: false,
    body: 'no',
    rfc: 'RFC 9110 §9.3.8',
    useCases: ['诊断反向代理 / 网关是否改写或追加请求头', '网络链路排障'],
    requestExample: 'TRACE /debug HTTP/1.1\nHost: api.example.com',
    responseExample: 'HTTP/1.1 200 OK\nContent-Type: message/http\n\nTRACE /debug HTTP/1.1\r\nHost: api.example.com',
    commonStatuses: [200, 405],
    pitfalls: ['可能泄露内部头（如 Cookie、鉴权头），生产环境通常禁用并返回 405', 'TRACE 请求不得携带消息体'],
    keywords: ['回显', '诊断', 'trace', '安全', '幂等', 'safe', 'idempotent'],
  },
  {
    method: 'PATCH',
    name: '部分更新',
    nameEn: 'Partial Modification',
    semantics: '请求对目标资源执行一组由媒体类型描述的修改（如 JSON Patch / Merge Patch），而非整体替换；是否幂等取决于补丁媒体类型。',
    safe: false,
    idempotent: false,
    cacheable: false,
    body: 'yes',
    rfc: 'RFC 5789 §2',
    useCases: ['只更新资源的部分字段', 'JSON Patch（RFC 6902）/ Merge Patch（RFC 7386）', '原子化的字段级修改'],
    requestExample: 'PATCH /users/124 HTTP/1.1\nHost: api.example.com\nContent-Type: application/merge-patch+json\n\n{"name":"Ada Lovelace"}',
    responseExample: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":124,"name":"Ada Lovelace"}',
    commonStatuses: [200, 204, 400, 409, 415, 422],
    pitfalls: ['PATCH 本身不保证幂等：例如 {"op":"add","path":"/tags/-"} 每次追加都会变化', '缺少对补丁媒体类型的支持时应返回 415，不要把 PATCH 当成部分字段的 PUT'],
    keywords: ['补丁', '部分更新', 'patch', '非幂等', 'json patch'],
  },
];

/** 专题对比 */
export const METHOD_COMPARISONS: MethodComparison[] = [
  {
    id: 'put-vs-patch',
    title: 'PUT vs PATCH：整体替换与部分更新',
    titleEn: 'PUT vs PATCH',
    summary: 'PUT 用完整表示整体替换资源（天然幂等）；PATCH 提交修改指令，只描述差异，幂等性取决于媒体类型。',
    sideA: {
      label: 'PUT（整体替换）',
      points: ['请求体是资源的完整新表示', '省略字段意味着删除/置空', '同一请求重复执行结果相同，天然幂等'],
      example: 'PUT /users/1 HTTP/1.1\nContent-Type: application/json\n\n{"id":1,"name":"Ada","role":"admin"}',
    },
    sideB: {
      label: 'PATCH（部分更新）',
      points: ['请求体是修改指令或差异片段', '未提及的字段保持不变', '可能非幂等（如数组追加操作）'],
      example: 'PATCH /users/1 HTTP/1.1\nContent-Type: application/merge-patch+json\n\n{"role":"admin"}',
    },
    keywords: ['对比', '幂等', '更新', '替换', '补丁', 'comparison'],
  },
  {
    id: 'post-vs-put',
    title: 'POST vs PUT：谁来决定资源 URI',
    titleEn: 'POST vs PUT',
    summary: 'POST 在“集合资源”下创建并由服务端分配 URI（非幂等）；PUT 面向客户端已知的具体 URI，可创建也可整体替换（幂等）。',
    sideA: {
      label: 'POST（服务端分配 URI）',
      points: ['POST /users 创建子资源', '响应 201 并在 Location 给出新 URI', '重复提交通常创建多份资源，非幂等'],
      example: 'POST /users\n\n{"name":"Ada"}  → 201 Location: /users/124',
    },
    sideB: {
      label: 'PUT（客户端指定 URI）',
      points: ['PUT /users/124 直接定位目标', '不存在则创建、存在则整体替换', '重复执行结果一致，幂等'],
      example: 'PUT /users/124\n\n{"name":"Ada"}  → 201 / 204',
    },
    keywords: ['对比', '创建', '幂等', 'uri', 'comparison'],
  },
  {
    id: 'options-cors',
    title: 'OPTIONS 与 CORS 预检',
    titleEn: 'OPTIONS and CORS Preflight',
    summary: '浏览器对“非简单请求”（自定义头、PUT/DELETE/PATCH 等）先自动发送 OPTIONS 预检，获得许可后才发真实请求。',
    sideA: {
      label: '预检请求（浏览器自动发起）',
      points: ['方法固定为 OPTIONS，无业务消息体', '携带 Origin 与 Access-Control-Request-Method/Headers', '可用 Access-Control-Max-Age 缓存预检结果'],
      example: 'OPTIONS /users HTTP/1.1\nOrigin: https://web.example.com\nAccess-Control-Request-Method: PUT\nAccess-Control-Request-Headers: Content-Type',
    },
    sideB: {
      label: '预检响应',
      points: ['返回允许的来源、方法与头', '通过后浏览器才发送真实 PUT 请求', '预检失败则真实请求不会发出'],
      example: 'HTTP/1.1 204 No Content\nAccess-Control-Allow-Origin: https://web.example.com\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE',
    },
    keywords: ['对比', '预检', 'cors', '跨域', 'options', 'comparison'],
  },
];
