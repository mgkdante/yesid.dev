import * as migration_20260421_035719 from './20260421_035719';

export const migrations = [
  {
    up: migration_20260421_035719.up,
    down: migration_20260421_035719.down,
    name: '20260421_035719'
  },
];
