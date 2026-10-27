/**
 * HTTP 状态码速查：静态数据表与纯函数检索 / 过滤 / 分组逻辑。
 *
 * 数据覆盖 IANA 注册的常见标准状态码（100–511），全部检索均为确定性
 * 纯函数：不触碰 DOM、不发起网络请求、零新增依赖。
 */

/** 状态码分类（百位段） */
export type StatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

/** HTTP 状态码条目 */
export interface HttpStatus {
  /** 三位数字状态码 */
  code: number;
  /** 英文 Reason-Phrase（IANA 注册名） */
  name: string;
  /** 中文含义 */
  nameZh: string;
  /** 百位段分类 */
  category: StatusClass;
  /** 典型触发场景 */
  scenario: string;
  /** 排错建议 */
  troubleshooting: string;
  /** 是否可安全重试：true 可重试，false 不应直接重试，null 视情况 / 不适用 */
  retryable: boolean | null;
}

/**
 * IANA 常见标准状态码静态表（100–511）。
 * 306 为已保留但未使用的状态码，保留条目以保证 3xx 段完整。
 */
export const HTTP_STATUSES: HttpStatus[] = [
  // ---- 1xx 信息响应 ----
  {
    code: 100,
    name: 'Continue',
    nameZh: '继续',
    category: '1xx',
    scenario: '客户端发送带 Expect: 100-continue 的请求体前，服务器告知可以继续发送请求体。',
    troubleshooting: '属于协议中间响应，无需处理；客户端收到后继续发送剩余请求体即可。',
    retryable: null,
  },
  {
    code: 101,
    name: 'Switching Protocols',
    nameZh: '切换协议',
    category: '1xx',
    scenario: '服务器同意客户端的 Upgrade 请求（如 HTTP/1.1 升级到 WebSocket）。',
    troubleshooting: '检查 Upgrade 与 Connection 头是否正确；握手成功后连接将切换为新协议。',
    retryable: null,
  },
  {
    code: 102,
    name: 'Processing',
    nameZh: '处理中',
    category: '1xx',
    scenario: 'WebDAV 请求已受理但尚未完成，服务器借此告知客户端保持等待。',
    troubleshooting: '客户端应继续等待最终响应，不要超时后立即重试。',
    retryable: null,
  },
  {
    code: 103,
    name: 'Early Hints',
    nameZh: '早期提示',
    category: '1xx',
    scenario: '服务器在最终响应前返回 Link 头，提示浏览器预加载关键资源。',
    troubleshooting: '仅用于性能优化，最终状态以后续正式响应为准。',
    retryable: null,
  },

  // ---- 2xx 成功响应 ----
  {
    code: 200,
    name: 'OK',
    nameZh: '成功',
    category: '2xx',
    scenario: '请求成功，GET / POST 等常规请求最常见的成功响应。',
    troubleshooting: '无需处理；确认响应体符合接口约定即可。',
    retryable: null,
  },
  {
    code: 201,
    name: 'Created',
    nameZh: '已创建',
    category: '2xx',
    scenario: 'POST 创建资源成功（如新建订单、上传文件），通常伴随 Location 头指向新资源。',
    troubleshooting: '无需处理；可从 Location 头获取新资源地址，避免重复提交。',
    retryable: null,
  },
  {
    code: 202,
    name: 'Accepted',
    nameZh: '已接受',
    category: '2xx',
    scenario: '请求已受理但尚未处理完成，常见于异步任务（队列、批处理）。',
    troubleshooting: '通过任务 ID 或回调轮询最终结果；不代表业务已成功。',
    retryable: null,
  },
  {
    code: 203,
    name: 'Non-Authoritative Information',
    nameZh: '非权威信息',
    category: '2xx',
    scenario: '代理 / 网关返回了经过修改的内容，而非源服务器的原始响应。',
    troubleshooting: '确认中间代理是否按预期改写了响应；需要原始数据时直连源站核对。',
    retryable: null,
  },
  {
    code: 204,
    name: 'No Content',
    nameZh: '无内容',
    category: '2xx',
    scenario: 'DELETE / PUT 成功但无响应体，或仅做状态更新的接口。',
    troubleshooting: '成功但没有响应体，前端不要尝试解析 JSON。',
    retryable: null,
  },
  {
    code: 205,
    name: 'Reset Content',
    nameZh: '重置内容',
    category: '2xx',
    scenario: '请求成功且要求客户端重置表单 / 文档视图。',
    troubleshooting: '按语义清空用户输入的表单，不展示新内容。',
    retryable: null,
  },
  {
    code: 206,
    name: 'Partial Content',
    nameZh: '部分内容',
    category: '2xx',
    scenario: '断点续传 / Range 请求成功，服务器返回指定区间的资源片段。',
    troubleshooting: '核对 Content-Range 与 Content-Length；多区间下载注意 boundary 分隔。',
    retryable: null,
  },
  {
    code: 207,
    name: 'Multi-Status',
    nameZh: '多状态',
    category: '2xx',
    scenario: 'WebDAV 批量操作（如一次操作多个文件），响应体内逐个子资源给出状态。',
    troubleshooting: '需逐个解析响应体内各资源的状态码，不能只看整体 207。',
    retryable: null,
  },
  {
    code: 208,
    name: 'Already Reported',
    nameZh: '已报告',
    category: '2xx',
    scenario: 'WebDAV 的 207 响应中，同一集合成员被重复遍历时只报告一次。',
    troubleshooting: '属于去重优化，客户端按首次报告处理即可。',
    retryable: null,
  },
  {
    code: 226,
    name: 'IM Used',
    nameZh: '已应用实例操作',
    category: '2xx',
    scenario: '服务器已按 A-IM 头对资源应用实例操作（delta encoding）后返回。',
    troubleshooting: '较少见；确认客户端能否正确处理增量编码内容。',
    retryable: null,
  },

  // ---- 3xx 重定向 ----
  {
    code: 300,
    name: 'Multiple Choices',
    nameZh: '多种选择',
    category: '3xx',
    scenario: '请求的资源有多个可选表示（如多种格式 / 语言版本）。',
    troubleshooting: '从响应体或 Location 中选择合适的资源地址。',
    retryable: null,
  },
  {
    code: 301,
    name: 'Moved Permanently',
    nameZh: '永久重定向',
    category: '3xx',
    scenario: '资源已永久移动到新地址，Location 头给出目标 URL。',
    troubleshooting: '更新书签、链接与搜索引擎入口；浏览器 / 爬虫会缓存该重定向。',
    retryable: null,
  },
  {
    code: 302,
    name: 'Found',
    nameZh: '临时重定向（找到）',
    category: '3xx',
    scenario: '资源临时位于其他地址，常见于登录跳转、活动页临时迁移。',
    troubleshooting: '按 Location 临时跳转；不要更新原始链接，历史实现可能将 POST 改写为 GET。',
    retryable: null,
  },
  {
    code: 303,
    name: 'See Other',
    nameZh: '参见其他',
    category: '3xx',
    scenario: 'POST / PUT 后引导客户端以 GET 访问另一个 URL（如 PRG 模式防止重复提交）。',
    troubleshooting: '按 Location 以 GET 方式获取结果页即可。',
    retryable: null,
  },
  {
    code: 304,
    name: 'Not Modified',
    nameZh: '未修改',
    category: '3xx',
    scenario: '协商缓存命中：带 If-None-Match / If-Modified-Since 的请求资源未变化。',
    troubleshooting: '属正常缓存机制，客户端直接使用本地缓存副本。',
    retryable: null,
  },
  {
    code: 305,
    name: 'Use Proxy',
    nameZh: '使用代理',
    category: '3xx',
    scenario: '历史状态码，要求通过指定代理访问资源；已因安全问题被废弃。',
    troubleshooting: '现代浏览器会忽略；服务端不应再返回此状态码。',
    retryable: null,
  },
  {
    code: 306,
    name: '(Unused)',
    nameZh: '保留未使用',
    category: '3xx',
    scenario: '曾在早期规范中保留（Switch Proxy），目前 IANA 登记为未使用。',
    troubleshooting: '不会在实际通信中出现；收到说明是非标准实现，按异常响应排查。',
    retryable: null,
  },
  {
    code: 307,
    name: 'Temporary Redirect',
    nameZh: '临时重定向',
    category: '3xx',
    scenario: '资源临时迁移，且明确要求保持原请求方法与请求体重定向。',
    troubleshooting: '按 Location 跳转并保留 POST 等原方法；临时地址不要更新收藏。',
    retryable: null,
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    nameZh: '永久重定向',
    category: '3xx',
    scenario: '资源永久迁移，且要求保持原请求方法与请求体（301 的方法安全版本）。',
    troubleshooting: '更新原始链接；客户端可缓存该重定向。',
    retryable: null,
  },

  // ---- 4xx 客户端错误 ----
  {
    code: 400,
    name: 'Bad Request',
    nameZh: '错误请求',
    category: '4xx',
    scenario: '请求语法错误、参数缺失或校验失败（如 JSON 格式错误、类型不匹配）。',
    troubleshooting: '检查请求行、请求头与请求体格式，对照接口文档核对参数。',
    retryable: false,
  },
  {
    code: 401,
    name: 'Unauthorized',
    nameZh: '未授权（未认证）',
    category: '4xx',
    scenario: '缺少或携带了无效的认证信息（Token 过期、未登录）。',
    troubleshooting: '补充 / 刷新 Authorization 凭证后重新发起；语义是“未认证”而非“无权限”。',
    retryable: false,
  },
  {
    code: 402,
    name: 'Payment Required',
    nameZh: '需要付款',
    category: '4xx',
    scenario: '保留给付费场景，部分支付 / 限流服务商用来表示账户欠费或额度用尽。',
    troubleshooting: '按业务方文档完成支付 / 充值后再试。',
    retryable: false,
  },
  {
    code: 403,
    name: 'Forbidden',
    nameZh: '禁止访问',
    category: '4xx',
    scenario: '已认证但没有该资源的访问权限，或被 WAF / IP 黑白名单拦截。',
    troubleshooting: '核对账号权限、资源归属与访问控制策略；重新登录通常无效。',
    retryable: false,
  },
  {
    code: 404,
    name: 'Not Found',
    nameZh: '未找到',
    category: '4xx',
    scenario: '请求的 URL 不存在，或资源已被删除；也可能被服务端用来隐藏无权访问的资源。',
    troubleshooting: '核对路径拼写、版本前缀与资源 ID；确认资源是否已删除。',
    retryable: false,
  },
  {
    code: 405,
    name: 'Method Not Allowed',
    nameZh: '方法不允许',
    category: '4xx',
    scenario: 'URL 存在但不支持该 HTTP 方法，如对只读接口发 POST。',
    troubleshooting: '查看 Allow 响应头列出的允许方法，改用正确方法。',
    retryable: false,
  },
  {
    code: 406,
    name: 'Not Acceptable',
    nameZh: '不可接受',
    category: '4xx',
    scenario: '服务器无法满足 Accept / Accept-Language 等协商头要求的内容格式。',
    troubleshooting: '放宽或修正 Accept 头（如改为 application/json）。',
    retryable: false,
  },
  {
    code: 407,
    name: 'Proxy Authentication Required',
    nameZh: '需要代理认证',
    category: '4xx',
    scenario: '请求经过的代理服务器要求认证（Proxy-Authorization 缺失或无效）。',
    troubleshooting: '配置正确的代理凭证；排查企业代理 / 抓包工具设置。',
    retryable: false,
  },
  {
    code: 408,
    name: 'Request Timeout',
    nameZh: '请求超时',
    category: '4xx',
    scenario: '服务器等待请求体超时，客户端发送过慢或网络拥塞。',
    troubleshooting: '检查网络与请求体大小；幂等请求可直接重试，非幂等请求确认状态后再试。',
    retryable: true,
  },
  {
    code: 409,
    name: 'Conflict',
    nameZh: '冲突',
    category: '4xx',
    scenario: '请求与服务器当前状态冲突，如乐观锁版本不一致、重复创建唯一资源。',
    troubleshooting: '先拉取最新状态、解决冲突后再提交；不要盲目重试同一请求。',
    retryable: false,
  },
  {
    code: 410,
    name: 'Gone',
    nameZh: '已永久删除',
    category: '4xx',
    scenario: '资源曾存在但已永久移除，且不会再恢复。',
    troubleshooting: '移除指向该资源的链接；比 404 更明确地表示终结。',
    retryable: false,
  },
  {
    code: 411,
    name: 'Length Required',
    nameZh: '需要 Content-Length',
    category: '4xx',
    scenario: '服务器要求请求带 Content-Length 头，而客户端使用了分块传输或缺失该头。',
    troubleshooting: '补充正确的 Content-Length 头。',
    retryable: false,
  },
  {
    code: 412,
    name: 'Precondition Failed',
    nameZh: '前提条件失败',
    category: '4xx',
    scenario: 'If-Match / If-Unmodified-Since 等前提头不满足，常用于乐观并发控制。',
    troubleshooting: '资源已被他人修改，重新获取最新版本与 ETag 后再提交。',
    retryable: false,
  },
  {
    code: 413,
    name: 'Content Too Large',
    nameZh: '请求体过大',
    category: '4xx',
    scenario: '上传的文件 / 请求体超过服务器限制（nginx client_max_body_size 等）。',
    troubleshooting: '压缩 / 分片上传，或调大服务端 body 大小限制。',
    retryable: false,
  },
  {
    code: 414,
    name: 'URI Too Long',
    nameZh: 'URI 过长',
    category: '4xx',
    scenario: '请求 URL 超长，常见于把大量数据误拼进 query string。',
    troubleshooting: '将参数改为放入请求体，缩短路径与查询串。',
    retryable: false,
  },
  {
    code: 415,
    name: 'Unsupported Media Type',
    nameZh: '不支持的媒体类型',
    category: '4xx',
    scenario: 'Content-Type 不被接口支持，如接口要求 application/json 却传了 text/plain。',
    troubleshooting: '设置正确的 Content-Type（含 charset），核对接口文档。',
    retryable: false,
  },
  {
    code: 416,
    name: 'Range Not Satisfiable',
    nameZh: '范围无法满足',
    category: '4xx',
    scenario: 'Range 请求的字节区间超出资源实际大小（如下载偏移超过文件长度）。',
    troubleshooting: '重新获取资源大小（Content-Length）后修正 Range。',
    retryable: false,
  },
  {
    code: 417,
    name: 'Expectation Failed',
    nameZh: '期望失败',
    category: '4xx',
    scenario: '服务器无法满足 Expect 请求头的期望（如 Expect: 100-continue）。',
    troubleshooting: '移除或修改 Expect 头后重试。',
    retryable: false,
  },
  {
    code: 418,
    name: "I'm a Teapot",
    nameZh: '我是一个茶壶',
    category: '4xx',
    scenario: 'HTCPCP 玩笑状态码（RFC 2324）；部分站点用作彩蛋或拒绝爬虫。',
    troubleshooting: '不是真实协议错误；若业务接口返回它，检查服务端自定义逻辑。',
    retryable: false,
  },
  {
    code: 421,
    name: 'Misdirected Request',
    nameZh: '错误定向的请求',
    category: '4xx',
    scenario: '请求被发往无法产生响应的服务器（如连接复用指向了错误的虚拟主机 / SNI）。',
    troubleshooting: '核对 Host、SNI 与连接复用配置，改用正确目标连接重试。',
    retryable: true,
  },
  {
    code: 422,
    name: 'Unprocessable Content',
    nameZh: '无法处理的内容',
    category: '4xx',
    scenario: '请求体语法正确但语义错误（WebDAV / REST API 常用于业务校验失败）。',
    troubleshooting: '根据响应体内字段级错误信息修正业务参数。',
    retryable: false,
  },
  {
    code: 423,
    name: 'Locked',
    nameZh: '资源已锁定',
    category: '4xx',
    scenario: 'WebDAV 资源被加锁，当前操作被拒绝。',
    troubleshooting: '等待锁释放或使用正确的锁令牌。',
    retryable: false,
  },
  {
    code: 424,
    name: 'Failed Dependency',
    nameZh: '依赖失败',
    category: '4xx',
    scenario: 'WebDAV 事务中所依赖的另一个操作失败，导致本操作无法执行。',
    troubleshooting: '先修复被依赖操作的错误，再重新执行整组操作。',
    retryable: false,
  },
  {
    code: 425,
    name: 'Too Early',
    nameZh: '过早发送请求',
    category: '4xx',
    scenario: '服务器不愿在 TLS 早期数据阶段处理可能重放的请求。',
    troubleshooting: '等待握手完成后重发；不要对非幂等请求启用 0-RTT。',
    retryable: false,
  },
  {
    code: 426,
    name: 'Upgrade Required',
    nameZh: '需要升级协议',
    category: '4xx',
    scenario: '服务器拒绝当前协议，要求通过 Upgrade 头切换（如强制 TLS / WebSocket）。',
    troubleshooting: '按 Upgrade 头切换协议后重新连接。',
    retryable: false,
  },
  {
    code: 428,
    name: 'Precondition Required',
    nameZh: '需要前提条件',
    category: '4xx',
    scenario: '服务器要求带条件请求头（If-Match 等），防止并发更新造成丢失更新。',
    troubleshooting: '先 GET 获取 ETag，再在写请求中带上对应条件头。',
    retryable: false,
  },
  {
    code: 429,
    name: 'Too Many Requests',
    nameZh: '请求过多（限流）',
    category: '4xx',
    scenario: '触发接口限流：单位时间内请求次数或并发数超限。',
    troubleshooting: '按 Retry-After 头退避重试；实现指数退避与限频，避免继续猛打。',
    retryable: true,
  },
  {
    code: 431,
    name: 'Request Header Fields Too Large',
    nameZh: '请求头字段过大',
    category: '4xx',
    scenario: 'Cookie 过大或单个 / 整体请求头超过服务器限制。',
    troubleshooting: '精简 Cookie 与自定义头，或调大服务端头部缓冲区限制。',
    retryable: false,
  },
  {
    code: 451,
    name: 'Unavailable For Legal Reasons',
    nameZh: '因法律原因不可用',
    category: '4xx',
    scenario: '内容因法律法规要求被下架（如地区屏蔽、版权封禁）。',
    troubleshooting: '属合规性拒绝，重试无效；可从响应头了解封禁主体与原因。',
    retryable: false,
  },

  // ---- 5xx 服务器错误 ----
  {
    code: 500,
    name: 'Internal Server Error',
    nameZh: '服务器内部错误',
    category: '5xx',
    scenario: '服务器遇到未预期的异常（代码 bug、空指针、下游报错未兜底）。',
    troubleshooting: '查看服务端日志与链路追踪定位异常；幂等请求可稍后重试，非幂等需先确认状态。',
    retryable: null,
  },
  {
    code: 501,
    name: 'Not Implemented',
    nameZh: '未实现',
    category: '5xx',
    scenario: '服务器不支持请求所需的功能 / 方法。',
    troubleshooting: '确认接口是否已上线、方法是否被该服务支持。',
    retryable: false,
  },
  {
    code: 502,
    name: 'Bad Gateway',
    nameZh: '错误网关',
    category: '5xx',
    scenario: '网关 / 反向代理从上游收到了非法响应（上游崩溃、协议错误、连接被重置）。',
    troubleshooting: '排查上游服务健康状态、超时配置与网关错误日志；短暂故障可重试。',
    retryable: true,
  },
  {
    code: 503,
    name: 'Service Unavailable',
    nameZh: '服务不可用',
    category: '5xx',
    scenario: '服务临时过载、停机维护或健康检查失败，常伴随 Retry-After 头。',
    troubleshooting: '按 Retry-After 退避重试；检查容量、发布状态与健康检查。',
    retryable: true,
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    nameZh: '网关超时',
    category: '5xx',
    scenario: '网关 / 代理等待上游响应超时（上游处理过慢、网络不通）。',
    troubleshooting: '排查上游耗时、慢查询与网关超时阈值；幂等请求可重试。',
    retryable: true,
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    nameZh: 'HTTP 版本不受支持',
    category: '5xx',
    scenario: '服务器不支持请求使用的 HTTP 协议版本。',
    troubleshooting: '改用服务器支持的 HTTP 版本（如回退到 HTTP/1.1）。',
    retryable: false,
  },
  {
    code: 506,
    name: 'Variant Also Negotiates',
    nameZh: '内容协商循环',
    category: '5xx',
    scenario: '透明内容协商配置错误，服务器自身被配置成了协商变体，形成循环。',
    troubleshooting: '修正服务端内容协商（variant）配置。',
    retryable: false,
  },
  {
    code: 507,
    name: 'Insufficient Storage',
    nameZh: '存储空间不足',
    category: '5xx',
    scenario: 'WebDAV 服务器无法存储完成请求所需的数据（磁盘 / 配额已满）。',
    troubleshooting: '清理空间、扩容或调整配额后重试。',
    retryable: false,
  },
  {
    code: 508,
    name: 'Loop Detected',
    nameZh: '检测到循环',
    category: '5xx',
    scenario: 'WebDAV 操作在内部集合映射中陷入无限循环。',
    troubleshooting: '检查资源映射 / 软链接是否形成环并解除。',
    retryable: false,
  },
  {
    code: 510,
    name: 'Not Extended',
    nameZh: '需要扩展',
    category: '5xx',
    scenario: '服务器要求请求进一步扩展（如附加协商策略）才能处理。',
    troubleshooting: '按响应声明补充所需扩展；该状态码很少使用。',
    retryable: false,
  },
  {
    code: 511,
    name: 'Network Authentication Required',
    nameZh: '需要网络认证',
    category: '5xx',
    scenario: ' captive portal 场景：需先登录 Wi-Fi / 完成网页认证才能访问网络。',
    troubleshooting: '在浏览器打开任意 HTTP 页面完成门户登录后再请求。',
    retryable: true,
  },
];

/** 分类展示顺序 */
export const STATUS_CLASSES: StatusClass[] = ['1xx', '2xx', '3xx', '4xx', '5xx'];

/**
 * 根据三位数字状态码计算百位段分类。
 *
 * @param code - 状态码数字
 * @returns 百位段分类；不在 100–599 范围时返回 null
 */
export function getStatusClass(code: number): StatusClass | null {
  if (!Number.isInteger(code) || code < 100 || code >= 600) {
    return null;
  }
  const index = Math.floor(code / 100) - 1;
  return STATUS_CLASSES[index] ?? null;
}

/**
 * 按状态码精确查找条目。
 *
 * @param code - 状态码数字
 * @returns 对应条目；未收录时返回 undefined
 */
export function getStatusByCode(code: number): HttpStatus | undefined {
  return HTTP_STATUSES.find((status) => status.code === code);
}

/**
 * 关键词检索：纯数字时按状态码前缀匹配（如 404、4），
 * 否则在英文名称、中文含义、典型场景、排错建议中做大小写不敏感的模糊匹配。
 *
 * @param query - 检索输入
 * @returns 命中的状态码条目集合（按编号升序）；非法 / 空输入返回空数组，不抛异常
 */
export function searchStatuses(query: string): HttpStatus[] {
  const normalized = (query ?? '').trim();
  if (!normalized) {
    return [];
  }
  // 限制检索词长度，避免异常输入造成无意义遍历
  const keyword = normalized.slice(0, 100);

  if (/^\d+$/.test(keyword)) {
    return HTTP_STATUSES.filter((status) => String(status.code).startsWith(keyword)).sort(
      (a, b) => a.code - b.code,
    );
  }

  const haystack = keyword.toLowerCase();
  return HTTP_STATUSES.filter((status) => {
    const searchable = [
      status.name,
      status.nameZh,
      status.scenario,
      status.troubleshooting,
    ]
      .join('\n')
      .toLowerCase();
    return searchable.includes(haystack);
  }).sort((a, b) => a.code - b.code);
}

/**
 * 检索 + 分类过滤组合。
 *
 * @param query - 检索输入（编号前缀或关键词），空白表示不做关键词过滤
 * @param category - 百位段分类；'all' 表示不限分类
 * @returns 过滤后的状态码条目集合
 */
export function filterStatuses(
  query: string,
  category: StatusClass | 'all' = 'all',
): HttpStatus[] {
  const normalized = (query ?? '').trim();
  const matched = normalized ? searchStatuses(normalized) : [...HTTP_STATUSES];
  if (category === 'all') {
    return matched.sort((a, b) => a.code - b.code);
  }
  return matched
    .filter((status) => status.category === category)
    .sort((a, b) => a.code - b.code);
}

/**
 * 按百位段对状态码条目分组。
 *
 * @param entries - 待分组的状态码条目
 * @returns 以 1xx–5xx 为键的分组结果（始终包含全部分类键，无数据时为空数组）
 */
export function groupByCategory(entries: HttpStatus[]): Record<StatusClass, HttpStatus[]> {
  const groups: Record<StatusClass, HttpStatus[]> = {
    '1xx': [],
    '2xx': [],
    '3xx': [],
    '4xx': [],
    '5xx': [],
  };
  for (const entry of entries) {
    groups[entry.category].push(entry);
  }
  for (const key of STATUS_CLASSES) {
    groups[key].sort((a, b) => a.code - b.code);
  }
  return groups;
}
