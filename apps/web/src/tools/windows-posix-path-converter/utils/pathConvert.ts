export type Direction = 'win2posix' | 'posix2win';
export type PosixStyle = 'wsl' | 'wsl2';
export type PathKind = 'windows-drive' | 'unc' | 'posix-absolute' | 'relative' | 'url';

export interface ConvertResult {
  ok: boolean;
  input: string;
  output: string;
  kind: PathKind;
  warnings: string[];
  error?: string;
}

const KIND_LABELS: Record<PathKind, string> = {
  'windows-drive': 'Windows 盘符绝对路径',
  unc: 'UNC 网络路径',
  'posix-absolute': 'POSIX 绝对路径',
  relative: '相对路径',
  url: 'URL',
};

export function pathKindLabel(kind: PathKind): string {
  return KIND_LABELS[kind];
}

/** 识别路径类型；改为正斜杠后再判断，兼容混合分隔符。 */
export function detectPathKind(input: string): PathKind {
  const text = input.trim();
  if (text.includes('://')) return 'url';
  if (/^[A-Za-z]:[\\/]/.test(text) || /^[A-Za-z]:$/.test(text)) return 'windows-drive';
  if (text.startsWith('\\\\') || text.startsWith('//')) {
    const segments = text.replace(/\\/g, '/').replace(/^\/+/, '').split('/');
    if (segments.length >= 2 && segments[0] !== '' && segments[1] !== '') return 'unc';
  }
  if (text.startsWith('/')) return 'posix-absolute';
  return 'relative';
}

function splitSegments(path: string): string[] {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment !== '');
}

/**
 * 折叠 `.` 与 `..`，并去除空段；floor 表示可以回退到的最深层级（相对 base 的偏移）。
 */
function normalizeSegments(
  segments: string[],
  floor = 0,
): { segments: string[]; overflow: boolean } {
  const result: string[] = [];
  let overflow = false;
  for (const segment of segments) {
    if (segment === '.' || segment === '') continue;
    if (segment === '..') {
      if (result.length > floor) {
        result.pop();
      } else {
        overflow = true;
      }
      continue;
    }
    result.push(segment);
  }
  return { segments: result, overflow };
}

function winDriveToPosix(
  text: string,
  style: PosixStyle,
  normalize: boolean,
): ConvertResult {
  const match = /^([A-Za-z]):(.*)$/.exec(text);
  if (!match) {
    return {
      ok: false,
      input: text,
      output: text,
      kind: 'relative',
      warnings: [],
      error: '无法识别的 Windows 盘符路径',
    };
  }
  const letter = (match[1] ?? '').toLowerCase();
  const rest = (match[2] ?? '').replace(/\\/g, '/').replace(/^\/+/, '');
  const base = style === 'wsl' ? ['mnt', letter] : [letter];
  const warnings: string[] = [];

  let restSegments = splitSegments(rest);
  if (normalize) {
    const normalized = normalizeSegments(restSegments);
    restSegments = normalized.segments;
    if (normalized.overflow) {
      warnings.push('路径中的 ".." 超出盘符根目录，已忽略多余回退');
    }
  }
  const output = `/${[...base, ...restSegments].join('/')}`;
  return { ok: true, input: text, output, kind: 'windows-drive', warnings };
}

function uncToPosix(text: string, normalize: boolean): ConvertResult {
  const normalized = text.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/').filter((segment) => segment !== '');
  if (segments.length < 2) {
    return {
      ok: false,
      input: text,
      output: text,
      kind: 'unc',
      warnings: [],
      error: 'UNC 路径至少需要 server 与 share 两段',
    };
  }
  const server = segments[0] ?? '';
  const share = segments[1] ?? '';
  const rest = segments.slice(2);
  const warnings: string[] = [];
  let restSegments = rest;
  if (normalize) {
    const normalizedRest = normalizeSegments(rest);
    restSegments = normalizedRest.segments;
    if (normalizedRest.overflow) {
      warnings.push('路径中的 ".." 超出共享根目录，已忽略多余回退');
    }
  }
  const output = `//${[server, share, ...restSegments].join('/')}`;
  return { ok: true, input: text, output, kind: 'unc', warnings };
}

function posixToWinDrive(
  text: string,
  style: PosixStyle,
  normalize: boolean,
): ConvertResult | undefined {
  const mntMatch = /^\/mnt\/([A-Za-z])(\/.*)?$/.exec(text);
  const wsl2Match = style === 'wsl2' ? /^\/([A-Za-z])(\/.*)?$/.exec(text) : null;
  const match = mntMatch ?? wsl2Match;
  if (!match) return undefined;

  const letter = (match[1] ?? '').toUpperCase();
  const rest = (match[2] ?? '').replace(/^\/+/, '');
  const warnings: string[] = [];
  let restSegments = splitSegments(rest);
  if (normalize) {
    const normalized = normalizeSegments(restSegments);
    restSegments = normalized.segments;
    if (normalized.overflow) {
      warnings.push('路径中的 ".." 超出盘符根目录，已忽略多余回退');
    }
  }
  const output = restSegments.length > 0 ? `${letter}:\\${restSegments.join('\\')}` : `${letter}:\\`;
  return { ok: true, input: text, output, kind: 'posix-absolute', warnings };
}

function posixUncToWin(text: string, normalize: boolean): ConvertResult {
  const segments = splitSegments(text);
  if (segments.length < 2) {
    return {
      ok: false,
      input: text,
      output: text,
      kind: 'unc',
      warnings: [],
      error: 'UNC 路径至少需要 server 与 share 两段',
    };
  }
  const server = segments[0] ?? '';
  const share = segments[1] ?? '';
  const rest = segments.slice(2);
  const warnings: string[] = [];
  let restSegments = rest;
  if (normalize) {
    const normalized = normalizeSegments(rest);
    restSegments = normalized.segments;
    if (normalized.overflow) {
      warnings.push('路径中的 ".." 超出共享根目录，已忽略多余回退');
    }
  }
  const output = `\\\\${[server, share, ...restSegments].join('\\')}`;
  return { ok: true, input: text, output, kind: 'unc', warnings };
}

/** 把一行路径按方向、目标风格与段归一选项转换。 */
export function convertPath(
  rawInput: string,
  direction: Direction,
  style: PosixStyle,
  normalize: boolean,
): ConvertResult {
  const text = rawInput.trim();
  if (text === '') {
    return {
      ok: false,
      input: rawInput,
      output: '',
      kind: 'relative',
      warnings: [],
      error: '路径为空',
    };
  }

  const kind = detectPathKind(text);

  if (kind === 'url') {
    return {
      ok: true,
      input: text,
      output: text,
      kind,
      warnings: ['输入是 URL 而非文件路径，已原样返回'],
    };
  }

  if (direction === 'win2posix') {
    if (kind === 'windows-drive') return winDriveToPosix(text, style, normalize);
    if (kind === 'unc') return uncToPosix(text, normalize);
    if (kind === 'posix-absolute') {
      let output = text.replace(/\\/g, '/');
      const warnings: string[] = [];
      if (normalize) {
        const normalized = normalizeSegments(splitSegments(text), 0);
        output = `/${normalized.segments.join('/')}`;
        if (normalized.overflow) warnings.push('路径中的 ".." 超出根目录，已忽略多余回退');
      }
      warnings.push('输入已是 POSIX 绝对路径，仅做了分隔符归一');
      return { ok: true, input: text, output, kind, warnings };
    }
    let output = text.replace(/\\/g, '/');
    if (normalize) {
      const normalized = normalizeSegments(splitSegments(text), 0);
      output = normalized.segments.join('/');
      if (normalized.overflow) {
        return {
          ok: true,
          input: text,
          output,
          kind,
          warnings: ['路径中的 ".." 无上层目录可回退，已丢弃多余回退'],
        };
      }
    }
    return {
      ok: true,
      input: text,
      output,
      kind,
      warnings: ['相对路径无法确定对应盘符，仅做分隔符归一'],
    };
  }

  // POSIX → Windows
  if (kind === 'unc') return posixUncToWin(text, normalize);
  if (kind === 'posix-absolute') {
    const driveResult = posixToWinDrive(text, style, normalize);
    if (driveResult) return driveResult;
    if (/^\/mnt\//.test(text)) {
      return {
        ok: true,
        input: text,
        output: text,
        kind,
        warnings: ['该 /mnt/ 路径不是单盘符挂载（如 /mnt/wsl），无法映射到 Windows 盘符，已原样返回'],
      };
    }
    return {
      ok: true,
      input: text,
      output: text,
      kind,
      warnings: ['无法确定对应的 Windows 盘符，已原样返回'],
    };
  }
  if (kind === 'windows-drive') {
    return {
      ok: true,
      input: text,
      output: text.replace(/\//g, '\\'),
      kind,
      warnings: ['输入已是 Windows 盘符路径，仅做了分隔符归一'],
    };
  }

  let output = text.replace(/\//g, '\\');
  const warnings = ['相对路径无法确定对应盘符，仅做了分隔符归一'];
  if (normalize) {
    const normalized = normalizeSegments(splitSegments(text), 0);
    output = normalized.segments.join('\\');
    if (normalized.overflow) warnings.push('路径中的 ".." 无上层目录可回退，已丢弃多余回退');
  }
  return { ok: true, input: text, output, kind, warnings };
}

/** 批量转换：空行忽略，返回每条非空行的结果与忽略行数。 */
export function convertPathBatch(
  input: string,
  direction: Direction,
  style: PosixStyle,
  normalize: boolean,
): { results: ConvertResult[]; ignoredEmptyLines: number } {
  const lines = input.split(/\r?\n/);
  const results: ConvertResult[] = [];
  let ignoredEmptyLines = 0;
  for (const line of lines) {
    if (line.trim() === '') {
      ignoredEmptyLines += 1;
      continue;
    }
    results.push(convertPath(line, direction, style, normalize));
  }
  return { results, ignoredEmptyLines };
}
