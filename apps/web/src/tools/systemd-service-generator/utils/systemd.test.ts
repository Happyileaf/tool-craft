import { describe, expect, it } from 'vitest';
import {
  buildInstallCommands,
  createEmptyForm,
  generateServiceUnit,
  parseServiceUnit,
  splitEnvLines,
  validateSystemdForm,
  type SystemdForm,
} from './systemd';

const fullForm = (overrides: Partial<SystemdForm> = {}): SystemdForm => ({
  ...createEmptyForm(),
  unitName: 'my-webapp',
  description: 'My Web Application',
  after: 'network-online.target',
  wants: 'network-online.target',
  type: 'simple',
  execStart: '/usr/bin/node /opt/app/server.js',
  execStop: '/usr/bin/node /opt/app/shutdown.js',
  user: 'appuser',
  group: 'appgroup',
  workingDirectory: '/opt/app',
  environmentText: 'NODE_ENV=production\nPORT=3000',
  restart: 'on-failure',
  restartSec: 5,
  standardOutput: 'journal',
  standardError: 'journal',
  wantedBy: 'multi-user.target',
  ...overrides,
});

describe('generateServiceUnit 生成', () => {
  it('完整表单输出与固定快照一致，section 与键顺序稳定', () => {
    expect(generateServiceUnit(fullForm())).toBe(`[Unit]
Description=My Web Application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/node /opt/app/server.js
ExecStop=/usr/bin/node /opt/app/shutdown.js
User=appuser
Group=appgroup
WorkingDirectory=/opt/app
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`);
  });

  it('空字段整行省略，空 section 不输出，Restart=no 省略', () => {
    const output = generateServiceUnit(
      fullForm({
        after: '',
        wants: '',
        execStop: '',
        user: '',
        group: '',
        workingDirectory: '',
        environmentText: '',
        restart: 'no',
        restartSec: null,
        standardOutput: '',
        standardError: '',
        wantedBy: '',
      }),
    );
    expect(output).toBe(`[Unit]
Description=My Web Application

[Service]
Type=simple
ExecStart=/usr/bin/node /opt/app/server.js
`);
    expect(output).not.toContain('[Install]');
    expect(output).not.toContain('Restart=');
  });

  it('依赖列表压缩多余空白并支持多目标', () => {
    const output = generateServiceUnit(
      fullForm({ after: '  network.target   timers.target  ', wantedBy: 'multi-user.target  graphical.target' }),
    );
    expect(output).toContain('After=network.target timers.target');
    expect(output).toContain('WantedBy=multi-user.target graphical.target');
  });

  it('Environment 可重复指令逐行输出', () => {
    const output = generateServiceUnit(fullForm({ environmentText: 'A=1\n\nB=2 \n C=3' }));
    const envLines = output.split('\n').filter((line) => line.startsWith('Environment='));
    expect(envLines).toEqual(['Environment=A=1', 'Environment=B=2', 'Environment=C=3']);
  });

  it('各 Type 与 Restart 枚举值原样输出', () => {
    const output = generateServiceUnit(fullForm({ type: 'notify', restart: 'always' }));
    expect(output).toContain('Type=notify');
    expect(output).toContain('Restart=always');
  });

  it('校验失败时抛出带字段名的错误', () => {
    expect(() => generateServiceUnit(fullForm({ execStart: '' }))).toThrow('execStart');
    expect(() => generateServiceUnit(fullForm({ unitName: 'bad name!' }))).toThrow('unitName');
  });
});

describe('validateSystemdForm 校验', () => {
  it('合法表单通过', () => {
    expect(validateSystemdForm(fullForm()).valid).toBe(true);
  });

  it('单元名与 ExecStart 必填，单元名字符受限', () => {
    expect(validateSystemdForm(fullForm({ unitName: '' })).errors.unitName).toBeTruthy();
    expect(validateSystemdForm(fullForm({ unitName: 'a b' })).errors.unitName).toBeTruthy();
    expect(validateSystemdForm(fullForm({ execStart: '   ' })).errors.execStart).toBeTruthy();
  });

  it('RestartSec 非负校验', () => {
    expect(validateSystemdForm(fullForm({ restartSec: -1 })).errors.restartSec).toBeTruthy();
    expect(validateSystemdForm(fullForm({ restartSec: 0 })).errors.restartSec).toBeUndefined();
    expect(validateSystemdForm(fullForm({ restartSec: null })).errors.restartSec).toBeUndefined();
  });

  it('Environment 每行必须 KEY=VALUE 且变量名合法', () => {
    expect(validateSystemdForm(fullForm({ environmentText: 'NO_EQUALS' })).errors.environmentText).toBeTruthy();
    expect(validateSystemdForm(fullForm({ environmentText: '=value' })).errors.environmentText).toBeTruthy();
    expect(
      validateSystemdForm(fullForm({ environmentText: '1BAD=x' })).errors.environmentText,
    ).toBeTruthy();
    expect(
      validateSystemdForm(fullForm({ environmentText: 'GOOD_NAME=x' })).errors.environmentText,
    ).toBeUndefined();
  });
});

describe('parseServiceUnit 往返解析', () => {
  it('生成结果可解析回三个 section，可重复 Environment 全部保留', () => {
    const parsed = parseServiceUnit(generateServiceUnit(fullForm()));
    expect(Object.keys(parsed)).toEqual(['Unit', 'Service', 'Install']);
    const serviceDirectives = parsed.Service ?? [];
    const installDirectives = parsed.Install ?? [];
    const envs = serviceDirectives.filter((item) => item.key === 'Environment');
    expect(envs).toHaveLength(2);
    expect(envs[0]).toEqual({ key: 'Environment', value: 'NODE_ENV=production' });
    expect(installDirectives[0]).toEqual({ key: 'WantedBy', value: 'multi-user.target' });
  });

  it('注释与空行忽略，CRLF 容错', () => {
    const text = '# header\n[Unit]\r\nDescription=X\r\n; comment\r\n';
    const parsed = parseServiceUnit(text);
    expect(parsed.Unit).toEqual([{ key: 'Description', value: 'X' }]);
  });

  it('段外指令与缺等号行抛错', () => {
    expect(() => parseServiceUnit('Description=orphan\n[Unit]\n')).toThrow('section');
    expect(() => parseServiceUnit('[Unit]\nBROKEN\n')).toThrow('=');
  });
});

describe('buildInstallCommands 命令提示', () => {
  it('文件名与单元名一致，自动补 .service 后缀', () => {
    const commands = buildInstallCommands('my-webapp');
    expect(commands).toContain('sudo cp my-webapp.service /etc/systemd/system/');
    expect(commands).toContain('sudo systemctl enable --now my-webapp.service');
    expect(buildInstallCommands('already.service')).toContain(
      'sudo cp already.service /etc/systemd/system/',
    );
  });
});

describe('splitEnvLines 辅助函数', () => {
  it('去空白、丢弃空行', () => {
    expect(splitEnvLines(' A=1 \n\nB=2\n  ')).toEqual(['A=1', 'B=2']);
  });
});
