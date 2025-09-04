import { 
  CodeOptions, 
  RecordInfo, 
  isDev
} from '@code-inspector/core';

interface Options extends CodeOptions {
  close?: boolean;
  output: string;
}

/**
 * Turbopack Code Inspector Plugin
 * 
 * Known limitation: When using symlinked packages (link: or workspace: dependencies),
 * turbopack may not resolve the dynamically generated import paths correctly.
 * For local development with symlinks, consider using regular npm/yarn install instead.
 */

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
  
  // Return loader rules - use the turbopack loader that handles both transformation and injection
  return {
    '**/*.{jsx,tsx}': {
      loaders: [{
        loader: '@code-inspector/turbopack/dist/turbopack-loader.js',
        options: {
          ...options,
          record,
          inject: true,
        }
      }]
    }
  };
}