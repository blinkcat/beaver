// jest.config.ts
import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  testEnvironment: 'node',
  projects: ['<rootDir>/packages'],
};

export default config;
