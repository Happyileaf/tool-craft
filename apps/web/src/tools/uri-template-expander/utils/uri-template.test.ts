import { describe, expect, it } from 'vitest';
import {
  expandUriTemplate,
  extractTemplateVariables,
  type TemplateVariables,
} from './uri-template';

// RFC 6570 Section 3.2 官方示例变量集
const VARS: TemplateVariables = {
  count: ['one', 'two', 'three'],
  dom: { example: 'com', hello: 'world' },
  dub: 'me/too',
  hello: 'Hello World!',
  half: '50%',
  var: 'value',
  who: 'fred',
  base: 'http://example.com/home/',
  path: '/foo/bar',
  list: ['red', 'green', 'blue'],
  keys: { semi: ';', dot: '.', comma: ',' },
  v: '6',
  w: '768',
  x: '1024',
  y: '768',
  empty: '',
  empty_keys: [],
};

function expand(template: string, vars: TemplateVariables = VARS): string {
  const result = expandUriTemplate(template, vars);
  expect(result.valid).toBe(true);
  return result.uri;
}

describe('RFC 6570 Level 1 - simple expansion', () => {
  it('expands Section 3.2.2 simple strings', () => {
    expect(expand('{var}')).toBe('value');
    expect(expand('{hello}')).toBe('Hello%20World%21');
    expect(expand('{half}')).toBe('50%25');
    expect(expand('O{empty}X')).toBe('OX');
    expect(expand('{x,y}')).toBe('1024,768');
    expect(expand('{?x}')).toBe('?x=1024');
  });
});

describe('RFC 6570 Level 2 - reserved and fragment', () => {
  it('expands + operator without encoding reserved chars', () => {
    expect(expand('{+var}')).toBe('value');
    expect(expand('{+hello}')).toBe('Hello%20World!');
    expect(expand('{+path}/here')).toBe('/foo/bar/here');
    expect(expand('{+base}index')).toBe('http://example.com/home/index');
    expect(expand('O{+empty}X')).toBe('OX');
  });

  it('expands # fragment operator', () => {
    expect(expand('{#var}')).toBe('#value');
    expect(expand('{#hello}')).toBe('#Hello%20World!');
    expect(expand('{#path}')).toBe('#/foo/bar');
    // RFC 6570 §3.2.5：空但已定义的值仍触发操作符前缀
    expect(expand('X{#empty}Y')).toBe('X#Y');
  });
});

describe('RFC 6570 Level 3 - path-style operators', () => {
  it('expands . label operator', () => {
    expect(expand('{.who}')).toBe('.fred');
    expect(expand('{.half,who}')).toBe('.50%25.fred');
    expect(expand('X{.empty}')).toBe('X.');
  });

  it('expands / path segment operator', () => {
    expect(expand('{/who}')).toBe('/fred');
    expect(expand('{/who,dub}')).toBe('/fred/me%2Ftoo');
    expect(expand('{/var:1,var}')).toBe('/v/value');
    expect(expand('{/empty}')).toBe('/');
  });

  it('expands ; path-style parameter operator with empty-name rule', () => {
    expect(expand('{;who}')).toBe(';who=fred');
    expect(expand('{;half}')).toBe(';half=50%25');
    expect(expand('{;empty}')).toBe(';empty');
    expect(expand('{;v,w}')).toBe(';v=6;w=768');
  });

  it('expands ? and & form-style query operators', () => {
    expect(expand('{?who}')).toBe('?who=fred');
    expect(expand('{?half}')).toBe('?half=50%25');
    expect(expand('{?x,y}')).toBe('?x=1024&y=768');
    expect(expand('{?x,y,empty}')).toBe('?x=1024&y=768&empty=');
    expect(expand('?fixed=yes{&x}')).toBe('?fixed=yes&x=1024');
  });

  it('applies prefix truncation by code points', () => {
    expect(expand('{var:3}')).toBe('val');
    expect(expand('{var:30}')).toBe('value');
    expect(expand('{+path:6}/here')).toBe('/foo/b/here');
    expect(expand('{#path:2}')).toBe('#/f');
  });
});

describe('RFC 6570 Level 4 - composite values and explode', () => {
  it('expands non-exploded arrays and objects', () => {
    expect(expand('{count}')).toBe('one,two,three');
    expect(expand('{dom}')).toBe('example,com,hello,world');
    expect(expand('{/list}')).toBe('/red,green,blue');
    expect(expand('{?list}')).toBe('?list=red,green,blue');
    expect(expand('{?keys}')).toBe('?keys=semi,%3B,dot,.,comma,%2C');
  });

  it('expands exploded arrays with operator separators', () => {
    expect(expand('{count*}')).toBe('one,two,three');
    expect(expand('{/list*}')).toBe('/red/green/blue');
    expect(expand('{?list*}')).toBe('?list=red&list=green&list=blue');
    expect(expand('{&list*}')).toBe('&list=red&list=green&list=blue');
  });

  it('expands exploded objects', () => {
    expect(expand('{dom*}')).toBe('example=com,hello=world');
    expect(expand('{?keys*}')).toBe('?semi=%3B&dot=.&comma=%2C');
    expect(expand('{/dom*}')).toBe('/example=com/hello=world');
  });

  it('omits undefined and empty composite variables per spec', () => {
    expect(expand('{/empty_keys*}')).toBe('');
    expect(expandUriTemplate('{undefinedVar}', VARS)).toMatchObject({
      uri: '',
      valid: true,
    });
    expect(expand('a{undefinedVar}b')).toBe('ab');
  });
});

describe('validation', () => {
  it('flags unpaired braces and illegal prefix lengths', () => {
    expect(expandUriTemplate('{var', VARS).valid).toBe(false);
    expect(expandUriTemplate('var}', VARS).valid).toBe(false);
    expect(expandUriTemplate('{var:0}', VARS).valid).toBe(false);
    expect(expandUriTemplate('{var:abc}', VARS).valid).toBe(false);
  });

  it('encodes UTF-8 multi-byte characters correctly', () => {
    expect(expand('{hello}', { hello: 'café 茶' })).toBe(
      'caf%C3%A9%20%E8%8C%B6',
    );
  });
});

describe('extractTemplateVariables', () => {
  it('returns deduplicated variable names in first-seen order', () => {
    expect(
      extractTemplateVariables('https://api.example.com/{+version}/users/{userId}{?fields*,limit}{#section}'),
    ).toEqual(['version', 'userId', 'fields', 'limit', 'section']);
  });
});
