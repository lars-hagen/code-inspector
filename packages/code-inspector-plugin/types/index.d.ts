import { CodeOptions } from '@code-inspector/core';
export interface CodeInspectorPluginOptions extends CodeOptions {
    /**
     * @zh 设置为 true 时，仅当 .env.local 文件存在且其包含 CODE_INSPECTOR=true 时插件生效；默认值为 false
     * @en When set the value to true, only if the .env.local file exists and it contains CODE_INSPECTOR=true, the plugin takes effect; The default value is false
     */
    needEnvInspector?: boolean;
    /**
     * @zh 自定义 turbopack 的文件匹配模式（仅在 bundler 为 'turbopack' 时生效）
     * @en Custom file pattern for turbopack (only effective when bundler is 'turbopack')
     */
    turbopackFilePattern?: string;
}
export declare function CodeInspectorPlugin(options: CodeInspectorPluginOptions): any;
export declare const codeInspectorPlugin: typeof CodeInspectorPlugin;
