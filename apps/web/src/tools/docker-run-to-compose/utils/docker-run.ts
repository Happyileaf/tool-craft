/**
 * `docker run` 命令到 docker-compose.yml 服务定义转换的纯函数实现。
 *
 * 设计取舍：
 * - 使用 shell 词法切分（支持单引号、双引号、反斜杠转义），不依赖外部 shell
 * - 支持短选项（-p/-v/-e 等）与长选项（--name/--restart 等），含 `--opt=value` 形式
 * - 每个 docker run 仅映射为 compose 中的一个服务，服务名取 --name 或镜像名派生
 * - 输出 YAML 由本模块手工缩进生成，零新增依赖；值按 YAML 1.1 纯量安全规则决定是否加引号
 */

/** 解析结果 */
export type ParseResult =
  | { ok: true; service: ComposeService; warnings: string[] }
  | { ok: false; error: string };

/** 归一化后的 compose 服务定义 */
export interface ComposeService {
  name: string;
  image: string;
  command?: string;
  containerName?: string;
  restart?: string;
  networkMode?: string;
  hostname?: string;
  user?: string;
  workingDir?: string;
  entrypoint?: string;
  privileged?: boolean;
  init?: boolean;
  readOnly?: boolean;
  stdinOpen?: boolean;
  tty?: boolean;
  remove?: boolean;
  ports: string[];
  volumes: string[];
  environment: Record<string, string>;
  envFiles: string[];
  labels: Record<string, string>;
  capAdd: string[];
  capDrop: string[];
  devices: string[];
  dns: string[];
  extraHosts: string[];
  tmpfs: string[];
  sysctls: Record<string, string>;
  ulimits: Record<string, string>;
  memLimit?: string;
  cpus?: number;
  healthCheck?: Record<string, unknown>;
  logs?: Record<string, unknown>;
}

/**
 * Shell 风格词法切分：处理双引号、单引号与反斜杠转义。
 *
 * @param input - 原始命令字符串
 * @returns token 数组
 */
export function tokenizeShell(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let hasContent = false;
  let index = 0;

  const push = () => {
    if (hasContent) {
      tokens.push(current);
      current = '';
      hasContent = false;
    }
  };

  while (index < input.length) {
    const char = input[index];
    if (char === undefined) {
      break;
    }
    if (/\s/.test(char)) {
      push();
      index += 1;
      continue;
    }
    if (char === '\\') {
      const next = input[index + 1];
      if (next !== undefined) {
        // 行尾反斜杠是 shell 续行，等价于分隔符；其余反斜杠按转义处理
        if (next === '\n' || next === '\r') {
          push();
          index += next === '\r' && input[index + 2] === '\n' ? 3 : 2;
          continue;
        }
        current += next;
        hasContent = true;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      hasContent = true;
      index += 1;
      while (index < input.length && input[index] !== quote) {
        const inner = input[index];
        if (quote === '"' && inner === '\\') {
          const escaped = input[index + 1];
          if (escaped !== undefined) {
            current += escaped;
            index += 2;
            continue;
          }
        }
        if (inner !== undefined) {
          current += inner;
        }
        index += 1;
      }
      index += 1; // 跳过闭合引号
      continue;
    }
    current += char;
    hasContent = true;
    index += 1;
  }
  push();
  return tokens;
}

/** 需要取一个值的选项（短选项与长选项统一映射到内部键） */
const VALUE_OPTIONS: Record<string, keyof ComposeService | string> = {
  '--name': 'containerName',
  '--restart': 'restart',
  '--network': 'networkMode',
  '--net': 'networkMode',
  '--hostname': 'hostname',
  '-h': 'hostname',
  '--user': 'user',
  '-u': 'user',
  '--workdir': 'workingDir',
  '-w': 'workingDir',
  '--entrypoint': 'entrypoint',
  '--memory': 'memLimit',
  '-m': 'memLimit',
  '--cpus': 'cpus',
  '--env-file': 'envFiles',
  '--label-file': 'labelFile',
};

/** 可重复的列表型选项 */
const LIST_OPTIONS: Record<string, keyof ComposeService> = {
  '-p': 'ports',
  '--publish': 'ports',
  '-v': 'volumes',
  '--volume': 'volumes',
  '--cap-add': 'capAdd',
  '--cap-drop': 'capDrop',
  '--device': 'devices',
  '--dns': 'dns',
  '--add-host': 'extraHosts',
  '--extra-hosts': 'extraHosts',
  '--tmpfs': 'tmpfs',
  '--link': 'extraHosts',
};

/** 布尔开关型选项（存在即 true） */
const BOOLEAN_OPTIONS: Record<string, keyof ComposeService> = {
  '--privileged': 'privileged',
  '--init': 'init',
  '--read-only': 'readOnly',
  '-i': 'stdinOpen',
  '--interactive': 'stdinOpen',
  '-t': 'tty',
  '--tty': 'tty',
  '--rm': 'remove',
};

/** 识别后静默忽略的选项：compose 模型无对应字段或默认行为已等价 */
const IGNORED_OPTIONS = new Set(['-d', '--detach', '--sig-proxy', '--disable-content-trust']);

/** 键值型选项（--env/--label/--sysctl/--ulimit） */
const KEY_VALUE_OPTIONS = new Set(['-e', '--env', '--label', '-l', '--sysctl', '--ulimit']);

/** 健康检查子选项前缀 */
const HEALTH_PREFIX = '--health-';
/** 日志子选项前缀 */
const LOG_PREFIX = '--log-';

/** 从镜像名派生合法的 compose 服务名 */
function deriveServiceName(image: string, containerName?: string): string {
  if (containerName !== undefined) {
    return sanitizeName(containerName);
  }
  const withoutRegistry = image.includes('/') ? image.slice(image.lastIndexOf('/') + 1) : image;
  const withoutTag = withoutRegistry.split(':')[0] ?? withoutRegistry;
  return sanitizeName(withoutTag);
}

/** compose 服务名只允许小写字母数字、连字符与下划线 */
function sanitizeName(value: string): string {
  const lowered = value.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  return /^[a-z0-9]/.test(lowered) ? lowered : `service-${lowered.replace(/^-+/, '')}`;
}

/** 拆分键值对，未提供 `=` 时值为空串（docker 的 -e FOO 合法，表示透传） */
function splitKeyValue(raw: string): { key: string; value: string } {
  const index = raw.indexOf('=');
  if (index < 0) {
    return { key: raw, value: '' };
  }
  return { key: raw.slice(0, index), value: raw.slice(index + 1) };
}

/**
 * 解析 docker run 命令为归一化服务定义。
 *
 * @param command - 完整 docker run 命令
 * @returns 服务定义与告警，或错误信息
 */
export function parseDockerRun(command: string): ParseResult {
  const tokens = tokenizeShell(command.trim());
  if (tokens.length === 0) {
    return { ok: false, error: '命令为空，请粘贴 docker run 命令' };
  }

  // 容忍开头的 docker / sudo docker / podman
  let cursor = 0;
  if (tokens[0] === 'sudo') {
    cursor += 1;
  }
  if (tokens[cursor] === 'docker' || tokens[cursor] === 'podman') {
    cursor += 1;
  }
  if (tokens[cursor] !== 'run') {
    return { ok: false, error: '仅支持 docker run（或 podman run）命令，请确认命令以 run 子命令开头' };
  }
  cursor += 1;

  const warnings: string[] = [];
  const service = createEmptyService();
  let image: string | undefined;
  const commandArgs: string[] = [];

  const takeValue = (token: string, next: string | undefined): string => {
    if (token.includes('=')) {
      return token.slice(token.indexOf('=') + 1);
    }
    if (next === undefined) {
      throw new ParseError(`选项 ${token} 缺少取值`);
    }
    cursor += 1;
    return next;
  };

  try {
    while (cursor < tokens.length) {
      const token = tokens[cursor];
      if (token === undefined) {
        break;
      }

      // 镜像之后的所有 token 视为容器命令
      if (image !== undefined) {
        commandArgs.push(token);
        cursor += 1;
        continue;
      }

      if (!token.startsWith('-')) {
        image = token;
        cursor += 1;
        continue;
      }

      const baseToken = token.split('=')[0] ?? token;

      // 合并短选项，如 -it、-di
      if (token.startsWith('-') && !token.startsWith('--') && token.length > 2 && !token.includes('=')) {
        const flags = token.slice(1).split('');
        for (const flag of flags) {
          const short = `-${flag}`;
          const mapped = BOOLEAN_OPTIONS[short];
          if (mapped !== undefined) {
            service[mapped] = true as never;
          } else if (IGNORED_OPTIONS.has(short)) {
            // -d 等静默忽略
          } else if (LIST_OPTIONS[short] !== undefined || VALUE_OPTIONS[short] !== undefined) {
            return { ok: false, error: `不支持在组合短选项中携带取值选项：${token}` };
          } else {
            warnings.push(`未识别的短选项 ${short} 已忽略`);
          }
        }
        cursor += 1;
        continue;
      }

      const valueOption = VALUE_OPTIONS[baseToken];
      if (valueOption !== undefined) {
        const value = takeValue(token, tokens[cursor + 1]);
        if (valueOption === 'envFiles') {
          service.envFiles.push(value);
        } else if (valueOption === 'cpus') {
          const cpus = Number(value);
          if (!Number.isFinite(cpus) || cpus <= 0) {
            return { ok: false, error: `--cpus 取值非法：${value}` };
          }
          service.cpus = cpus;
        } else if (valueOption === 'labelFile') {
          warnings.push('--label-file 在 compose 中没有直接等价项，请手动把标签写入 labels');
        } else {
          (service as unknown as Record<string, unknown>)[valueOption] = value;
        }
        cursor += 1;
        continue;
      }

      const listOption = LIST_OPTIONS[baseToken];
      if (listOption !== undefined) {
        const value = takeValue(token, tokens[cursor + 1]);
        (service[listOption] as string[]).push(value);
        cursor += 1;
        continue;
      }

      const booleanOption = BOOLEAN_OPTIONS[baseToken];
      if (booleanOption !== undefined) {
        service[booleanOption] = true as never;
        cursor += 1;
        continue;
      }

      if (IGNORED_OPTIONS.has(baseToken)) {
        cursor += 1;
        continue;
      }

      if (KEY_VALUE_OPTIONS.has(baseToken)) {
        const value = takeValue(token, tokens[cursor + 1]);
        const pair = splitKeyValue(value);
        if (baseToken === '-e' || baseToken === '--env') {
          service.environment[pair.key] = pair.value;
        } else if (baseToken === '--label' || baseToken === '-l') {
          service.labels[pair.key] = pair.value;
        } else if (baseToken === '--sysctl') {
          service.sysctls[pair.key] = pair.value;
        } else {
          service.ulimits[pair.key] = pair.value;
        }
        cursor += 1;
        continue;
      }

      if (baseToken.startsWith(HEALTH_PREFIX)) {
        const value = takeValue(token, tokens[cursor + 1]);
        applyHealthOption(service, baseToken, value);
        cursor += 1;
        continue;
      }

      if (baseToken.startsWith(LOG_PREFIX)) {
        const value = takeValue(token, tokens[cursor + 1]);
        applyLogOption(service, baseToken, value);
        cursor += 1;
        continue;
      }

      warnings.push(`未识别的选项 ${baseToken} 已忽略，请在生成后手动补充`);
      cursor += 1;
    }
  } catch (error) {
    if (error instanceof ParseError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  if (image === undefined) {
    return { ok: false, error: '未找到镜像名，docker run 命令必须指定镜像' };
  }
  service.image = image;
  service.name = deriveServiceName(image, service.containerName);
  if (commandArgs.length > 0) {
    service.command = commandArgs.join(' ');
  }
  if (service.remove) {
    warnings.push('--rm 是一次性容器选项，compose 服务模型无等价字段，已忽略');
  }

  return { ok: true, service, warnings };
}

/** 解析过程中的受控错误 */
class ParseError extends Error {}

/** 处理 --health-* 系列选项 */
function applyHealthOption(service: ComposeService, option: string, value: string): void {
  service.healthCheck ??= {};
  const health = service.healthCheck;
  switch (option) {
    case '--health-cmd':
      health.test = ['CMD-SHELL', value];
      break;
    case '--health-interval':
      health.interval = value;
      break;
    case '--health-timeout':
      health.timeout = value;
      break;
    case '--health-retries':
      health.retries = Number(value);
      break;
    case '--health-start-period':
      health.start_period = value;
      break;
    case '--health-no-healthcheck':
      service.healthCheck = { disable: true };
      break;
    default:
      break;
  }
}

/** 处理 --log-* 系列选项 */
function applyLogOption(service: ComposeService, option: string, value: string): void {
  service.logs ??= { driver: 'json-file', options: {} };
  const options = service.logs.options as Record<string, string>;
  if (option === '--log-driver') {
    service.logs.driver = value;
    return;
  }
  if (option === '--log-opt') {
    const pair = splitKeyValue(value);
    options[pair.key] = pair.value;
  }
}

/** 创建带空集合的服务骨架 */
function createEmptyService(): ComposeService {
  return {
    name: '',
    image: '',
    ports: [],
    volumes: [],
    environment: {},
    envFiles: [],
    labels: {},
    capAdd: [],
    capDrop: [],
    devices: [],
    dns: [],
    extraHosts: [],
    tmpfs: [],
    sysctls: {},
    ulimits: {},
  };
}

/** YAML 安全纯量：含特殊字符或以风险字符开头时加双引号并转义 */
function yamlScalar(value: string): string {
  if (value === '') {
    return '""';
  }
  const needsQuote =
    !/^[A-Za-z0-9_./:@+ -]+$/.test(value) ||
    /^(yes|no|true|false|null|on|off|~)$/i.test(value) ||
    /^[-?]/.test(value) ||
    value.includes(': ') ||
    value.includes(' #') ||
    value.trim() !== value;
  if (!needsQuote) {
    return value;
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** YAML 映射键：环境变量名等标识符按裸键输出，含特殊字符时加引号 */
function yamlMapKey(key: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) {
    return key;
  }
  return `"${key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** 序列化为 YAML 行数组（内部工具，便于缩进控制） */
function emitYaml(service: ComposeService): string {
  const lines: string[] = ['services:', `  ${service.name}:`, `    image: ${yamlScalar(service.image)}`];
  const push = (line: string) => lines.push(`    ${line}`);
  const pushList = (key: string, values: string[]) => {
    if (values.length === 0) {
      return;
    }
    push(`${key}:`);
    for (const value of values) {
      lines.push(`      - ${yamlScalar(value)}`);
    }
  };
  const pushMap = (key: string, map: Record<string, string>) => {
    const entries = Object.entries(map);
    if (entries.length === 0) {
      return;
    }
    push(`${key}:`);
    for (const [mapKey, mapValue] of entries) {
      lines.push(`      ${yamlMapKey(mapKey)}: ${yamlScalar(mapValue)}`);
    }
  };

  if (service.containerName !== undefined) {
    push(`container_name: ${yamlScalar(service.containerName)}`);
  }
  if (service.command !== undefined) {
    push(`command: ${yamlScalar(service.command)}`);
  }
  if (service.entrypoint !== undefined) {
    push(`entrypoint: ${yamlScalar(service.entrypoint)}`);
  }
  if (service.restart !== undefined) {
    push(`restart: ${yamlScalar(service.restart)}`);
  }
  if (service.networkMode !== undefined) {
    push(`network_mode: ${yamlScalar(service.networkMode)}`);
  }
  if (service.hostname !== undefined) {
    push(`hostname: ${yamlScalar(service.hostname)}`);
  }
  if (service.user !== undefined) {
    push(`user: ${yamlScalar(service.user)}`);
  }
  if (service.workingDir !== undefined) {
    push(`working_dir: ${yamlScalar(service.workingDir)}`);
  }
  if (service.memLimit !== undefined) {
    push(`mem_limit: ${yamlScalar(service.memLimit)}`);
  }
  if (service.cpus !== undefined) {
    push(`cpus: ${service.cpus}`);
  }
  for (const [key, value] of [
    ['privileged', service.privileged],
    ['init', service.init],
    ['read_only', service.readOnly],
    ['stdin_open', service.stdinOpen],
    ['tty', service.tty],
  ] as const) {
    if (value === true) {
      push(`${key}: true`);
    }
  }

  pushList('ports', service.ports);
  pushList('volumes', service.volumes);
  pushList('env_file', service.envFiles);
  pushList('cap_add', service.capAdd);
  pushList('cap_drop', service.capDrop);
  pushList('devices', service.devices);
  pushList('dns', service.dns);
  pushList('extra_hosts', service.extraHosts);
  pushList('tmpfs', service.tmpfs);
  pushMap('environment', service.environment);
  pushMap('labels', service.labels);
  pushMap('sysctls', service.sysctls);
  pushMap('ulimits', service.ulimits);

  if (service.healthCheck !== undefined) {
    lines.push('    healthcheck:');
    for (const [key, value] of Object.entries(service.healthCheck)) {
      if (Array.isArray(value)) {
        lines.push(`      ${key}:`);
        for (const item of value) {
          lines.push(`        - ${yamlScalar(String(item))}`);
        }
      } else {
        lines.push(`      ${key}: ${yamlScalar(String(value))}`);
      }
    }
  }

  if (service.logs !== undefined) {
    lines.push('    logging:');
    lines.push(`      driver: ${yamlScalar(String(service.logs.driver ?? 'json-file'))}`);
    const options = service.logs.options as Record<string, string> | undefined;
    if (options !== undefined && Object.keys(options).length > 0) {
      lines.push('      options:');
      for (const [key, value] of Object.entries(options)) {
        lines.push(`        ${yamlScalar(key)}: ${yamlScalar(value)}`);
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

/**
 * 把 docker run 命令直接转换为 docker-compose.yml 文本。
 *
 * @param command - docker run 命令
 * @returns YAML 文本与告警，或错误
 */
export function convertDockerRunToCompose(
  command: string,
): { ok: true; yaml: string; warnings: string[] } | { ok: false; error: string } {
  const parsed = parseDockerRun(command);
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, yaml: emitYaml(parsed.service), warnings: parsed.warnings };
}

/** 界面示例命令 */
export const SAMPLE_DOCKER_RUN = `docker run -d --name webapp --restart unless-stopped \\
  -p 8080:80 -p 8443:443 \\
  -v /data/web:/usr/share/nginx/html:ro \\
  -e NGINX_HOST=example.com -e NGINX_PORT=80 \\
  --network app-net --hostname webapp --memory 512m --cpus 1.5 \\
  --cap-add NET_BIND_SERVICE --health-cmd "curl -f http://localhost/ || exit 1" \\
  --health-interval 30s --health-retries 3 \\
  nginx:1.27-alpine nginx -g 'daemon off;'`;
