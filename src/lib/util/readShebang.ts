import fs from 'fs';
import shebangCommand from 'shebang-command';

export function readShebang(command: string) {
  // Read the first 150 bytes from the file
  const size = 150;
  const buffer = Buffer.alloc(size);

  let fd;

  try {
    fd = fs.openSync(command, 'r');
    fs.readSync(fd, buffer, 0, size, 0);
    fs.closeSync(fd);
  }
  catch (e) { /* Empty */ }

  // Attempt to extract shebang (null is returned if not a shebang)
  return shebangCommand(buffer.toString());
}
