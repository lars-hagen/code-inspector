/// <reference types="node" />
import http from 'http';
import { CodeOptions, type RecordInfo } from '../shared';
export declare function respondTrace(_: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
export declare function storeTraceData(req: http.IncomingMessage, res: http.ServerResponse, record: RecordInfo): Promise<void>;
export declare function traceSourceCode(req: http.IncomingMessage, res: http.ServerResponse, record: RecordInfo, options: CodeOptions): Promise<void>;
interface FileInfo {
    file: string;
    line: number;
    column: number;
    message: string;
}
export declare function traceHttpFile(fileInfo: FileInfo, record: RecordInfo): Promise<{
    file: string;
    line: number | null;
    column: number | null;
    message: string;
}>;
export declare function traceWebpackFile(fileInfo: FileInfo, record: RecordInfo): Promise<{
    file: string;
    line: number;
    column: number;
    message: string;
} | undefined>;
export declare function transformToSourceStack(req: http.IncomingMessage, res: http.ServerResponse, record: RecordInfo, options: CodeOptions): Promise<void>;
export {};
