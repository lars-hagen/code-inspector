// 启动本地接口，访问时唤起vscode
import http from 'http';
import {
  CodeOptions,
  TraceSourceURL,
  fetchFile,
  fileURLToPath,
  respondMessage,
  type RecordInfo,
} from '../shared';
import path, { dirname, resolve } from 'path';
import fs from 'fs';
import { SourceMapConsumer } from 'source-map';
import launchEditor from './launch-editor';

let compatibleDirname = '';
if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

const traceDataMap = new Map<number, string[]>();

// 收到 /t/ 请求时，唤起中间 html 页
export async function respondTrace(
  _: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const htmlPath = resolve(compatibleDirname, './trace.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  respondMessage(res, htmlContent, { 'Content-Type': 'text/html' });
}

// 收到 /trace-data 请求时，存取数据 uniqueKey - data
export async function storeTraceData(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  record: RecordInfo
) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString(); // 将二进制数据转换为字符串
  });
  req.on('end', () => {
    try {
      const list = JSON.parse(body) as { uniqueKey: number; file: string }[];
      if (Array.isArray(list)) {
        let map = traceDataMap.get(record.port);
        if (!map) {
          map = [];
          traceDataMap.set(record.port, map);
        }
        list.forEach((item) => {
          map![item.uniqueKey] = item.file;
        });
      }
      respondMessage(res, 'ok');
    } catch (error) {
      respondMessage(res, String(error));
    }
  });
}

// 收到 /trace-source 请求，打开源码
export async function traceSourceCode(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  record: RecordInfo,
  options: CodeOptions
) {
  const params = new URLSearchParams(
    (req.url as string)?.slice(TraceSourceURL.length)
  );
  const uniqueKey = Number(params.get('uniqueKey'));
  const line = Number(params.get('line') || 0);
  const column = Number(params.get('column') || 0);

  try {
    const fileFilst = traceDataMap.get(record.port) as string[];
    const file = fileFilst[uniqueKey];

    if (file.startsWith('http')) {
      await traceHttpFile({ file, line, column }, record, options);
    } else if (file.startsWith('webpack-internal:///')) {
      await traceWebpackFile({ file, line, column }, record, options);
    }

    respondMessage(res, 'ok');
  } catch (error) {
    respondMessage(res, String(error));
  }
}

interface FileInfo {
  file: string;
  line: number;
  column: number;
}


export async function traceHttpFile(
  fileInfo: FileInfo,
  record: RecordInfo,
  options: CodeOptions
) {
  const { file, line, column } = fileInfo;
  const result = await fetchFile(file + '.map');

  // 兼容 vite 环境使用 sourcemap
  if (typeof __dirname === 'undefined') {
    Object.defineProperty(globalThis, '__dirname', {
      get() {
        return dirname(fileURLToPath(import.meta.url));
      },
    });
  }

  const prefix = `${new URL(file).origin}/${record.base}/`.replace(/\/\//g, '/');
  const relativePath = file.slice(prefix.length);
  const absolutePath = path.resolve(record.root, `./${relativePath}`);

  const consumer = await new SourceMapConsumer(JSON.parse(result as string));
  const sourceInfo = consumer.originalPositionFor({
    line,
    column,
  });

  // 列偏移适配
  if (typeof sourceInfo.column === 'number') {
    sourceInfo.column++;
  }

  const sourceFile = path.resolve(absolutePath, '../', sourceInfo.source as string);
  launchEditor(sourceFile, sourceInfo.line, sourceInfo.column, options?.editor, options?.openIn, options?.pathFormat);
}

export async function traceWebpackFile(
  fileInfo: FileInfo,
  record: RecordInfo,
  options: CodeOptions
) {
  const { file, line, column } = fileInfo;

  let relativePath = '';

  const lastSplitIndex = file.lastIndexOf('?!');
  if (lastSplitIndex !== -1) {
    relativePath = file.slice(lastSplitIndex + '?!'.length);
  } else if (file.startsWith('webpack-internal:///')) {
    relativePath = file.slice('webpack-internal:///'.length);
  } else {
    return;
  }

  const absolutePath = path.resolve(record.root, relativePath);

  launchEditor(absolutePath, line, column, options?.editor, options?.openIn, options?.pathFormat);
}
