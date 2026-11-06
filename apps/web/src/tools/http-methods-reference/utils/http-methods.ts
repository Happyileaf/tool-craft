/**
 * HTTP 请求方法速查：静态数据表与纯函数检索 / 过滤逻辑。
 *
 * 方法属性依据 RFC 9110（HTTP 语义）、RFC 9111（缓存）与 RFC 5789（PATCH）：
 * safe / idempotent / cacheable / 是否允许请求体均按标准定义内置，
 * 全部检索为确定性纯函数：不触碰 DOM、不发起网络请求、零新增依赖。
 */

/** 方法语义大类（用于筛选与分组） */
export type MethodGroup = 'common' | 'special';

/** HTTP 请求方法条目 */
export interface HttpMethod {
  /** 方法名（规范大写） */
  method: string;
  /** 中文名 */
  nameZh: string;
  /** 语义说明 */
  semantics: string;
  /** Safe：只读语义，不会对服务器产生预期副作用（RFC 9110 §9.2.1） */
  safe: boolean;
  /** Idempotent：多次相同请求与单次请求对服务器的预期效果相同（RFC 9110 §9.2.2） */
  idempotent: boolean;
  /** 是否可被缓存（RFC 9111） */
  cacheable: boolean;
  /** 是否允许携带请求体 */
  requestBody: boolean;
  /** RFC 来源 */
  rfc: string;
  /** 典型场景 */
  useCase: string;
  /** 常见误用 / 注意事项 */
  pitfalls: string[];
  /** 纯文本请求示例（不实际发送） */
  requestExample: string;
  /** 纯文本响应示例（不实际发送） */
  responseExample: string;
  /** 常见搭配状态码 */
  statusCodes: number[];
  /** 语义大类 */
  group: MethodGroup;
  /** 检索关键字（中英文） */
  keywords: string[];
}

/**
 * 9 个标准方法静态表，属性与 RFC 9110 §9.3 / §9.4、RFC 9111 §4.4、RFC 5789 保持一致。
 */
export const HTTP_METHODS: HttpMethod[] = [
  {
    method: 'GET',
    nameZh: '获取资源',
    semantics: '请求目标资源的当前表示（representation），仅用于取回数据，不应携带请求体。',
    safe: true,
    idempotent: true,
    cacheable: true,
    requestBody: false,
    rfc: 'RFC 9110 §9.3.1',
    useCase: '读取网页、查询列表 / 详情、拉取静态资源与 API 查询。',
    pitfalls: [
      '不要用 GET 执行修改 / 删除等有副作用操作，否则可能被预取、爬虫或缓存重复触发',
      'GET 的请求体没有标准语义，代理与服务器可能丢弃，参数应放 query string',
    ],
    requestExample: 'GET /api/users?page=1 HTTP/1.1\nHost: example.com\nAccept: application/json',
    responseExample:
      'HTTP/1.1 200 OK\nContent-Type: application/json\n\n[{"id": 1, "name": "Ada"}]',
    statusCodes: [200, 304, 404, 406],
    group: 'common',
    keywords: ['查询', '读取', 'safe', '幂等', '缓存', 'retrieve', 'read', 'idempotent'],
  },
  {
    method: 'HEAD',
    nameZh: '获取资源首部',
    semantics: '与 GET 语义相同，但服务器在响应中只返回首部、不返回消息体，用于检查元数据。',
    safe: true,
    idempotent: true,
    cacheable: true,
    requestBody: false,
    rfc: 'RFC 9110 §9.3.2',
    useCase: '检查资源是否存在、读取 Content-Length / Last-Modified、下载前探测文件大小。',
    pitfalls: [
      '响应不得携带消息体；若服务器对 GET 会返回内容，HEAD 必须保留相同首部',
      '不能用 HEAD 取回实体内容，只能用于元数据探测',
    ],
    requestExample: 'HEAD /downloads/report.pdf HTTP/1.1\nHost: example.com',
    responseExample:
      'HTTP/1.1 200 OK\nContent-Type: application/pdf\nContent-Length: 248193\n（无响应体）',
    statusCodes: [200, 304, 404],
    group: 'common',
    keywords: ['首部', '元数据', '探测', 'safe', '幂等', 'headers', 'metadata', 'idempotent'],
  },
  {
    method: 'POST',
    nameZh: '提交处理',
    semantics:
      '向目标资源提交表示，请求服务器按资源自身的语义处理（如创建子资源、提交表单、触发动作）。',
    safe: false,
    idempotent: false,
    cacheable: false,
    requestBody: true,
    rfc: 'RFC 9110 §9.3.3',
    useCase: '创建子资源、提交表单、上传文件、执行非 CRUD 动作（付款、搜索等）。',
    pitfalls: [
      '重复提交可能创建多份资源，需要幂等键（Idempotency-Key）或防重令牌',
      'POST 本身默认不可缓存，仅在显式新鲜度信息（如 Expires）下才可缓存',
    ],
    requestExample:
      'POST /api/users HTTP/1.1\nHost: example.com\nContent-Type: application/json\n\n{"name": "Ada"}',
    responseExample:
      'HTTP/1.1 201 Created\nLocation: /api/users/42\n\n{"id": 42, "name": "Ada"}',
    statusCodes: [200, 201, 202, 204, 400, 409, 422],
    group: 'common',
    keywords: ['创建', '提交', '表单', '非幂等', 'create', 'submit'],
  },
  {
    method: 'PUT',
    nameZh: '整体替换资源',
    semantics: '用请求中的表示整体替换（replace）目标资源的当前状态；资源不存在时可创建。',
    safe: false,
    idempotent: true,
    cacheable: false,
    requestBody: true,
    rfc: 'RFC 9110 §9.3.4',
    useCase: '客户端知道目标 URI 时整体更新资源，或对该 URI 执行 upsert。',
    pitfalls: [
      'PUT 是整体替换：未提供的字段应被清空，部分更新应使用 PATCH',
      '两次相同 PUT 的最终状态一致，因此天然幂等；不要把追加式逻辑放进 PUT',
    ],
    requestExample:
      'PUT /api/users/42 HTTP/1.1\nHost: example.com\nContent-Type: application/json\n\n{"name": "Ada", "role": "admin"}',
    responseExample: 'HTTP/1.1 204 No Content\n（更新成功，无响应体）',
    statusCodes: [200, 201, 204, 400, 409, 422],
    group: 'common',
    keywords: ['替换', '更新', 'upsert', '幂等', 'replace', 'update'],
  },
  {
    method: 'DELETE',
    nameZh: '删除资源',
    semantics: '请求服务器删除目标资源与当前状态之间的关联。',
    safe: false,
    idempotent: true,
    cacheable: false,
    requestBody: false,
    rfc: 'RFC 9110 §9.3.5',
    useCase: '按 URI 删除指定资源，或触发软删除 / 回收站逻辑。',
    pitfalls: [
      '重复 DELETE 结果应一致：首次 204、后续可返回 404，但服务器最终状态相同，故仍属幂等',
      'DELETE 携带请求体没有普遍认可的语义，批量删除建议走 POST + 动作子资源',
    ],
    requestExample: 'DELETE /api/users/42 HTTP/1.1\nHost: example.com',
    responseExample: 'HTTP/1.1 204 No Content\n（删除成功，无响应体）',
    statusCodes: [200, 202, 204, 404, 409],
    group: 'common',
    keywords: ['删除', '幂等', 'remove', 'delete', 'idempotent'],
  },
  {
    method: 'CONNECT',
    nameZh: '建立隧道',
    semantics: '请求代理与目标主机建立 TCP 隧道，随后代理只做字节透传，常用于 HTTPS 代理。',
    safe: false,
    idempotent: false,
    cacheable: false,
    requestBody: false,
    rfc: 'RFC 9110 §9.3.6',
    useCase: '经 HTTP 代理发起 TLS（HTTPS）连接时的 CONNECT 隧道。',
    pitfalls: [
      '开放代理若放任 CONNECT 可能被用于内网穿透或绕过访问控制，应限制目标端口与主机',
      'CONNECT 是逐跳（hop-by-hop）语义，不应被缓存或由普通资源处理器实现',
    ],
    requestExample: 'CONNECT example.com:443 HTTP/1.1\nHost: example.com:443',
    responseExample: 'HTTP/1.1 200 Connection Established\n（随后开始 TLS 握手，代理透传字节）',
    statusCodes: [200, 403, 405, 502],
    group: 'special',
    keywords: ['隧道', '代理', 'tunnel', 'proxy', 'https'],
  },
  {
    method: 'OPTIONS',
    nameZh: '查询通信选项',
    semantics: '请求目标资源或服务器支持的通信选项，如允许的方法；也是 CORS 预检请求的方法。',
    safe: true,
    idempotent: true,
    cacheable: false,
    requestBody: false,
    rfc: 'RFC 9110 §9.3.7',
    useCase: 'CORS 预检（Access-Control-Request-*）、探测服务器允许的方法（Allow 首部）。',
    pitfalls: [
      '跨域非简单请求前浏览器自动发 OPTIONS 预检，服务端必须正确处理 Allow-* 响应头',
      'OPTIONS 响应不应携带业务资源表示，通常是 204 / 200 且无消息体',
    ],
    requestExample:
      'OPTIONS /api/users/42 HTTP/1.1\nHost: example.com\nAccess-Control-Request-Method: PUT',
    responseExample:
      'HTTP/1.1 204 No Content\nAllow: GET, HEAD, PUT, DELETE\nAccess-Control-Allow-Methods: GET, PUT, DELETE',
    statusCodes: [200, 204],
    group: 'special',
    keywords: ['预检', 'cors', '选项', 'allow', 'safe', '幂等', 'preflight'],
  },
  {
    method: 'TRACE',
    nameZh: '回路测试',
    semantics: '请求服务器在响应体中原样回送收到的请求消息，用于诊断与回环测试。',
    safe: true,
    idempotent: true,
    cacheable: false,
    requestBody: false,
    rfc: 'RFC 9110 §9.3.8',
    useCase: '排查代理链路上的请求改写，验证中间盒是否修改了首部。',
    pitfalls: [
      '回显请求可能泄露 Cookie / 授权首部，存在跨站追踪（XST）风险，生产环境通常禁用',
      'TRACE 请求不得携带会产生副作用的语义，代理可选择直接拒绝（405）',
    ],
    requestExample: 'TRACE /index.html HTTP/1.1\nHost: example.com',
    responseExample:
      'HTTP/1.1 200 OK\nContent-Type: message/http\n\nTRACE /index.html HTTP/1.1\nHost: example.com',
    statusCodes: [200, 405],
    group: 'special',
    keywords: ['回显', '诊断', 'xst', 'echo', 'diagnostic', 'safe', '幂等'],
  },
  {
    method: 'PATCH',
    nameZh: '部分更新资源',
    semantics: '携带一组修改指令，对目标资源执行部分更新（partial modification），媒体类型定义补丁格式。',
    safe: false,
    idempotent: false,
    cacheable: false,
    requestBody: true,
    rfc: 'RFC 5789',
    useCase: '只更新资源的个别字段（JSON Merge Patch / JSON Patch），避免整体替换。',
    pitfalls: [
      'PATCH 标准本身不保证幂等：重复应用同一补丁可能叠加（如 {"op":"add"} 或自增路径），幂等性取决于媒体类型与补丁设计',
      '需要在 Content-Type 中声明补丁格式（application/merge-patch+json、application/json-patch+json）',
    ],
    requestExample:
      'PATCH /api/users/42 HTTP/1.1\nHost: example.com\nContent-Type: application/merge-patch+json\n\n{"role": "admin"}',
    responseExample: 'HTTP/1.1 200 OK\n\n{"id": 42, "name": "Ada", "role": "admin"}',
    statusCodes: [200, 204, 400, 409, 415, 422],
    group: 'common',
    keywords: ['部分更新', '补丁', '非幂等', 'patch', 'merge-patch'],
  },
];

/** 专题对比条目 */
export interface MethodComparison {
  /** 对比标题 */
  title: string;
  /** 检索关键字 */
  keywords: string[];
  /** 对比维度说明 */
  rows: { aspect: string; left: string; right: string }[];
  /** 左侧方法名 */
  leftMethod: string;
  /** 右侧方法名 */
  rightMethod: string;
  /** 请求体示例 */
  bodyExample: string;
}

/** 专题对比区：PUT vs PATCH、POST vs PUT、OPTIONS 与 CORS */
export const METHOD_COMPARISONS: MethodComparison[] = [
  {
    title: 'PUT vs PATCH：整体替换与部分更新',
    leftMethod: 'PUT',
    rightMethod: 'PATCH',
    keywords: ['对比', '幂等', '替换', '部分更新', 'patch', 'put'],
    rows: [
      {
        aspect: '语义',
        left: '用请求表示整体替换资源，未出现的字段被清空 / 重置为默认',
        right: '只对补丁中出现的字段做局部修改，其余字段保持不变',
      },
      {
        aspect: '幂等性',
        left: '天然幂等：重复发送同一 PUT，最终状态完全一致',
        right: '标准不保证幂等：取决于补丁媒体类型，自增 / add 类补丁重复执行会叠加',
      },
      {
        aspect: '请求体',
        left: '必须是资源的完整表示',
        right: '是修改指令或部分字段，需声明补丁 Content-Type',
      },
    ],
    bodyExample:
      '资源当前状态：{"name": "Ada", "role": "user", "age": 30}\n\n' +
      'PUT  body {"role": "admin"}        → {"role": "admin"}（name、age 丢失）\n' +
      'PATCH body {"role": "admin"}       → {"name": "Ada", "role": "admin", "age": 30}',
  },
  {
    title: 'POST vs PUT：谁来决定资源 URI 与幂等',
    leftMethod: 'POST',
    rightMethod: 'PUT',
    keywords: ['对比', '创建', '幂等', 'uri', 'post', 'put'],
    rows: [
      {
        aspect: 'URI 决策',
        left: '由服务器决定新资源 URI，客户端提交到集合（如 /api/users）',
        right: '客户端知道目标 URI（如 /api/users/42），对其整体替换或创建',
      },
      {
        aspect: '幂等性',
        left: '非幂等：重复提交通常创建多个资源',
        right: '幂等：重复提交同一表示，资源状态不变',
      },
      {
        aspect: '典型成功码',
        left: '201 Created + Location 指向新资源',
        right: '新建 201，替换已有资源多用 200 / 204',
      },
    ],
    bodyExample:
      'POST /api/users        → 服务器生成 id，Location: /api/users/42\n' +
      'PUT  /api/users/42     → 客户端指定 id=42，重复执行结果相同',
  },
  {
    title: 'OPTIONS 与 CORS 预检的关系',
    leftMethod: 'OPTIONS',
    rightMethod: 'CORS 预检',
    keywords: ['对比', 'cors', '预检', '跨域', 'options', 'preflight'],
    rows: [
      {
        aspect: '关系',
        left: 'OPTIONS 是 HTTP 标准方法，用于查询资源支持的通信选项',
        right: 'CORS 预检是浏览器自动发起的一个 OPTIONS 请求，属于 OPTIONS 的典型用法',
      },
      {
        aspect: '触发条件',
        left: '客户端可随时手动发送，如查询 Allow 首部',
        right: '跨域且非「简单请求」（自定义头、PUT/DELETE 等方法、非简单 Content-Type）时自动触发',
      },
      {
        aspect: '关键首部',
        left: '请求 Access-Control-Request-Method，响应 Allow / Access-Control-Allow-*',
        right: '响应需含 Access-Control-Allow-Origin、Allow-Methods、Allow-Headers 与 Max-Age',
      },
    ],
    bodyExample:
      'OPTIONS /api/users HTTP/1.1\nOrigin: https://web.example\n' +
      'Access-Control-Request-Method: PUT\nAccess-Control-Request-Headers: Content-Type\n\n' +
      'HTTP/1.1 204 No Content\nAccess-Control-Allow-Origin: https://web.example\n' +
      'Access-Control-Allow-Methods: GET, POST, PUT, DELETE\n' +
      'Access-Control-Allow-Headers: Content-Type\nAccess-Control-Max-Age: 600',
  },
];

/**
 * 按关键字与分组过滤方法。
 *
 * @param keyword - 搜索关键字（方法名 / 中文名 / 语义 / 关键字，大小写不敏感）
 * @param group - 分组筛选，'all' 表示不限制
 * @returns 命中的方法数组（保持静态表顺序）
 */
export function filterMethods(
  keyword: string,
  group: MethodGroup | 'all' = 'all',
): HttpMethod[] {
  const kw = keyword.trim().toLowerCase();
  return HTTP_METHODS.filter((item) => {
    const groupMatched = group === 'all' || item.group === group;
    if (!groupMatched) {
      return false;
    }
    if (kw === '') {
      return true;
    }
    const haystack = [
      item.method,
      item.nameZh,
      item.semantics,
      item.rfc,
      item.useCase,
      ...item.keywords,
      ...item.pitfalls,
    ]
      .join('\n')
      .toLowerCase();
    return haystack.includes(kw);
  });
}

/**
 * 按关键字过滤专题对比条目（标题与关键字字段）。
 *
 * @param keyword - 搜索关键字
 * @returns 命中的对比条目
 */
export function filterComparisons(keyword: string): MethodComparison[] {
  const kw = keyword.trim().toLowerCase();
  if (kw === '') {
    return METHOD_COMPARISONS;
  }
  return METHOD_COMPARISONS.filter((item) =>
    [item.title, ...item.keywords, ...item.rows.map((row) => `${row.aspect}${row.left}${row.right}`)]
      .join('\n')
      .toLowerCase()
      .includes(kw),
  );
}
