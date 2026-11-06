/**
 * HTTP 头字段速查：静态数据表与纯函数检索 / 过滤逻辑。
 *
 * 字段语义依据 RFC 9110（HTTP 语义）、RFC 9111（缓存）、RFC 6265/6265bis（Cookie）、
 * RFC 6266（Content-Disposition）、RFC 6454（Origin）、Fetch / CORS 标准与各安全头部 RFC。
 * 「禁止修改的请求头 / 响应头」清单与 Fetch 标准 forbidden header name 保持一致，
 * 全部检索为确定性纯函数：不触碰 DOM、不发起网络请求、零新增依赖。
 */

/** 头字段大类（用于筛选与分组） */
export type HeaderCategory =
  | 'general'
  | 'request'
  | 'response'
  | 'entity'
  | 'caching'
  | 'cors'
  | 'security';

/** 头字段出现方向 */
export type HeaderDirection = 'request' | 'response' | 'both';

/** HTTP 头字段条目 */
export interface HttpHeader {
  /** 规范头名（Fetch 标准大小写） */
  name: string;
  /** 中文名 */
  nameZh: string;
  /** 大类 */
  category: HeaderCategory;
  /** 出现方向 */
  direction: HeaderDirection;
  /** 含义说明 */
  description: string;
  /** 取值示例 */
  example: string;
  /** 标准来源 */
  rfc: string;
  /** 是否为逐跳（hop-by-hop）头，仅对单次传输连接有效、不得被代理转发 */
  hopByHop: boolean;
  /**
   * 是否为 Fetch 标准「禁止修改的头字段」：
   * 浏览器环境下 JS 无法通过 XHR/fetch 自行设置（request）或读取（response）
   */
  forbidden: boolean;
  /** 安全注意事项（可空） */
  securityNote?: string;
  /** 检索关键字（中英文） */
  keywords: string[];
}

/** 分类展示标签 */
export const CATEGORY_LABELS: Record<HeaderCategory, string> = {
  general: '通用（General）',
  request: '请求（Request）',
  response: '响应（Response）',
  entity: '表示 / 实体（Entity）',
  caching: '缓存（Caching）',
  cors: 'CORS 跨域',
  security: '安全（Security）',
};

/**
 * 51 个常用 HTTP 头字段静态表。
 */
export const HTTP_HEADERS: HttpHeader[] = [
  // ---- 通用 ----
  {
    name: 'Connection',
    nameZh: '连接管理',
    category: 'general',
    direction: 'both',
    description: '控制当前连接是否保持（keep-alive）或在事务完成后关闭，并列出逐跳首部。',
    example: 'Connection: keep-alive',
    rfc: 'RFC 9110 §7.6.1',
    hopByHop: true,
    forbidden: true,
    securityNote: '逐跳头不会被代理透传；HTTP/2、HTTP/3 中连接管理由协议自身承担，该头被禁用。',
    keywords: ['连接', 'keep-alive', '逐跳', 'connection'],
  },
  {
    name: 'Date',
    nameZh: '报文生成时间',
    category: 'general',
    direction: 'both',
    description: '报文起源的日期与时间（HTTP-date），是缓存新鲜度计算的基准之一。',
    example: 'Date: Wed, 21 Oct 2026 07:28:00 GMT',
    rfc: 'RFC 9110 §5.6.7',
    hopByHop: false,
    forbidden: false,
    keywords: ['时间', '日期', 'date', 'gmt'],
  },
  {
    name: 'Transfer-Encoding',
    nameZh: '传输编码',
    category: 'general',
    direction: 'both',
    description: '声明报文在传输层的编码方式，常见值 chunked 表示分块传输。',
    example: 'Transfer-Encoding: chunked',
    rfc: 'RFC 9110 §6.1',
    hopByHop: true,
    forbidden: true,
    securityNote: '与 Content-Length 同时出现时需按规范消歧，历史上曾引发请求走私（request smuggling）攻击。',
    keywords: ['分块', 'chunked', '传输编码', 'smuggling'],
  },
  {
    name: 'Upgrade',
    nameZh: '协议升级',
    category: 'general',
    direction: 'both',
    description: '邀请服务器升级到其他协议，如从 HTTP/1.1 切换到 WebSocket（h2c 同理）。',
    example: 'Upgrade: websocket',
    rfc: 'RFC 9110 §7.8',
    hopByHop: true,
    forbidden: true,
    keywords: ['websocket', '升级', 'h2c', 'upgrade'],
  },
  {
    name: 'Via',
    nameZh: '代理链路',
    category: 'general',
    direction: 'both',
    description: '由代理在转发时追加，记录请求 / 响应经过的中间协议与主机，用于追踪报文路径。',
    example: 'Via: 1.1 proxy.example, 1.1 edge.example',
    rfc: 'RFC 9110 §7.6.3',
    hopByHop: true,
    forbidden: false,
    keywords: ['代理', '链路', 'via', 'proxy'],
  },
  {
    name: 'Warning',
    nameZh: '缓存告警',
    category: 'general',
    direction: 'both',
    description: '携带状态码未体现的补充告警信息，多用于缓存陈旧提示；该头已在最新规范中被弃用。',
    example: 'Warning: 110 - "Response is stale"',
    rfc: 'RFC 9111 §5.5（已弃用）',
    hopByHop: true,
    forbidden: false,
    keywords: ['告警', '陈旧', 'warning', 'deprecated'],
  },

  // ---- 请求 ----
  {
    name: 'Host',
    nameZh: '目标主机与端口',
    category: 'request',
    direction: 'request',
    description: '指定目标服务器的主机名与端口，是虚拟主机托管与路由的依据；HTTP/1.1 强制要求。',
    example: 'Host: api.example.com',
    rfc: 'RFC 9110 §7.2',
    hopByHop: false,
    forbidden: true,
    securityNote: '缺失或伪造 Host 可能引发路由混淆、密码重置投毒与缓存投毒，代理应做白名单校验。',
    keywords: ['主机', '虚拟主机', 'host', '路由'],
  },
  {
    name: 'User-Agent',
    nameZh: '用户代理标识',
    category: 'request',
    direction: 'request',
    description: '标识发起请求的浏览器、爬虫或客户端程序及其版本、操作系统等信息。',
    example: 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    rfc: 'RFC 9110 §10.1.5',
    hopByHop: false,
    forbidden: true,
    keywords: ['ua', '浏览器', '爬虫', 'user-agent'],
  },
  {
    name: 'Referer',
    nameZh: '来源页面',
    category: 'request',
    direction: 'request',
    description: '告诉服务器当前请求是从哪个页面发起的（原始 URI），拼写沿用历史错误。',
    example: 'Referer: https://example.com/list',
    rfc: 'RFC 9110 §10.1.3',
    hopByHop: false,
    forbidden: true,
    securityNote: '可能泄露完整 URL（含敏感路径 / token），可用 Referrer-Policy 控制是否发送。',
    keywords: ['来源', 'referrer', 'referer', '防盗链'],
  },
  {
    name: 'Accept',
    nameZh: '可接受媒体类型',
    category: 'request',
    direction: 'request',
    description: '声明客户端可处理的媒体类型与偏好权重（q 值），用于内容协商。',
    example: 'Accept: text/html,application/json;q=0.9,*/*;q=0.8',
    rfc: 'RFC 9110 §12.5.1',
    hopByHop: false,
    forbidden: false,
    keywords: ['内容协商', 'mime', 'accept', 'q值'],
  },
  {
    name: 'Accept-Language',
    nameZh: '可接受自然语言',
    category: 'request',
    direction: 'request',
    description: '声明偏好的自然语言与权重，服务器据此做国际化语言协商。',
    example: 'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8',
    rfc: 'RFC 9110 §12.5.4',
    hopByHop: false,
    forbidden: false,
    keywords: ['语言', 'i18n', 'locale', 'accept-language'],
  },
  {
    name: 'Accept-Encoding',
    nameZh: '可接受内容编码',
    category: 'request',
    direction: 'request',
    description: '声明客户端支持的压缩编码（gzip、br、deflate、zstd 等）与权重。',
    example: 'Accept-Encoding: gzip, deflate, br, zstd',
    rfc: 'RFC 9110 §12.5.3',
    hopByHop: false,
    forbidden: true,
    keywords: ['压缩', 'gzip', 'brotli', 'accept-encoding'],
  },
  {
    name: 'Authorization',
    nameZh: '认证凭据',
    category: 'request',
    direction: 'request',
    description: '携带服务器要求的认证凭据，常见方案有 Basic、Bearer（JWT/OAuth 2.0）、Digest。',
    example: 'Authorization: Bearer eyJhbGciOi...',
    rfc: 'RFC 9110 §11.6.2',
    hopByHop: false,
    forbidden: true,
    securityNote: '凭据会随每个请求发送，必须走 HTTPS；禁止写入 URL / 日志，注意防 CSRF 与 token 泄露。',
    keywords: ['认证', 'token', 'bearer', 'basic', 'jwt', 'authorization'],
  },
  {
    name: 'Proxy-Authorization',
    nameZh: '代理认证凭据',
    category: 'request',
    direction: 'request',
    description: '向代理服务器提交认证凭据，语义同 Authorization 但面向代理链路。',
    example: 'Proxy-Authorization: Basic dXNlcjpwYXNz',
    rfc: 'RFC 9110 §11.7.2',
    hopByHop: true,
    forbidden: true,
    securityNote: '逐跳头，代理消费后不应继续转发；同样必须在 TLS 隧道内使用。',
    keywords: ['代理认证', 'proxy', 'basic'],
  },
  {
    name: 'Cookie',
    nameZh: '请求 Cookie',
    category: 'request',
    direction: 'request',
    description: '把浏览器保存的、作用域匹配的 Cookie 回传给服务器。',
    example: 'Cookie: sessionId=abc123; theme=dark',
    rfc: 'RFC 6265 §4.2',
    hopByHop: false,
    forbidden: true,
    securityNote: '会话 Cookie 应设置 HttpOnly、Secure、SameSite；警惕 CSRF 与会话固定攻击。',
    keywords: ['cookie', '会话', 'session', 'csrf'],
  },
  {
    name: 'Range',
    nameZh: '字节范围请求',
    category: 'request',
    direction: 'request',
    description: '只请求资源的指定字节区间，用于断点续传、视频拖动与分块下载。',
    example: 'Range: bytes=200-1000',
    rfc: 'RFC 9110 §14.2',
    hopByHop: false,
    forbidden: false,
    keywords: ['断点续传', 'range', '分块下载'],
  },
  {
    name: 'Expect',
    nameZh: '期望条件',
    category: 'request',
    direction: 'request',
    description: '客户端要求服务器先满足特定条件再收请求体，典型值 100-continue 用于大 body 预检。',
    example: 'Expect: 100-continue',
    rfc: 'RFC 9110 §10.1.1',
    hopByHop: true,
    forbidden: true,
    keywords: ['100-continue', '大文件', 'expect'],
  },
  {
    name: 'Max-Forwards',
    nameZh: '最大转发次数',
    category: 'request',
    direction: 'request',
    description: '限制 TRACE / OPTIONS 请求可经过的代理数量，每经过一跳减一，归零后必须由当前服务器处理。',
    example: 'Max-Forwards: 5',
    rfc: 'RFC 9110 §10.1.2',
    hopByHop: false,
    forbidden: false,
    keywords: ['转发', 'trace', '代理', 'max-forwards'],
  },

  // ---- 响应 ----
  {
    name: 'Server',
    nameZh: '服务器软件标识',
    category: 'response',
    direction: 'response',
    description: '标识处理请求的源服务器软件及版本信息。',
    example: 'Server: nginx/1.25.3',
    rfc: 'RFC 9110 §10.2.5',
    hopByHop: false,
    forbidden: false,
    securityNote: '暴露精确版本会帮助攻击者匹配已知漏洞，生产环境建议隐藏或泛化。',
    keywords: ['服务器', 'nginx', 'server'],
  },
  {
    name: 'Allow',
    nameZh: '允许的方法',
    category: 'response',
    direction: 'response',
    description: '列出目标资源支持的 HTTP 方法集合，常随 405 Method Not Allowed 返回。',
    example: 'Allow: GET, HEAD, PUT, DELETE',
    rfc: 'RFC 9110 §10.2.1',
    hopByHop: false,
    forbidden: false,
    keywords: ['方法', '405', 'allow'],
  },
  {
    name: 'Location',
    nameZh: '重定向目标',
    category: 'response',
    direction: 'response',
    description: '指示重定向目标 URI 或新建资源的地址，配合 201/3xx 状态码使用。',
    example: 'Location: /login?next=/dashboard',
    rfc: 'RFC 9110 §10.2.2',
    hopByHop: false,
    forbidden: false,
    securityNote: '开放重定向（用户可控 Location）可被用于钓鱼，服务端应校验跳转目标白名单。',
    keywords: ['重定向', 'redirect', '302', 'location'],
  },
  {
    name: 'Retry-After',
    nameZh: '重试等待时间',
    category: 'response',
    direction: 'response',
    description: '告知客户端多久后可重试，值为秒数或 HTTP 日期，常随 503 / 429 返回。',
    example: 'Retry-After: 120',
    rfc: 'RFC 9110 §10.2.3',
    hopByHop: false,
    forbidden: false,
    keywords: ['限流', '503', '429', '重试', 'retry-after'],
  },
  {
    name: 'Accept-Ranges',
    nameZh: '范围请求支持声明',
    category: 'response',
    direction: 'response',
    description: '声明服务器是否支持字节范围请求，bytes 表示支持，none 表示不支持。',
    example: 'Accept-Ranges: bytes',
    rfc: 'RFC 9110 §14.3',
    hopByHop: false,
    forbidden: false,
    keywords: ['range', '续传', 'accept-ranges'],
  },
  {
    name: 'Set-Cookie',
    nameZh: '下发 Cookie',
    category: 'response',
    direction: 'response',
    description: '服务器向浏览器写入或更新一个 Cookie，可携带 Domain、Path、Expires、Secure、HttpOnly、SameSite 等属性。',
    example: 'Set-Cookie: sid=xyz; Path=/; HttpOnly; Secure; SameSite=Lax',
    rfc: 'RFC 6265 §4.1',
    hopByHop: false,
    forbidden: true,
    securityNote: '敏感 Cookie 必须 HttpOnly+Secure；SameSite 缺失默认 Lax，注意 __Host- / __Secure- 前缀约束。',
    keywords: ['cookie', 'httponly', 'samesite', 'secure', 'set-cookie'],
  },
  {
    name: 'Trailer',
    nameZh: '分块尾部字段',
    category: 'response',
    direction: 'both',
    description: '声明分块传输编码消息末尾（trailer 区）会携带哪些首部，用于后验校验值等场景。',
    example: 'Trailer: Content-MD5',
    rfc: 'RFC 9110 §6.6.2',
    hopByHop: true,
    forbidden: true,
    keywords: ['chunked', '尾部', 'trailer'],
  },

  // ---- 表示 / 实体 ----
  {
    name: 'Content-Type',
    nameZh: '媒体类型',
    category: 'entity',
    direction: 'both',
    description: '声明消息体的媒体类型与字符集（MIME type），决定浏览器如何解析内容。',
    example: 'Content-Type: application/json; charset=utf-8',
    rfc: 'RFC 9110 §8.3',
    hopByHop: false,
    forbidden: false,
    securityNote: '响应缺少正确 charset 或类型可触发 MIME 嗅探与 XSS，应配合 X-Content-Type-Options: nosniff。',
    keywords: ['mime', 'json', 'charset', 'content-type'],
  },
  {
    name: 'Content-Length',
    nameZh: '消息体长度',
    category: 'entity',
    direction: 'both',
    description: '消息体的字节数，用于定长帧界定与连接复用。',
    example: 'Content-Length: 1024',
    rfc: 'RFC 9110 §8.6',
    hopByHop: false,
    forbidden: true,
    securityNote: '与 Transfer-Encoding 冲突处理不当会造成请求走私；前端伪造长度可能被服务器拒绝。',
    keywords: ['长度', '字节', 'content-length'],
  },
  {
    name: 'Content-Encoding',
    nameZh: '内容编码',
    category: 'entity',
    direction: 'both',
    description: '声明消息体实际使用的压缩编码（gzip、br、deflate、zstd）。',
    example: 'Content-Encoding: br',
    rfc: 'RFC 9110 §8.4',
    hopByHop: false,
    forbidden: false,
    keywords: ['压缩', 'gzip', 'brotli', 'content-encoding'],
  },
  {
    name: 'Content-Language',
    nameZh: '内容自然语言',
    category: 'entity',
    direction: 'both',
    description: '描述消息体面向的自然语言受众。',
    example: 'Content-Language: zh-CN',
    rfc: 'RFC 9110 §8.5',
    hopByHop: false,
    forbidden: false,
    keywords: ['语言', 'i18n', 'content-language'],
  },
  {
    name: 'Content-Disposition',
    nameZh: '展示与下载处置',
    category: 'entity',
    direction: 'response',
    description: '指示内容应内联展示（inline）还是作为附件下载（attachment），并可指定文件名。',
    example: 'Content-Disposition: attachment; filename="report.pdf"',
    rfc: 'RFC 6266',
    hopByHop: false,
    forbidden: false,
    securityNote: 'filename 需处理引号 / 路径注入，建议同时提供 filename* 以 RFC 5987 编码非 ASCII 文件名。',
    keywords: ['下载', '附件', '文件名', 'attachment', 'content-disposition'],
  },
  {
    name: 'Content-Range',
    nameZh: '字节区间位置',
    category: 'entity',
    direction: 'response',
    description: '声明当前部分消息体在完整资源中的字节区间与总长度，配合 206 Partial Content。',
    example: 'Content-Range: bytes 200-1000/67589',
    rfc: 'RFC 9110 §14.4',
    hopByHop: false,
    forbidden: false,
    keywords: ['206', 'range', '续传', 'content-range'],
  },
  {
    name: 'ETag',
    nameZh: '实体版本标识',
    category: 'entity',
    direction: 'response',
    description: '资源当前表示的不透明版本令牌，分强校验（"…"）与弱校验（W/"…"），用于条件请求与缓存。',
    example: 'ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"',
    rfc: 'RFC 9110 §8.8.3',
    hopByHop: false,
    forbidden: false,
    keywords: ['etag', '版本', '条件请求', '乐观锁'],
  },
  {
    name: 'Last-Modified',
    nameZh: '最后修改时间',
    category: 'entity',
    direction: 'response',
    description: '源服务器认定资源最后一次被修改的时间，是条件请求与缓存启发式过期的依据。',
    example: 'Last-Modified: Tue, 20 Oct 2026 12:00:00 GMT',
    rfc: 'RFC 9110 §8.8.2',
    hopByHop: false,
    forbidden: false,
    keywords: ['修改时间', '缓存', 'last-modified'],
  },

  // ---- 缓存 ----
  {
    name: 'Cache-Control',
    nameZh: '缓存策略指令',
    category: 'caching',
    direction: 'both',
    description: '携带缓存指令，请求与响应方向均可使用，如 max-age、no-cache、no-store、public、private、immutable。',
    example: 'Cache-Control: public, max-age=31536000, immutable',
    rfc: 'RFC 9111 §5.2',
    hopByHop: false,
    forbidden: false,
    securityNote: '含敏感信息的响应应使用 no-store；no-cache 不是「不缓存」，而是每次使用前必须重新校验。',
    keywords: ['缓存', 'max-age', 'no-store', 'no-cache', 'immutable', 'cache-control'],
  },
  {
    name: 'Expires',
    nameZh: '过期时间',
    category: 'caching',
    direction: 'response',
    description: '给出响应被视为过期的绝对时间；HTTP/1.0 遗留机制，优先级低于 Cache-Control 的 max-age。',
    example: 'Expires: Thu, 01 Dec 2026 16:00:00 GMT',
    rfc: 'RFC 9111 §5.3',
    hopByHop: false,
    forbidden: false,
    keywords: ['过期', '缓存', 'expires'],
  },
  {
    name: 'Age',
    nameZh: '缓存已存秒数',
    category: 'caching',
    direction: 'response',
    description: '代理缓存估算该响应已在缓存中存放的秒数，源服务器响应通常为 0。',
    example: 'Age: 864',
    rfc: 'RFC 9111 §5.1',
    hopByHop: false,
    forbidden: false,
    keywords: ['缓存', 'age', '代理缓存'],
  },
  {
    name: 'Vary',
    nameZh: '缓存差异化维度',
    category: 'caching',
    direction: 'response',
    description: '声明除 URL 外还需依据哪些请求头选择缓存表示，如 Vary: Accept-Encoding、Origin。',
    example: 'Vary: Accept-Encoding, Origin',
    rfc: 'RFC 9111 §3.4.1',
    hopByHop: false,
    forbidden: false,
    securityNote: 'Vary: User-Agent 等过度差异化会降低缓存命中率；CORS 响应通常需 Vary: Origin 防止串用。',
    keywords: ['缓存键', '协商', 'vary'],
  },
  {
    name: 'If-None-Match',
    nameZh: '条件请求（ETag）',
    category: 'caching',
    direction: 'request',
    description: '携带此前获得的 ETag，资源未变化时服务器返回 304 Not Modified，节省带宽。',
    example: 'If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"',
    rfc: 'RFC 9110 §13.1.2',
    hopByHop: false,
    forbidden: false,
    keywords: ['304', 'etag', '协商缓存', 'if-none-match'],
  },
  {
    name: 'If-Modified-Since',
    nameZh: '条件请求（时间）',
    category: 'caching',
    direction: 'request',
    description: '携带 Last-Modified 时间，资源在该时间后未修改则返回 304。',
    example: 'If-Modified-Since: Tue, 20 Oct 2026 12:00:00 GMT',
    rfc: 'RFC 9110 §13.1.3',
    hopByHop: false,
    forbidden: false,
    keywords: ['304', 'last-modified', '协商缓存', 'if-modified-since'],
  },

  // ---- CORS ----
  {
    name: 'Origin',
    nameZh: '请求来源（方案+主机+端口）',
    category: 'cors',
    direction: 'request',
    description: '标识请求的源（scheme + host + port），所有跨域请求与 POST 等同源请求均会携带，不含路径。',
    example: 'Origin: https://web.example.com',
    rfc: 'RFC 6454 §7',
    hopByHop: false,
    forbidden: true,
    securityNote: '与 Referer 不同，Origin 不携带路径，是 CORS 与 CSRF 防护的核心校验依据。',
    keywords: ['源', 'cors', 'csrf', 'origin'],
  },
  {
    name: 'Access-Control-Allow-Origin',
    nameZh: '允许的跨域来源',
    category: 'cors',
    direction: 'response',
    description: '声明允许访问该资源的源，具体 Origin 或 *；携带凭据时不能使用通配符。',
    example: 'Access-Control-Allow-Origin: https://web.example.com',
    rfc: 'Fetch 标准（CORS）',
    hopByHop: false,
    forbidden: false,
    securityNote: '反射任意 Origin 且允许凭据等同于放开同源策略；通配符 * 与 credentials: include 互斥。',
    keywords: ['cors', '跨域', 'allow-origin', 'acao'],
  },
  {
    name: 'Access-Control-Allow-Methods',
    nameZh: '允许的跨域方法',
    category: 'cors',
    direction: 'response',
    description: '预检响应中声明跨域允许使用的 HTTP 方法集合。',
    example: 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE',
    rfc: 'Fetch 标准（CORS）',
    hopByHop: false,
    forbidden: false,
    keywords: ['cors', '预检', 'methods'],
  },
  {
    name: 'Access-Control-Allow-Headers',
    nameZh: '允许的跨域请求头',
    category: 'cors',
    direction: 'response',
    description: '预检响应中声明跨域请求允许携带的首部字段。',
    example: 'Access-Control-Allow-Headers: Content-Type, Authorization',
    rfc: 'Fetch 标准（CORS）',
    hopByHop: false,
    forbidden: false,
    keywords: ['cors', '预检', 'headers'],
  },
  {
    name: 'Access-Control-Allow-Credentials',
    nameZh: '允许携带凭据',
    category: 'cors',
    direction: 'response',
    description: '声明跨域请求是否允许携带 Cookie、TLS 证书与 Authorization 等凭据。',
    example: 'Access-Control-Allow-Credentials: true',
    rfc: 'Fetch 标准（CORS）',
    hopByHop: false,
    forbidden: false,
    securityNote: '置为 true 时 Allow-Origin 必须回显具体源而不能为 *，否则浏览器拒绝响应。',
    keywords: ['cors', 'cookie', '凭据', 'credentials'],
  },
  {
    name: 'Access-Control-Max-Age',
    nameZh: '预检结果缓存时间',
    category: 'cors',
    direction: 'response',
    description: '预检请求结果可被缓存的秒数，缓存期内跨域请求不再重复发起 OPTIONS 预检。',
    example: 'Access-Control-Max-Age: 600',
    rfc: 'Fetch 标准（CORS）',
    hopByHop: false,
    forbidden: false,
    keywords: ['cors', '预检', '缓存', 'max-age'],
  },

  // ---- 安全 ----
  {
    name: 'Content-Security-Policy',
    nameZh: '内容安全策略',
    category: 'security',
    direction: 'response',
    description: '以白名单指令限制脚本、样式、图片、iframe 等资源的加载来源与内联执行，是纵深防御 XSS 的核心头部。',
    example: "Content-Security-Policy: default-src 'self'; script-src 'self' cdn.example",
    rfc: 'CSP Level 3（W3C）',
    hopByHop: false,
    forbidden: false,
    securityNote: '上线前建议先用 Content-Security-Policy-Report-Only 观察违规报告，避免误杀；慎用 unsafe-inline / unsafe-eval。',
    keywords: ['csp', 'xss', '白名单', '安全', 'content-security-policy'],
  },
  {
    name: 'Strict-Transport-Security',
    nameZh: '强制 HTTPS',
    category: 'security',
    direction: 'response',
    description: 'HSTS：告知浏览器在 max-age 周期内对该主机的所有访问强制走 HTTPS，可选 includeSubDomains 与 preload。',
    example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    rfc: 'RFC 6797',
    hopByHop: false,
    forbidden: false,
    securityNote: '首次下发仍可能被中间人降级；加入 preload 列表才能覆盖首次访问，配置前确认全站 HTTPS 就绪。',
    keywords: ['hsts', 'https', 'tls', '安全', 'strict-transport-security'],
  },
  {
    name: 'X-Frame-Options',
    nameZh: '嵌套框架限制',
    category: 'security',
    direction: 'response',
    description: '限制页面被 frame/iframe/object 嵌套的方式（DENY / SAMEORIGIN），用于防御点击劫持，正逐步被 CSP frame-ancestors 取代。',
    example: 'X-Frame-Options: SAMEORIGIN',
    rfc: 'RFC 7034',
    hopByHop: false,
    forbidden: false,
    securityNote: '已被 CSP frame-ancestors 指令取代，新系统建议两者同时下发以兼容旧浏览器。',
    keywords: ['点击劫持', 'iframe', 'frame-ancestors', 'x-frame-options'],
  },
  {
    name: 'X-Content-Type-Options',
    nameZh: '禁用 MIME 嗅探',
    category: 'security',
    direction: 'response',
    description: '唯一合法值 nosniff，告知浏览器严格按 Content-Type 解析，禁止 MIME 嗅探，阻断脚本伪装上传。',
    example: 'X-Content-Type-Options: nosniff',
    rfc: 'Fetch 标准',
    hopByHop: false,
    forbidden: false,
    securityNote: '文件上传与用户生成内容场景必须下发，防止浏览器把文本 / 图片嗅探成可执行脚本。',
    keywords: ['nosniff', 'mime', '安全', 'x-content-type-options'],
  },
  {
    name: 'Referrer-Policy',
    nameZh: 'Referrer 发送策略',
    category: 'security',
    direction: 'response',
    description: '控制 Referer 头的发送范围，常用值 strict-origin-when-cross-origin、no-referrer、same-origin。',
    example: 'Referrer-Policy: strict-origin-when-cross-origin',
    rfc: 'Referrer Policy（W3C）',
    hopByHop: false,
    forbidden: false,
    securityNote: '默认策略会在跨域导航中泄露完整 URL（含路径与查询参数），敏感站点建议显式收紧。',
    keywords: ['referer', '隐私', 'referrer-policy'],
  },
  {
    name: 'X-XSS-Protection',
    nameZh: '旧版 XSS 审计开关',
    category: 'security',
    direction: 'response',
    description: '早期 IE/Chrome 的 XSS 过滤器开关，现代浏览器已移除该过滤器，推荐以 CSP 替代。',
    example: 'X-XSS-Protection: 0',
    rfc: '历史遗留（已废弃）',
    hopByHop: false,
    forbidden: false,
    securityNote: '过滤器本身曾引入 XSS 漏洞，现代实践建议显式关闭（0）并部署 CSP。',
    keywords: ['xss', '废弃', 'legacy', 'x-xss-protection'],
  },
];

/** 安全实践专题区块（不参与普通条目计数，单独渲染） */
export interface SecurityPractice {
  /** 标题 */
  title: string;
  /** 涉及的头部名 */
  headers: string[];
  /** 实践说明 */
  guidance: string;
  /** 推荐配置示例 */
  example: string;
  /** 检索关键字 */
  keywords: string[];
}

/** 安全头部实践专题 */
export const SECURITY_PRACTICES: SecurityPractice[] = [
  {
    title: '基础安全响应头组合',
    headers: [
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
    ],
    guidance:
      '任何面向公网的 Web 应用都建议至少下发这五个响应头：HSTS 强制 HTTPS、CSP 限制资源来源、nosniff 禁止类型嗅探、X-Frame-Options 防点击劫持、Referrer-Policy 控制来源泄露。',
    example:
      'Strict-Transport-Security: max-age=31536000; includeSubDomains\n' +
      "Content-Security-Policy: default-src 'self'\n" +
      'X-Content-Type-Options: nosniff\n' +
      'X-Frame-Options: SAMEORIGIN\n' +
      'Referrer-Policy: strict-origin-when-cross-origin',
    keywords: ['基础', '组合', '最佳实践', '安全头'],
  },
  {
    title: 'Cookie 安全属性',
    headers: ['Set-Cookie', 'Cookie'],
    guidance:
      '会话类 Cookie 必须带 HttpOnly（阻止 JS 读取，缓解 XSS 窃取）、Secure（仅 HTTPS 发送）与 SameSite=Lax/Strict（缓解 CSRF）；跨站场景用 SameSite=None 时必须同时带 Secure。',
    example:
      'Set-Cookie: sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000',
    keywords: ['cookie', 'httponly', 'samesite', 'csrf', '会话'],
  },
  {
    title: 'CORS 与凭据的正确搭配',
    headers: [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
      'Vary',
      'Origin',
    ],
    guidance:
      '需要跨域携带 Cookie 时，Allow-Origin 不能为 *，必须回显经过白名单校验的具体 Origin，并显式返回 Allow-Credentials: true，同时追加 Vary: Origin 防止缓存串用。',
    example:
      'Access-Control-Allow-Origin: https://web.example.com\n' +
      'Access-Control-Allow-Credentials: true\n' +
      'Vary: Origin',
    keywords: ['cors', '跨域', '凭据', 'cookie', '白名单'],
  },
];

/**
 * 按关键字、分类与方向过滤头字段。
 *
 * @param keyword - 搜索关键字（头名 / 中文名 / 描述 / RFC / 关键字，大小写不敏感）
 * @param category - 分类筛选，'all' 表示不限制
 * @param direction - 方向筛选，'all' 表示不限制
 * @returns 命中的头字段数组（保持静态表顺序）
 */
export function filterHeaders(
  keyword: string,
  category: HeaderCategory | 'all' = 'all',
  direction: HeaderDirection | 'all' = 'all',
): HttpHeader[] {
  const kw = keyword.trim().toLowerCase();
  return HTTP_HEADERS.filter((header) => {
    if (category !== 'all' && header.category !== category) {
      return false;
    }
    if (direction !== 'all' && header.direction !== direction) {
      return false;
    }
    if (kw === '') {
      return true;
    }
    const haystack = [
      header.name,
      header.nameZh,
      header.description,
      header.rfc,
      header.example,
      ...header.keywords,
      header.securityNote ?? '',
    ]
      .join('\n')
      .toLowerCase();
    return haystack.includes(kw);
  });
}

/**
 * 按关键字过滤安全实践专题。
 *
 * @param keyword - 搜索关键字
 * @returns 命中的专题
 */
export function filterPractices(keyword: string): SecurityPractice[] {
  const kw = keyword.trim().toLowerCase();
  if (kw === '') {
    return SECURITY_PRACTICES;
  }
  return SECURITY_PRACTICES.filter((item) =>
    [item.title, item.guidance, item.example, ...item.keywords, ...item.headers]
      .join('\n')
      .toLowerCase()
      .includes(kw),
  );
}
