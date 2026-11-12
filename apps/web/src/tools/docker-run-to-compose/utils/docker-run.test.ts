import { describe, expect, it } from 'vitest';
import {
  SAMPLE_DOCKER_RUN,
  convertDockerRunToCompose,
  parseDockerRun,
  tokenizeShell,
} from './docker-run';

describe('tokenizeShell', () => {
  it('splits on whitespace and respects single, double quotes and escapes', () => {
    expect(tokenizeShell('docker run -e A="hello world" nginx echo \'a b\' c\\ d')).toEqual([
      'docker',
      'run',
      '-e',
      'A=hello world',
      'nginx',
      'echo',
      'a b',
      'c d',
    ]);
  });

  it('handles line continuations and backslashes inside double quotes', () => {
    expect(tokenizeShell('run --health-cmd "curl \\"http://x/\\"" img')).toEqual([
      'run',
      '--health-cmd',
      'curl "http://x/"',
      'img',
    ]);
  });
});

describe('parseDockerRun validation', () => {
  it('rejects empty input and non-run commands', () => {
    expect(parseDockerRun('   ').ok).toBe(false);
    const result = parseDockerRun('docker ps -a');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/run/);
    }
  });

  it('rejects a command without an image', () => {
    const result = parseDockerRun('docker run --name only-flags');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/镜像/);
    }
  });

  it('reports a missing option value', () => {
    const result = parseDockerRun('docker run --name');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/缺少取值/);
    }
  });

  it('rejects invalid --cpus', () => {
    const result = parseDockerRun('docker run --cpus=abc nginx');
    expect(result.ok).toBe(false);
  });
});

describe('parseDockerRun mapping', () => {
  it('maps core options, lists and key-value pairs', () => {
    const result = parseDockerRun(
      [
        'docker run -d --name webapp --restart unless-stopped',
        '-p 8080:80 -v /data:/usr/share:ro',
        '-e NGINX_HOST=example.com -e EMPTY_VAR',
        '--network app-net --hostname web --memory 512m --cpus 1.5',
        '--cap-add NET_BIND_SERVICE --cap-drop ALL',
        '--sysctl net.core.somaxconn=1024 --ulimit nofile=65535',
        'nginx:1.27-alpine nginx -g "daemon off;"',
      ].join(' '),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const { service } = result;
    expect(service.name).toBe('webapp');
    expect(service.image).toBe('nginx:1.27-alpine');
    expect(service.containerName).toBe('webapp');
    expect(service.restart).toBe('unless-stopped');
    expect(service.networkMode).toBe('app-net');
    expect(service.hostname).toBe('web');
    expect(service.memLimit).toBe('512m');
    expect(service.cpus).toBe(1.5);
    expect(service.ports).toEqual(['8080:80']);
    expect(service.volumes).toEqual(['/data:/usr/share:ro']);
    expect(service.capAdd).toEqual(['NET_BIND_SERVICE']);
    expect(service.capDrop).toEqual(['ALL']);
    expect(service.environment).toEqual({ NGINX_HOST: 'example.com', EMPTY_VAR: '' });
    expect(service.sysctls).toEqual({ 'net.core.somaxconn': '1024' });
    expect(service.ulimits).toEqual({ nofile: '65535' });
    expect(service.command).toBe('nginx -g daemon off;');
  });

  it('supports combined short boolean flags and --opt=value form', () => {
    const result = parseDockerRun(
      'docker run -it --rm --privileged --env-file=.env --tmpfs=/run --dns=8.8.8.8 redis:7',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.service.stdinOpen).toBe(true);
    expect(result.service.tty).toBe(true);
    expect(result.service.privileged).toBe(true);
    expect(result.service.envFiles).toEqual(['.env']);
    expect(result.service.tmpfs).toEqual(['/run']);
    expect(result.service.dns).toEqual(['8.8.8.8']);
    expect(result.warnings.some((w) => w.includes('--rm'))).toBe(true);
  });

  it('derives service name from the image when --name is absent', () => {
    const result = parseDockerRun('docker run registry.example.com/team/my-svc:v2');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.service.name).toBe('my-svc');
  });

  it('maps healthcheck and logging options', () => {
    const result = parseDockerRun(
      'docker run --health-cmd "curl -f http://localhost/" --health-interval 30s --health-retries 3 --log-driver json-file --log-opt max-size=10m nginx',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.service.healthCheck).toMatchObject({
      interval: '30s',
      retries: 3,
    });
    expect(result.service.healthCheck?.test).toEqual(['CMD-SHELL', 'curl -f http://localhost/']);
    expect(result.service.logs?.driver).toBe('json-file');
    expect((result.service.logs?.options as Record<string, string>)?.['max-size']).toBe('10m');
  });

  it('warns on unknown options instead of failing', () => {
    const result = parseDockerRun('docker run --some-future-flag=x nginx');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.warnings.some((w) => w.includes('--some-future-flag'))).toBe(true);
  });
});

describe('convertDockerRunToCompose YAML', () => {
  it('emits indented YAML with quoted risky scalars', () => {
    const result = convertDockerRunToCompose(
      'docker run --name demo -p 80:80 -e MSG="hello: world" nginx',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.yaml).toContain('services:');
    expect(result.yaml).toContain('  demo:');
    expect(result.yaml).toContain('    image: nginx');
    expect(result.yaml).toContain('      - 80:80');
    expect(result.yaml).toContain('      MSG: "hello: world"');
    expect(result.yaml.endsWith('\n')).toBe(true);
  });

  it('converts the full sample command end to end', () => {
    const result = convertDockerRunToCompose(SAMPLE_DOCKER_RUN);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.yaml).toContain('  webapp:');
    expect(result.yaml).toContain('    image: nginx:1.27-alpine');
    expect(result.yaml).toContain('    restart: unless-stopped');
    expect(result.yaml).toContain('    ports:');
    expect(result.yaml).toContain('    volumes:');
    expect(result.yaml).toContain('    environment:');
    expect(result.yaml).toContain('    healthcheck:');
    expect(result.yaml).toContain('    cap_add:');
    expect(result.yaml).toContain('    cpus: 1.5');
    expect(result.warnings).toEqual([]);
  });

  it('quotes YAML booleans-like and special-character values', () => {
    const result = convertDockerRunToCompose('docker run -e ON=yes -e PLAIN=abc-1.2 nginx');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.yaml).toContain('      ON: "yes"');
    expect(result.yaml).toContain('      PLAIN: abc-1.2');
  });
});
