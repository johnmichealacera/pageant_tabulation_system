/**
 * Electron-builder configuration for the Pageant Tabulation System desktop build.
 * Produces a Windows NSIS installer (.exe).
 */
module.exports = {
  appId: 'com.pageant.tabulation',
  productName: 'Pageant Tabulation System',
  copyright: 'Copyright © 2026',

  directories: {
    output: 'dist',
  },

  files: [
    '.next/**/*',
    'public/**/*',
    'prisma/schema.desktop.prisma',
    'prisma/pageant.db',
    'electron/**/*',
    'node_modules/**/*',
    'node_modules/.prisma/**/*',
    'package.json',
    'next.config.js',
    '!node_modules/.cache',
    '!node_modules/.prisma/client/libquery_engine-linux*',
    '!node_modules/.prisma/client/libquery_engine-darwin*',
    '!node_modules/@prisma/engines/libquery_engine-linux*',
    '!node_modules/@prisma/engines/libquery_engine-darwin*',
    '!node_modules/@prisma/engines/schema-engine-linux*',
    '!node_modules/@prisma/engines/schema-engine-darwin*',
    '!**/*.map',
  ],

  win: {
    target: [
      {
        target: 'dir',
        arch: ['x64'],
      },
    ],
  },

  asar: false,
};
