import { CodeOptions } from 'code-inspector-core';
interface Options extends CodeOptions {
    close?: boolean;
    output: string;
}
export declare function ViteCodeInspectorPlugin(options: Options): {
    apply(_: any, { command }: {
        command: any;
    }): boolean;
    configResolved(config: any): void;
    transform(code: any, id: any): Promise<any>;
    enforce?: "pre";
    name: string;
};
export {};
