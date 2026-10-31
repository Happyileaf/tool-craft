/**
 * 知名 TCP/UDP 端口速查核心逻辑：
 * 内置 IANA 长期稳定条目的静态数据集与纯函数查询，不依赖 DOM / 网络。
 */

/** 传输协议 */
export type PortProtocol = 'tcp' | 'udp';

/** 端口区间分类 */
export type PortRangeKey = 'well-known' | 'registered' | 'dynamic';

/** 单条端口记录 */
export interface PortEntry {
  /** 端口号（0–65535） */
  port: number;
  /** 该端口上的传输协议 */
  protocols: PortProtocol[];
  /** 官方服务名（小写，如 ssh、https）；事实标准端口标注实际用途名 */
  name: string;
  /** 中文用途说明 */
  nameZh: string;
  /** 检索关键词（服务名别名、中文关键字等） */
  keywords: string[];
  /** 是否为 IANA 正式分配条目；false 表示生态事实默认端口 */
  official: boolean;
}

/** 校验成功结果 */
export interface PortValid {
  ok: true;
  /** 解析后的端口号 */
  value: number;
}

/** 校验失败结果 */
export interface PortInvalid {
  ok: false;
  /** 面向用户的错误说明 */
  error: string;
}

/** 端口输入校验结果 */
export type PortValidation = PortValid | PortInvalid;

/** 端口区间信息 */
export interface PortRangeInfo {
  key: PortRangeKey;
  /** 区间名（中文） */
  label: string;
  /** 区间数字范围说明 */
  range: string;
}

/**
 * IANA 长期稳定端口条目（附少量生态事实默认端口，official=false 并在 UI 标注）。
 * 数据截至 2026-10，仅收录一经分配极少回收的稳定条目。
 */
export const PORT_ENTRIES: PortEntry[] = [
  { port: 20, protocols: ['tcp'], name: 'ftp-data', nameZh: 'FTP 文件传输（数据通道）', keywords: ['ftp', '文件传输', '主动模式'], official: true },
  { port: 21, protocols: ['tcp'], name: 'ftp', nameZh: 'FTP 文件传输（控制通道）', keywords: ['ftp', '文件传输', '命令'], official: true },
  { port: 22, protocols: ['tcp'], name: 'ssh', nameZh: 'SSH 远程登录 / SCP / SFTP', keywords: ['ssh', 'scp', 'sftp', '远程登录', '安全外壳'], official: true },
  { port: 23, protocols: ['tcp'], name: 'telnet', nameZh: 'Telnet 明文远程终端', keywords: ['telnet', '远程终端', '明文'], official: true },
  { port: 25, protocols: ['tcp'], name: 'smtp', nameZh: 'SMTP 邮件发送（明文）', keywords: ['smtp', '邮件', 'email', '发送'], official: true },
  { port: 53, protocols: ['tcp', 'udp'], name: 'domain', nameZh: 'DNS 域名解析', keywords: ['dns', 'domain', '域名', '域名解析'], official: true },
  { port: 67, protocols: ['udp'], name: 'bootps', nameZh: 'DHCP 服务器（BOOTPS）', keywords: ['dhcp', 'bootp', '动态主机', '分配ip'], official: true },
  { port: 68, protocols: ['udp'], name: 'bootpc', nameZh: 'DHCP 客户端（BOOTPC）', keywords: ['dhcp', 'bootp', '动态主机', '客户端'], official: true },
  { port: 69, protocols: ['udp'], name: 'tftp', nameZh: 'TFTP 简单文件传输', keywords: ['tftp', '简单文件传输', 'pxe'], official: true },
  { port: 80, protocols: ['tcp'], name: 'http', nameZh: 'HTTP 网页浏览', keywords: ['http', 'web', '网页', 'nginx', 'apache'], official: true },
  { port: 110, protocols: ['tcp'], name: 'pop3', nameZh: 'POP3 邮件接收（明文）', keywords: ['pop3', '邮件', 'email', '收信'], official: true },
  { port: 123, protocols: ['udp'], name: 'ntp', nameZh: 'NTP 网络时间同步', keywords: ['ntp', '时间同步', '校时', 'clock'], official: true },
  { port: 143, protocols: ['tcp'], name: 'imap', nameZh: 'IMAP 邮件访问（明文）', keywords: ['imap', '邮件', 'email', '收件'], official: true },
  { port: 161, protocols: ['udp'], name: 'snmp', nameZh: 'SNMP 简单网络管理', keywords: ['snmp', '网络管理', '监控', '网管'], official: true },
  { port: 443, protocols: ['tcp'], name: 'https', nameZh: 'HTTPS 加密网页浏览', keywords: ['https', 'http over tls', 'web', '网页', 'tls', 'ssl'], official: true },
  { port: 465, protocols: ['tcp'], name: 'submissions', nameZh: 'SMTPS 加密邮件发送', keywords: ['smtps', 'smtp over tls', '邮件', 'email', 'ssl'], official: true },
  { port: 500, protocols: ['udp'], name: 'isakmp', nameZh: 'IPSec / IKE 密钥协商', keywords: ['ipsec', 'ike', 'isakmp', 'vpn', '密钥协商'], official: true },
  { port: 587, protocols: ['tcp'], name: 'submission', nameZh: 'SMTP 邮件提交（STARTTLS）', keywords: ['submission', 'smtp', '邮件', 'email', 'starttls'], official: true },
  { port: 993, protocols: ['tcp'], name: 'imaps', nameZh: 'IMAPS 加密邮件访问', keywords: ['imaps', 'imap over tls', '邮件', 'email', 'ssl'], official: true },
  { port: 995, protocols: ['tcp'], name: 'pop3s', nameZh: 'POP3S 加密邮件接收', keywords: ['pop3s', 'pop3 over tls', '邮件', 'email', 'ssl'], official: true },
  { port: 3306, protocols: ['tcp'], name: 'mysql', nameZh: 'MySQL 数据库', keywords: ['mysql', '数据库', 'database', 'rds'], official: true },
  { port: 3389, protocols: ['tcp'], name: 'ms-wbt-server', nameZh: 'RDP Windows 远程桌面', keywords: ['rdp', '远程桌面', 'windows', 'terminal'], official: true },
  { port: 5432, protocols: ['tcp'], name: 'postgresql', nameZh: 'PostgreSQL 数据库', keywords: ['postgresql', 'postgres', 'pgsql', '数据库', 'database'], official: true },
  { port: 5601, protocols: ['tcp'], name: 'kibana', nameZh: 'Kibana 控制台（事实默认端口）', keywords: ['kibana', 'elasticsearch', 'es', '日志', '事实标准'], official: false },
  { port: 5672, protocols: ['tcp'], name: 'amqp', nameZh: 'AMQP 消息队列（RabbitMQ）', keywords: ['amqp', 'rabbitmq', '消息队列', 'mq'], official: true },
  { port: 6379, protocols: ['tcp'], name: 'redis', nameZh: 'Redis 缓存 / 键值数据库', keywords: ['redis', '缓存', 'cache', '键值', 'nosql'], official: true },
  { port: 8080, protocols: ['tcp'], name: 'http-alt', nameZh: 'HTTP 备用端口（常见 Web 代理 / 应用）', keywords: ['http-alt', 'http proxy', 'tomcat', '代理', '备用web'], official: true },
  { port: 8443, protocols: ['tcp'], name: 'https-alt', nameZh: 'HTTPS 备用端口（常见管理后台）', keywords: ['https-alt', '管理后台', '备用https', 'tomcat'], official: true },
  { port: 9200, protocols: ['tcp'], name: 'elasticsearch', nameZh: 'Elasticsearch REST API（事实默认端口）', keywords: ['elasticsearch', 'es', '搜索引擎', '9200', '事实标准'], official: false },
  { port: 27017, protocols: ['tcp'], name: 'mongod', nameZh: 'MongoDB 数据库', keywords: ['mongodb', 'mongo', 'mongod', '数据库', 'nosql', 'document'], official: true },
];

/** 端口号 → 记录的索引（同一端口只有一条聚合记录） */
const PORT_INDEX = new Map<number, PortEntry>(
  PORT_ENTRIES.map((entry) => [entry.port, entry]),
);

/**
 * 校验端口输入：接受数字或数字字符串，拒绝空值、非数字、小数、越界值。
 *
 * @param input - 原始输入（数字或字符串）
 * @returns 校验成功（含端口号）或失败（含错误说明）
 */
export function validatePort(input: number | string): PortValidation {
  if (typeof input === 'number') {
    if (!Number.isInteger(input)) {
      return { ok: false, error: '端口号必须是整数' };
    }
    if (input < 0 || input > 65535) {
      return { ok: false, error: '端口号必须在 0–65535 之间' };
    }
    return { ok: true, value: input };
  }

  const text = input.trim();
  if (text === '') {
    return { ok: false, error: '请输入端口号' };
  }
  if (!/^\d+$/.test(text)) {
    return { ok: false, error: '端口号只能包含数字' };
  }
  const value = Number(text);
  if (value > 65535) {
    return { ok: false, error: '端口号必须在 0–65535 之间' };
  }
  return { ok: true, value };
}

/**
 * 按端口号精确查询收录的服务。
 *
 * @param port - 端口号（0–65535）
 * @returns 命中的端口记录；未收录返回 null
 */
export function lookupPort(port: number): PortEntry | null {
  return PORT_INDEX.get(port) ?? null;
}

/**
 * 判定端口所属区间：well-known 0–1023 / registered 1024–49151 / dynamic 49152–65535。
 *
 * @param port - 合法端口号
 * @returns 区间信息
 */
export function getPortRange(port: number): PortRangeInfo {
  if (port <= 1023) {
    return { key: 'well-known', label: '知名端口', range: '0–1023' };
  }
  if (port <= 49151) {
    return { key: 'registered', label: '已注册端口', range: '1024–49151' };
  }
  return { key: 'dynamic', label: '动态 / 私有端口', range: '49152–65535' };
}

/**
 * 判断单条记录是否命中关键词（服务名、中文名、关键词、端口字符串，大小写不敏感）。
 *
 * @param entry - 端口记录
 * @param normalized - 已小写化的关键词
 * @returns 是否命中
 */
function matchesKeyword(entry: PortEntry, normalized: string): boolean {
  if (String(entry.port) === normalized) {
    return true;
  }
  if (entry.name.toLowerCase().includes(normalized)) {
    return true;
  }
  if (entry.nameZh.toLowerCase().includes(normalized)) {
    return true;
  }
  return entry.keywords.some((keyword) =>
    keyword.toLowerCase().includes(normalized),
  );
}

/**
 * 关键词模糊搜索端口条目；空关键词返回全部条目（按端口号升序）。
 *
 * @param keyword - 服务名 / 中文用途 / 端口字符串
 * @returns 命中的端口记录列表
 */
export function searchPorts(keyword: string): PortEntry[] {
  const normalized = keyword.trim().toLowerCase();
  if (normalized === '') {
    return PORT_ENTRIES;
  }
  if (/^\d+$/.test(normalized)) {
    const exact = PORT_INDEX.get(Number(normalized));
    return exact ? [exact] : [];
  }
  return PORT_ENTRIES.filter((entry) => matchesKeyword(entry, normalized));
}

/**
 * 把整段输入拆成词条（支持空格、逗号、中文逗号、顿号、换行、分号分隔）。
 *
 * @param input - 搜索框原始文本
 * @returns 非空词条数组
 */
export function tokenizeInput(input: string): string[] {
  return input
    .split(/[\s,;，、；]+/)
    .map((token) => token.trim())
    .filter((token) => token !== '');
}
