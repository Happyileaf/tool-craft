/**
 * docker run → docker-compose 转换器常量
 */

/** 支持的 docker run 选项速查表（用于 UI 说明） */
export const SUPPORTED_OPTIONS: { option: string; compose: string }[] = [
  { option: '-d / --detach', compose: '默认后台运行，无需字段（静默忽略）' },
  { option: '--name', compose: 'container_name / 服务名' },
  { option: '--restart', compose: 'restart' },
  { option: '-p / --publish', compose: 'ports（可重复）' },
  { option: '-v / --volume', compose: 'volumes（可重复）' },
  { option: '-e / --env', compose: 'environment（可重复）' },
  { option: '--env-file', compose: 'env_file' },
  { option: '--network / --net', compose: 'network_mode' },
  { option: '--hostname / -h', compose: 'hostname' },
  { option: '-w / --workdir', compose: 'working_dir' },
  { option: '-u / --user', compose: 'user' },
  { option: '--entrypoint', compose: 'entrypoint' },
  { option: '--memory / -m、--cpus', compose: 'mem_limit / cpus' },
  { option: '--cap-add / --cap-drop', compose: 'cap_add / cap_drop' },
  { option: '--device / --dns / --tmpfs', compose: 'devices / dns / tmpfs' },
  { option: '--add-host', compose: 'extra_hosts' },
  { option: '--sysctl / --ulimit / --label', compose: 'sysctls / ulimits / labels' },
  { option: '--privileged / --init / --read-only / -it', compose: '同名布尔字段' },
  { option: '--health-cmd 等', compose: 'healthcheck' },
  { option: '--log-driver / --log-opt', compose: 'logging' },
  { option: '--rm', compose: '一次性容器，无等价字段（告警提示）' },
];
