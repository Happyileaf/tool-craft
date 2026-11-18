import type { RestartPolicy, ServiceType, SystemdForm } from './utils/systemd';

/** Type= 可选值与中文说明 */
export const SERVICE_TYPE_OPTIONS: Array<{ value: ServiceType; label: string }> = [
  { value: 'simple', label: 'simple（默认，主进程常驻前台）' },
  { value: 'exec', label: 'exec（同 simple，但等待 ExecStart 派生完成）' },
  { value: 'forking', label: 'forking（服务自行 fork 并退出父进程）' },
  { value: 'oneshot', label: 'oneshot（一次性任务，退出即完成）' },
  { value: 'dbus', label: 'dbus（取得 D-Bus 名称后视为就绪）' },
  { value: 'notify', label: 'notify（通过 sd_notify 通知就绪）' },
  { value: 'idle', label: 'idle（等所有作业完成后再启动）' },
];

/** Restart= 可选值与中文说明 */
export const RESTART_OPTIONS: Array<{ value: RestartPolicy; label: string }> = [
  { value: 'no', label: 'no（不重启，默认）' },
  { value: 'on-success', label: 'on-success（仅正常退出时重启）' },
  { value: 'on-failure', label: 'on-failure（非零退出 / 信号终止时重启）' },
  { value: 'on-abnormal', label: 'on-abnormal（信号 / 超时 / 看门狗时重启）' },
  { value: 'on-watchdog', label: 'on-watchdog（仅看门狗超时时重启）' },
  { value: 'on-abort', label: 'on-abort（仅未捕获信号终止时重启）' },
  { value: 'always', label: 'always（无论退出原因始终重启）' },
];

/** 常见服务预设 */
export interface ServicePreset {
  key: string;
  label: string;
  form: SystemdForm;
}

const baseForm = (): SystemdForm => ({
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
});

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    key: 'webapp',
    label: 'Node Web 守护服务',
    form: {
      ...baseForm(),
      unitName: 'my-webapp',
      description: 'My Node.js Web Application',
      after: 'network-online.target',
      wants: 'network-online.target',
      type: 'simple',
      execStart: '/usr/bin/node /opt/app/server.js',
      user: 'appuser',
      workingDirectory: '/opt/app',
      environmentText: 'NODE_ENV=production\nPORT=3000',
      restart: 'on-failure',
      restartSec: 5,
      standardOutput: 'journal',
      standardError: 'journal',
      wantedBy: 'multi-user.target',
    },
  },
  {
    key: 'oneshot',
    label: '定时 / 一次性脚本',
    form: {
      ...baseForm(),
      unitName: 'daily-job',
      description: 'Daily maintenance job',
      after: 'network.target',
      type: 'oneshot',
      execStart: '/usr/local/bin/daily-job.sh',
      user: 'root',
      wantedBy: 'multi-user.target',
    },
  },
  {
    key: 'forking',
    label: '传统 forking 守护进程',
    form: {
      ...baseForm(),
      unitName: 'legacy-daemon',
      description: 'Legacy forking daemon',
      after: 'network.target',
      type: 'forking',
      execStart: '/usr/local/bin/daemonctl start',
      execStop: '/usr/local/bin/daemonctl stop',
      user: 'daemon',
      restart: 'on-failure',
      restartSec: 10,
      wantedBy: 'multi-user.target',
    },
  },
];

/** UI 首次加载的默认预设 key */
export const DEFAULT_PRESET_KEY = 'webapp';
