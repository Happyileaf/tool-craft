import { describe, it, expect } from 'vitest';
import { parseSyslog, parseSyslogLine } from './syslog';

const RFC5424_SAMPLE =
  '<165>1 2003-10-11T22:14:15.003Z mymachine.example.com evntslog - ID47 [exampleSDID@32473 iut="3" eventSource="Application"] An application event log entry';

describe('RFC 5424 解析', () => {
  it('正确解析 PRI、版本、字段与结构化数据', () => {
    const result = parseSyslogLine(RFC5424_SAMPLE, 1);
    expect(result.format).toBe('rfc5424');
    expect(result.errors).toEqual([]);
    expect(result.fields.pri).toBe(165);
    expect(result.fields.facilityCode).toBe(20);
    expect(result.fields.facilityName).toBe('local4');
    expect(result.fields.severityCode).toBe(5);
    expect(result.fields.severityName).toBe('notice');
    expect(result.fields.version).toBe(1);
    expect(result.fields.timestamp).toBe('2003-10-11T22:14:15.003Z');
    expect(result.fields.host).toBe('mymachine.example.com');
    expect(result.fields.app).toBe('evntslog');
    expect(result.fields.procid).toBeUndefined();
    expect(result.fields.msgid).toBe('ID47');
    expect(result.fields.message).toBe('An application event log entry');
    expect(result.fields.structuredData).toEqual([
      {
        id: 'exampleSDID@32473',
        params: { iut: '3', eventSource: 'Application' },
      },
    ]);
  });

  it('NILVALUE 字段表示为 undefined，多个 SD 块均可解析', () => {
    const line =
      '<13>1 2026-11-07T08:00:00Z host app 1234 - [meta a="1"][b@1 x="y"] hello';
    const result = parseSyslogLine(line, 1);
    expect(result.errors).toEqual([]);
    expect(result.fields.procid).toBe('1234');
    expect(result.fields.structuredData).toHaveLength(2);
    expect(result.fields.structuredData?.[1]).toEqual({ id: 'b@1', params: { x: 'y' } });
  });

  it('NILVALUE 结构化数据返回空数组', () => {
    const line = '<14>1 2026-11-07T08:00:00Z host app - - - plain message';
    const result = parseSyslogLine(line, 1);
    expect(result.fields.structuredData).toEqual([]);
    expect(result.fields.message).toBe('plain message');
  });
});

describe('RFC 3164 解析', () => {
  it('正确解析 PRI、时间戳、host、TAG 与正文', () => {
    const line = "<34>Oct 11 22:14:15 mymachine su: 'su root' failed";
    const result = parseSyslogLine(line, 1);
    expect(result.format).toBe('rfc3164');
    expect(result.errors).toEqual([]);
    expect(result.fields.pri).toBe(34);
    expect(result.fields.facilityCode).toBe(4);
    expect(result.fields.facilityName).toBe('security-auth');
    expect(result.fields.severityCode).toBe(2);
    expect(result.fields.severityName).toBe('critical');
    expect(result.fields.timestamp).toBe('Oct 11 22:14:15');
    expect(result.fields.host).toBe('mymachine');
    expect(result.fields.app).toBe('su');
    expect(result.fields.message).toBe("'su root' failed");
  });

  it('从 TAG[pid] 中提取进程 ID', () => {
    const line = 'Oct 11 22:14:15 host sshd[1234]: Accepted login'.replace(
      'Oct',
      '<38>Oct',
    );
    const result = parseSyslogLine(line, 1);
    expect(result.format).toBe('rfc3164');
    expect(result.fields.app).toBe('sshd');
    expect(result.fields.procid).toBe('1234');
    expect(result.fields.message).toBe('Accepted login');
  });
});

describe('异常与边界', () => {
  it('无 PRI 的纯文本标记为 unknown 并原样保留', () => {
    const result = parseSyslogLine('just a plain text line', 1);
    expect(result.format).toBe('unknown');
    expect(result.fields.message).toBe('just a plain text line');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('PRI 越界进入错误且不中断后续行', () => {
    const result = parseSyslog('<192>1 2026-11-07T08:00:00Z h a - - - msg\n<13>1 2026-11-07T08:01:00Z h a - - - ok');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]!.errors.some((error) => error.includes('越界'))).toBe(true);
    expect(result.lines[1]!.errors).toEqual([]);
  });

  it('空行被跳过，批量统计与构造样本一致', () => {
    const input = `${RFC5424_SAMPLE}\n\n<34>Oct 11 22:14:15 mymachine su: failed\n\nplain line\n`;
    const result = parseSyslog(input);
    expect(result.summary.total).toBe(3);
    expect(result.summary.formatCounts).toEqual({
      rfc5424: 1,
      rfc3164: 1,
      unknown: 1,
    });
    expect(result.summary.errorLines).toBe(1);
    expect(result.lines.map((line) => line.lineNo)).toEqual([1, 2, 3]);
  });

  it('空输入返回零统计', () => {
    const result = parseSyslog('   \n  \n');
    expect(result.summary.total).toBe(0);
    expect(result.lines).toEqual([]);
  });
});
