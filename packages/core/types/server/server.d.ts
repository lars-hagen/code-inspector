import { type CodeOptions, type RecordInfo } from '../shared';
export declare function createServer(callback: (port: number) => void, options: CodeOptions, record: RecordInfo): void;
export declare function startServer(options: CodeOptions, record: RecordInfo): Promise<void>;
