#!/usr/bin/env node

import { spawnSync } from 'child_process';

function ppidSync() {
  const res = spawnSync('wmic',
    [ 'process', 'where', `(processid=${process.pid})`, 'get', 'parentprocessid' ]);
  const lines = res.stdout.toString().split(/\r?\n/);

  return parseInt(lines[1].trim(), 10);
}

console.log(ppidSync());
