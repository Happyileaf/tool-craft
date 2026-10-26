export const TWITTER_EPOCH = BigInt(1288834974657);
export const DISCORD_EPOCH = BigInt(1420070400000);

export const SNOWFLAKE_MAX = (BigInt(1) << BigInt(63)) - BigInt(1);
export const MACHINE_ID_MAX = (1 << 10) - 1;
export const WORKER_ID_MAX = (1 << 5) - 1;
export const SEQUENCE_MAX = (1 << 12) - 1;

export interface SnowflakePreset {
  key: string;
  label: string;
  epoch: bigint;
}

export const SNOWFLAKE_PRESETS: SnowflakePreset[] = [
  { key: 'twitter', label: 'Twitter / X', epoch: TWITTER_EPOCH },
  { key: 'discord', label: 'Discord', epoch: DISCORD_EPOCH },
];

export interface SnowflakeParts {
  id: bigint;
  idDecimal: string;
  idHex: string;
  idBinary: string;
  timestamp: number;
  relativeTimestamp: number;
  machineId: number;
  workerId: number;
  processId: number;
  sequence: number;
}

export function parseEpochInput(epoch: number | string): bigint {
  const value = typeof epoch === 'string' ? Number(epoch.trim()) : epoch;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('纪元必须是非负整数毫秒时间戳');
  }
  return BigInt(value);
}

export function parseSnowflakeId(input: string): bigint {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Snowflake ID 必须是十进制正整数');
  }
  let id: bigint;
  try {
    id = BigInt(trimmed);
  } catch {
    throw new Error('Snowflake ID 格式不合法');
  }
  if (id <= BigInt(0)) {
    throw new Error('Snowflake ID 必须大于 0');
  }
  if (id > SNOWFLAKE_MAX) {
    throw new Error('Snowflake ID 超出 64 位有符号整数范围（> 2^63 - 1）');
  }
  return id;
}

export function decomposeSnowflake(input: string, epoch: number | string | bigint): SnowflakeParts {
  const id = parseSnowflakeId(input);
  const epochBig = typeof epoch === 'bigint' ? epoch : parseEpochInput(epoch);
  const relative = id >> BigInt(22);
  const timestampBig = relative + epochBig;
  if (timestampBig > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('解析出的时间戳超出安全整数范围');
  }
  const timestamp = Number(timestampBig);
  if (timestamp < Number(epochBig)) {
    throw new Error('解析出的时间早于所选纪元，请确认纪元是否正确');
  }
  const machineId = Number((id >> BigInt(12)) & BigInt(1023));
  return {
    id,
    idDecimal: id.toString(10),
    idHex: `0x${id.toString(16).toUpperCase()}`,
    idBinary: id.toString(2).padStart(64, '0'),
    timestamp,
    relativeTimestamp: Number(relative),
    machineId,
    workerId: machineId >> 5,
    processId: machineId & WORKER_ID_MAX,
    sequence: Number(id & BigInt(4095)),
  };
}

export interface BuildSnowflakeInput {
  timestamp: number;
  machineId?: number;
  workerId?: number;
  processId?: number;
  sequence?: number;
}

export function buildSnowflake(input: BuildSnowflakeInput, epoch: number | string | bigint): string {
  const epochBig = typeof epoch === 'bigint' ? epoch : parseEpochInput(epoch);
  const { timestamp } = input;
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new Error('时间戳必须是非负整数毫秒值');
  }
  const timestampBig = BigInt(timestamp);
  if (timestampBig < epochBig) {
    throw new Error('时间戳不能早于所选纪元');
  }
  const relative = timestampBig - epochBig;
  if (relative >= BigInt(1) << BigInt(41)) {
    throw new Error('相对纪元的时间差超出 41 位范围');
  }

  let machineId: number;
  if (input.machineId !== undefined) {
    machineId = input.machineId;
    if (input.workerId !== undefined || input.processId !== undefined) {
      throw new Error('机器位与 worker/process 拆分不能同时指定');
    }
  } else {
    const workerId = input.workerId ?? 0;
    const processId = input.processId ?? 0;
    if (!Number.isInteger(workerId) || workerId < 0 || workerId > WORKER_ID_MAX) {
      throw new Error(`worker ID 必须是 0–${WORKER_ID_MAX} 的整数`);
    }
    if (!Number.isInteger(processId) || processId < 0 || processId > WORKER_ID_MAX) {
      throw new Error(`process ID 必须是 0–${WORKER_ID_MAX} 的整数`);
    }
    machineId = (workerId << 5) | processId;
  }
  if (!Number.isInteger(machineId) || machineId < 0 || machineId > MACHINE_ID_MAX) {
    throw new Error(`机器 ID 必须是 0–${MACHINE_ID_MAX} 的整数`);
  }
  const sequence = input.sequence ?? 0;
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > SEQUENCE_MAX) {
    throw new Error(`序列号必须是 0–${SEQUENCE_MAX} 的整数`);
  }

  const id =
    (relative << BigInt(22)) | (BigInt(machineId) << BigInt(12)) | BigInt(sequence);
  if (id > SNOWFLAKE_MAX) {
    throw new Error('拼装结果超出 64 位有符号整数范围');
  }
  return id.toString(10);
}
