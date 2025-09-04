import { CodeOptions } from '@code-inspector/core';
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
export declare function TurbopackCodeInspectorPlugin(options: Options): Record<string, any>;
export {};
