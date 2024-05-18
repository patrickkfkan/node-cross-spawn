import path from 'path';
import * as escape from './util/escape.js';
import { resolveCommand } from './util/resolveCommand.js';
import { readShebang } from './util/readShebang.js';
import readCmdShim from 'read-cmd-shim';
import { CommonSpawnOptions } from 'child_process';
import { ParsedSpawnParams, CrossSpawnOptions } from '../types.js';

const isWin = process.platform === 'win32';
const isExecutableRegExp = /\.(?:com|exe)$/i;
const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;

function detectShebang<T extends CommonSpawnOptions>(parsed: ParsedSpawnParams<T>) {
  parsed.file = resolveCommand(parsed);

  if (parsed.file) {
    const shebang = readShebang(parsed.file);
    if (shebang) {
      parsed.args.unshift(parsed.file);
      parsed.command = shebang;

      return resolveCommand(parsed);
    }
  }

  return parsed.file;
}

function isCmdShim(commandFile: string) {
  // Check if file is located in `node_modules/.bin/`
  if (isCmdShimRegExp.test(commandFile)) {
    return true;
  }
  // A cmd-shim does not necessarily have to be in `node_modules/.bin/`,
  // Such as one installed globally through 'npm i -g'. So we test by reading
  // Its contents and see if we can obtain the wrapped command.
  try {
    const dest = readCmdShim.sync(commandFile.toLowerCase());

    return !!dest;
  }
  catch (error) {
    return false;
  }
}

function parseNonShell<T extends CommonSpawnOptions>(parsed: ParsedSpawnParams<T>) {
  if (!isWin) {
    return parsed;
  }

  // Detect & add support for shebangs
  const commandFile = detectShebang(parsed) || '';

  // We don't need a shell if the command filename is an executable
  const needsShell = !isExecutableRegExp.test(commandFile);

  // If a shell is required, use cmd.exe and take care of escaping everything correctly
  // Note that `forceShell` is an hidden option used only in tests
  if (parsed.options.forceShell || needsShell) {
    // Need to double escape meta chars if the command is a cmd-shim.
    // The cmd-shim simply calls execute the package bin file with NodeJS, proxying any argument
    // Because the escape of metachars with ^ gets interpreted when the cmd.exe is first called,
    // We need to double escape them
    const needsDoubleEscapeMetaChars = isCmdShim(commandFile);

    // Normalize posix paths into OS compatible paths (e.g.: foo/bar -> foo\bar)
    // This is necessary otherwise it will always fail with ENOENT in those cases
    parsed.command = path.normalize(parsed.command);

    // Escape command & arguments
    parsed.command = escape.command(parsed.command);
    parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));

    const shellCommand = [ parsed.command ].concat(parsed.args).join(' ');

    parsed.args = [ '/d', '/s', '/c', `"${shellCommand}"` ];
    parsed.command = process.env.comspec || 'cmd.exe';
    parsed.options.windowsVerbatimArguments = true; // Tell node's spawn that the arguments are already escaped
  }

  return parsed;
}

export function parse<T extends CommonSpawnOptions>(command: string, args?: string[], options?: CrossSpawnOptions<T>) {
  // Normalize arguments, similar to nodejs
  if (args && !Array.isArray(args)) {
    options = args;
    args = undefined;
  }

  args = args ? args.slice(0) : []; // Clone array to avoid changing the original
  options = Object.assign({}, options); // Clone object to avoid changing the original

  // Build our parsed object
  const parsed = {
    command,
    args,
    options,
    file: undefined,
    original: {
      command,
      args
    }
  };

  // Delegate further parsing to shell or non-shell
  return options.shell ? parsed : parseNonShell(parsed);
}
