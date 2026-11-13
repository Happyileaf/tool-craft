// RFC 3986 URI reference resolution against a base URI.
// Implements component split (§3), transform references (§5.2.2),
// merge paths (§5.2.3) and remove_dot_segments (§5.2.4) from scratch,
// without relying on the WHATWG URL constructor, so behaviour matches the
// RFC normal and abnormal examples exactly and stays explainable.

export interface UriComponents {
  scheme: string;
  authority: string;
  path: string;
  query: string;
  fragment: string;
}

export interface ResolveResult {
  ok: boolean;
  target: string;
  components?: UriComponents;
  error?: string;
}

// RFC 3986 §B appendix regex for splitting an absolute URI reference.
const URI_REGEX =
  /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

/** Split a URI reference into its five components (RFC 3986 §5.3 Appendix B). */
export function splitUri(reference: string): UriComponents {
  const match = URI_REGEX.exec(reference);
  if (!match) {
    return { scheme: '', authority: '', path: reference, query: '', fragment: '' };
  }
  return {
    scheme: match[2] ?? '',
    authority: match[4] ?? '',
    path: match[5] ?? '',
    query: match[7] ?? '',
    fragment: match[9] ?? '',
  };
}

/**
 * RFC 3986 §5.2.4 remove_dot_segments using the input-buffer / output-stack
 * algorithm, applied to a path that already carries any leading "/".
 */
export function removeDotSegments(path: string): string {
  let input = path;
  let output = '';

  while (input.length > 0) {
    if (input.startsWith('../')) {
      input = input.slice(3);
    } else if (input.startsWith('./')) {
      input = input.slice(2);
    } else if (input.startsWith('/./')) {
      input = `/${input.slice(3)}`;
    } else if (input === '/.') {
      input = '/';
    } else if (input.startsWith('/../')) {
      input = `/${input.slice(4)}`;
      output = removeLastSegment(output);
    } else if (input === '/..') {
      input = '/';
      output = removeLastSegment(output);
    } else if (input === '.' || input === '..') {
      input = '';
    } else {
      // Move the first path segment (including initial "/" if any) to output.
      const segment = takeFirstSegment(input);
      output += segment;
      input = input.slice(segment.length);
    }
  }

  return output;
}

function removeLastSegment(output: string): string {
  const idx = output.lastIndexOf('/');
  return idx === -1 ? '' : output.slice(0, idx);
}

function takeFirstSegment(input: string): string {
  if (input.startsWith('/')) {
    const next = input.indexOf('/', 1);
    return next === -1 ? input : input.slice(0, next);
  }
  const next = input.indexOf('/');
  return next === -1 ? input : input.slice(0, next);
}

/** RFC 3986 §5.2.3 merge a relative-path reference with the base path. */
function mergePath(base: UriComponents, refPath: string): string {
  if (base.authority !== '' && base.path === '') {
    return `/${refPath}`;
  }
  const idx = base.path.lastIndexOf('/');
  const prefix = idx === -1 ? '' : base.path.slice(0, idx + 1);
  return prefix + refPath;
}

function recompose(uri: UriComponents): string {
  let result = '';
  if (uri.scheme !== '') {
    result += `${uri.scheme}:`;
  }
  if (uri.authority !== '') {
    result += `//${uri.authority}`;
  }
  result += uri.path;
  if (uri.query !== '') {
    result += `?${uri.query}`;
  }
  if (uri.fragment !== '') {
    result += `#${uri.fragment}`;
  }
  return result;
}

/**
 * Resolve a (possibly relative) URI reference against a base absolute URI,
 * following RFC 3986 §5.2.2 transform references.
 */
export function resolveReference(baseUri: string, reference: string): ResolveResult {
  const baseInput = baseUri.trim();
  const refInput = reference;

  if (!baseInput) {
    return { ok: false, target: '', error: 'Base URI 不能为空' };
  }
  const base = splitUri(baseInput);
  if (base.scheme === '') {
    return { ok: false, target: '', error: 'Base URI 必须是绝对 URI（缺少 scheme）' };
  }

  const ref = splitUri(refInput);
  const target: UriComponents = {
    scheme: '',
    authority: '',
    path: '',
    query: '',
    fragment: '',
  };

  if (ref.scheme !== '') {
    target.scheme = ref.scheme;
    target.authority = ref.authority;
    target.path = removeDotSegments(ref.path);
    target.query = ref.query;
  } else {
    if (ref.authority !== '') {
      target.authority = ref.authority;
      target.path = removeDotSegments(ref.path);
      target.query = ref.query;
    } else {
      if (ref.path === '') {
        target.path = base.path;
        if (ref.query !== '') {
          target.query = ref.query;
        } else {
          target.query = base.query;
        }
      } else {
        if (ref.path.startsWith('/')) {
          target.path = removeDotSegments(ref.path);
        } else {
          target.path = removeDotSegments(mergePath(base, ref.path));
        }
        target.query = ref.query;
      }
      target.authority = base.authority;
    }
    target.scheme = base.scheme;
  }

  target.fragment = ref.fragment;
  return { ok: true, target: recompose(target), components: target };
}
