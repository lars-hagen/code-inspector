import { CodeOptions, RecordInfo, isDev } from '@code-inspector/core';
import path from 'path';
import { fileURLToPath } from 'url';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

export function TurbopackCodeInspectorPlugin(
  options: Options
): Record<string, any> {
  if (
    options.close ||
    !isDev(options.dev, process.env.NODE_ENV === 'development')
  ) {
    return {};
  }

  const record: RecordInfo = {
    port: 0,
    entry: '',
    output: options.output,
  };

  let WebpackEntry = null;
  if (typeof require !== 'undefined' && typeof require.resolve === 'function') {
    WebpackEntry = require.resolve('@code-inspector/webpack');
  }
  if (typeof import.meta.resolve === 'function') {
    const dir = import.meta.resolve(
      '@code-inspector/webpack'
    ) as unknown as string;
    WebpackEntry = fileURLToPath(dir);
  }
  const WebpackDistDir = path.resolve(WebpackEntry, '..');

  // Due to a Turbopack bug, middleware files cause errors when processed with webpack loaders
  // See: https://github.com/vercel/next.js/issues/[pending]
  // We use specific patterns to avoid middleware.ts files in root or src directories
  const loaderConfig = {
    loaders: [
      {
        loader: `${WebpackDistDir}/loader.js`,
        options: {
          ...options,
          record,
        },
        ...(options.enforcePre === false ? {} : { enforce: 'pre' }),
      },
      {
        loader: `${WebpackDistDir}/inject-loader.js`,
        options: {
          ...options,
          record,
        },
        enforce: 'pre',
      },
    ],
  };

  // Apply loaders to common Next.js directories, avoiding root-level files
  return {
    '**/app/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/components/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/lib/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/utils/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/hooks/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/services/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/features/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/modules/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/ui/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/pages/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/context/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/store/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
    '**/types/**/*.{jsx,tsx,js,ts,mjs,mts}': loaderConfig,
  };
}
