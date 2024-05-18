import path from 'path';
import which from 'which';
import getPathKey from 'path-key';
import { CommonSpawnOptions } from 'child_process';
import { ParsedSpawnParams, CrossSpawnOptions } from '../../types.js';

function hasCustomCwd<T extends CommonSpawnOptions>(options: CrossSpawnOptions<T>): options is CrossSpawnOptions<T> & { cwd: string; } {
  return options.cwd != null;
}

function processCanChdir(process: any): process is NodeJS.Process {
  // Worker threads do not have process.chdir()
  return process.chdir !== undefined && !process.chdir.disabled;
}

function resolveCommandAttempt<T extends CommonSpawnOptions>(parsed: ParsedSpawnParams<T>, withoutPathExt?: boolean) {
  const opts = parsed.options;
  const env = opts.env || process.env;
  const cwd = process.cwd();

  // If a custom `cwd` was specified, we need to change the process cwd
  // Because `which` will do stat calls but does not support a custom cwd
  if (hasCustomCwd(opts) && processCanChdir(process)) {
    try {
      process.chdir(opts.cwd);
    }
    catch (err) {
      /* Empty */
    }
  }

  let resolved;

  try {
    resolved = which.sync(parsed.command, {
      path: env[getPathKey({ env })],
      pathExt: withoutPathExt ? path.delimiter : undefined
    });
  }
  catch (e) {
    /* Empty */
  }
  finally {
    if (hasCustomCwd(opts) && processCanChdir(process)) {
      process.chdir(cwd);
    }
  }

  // If we successfully resolved, ensure that an absolute path is returned
  // Note that when a custom `cwd` was used, we need to resolve to an absolute path based on it
  if (resolved) {
    resolved = path.resolve(hasCustomCwd(opts) ? opts.cwd : '', resolved);
  }

  return resolved;
}

export function resolveCommand<T extends CommonSpawnOptions>(parsed: ParsedSpawnParams<T>) {
  return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
}
