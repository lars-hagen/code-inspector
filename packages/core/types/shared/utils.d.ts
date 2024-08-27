/// <reference types="node" />
import http from 'http';
import { EscapeTags } from './type';
export declare function getIP(ip: boolean | string): string;
export declare function fileURLToPath(fileURL: string): string;
export declare function isJsTypeFile(file: string): boolean;
export declare function getFilePathWithoutExt(filePath: string): string;
export declare function normalizePath(filepath: string): string;
export declare function formatOpenPath(file: string, line: string, column: string, format: string | string[] | boolean): string[];
export declare function isEscapeTags(escapeTags: EscapeTags, tag: string): boolean;
export declare function fetchFile(url: string): Promise<unknown>;
export declare function respondMessage(res: http.ServerResponse, msg: string, appendHeaders?: Record<string, string>): void;
export declare function getDenpendencies(): string[];
