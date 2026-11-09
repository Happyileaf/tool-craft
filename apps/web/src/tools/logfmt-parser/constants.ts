export const SAMPLE_INPUT = `level=info msg="server started" port=8080 debug
level=warn msg="cache miss" key=user:42 duration_ms=12.5
level=error msg="say \\"hi\\" failed" code=500 retries=0 trace_id=abc123`;

export const TYPE_COLORS: Record<string, string> = {
  integer: 'blue',
  float: 'geekblue',
  boolean: 'green',
  string: 'default',
  null: 'red',
};

export const TYPE_LABELS: Record<string, string> = {
  integer: '整数',
  float: '浮点',
  boolean: '布尔',
  string: '字符串',
  null: 'null',
};

export const HINT =
  '解析 Heroku / Promtail / Go 服务常用的 logfmt（key=value 空格分隔，双引号支持反斜杠转义，裸键视为 true），按行对齐为字段表并推断类型；也可把键值对象反向序列化为合规 logfmt。全部解析在浏览器本地完成。';
