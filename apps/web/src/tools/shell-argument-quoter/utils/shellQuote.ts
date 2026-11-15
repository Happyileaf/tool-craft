export type Shell = 'posix' | 'cmd' | 'powershell';

export interface ShellQuoteResult {
  ok: boolean;
  output: string;
  warnings: string[];
  error?: string;
}

export const SHELL_LABELS: Record<Shell, string> = {
  posix: 'POSIX sh / Bash',
  cmd: 'Windows CMD',
  powershell: 'PowerShell',
};

const NUL_ERROR = '输入包含 NUL（\\0）字节，无法作为命令行参数安全传递';

function controlCharEscape(ch: string): string {
  switch (ch) {
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\t':
      return '\\t';
    case '\\':
      return '\\\\';
    case "'":
      return "\\'";
    default:
      return `\\x${ch.charCodeAt(0).toString(16).padStart(2, '0')}`;
  }
}

/** POSIX sh：普通情况用单引号；含控制字符时用 $'...' ANSI-C 引用。 */
export function quotePosix(input: string): ShellQuoteResult {
  if (input.includes('\u0000')) {
    return { ok: false, output: '', warnings: [], error: NUL_ERROR };
  }
  if (input === '') return { ok: true, output: "''", warnings: [] };

  const hasControl = /[\u0001-\u001f\u007f]/.test(input);
  if (hasControl) {
    let escaped = '';
    for (const ch of input) {
      escaped += /[\u0001-\u001f\u007f\\']/.test(ch) ? controlCharEscape(ch) : ch;
    }
    return {
      ok: true,
      output: `$'${escaped}'`,
      warnings: ['输入含换行、制表符等控制字符，已使用 $\'...\'（ANSI-C 引用）形式'],
    };
  }

  const escaped = input.split("'").join("'\\''");
  return { ok: true, output: `'${escaped}'`, warnings: [] };
}

/** Windows CMD：双引号包裹；内部 ^ 元字符与 % 变量给出告警说明。 */
export function quoteCmd(input: string): ShellQuoteResult {
  if (input.includes('\u0000')) {
    return { ok: false, output: '', warnings: [], error: NUL_ERROR };
  }
  const warnings: string[] = [];
  if (input === '') return { ok: true, output: '""', warnings };

  if (/%[^%]+%/.test(input)) {
    warnings.push('检测到 %VAR% 形式，CMD 即使参数在双引号内也会展开环境变量，使用时需注意');
  }
  if (/![^!]+!/.test(input)) {
    warnings.push('检测到 !VAR! 形式，若启用了延迟展开（setlocal enabledelayedexpansion）会展开变量');
  }
  if (input.includes('"')) {
    warnings.push(
      'CMD 解析器不支持在双引号内转义双引号，本工具按多数程序的 C 运行时约定输出 \\"，请在实际目标程序上验证',
    );
  }
  if (/[\u0001-\u001f\u007f]/.test(input)) {
    warnings.push('输入含换行或控制字符，CMD 无法把它们作为单个参数完整传递');
  }

  const escaped = input.replace(/"/g, '\\"');
  return { ok: true, output: `"${escaped}"`, warnings };
}

/** PowerShell：单引号包裹，内部单引号双写。 */
export function quotePowerShell(input: string): ShellQuoteResult {
  if (input.includes('\u0000')) {
    return { ok: false, output: '', warnings: [], error: NUL_ERROR };
  }
  const escaped = input.replace(/'/g, "''");
  return { ok: true, output: `'${escaped}'`, warnings: [] };
}

export function quoteArg(input: string, shell: Shell): ShellQuoteResult {
  if (shell === 'cmd') return quoteCmd(input);
  if (shell === 'powershell') return quotePowerShell(input);
  return quotePosix(input);
}

function unquotePosixText(input: string): ShellQuoteResult {
  if (input.startsWith("$'")) {
    if (!input.endsWith("'") || input.length < 3) {
      return { ok: false, output: '', warnings: [], error: 'ANSI-C 引用缺少结尾单引号' };
    }
    let output = '';
    let index = 2;
    const end = input.length - 1;
    while (index < end) {
      const ch = input.charAt(index);
      if (ch !== '\\') {
        output += ch;
        index += 1;
        continue;
      }
      const next = input.charAt(index + 1);
      if (next === '') {
        return { ok: false, output: '', warnings: [], error: 'ANSI-C 引用以孤立反斜杠结尾' };
      }
      switch (next) {
        case 'n':
          output += '\n';
          break;
        case 't':
          output += '\t';
          break;
        case 'r':
          output += '\r';
          break;
        case '\\':
          output += '\\';
          break;
        case "'":
          output += "'";
          break;
        case 'x': {
          const hex = input.slice(index + 2, index + 4);
          if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
            return {
              ok: false,
              output: '',
              warnings: [],
              error: `\\x 转义后需要两位十六进制数字（位置 ${index + 1}）`,
            };
          }
          output += String.fromCharCode(parseInt(hex, 16));
          index += 2;
          break;
        }
        default:
          return {
            ok: false,
            output: '',
            warnings: [],
            error: `不支持的 ANSI-C 转义 \\${next}（位置 ${index + 1}）`,
          };
      }
      index += 2;
    }
    return { ok: true, output, warnings: [] };
  }

  if (!input.startsWith("'") || !input.endsWith("'") || input.length < 2) {
    return {
      ok: false,
      output: '',
      warnings: [],
      error: 'POSIX 已引用参数必须以单引号开始并以单引号结尾',
    };
  }

  let output = '';
  let index = 0;
  while (index < input.length) {
    const ch = input.charAt(index);
    if (ch === "'") {
      const close = input.indexOf("'", index + 1);
      if (close === -1) {
        return { ok: false, output: '', warnings: [], error: '单引号缺少结尾引号' };
      }
      output += input.slice(index + 1, close);
      index = close + 1;
      if (input.charAt(index) === '\\' && input.charAt(index + 1) === "'") {
        output += "'";
        index += 2;
      }
      continue;
    }
    if (ch === '\\' && input.charAt(index + 1) === "'") {
      output += "'";
      index += 2;
      continue;
    }
    return {
      ok: false,
      output: '',
      warnings: [],
      error: `引号外出现无法解析的字符 "${ch}"（位置 ${index + 1}）`,
    };
  }
  return { ok: true, output, warnings: [] };
}

function unquoteCmdText(input: string): ShellQuoteResult {
  if (!input.startsWith('"') || !input.endsWith('"') || input.length < 2) {
    return {
      ok: false,
      output: '',
      warnings: [],
      error: 'CMD 已引用参数必须以双引号包裹',
    };
  }
  let output = '';
  let index = 1;
  while (index < input.length - 1) {
    const ch = input.charAt(index);
    if (ch === '\\' && input.charAt(index + 1) === '"') {
      output += '"';
      index += 2;
      continue;
    }
    if (ch === '"') {
      return {
        ok: false,
        output: '',
        warnings: [],
        error: `双引号内出现未转义的双引号（位置 ${index + 1}）`,
      };
    }
    output += ch;
    index += 1;
  }
  return {
    ok: true,
    output,
    warnings: input.includes('\\"') ? ['已把 \\" 还原为双引号，该写法在 CMD 中并非原生语法'] : [],
  };
}

function unquotePowerShellText(input: string): ShellQuoteResult {
  if (!input.startsWith("'") || !input.endsWith("'") || input.length < 2) {
    return {
      ok: false,
      output: '',
      warnings: [],
      error: 'PowerShell 已引用参数必须以单引号包裹',
    };
  }
  let output = '';
  let index = 1;
  while (index < input.length - 1) {
    const ch = input.charAt(index);
    if (ch === "'") {
      if (input.charAt(index + 1) === "'") {
        output += "'";
        index += 2;
        continue;
      }
      return {
        ok: false,
        output: '',
        warnings: [],
        error: `单引号内出现未双写的单引号（位置 ${index + 1}），应写成 ''`,
      };
    }
    output += ch;
    index += 1;
  }
  return { ok: true, output, warnings: [] };
}

/** 去引用还原：接受对应 shell 的已引用参数，无法无损解析时返回定位明确的错误。 */
export function unquoteArg(input: string, shell: Shell): ShellQuoteResult {
  if (input.includes('\u0000')) {
    return { ok: false, output: '', warnings: [], error: NUL_ERROR };
  }
  if (shell === 'cmd') return unquoteCmdText(input);
  if (shell === 'powershell') return unquotePowerShellText(input);
  return unquotePosixText(input);
}

/** 批量拆分参数：每行一个；忽略末尾换行造成的空参数，保留中间空行（空参数）。 */
export function splitArgs(input: string): string[] {
  const lines = input.split(/\r?\n/);
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** 生成可直接粘贴的命令片段。 */
export function buildCommandSnippet(quoted: string): string {
  return `my-command ${quoted}`;
}
