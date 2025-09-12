import { CodeOptions, RecordInfo, isDev } from '@code-inspector/core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
  turbopackFilePattern?: string;
}

// Check for middleware files in common locations
function detectMiddleware(cwd: string): string[] {
  const middlewareFiles: string[] = [];
  
  // Only check for .ts and .js (official Next.js supported extensions)
  const quickCheckPaths = [
    'middleware.ts',
    'middleware.js',
    'src/middleware.ts',
    'src/middleware.js',
  ];
  
  for (const middlewarePath of quickCheckPaths) {
    const fullPath = path.join(cwd, middlewarePath);
    if (fs.existsSync(fullPath)) {
      middlewareFiles.push(middlewarePath);
    }
  }
  
  return middlewareFiles;
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
  
  // Check for middleware files if no custom pattern is set and warning not shown
  if (!options.turbopackFilePattern && !process.env.__CODE_INSPECTOR_TURBOPACK_WARNING_SHOWN) {
    const cwd = process.cwd();
    const middlewareFiles = detectMiddleware(cwd);
    
    if (middlewareFiles.length > 0) {
      process.env.__CODE_INSPECTOR_TURBOPACK_WARNING_SHOWN = 'true'; // Set env var to prevent showing again
      
      // Colorful warning message
      console.warn('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
      console.warn('\x1b[33m⚠️  \x1b[1mCODE INSPECTOR - TURBOPACK CONFIGURATION REQUIRED\x1b[0m \x1b[33m⚠️\x1b[0m');
      console.warn('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
      
      console.warn('\x1b[31mCRITICAL:\x1b[0m Detected middleware file(s) that \x1b[1mWILL\x1b[0m cause Turbopack to crash:');
      middlewareFiles.forEach(file => {
        console.warn(`  \x1b[31m•\x1b[0m ${file}`);
      });
      
      console.warn('\n\x1b[1mTo fix this issue, add the following to your next.config.ts:\x1b[0m\n');
      
      console.warn('\x1b[36m┌─────────────────────────────────────────────────────────────────┐\x1b[0m');
      console.warn('\x1b[36m│\x1b[0m turbopack: {                                                    \x1b[36m│\x1b[0m');
      console.warn('\x1b[36m│\x1b[0m   rules: codeInspectorPlugin({                                  \x1b[36m│\x1b[0m');
      console.warn('\x1b[36m│\x1b[0m     bundler: \'turbopack\',                                       \x1b[36m│\x1b[0m');
      console.warn('\x1b[36m│\x1b[0m     turbopackFilePattern: \'**/app/**/*.{jsx,tsx,js,ts,mjs,mts}\' \x1b[36m│\x1b[0m');
      console.warn('\x1b[36m│\x1b[0m   })                                                            \x1b[36m│\x1b[0m');
      console.warn('\x1b[36m│\x1b[0m }                                                               \x1b[36m│\x1b[0m');
      console.warn('\x1b[36m└─────────────────────────────────────────────────────────────────┘\x1b[0m');
      
      console.warn('\nThis pattern includes all files in your app directory while excluding middleware.');
      console.warn('Learn more:');
      console.warn('  \x1b[4mhttps://github.com/vercel/next.js/issues/79592\x1b[0m');
      console.warn('  \x1b[4mhttps://github.com/zh-lx/code-inspector/issues/357\x1b[0m\n');
      console.warn('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n');
    }
  }
  
  const pattern = options.turbopackFilePattern || '**/*.{jsx,tsx,js,ts,mjs,mts}';

  return {
    [pattern]: {
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
    },
  };
}
