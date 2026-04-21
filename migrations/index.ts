import * as migration_20260421_035719 from './20260421_035719';
import * as migration_20260421_204630 from './20260421_204630';

export const migrations = [
  {
    up: migration_20260421_035719.up,
    down: migration_20260421_035719.down,
    name: '20260421_035719',
  },
  {
    up: migration_20260421_204630.up,
    down: migration_20260421_204630.down,
    name: '20260421_204630'
  },
];
