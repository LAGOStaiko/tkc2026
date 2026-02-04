import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: ['src/components/ui/**', 'src/routeTree.gen.ts', 'functions/**', 'src/tanstack-table.d.ts'],
  ignoreDependencies: []
};

export default config;