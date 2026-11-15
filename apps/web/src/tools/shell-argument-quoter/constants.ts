export const SHELL_SAMPLES: Record<string, string[]> = {
  posix: ['Hello World', "it's", '$HOME/*.txt', 'line1\nline2', ''],
  cmd: ['a & b', '%PATH%', '!FOO!', 'C:\\Program Files\\My App', 'say "hi"'],
  powershell: ["it's", 'C:\\temp\\$x', '$env:PATH', 'a b', ''],
};
