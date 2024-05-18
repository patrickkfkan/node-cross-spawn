// See http://www.robvanderwoude.com/escapechars.php
const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;

function escapeCommand(arg: string) {
  // Escape meta chars
  arg = arg.replace(metaCharsRegExp, '^$1');

  return arg;
}

function escapeArgument(arg: string, doubleEscapeMetaChars: boolean) {
  // Convert to string
  arg = `${arg}`;

  // Algorithm below is based on https://qntm.org/cmd

  // Sequence of backslashes followed by a double quote:
  // Double up all the backslashes and escape the double quote
  arg = arg.replace(/(\\*)"/g, '$1$1\\"');

  // Sequence of backslashes followed by the end of the string
  // (which will become a double quote later):
  // Double up all the backslashes
  arg = arg.replace(/(\\*)$/, '$1$1');

  // All other backslashes occur literally

  // Quote the whole thing:
  arg = `"${arg}"`;

  // Escape meta chars
  arg = arg.replace(metaCharsRegExp, '^$1');

  // Double escape meta chars if necessary
  if (doubleEscapeMetaChars) {
    arg = arg.replace(metaCharsRegExp, '^$1');
  }

  return arg;
}

export const command = escapeCommand;
export const argument = escapeArgument;
