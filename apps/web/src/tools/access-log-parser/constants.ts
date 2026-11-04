/** 输入框默认示例（NCSA Combined + Common 混合，含 request_time 扩展与一行畸形行） */
export const SAMPLE_LOG = `127.0.0.1 - frank [10/Oct/2026:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326 "http://www.example.com/start.html" "Mozilla/4.08 [en] (Win98; I ;Nav)" 0.032
192.168.1.10 - - [10/Oct/2026:13:55:38 -0700] "GET /index.html?src=home HTTP/1.1" 200 1024 "-" "Mozilla/5.0 (X11; Linux x86_64)" 0.011
192.168.1.10 - - [10/Oct/2026:13:55:40 -0700] "POST /api/login HTTP/1.1" 302 - "http://www.example.com/" "Mozilla/5.0 (X11; Linux x86_64)" 0.187
10.0.0.5 - alice [10/Oct/2026:13:56:02 -0700] "GET /missing HTTP/1.1" 404 512 "http://www.example.com/index.html" "curl/8.4.0"
10.0.0.5 - - [10/Oct/2026:13:56:05 -0700] "GET /admin HTTP/1.1" 403 0 "-" "curl/8.4.0"
203.0.113.7 - - [10/Oct/2026:13:56:30 -0700] "GET /index.html HTTP/1.1" 200 1024 "http://www.example.com/" "Mozilla/5.0 (Windows NT 10.0)"
203.0.113.7 - - [10/Oct/2026:13:56:31 -0700] "GET /apache_pb.gif HTTP/1.1" 200 2326 "http://www.example.com/index.html" "Mozilla/5.0 (Windows NT 10.0)"
this is not a valid log line
198.51.100.22 - - [10/Oct/2026:13:57:12 -0700] "GET /crash HTTP/1.1" 500 256 "-" "python-requests/2.31"`;

export const STATUS_CLASS_COLORS: Record<'1xx' | '2xx' | '3xx' | '4xx' | '5xx', string> = {
  '1xx': '#1677ff',
  '2xx': '#52c41a',
  '3xx': '#faad14',
  '4xx': '#fa8c16',
  '5xx': '#f5222d',
};
