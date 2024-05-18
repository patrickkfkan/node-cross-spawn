import * as cp from 'child_process';
import { parse } from './lib/parse.js';
import * as enoent from './lib/enoent.js';
import { CrossSpawnOptions } from './types.js';

export function spawn<T extends cp.CommonSpawnOptions>(command: string, args?: string[], options?: CrossSpawnOptions<T>) {
  // Parse the arguments
  const parsed = parse(command, args, options);

  // Spawn the child process
  const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);

  // Hook into child process "exit" event to emit an error if the command
  // Does not exists, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
  enoent.hookChildProcess(spawned, parsed);

  return spawned;
}

function spawnSync<T extends cp.CommonSpawnOptions>(command: string, args?: string[], options?: CrossSpawnOptions<T>) {
  // Parse the arguments
  const parsed = parse(command, args, options);

  // Spawn the child process
  const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);

  // Analyze if the command does not exist, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
  result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);

  return result;
}

export default spawn;
export { parse as _parse } from './lib/parse.js';
export const sync = spawnSync;
export const _enoent = enoent;
