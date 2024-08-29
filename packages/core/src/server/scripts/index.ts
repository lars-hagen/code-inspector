import path, { dirname } from "path";
import fs from 'fs';
import { CodeOptions, fileURLToPath, getIP } from "../../shared";

let compatibleDirname = '';
if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

export function getEnhancedTraceCode(options: CodeOptions, port: number, base: string) {
  const func = fs.readFileSync(path.resolve(compatibleDirname, './enhance-trace.js'), 'utf-8');
  return `;(${func})('${getIP(options.ip || false)}', '${port}', '${base}');`;
}