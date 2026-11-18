/**
 * systemd .service 单元文件生成与解析纯函数，不依赖 DOM 与 React。
 * 输出遵循 systemd.unit(5) 的 INI 风格：固定 [Unit]/[Service]/[Install] 顺序，
 * 空值字段整行省略，Environment 等可重复指令各占一行。
 */

/** systemd 服务类型（systemd.service Type=） */
export type ServiceType =
  | 'simple'
  | 'exec'
  | 'forking'
  | 'oneshot'
  | 'dbus'
  | 'notify'
  | 'idle';

/** Restart= 策略枚举 */
export type RestartPolicy = 'no' | 'on-success' | 'on-failure' | 'on-abnormal' | 'on-watchdog' | 'on-abort' | 'always';

/** 表单输入（空字符串表示未填写，输出时省略对应指令） */
export interface SystemdForm {
  /** 单元名（不含 .service 后缀），用于文件名与安装命令 */
  unitName: string;
  // [Unit]
  description: string;
  after: string;
  wants: string;
  requires: string;
  // [Service]
  type: ServiceType;
  execStart: string;
  execStop: string;
  execReload: string;
  user: string;
  group: string;
  workingDirectory: string;
  /** 多行 Environment，每行一条 KEY=VALUE */
  environmentText: string;
  restart: RestartPolicy;
  /** RestartSec 秒数，null 表示不输出 */
  restartSec: number | null;
  standardOutput: string;
  standardError: string;
  // [Install]
  wantedBy: string;
  requiredBy: string;
  also: string;
}

export interface SystemdValidation {
  valid: boolean;
  /** 字段名 → 错误信息 */
  errors: Partial<Record<keyof SystemdForm, string>>;
}

/** 表单字段校验 */
export function validateSystemdForm(form: SystemdForm): SystemdValidation {
  const errors: SystemdValidation['errors'] = {};

  if (!form.unitName.trim()) {
    errors.unitName = '单元名必填';
  } else if (!/^[A-Za-z0-9@._:-]+$/.test(form.unitName.trim())) {
    errors.unitName = '单元名只能包含字母、数字与 @ . _ : - 字符';
  }

  if (!form.execStart.trim()) {
    errors.execStart = 'ExecStart 必填（oneshot 等类型也至少需要一条启动指令）';
  }

  if (form.restartSec !== null && (!Number.isFinite(form.restartSec) || form.restartSec < 0)) {
    errors.restartSec = 'RestartSec 必须为不小于 0 的数值';
  }

  const envLines = splitEnvLines(form.environmentText);
  for (const line of envLines) {
    const eq = line.indexOf('=');
    if (eq <= 0) {
      errors.environmentText = `Environment 行必须为 KEY=VALUE 形式："${line}"`;
      break;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(line.slice(0, eq))) {
      errors.environmentText = `环境变量名非法："${line.slice(0, eq)}"`;
      break;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** 拆分多行 Environment 文本，去空白并丢弃空行 */
export function splitEnvLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** 空格分隔的依赖列表（After=/Wants= 等），原样保留用户写法但压缩空白 */
function splitDependencies(value: string): string[] {
  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

interface Directive {
  key: string;
  value: string;
}

/** 收集非空指令，保持调用顺序（即键顺序） */
function buildDirectives(entries: Array<[string, string]>): Directive[] {
  return entries
    .filter(([, value]) => value.trim() !== '')
    .map(([key, value]) => ({ key, value: value.trim() }));
}

/**
 * 生成 systemd .service 单元文件文本。
 *
 * @param form - 表单数据
 * @returns INI 风格单元文本（LF 换行，段间空行分隔）
 * @throws 校验失败时抛出带字段名的错误
 */
export function generateServiceUnit(form: SystemdForm): string {
  const validation = validateSystemdForm(form);
  if (!validation.valid) {
    const first = Object.entries(validation.errors)[0];
    throw new Error(first && first[1] ? `${first[0]}：${first[1]}` : '表单校验失败');
  }

  const sections: string[] = [];

  const unitDirectives = buildDirectives([
    ['Description', form.description],
    ['After', splitDependencies(form.after).join(' ')],
    ['Wants', splitDependencies(form.wants).join(' ')],
    ['Requires', splitDependencies(form.requires).join(' ')],
  ]);
  if (unitDirectives.length > 0) {
    sections.push(renderSection('Unit', unitDirectives));
  }

  const serviceEntries: Array<[string, string]> = [
    ['Type', form.type],
    ['ExecStart', form.execStart],
    ['ExecStop', form.execStop],
    ['ExecReload', form.execReload],
    ['User', form.user],
    ['Group', form.group],
    ['WorkingDirectory', form.workingDirectory],
  ];
  for (const envLine of splitEnvLines(form.environmentText)) {
    // Environment 是可重复指令，逐行输出
    serviceEntries.push(['Environment', envLine]);
  }
  serviceEntries.push(
    ['Restart', form.restart === 'no' ? '' : form.restart],
    ['RestartSec', form.restartSec === null ? '' : String(form.restartSec)],
    ['StandardOutput', form.standardOutput],
    ['StandardError', form.standardError],
  );
  const serviceDirectives = buildDirectives(serviceEntries);
  sections.push(renderSection('Service', serviceDirectives));

  const installDirectives = buildDirectives([
    ['WantedBy', splitDependencies(form.wantedBy).join(' ')],
    ['RequiredBy', splitDependencies(form.requiredBy).join(' ')],
    ['Also', splitDependencies(form.also).join(' ')],
  ]);
  if (installDirectives.length > 0) {
    sections.push(renderSection('Install', installDirectives));
  }

  return `${sections.join('\n\n')}\n`;
}

function renderSection(name: string, directives: Directive[]): string {
  return [`[${name}]`, ...directives.map((item) => `${item.key}=${item.value}`)].join('\n');
}

/** 解析后的单元文件结构（段名 → 有序指令列表，可重复键全部保留） */
export type ParsedUnit = Record<string, Directive[]>;

/**
 * 解析 INI 风格单元文本回结构化段与指令（用于往返校验）。
 *
 * @param text - 单元文件文本
 * @returns 段名到指令列表的映射
 * @throws 段外指令或语法损坏时抛出错误
 */
export function parseServiceUnit(text: string): ParsedUnit {
  const result: ParsedUnit = {};
  let currentSection = '';

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#') || line.startsWith(';')) {
      return;
    }
    const sectionMatch = /^\[(.+)]$/.exec(line);
    if (sectionMatch) {
      currentSection = sectionMatch[1] ?? '';
      result[currentSection] = result[currentSection] ?? [];
      return;
    }
    if (!currentSection) {
      throw new Error(`第 ${index + 1} 行指令不属于任何 section："${line}"`);
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      throw new Error(`第 ${index + 1} 行缺少 "="："${line}"`);
    }
    const directives = result[currentSection];
    if (directives) {
      directives.push({ key: line.slice(0, eq), value: line.slice(eq + 1) });
    }
  });

  return result;
}

/** 生成配套的安装启用命令提示 */
export function buildInstallCommands(unitName: string): string {
  const name = unitName.trim().endsWith('.service') ? unitName.trim() : `${unitName.trim()}.service`;
  return [
    `sudo cp ${name} /etc/systemd/system/`,
    'sudo systemctl daemon-reload',
    `sudo systemctl enable --now ${name}`,
    `systemctl status ${name}`,
  ].join('\n');
}

/** 空表单（UI 初始值） */
export function createEmptyForm(): SystemdForm {
  return {
    unitName: '',
    description: '',
    after: '',
    wants: '',
    requires: '',
    type: 'simple',
    execStart: '',
    execStop: '',
    execReload: '',
    user: '',
    group: '',
    workingDirectory: '',
    environmentText: '',
    restart: 'no',
    restartSec: null,
    standardOutput: '',
    standardError: '',
    wantedBy: '',
    requiredBy: '',
    also: '',
  };
}
