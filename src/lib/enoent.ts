import { ParsedSpawnParams } from '../types.js';
import { ChildProcess, CommonSpawnOptions } from 'child_process';

const isWin = process.platform === 'win32';

export function notFoundError<T extends CommonSpawnOptions>(original: ParsedSpawnParams<T>['original'], syscall: string) {
  return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
    code: 'ENOENT',
    errno: 'ENOENT',
    syscall: `${syscall} ${original.command}`,
    path: original.command,
    spawnargs: original.args
  });
}

export function hookChildProcess<T extends CommonSpawnOptions>(cp: ChildProcess, parsed: ParsedSpawnParams<T>) {
  if (!isWin) {
    return;
  }

  const originalEmit = cp.emit;

  cp.emit = (event: string, ...args: any[]) => {
    // If emitting "exit" event and exit code is 1, we need to check if
    // The command exists and emit an "error" instead
    // See https://github.com/IndigoUnited/node-cross-spawn/issues/16
    if (event === 'exit') {
      const code = args[0];
      const err = verifyENOENT(code, parsed);

      if (err) {
        return originalEmit.call<ChildProcess, [event: 'error', err: Error], boolean>(cp, 'error', err);
      }
    }

    return originalEmit.apply<ChildProcess, [event: string, ...args: any[]], boolean>(cp, [ event, ...args ]);
  };
}

export function verifyENOENT<T extends CommonSpawnOptions>(status: number, parsed: ParsedSpawnParams<T>) {
  if (isWin && status === 1 && !parsed.file) {
    return notFoundError(parsed.original, 'spawn');
  }

  return undefined;
}

export function verifyENOENTSync<T extends CommonSpawnOptions>(status: number | null, parsed: ParsedSpawnParams<T>) {
  if (isWin && status === 1 && !parsed.file) {
    return notFoundError(parsed.original, 'spawnSync');
  }

  return undefined;
}
