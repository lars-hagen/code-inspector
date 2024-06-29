// 启动本地接口，访问时唤起vscode
import http from 'http';
import portFinder from 'portfinder';
import launchEditor from './launch-editor';
import { DefaultPort, TraceDataURL, TraceHtmlURL, TraceSourceURL } from '../shared/constant';
import { type CodeOptions, type RecordInfo } from '../shared';
import { respondTrace, storeTraceData, traceSourceCode } from './trace';

function openEditor(req: http.IncomingMessage, res: http.ServerResponse, options?: CodeOptions) {
   // 收到请求唤醒vscode
   const params = new URLSearchParams((req.url as string)?.slice(1));
   const file = decodeURIComponent(params.get('file') as string);
   const line = Number(params.get('line'));
   const column = Number(params.get('column'));
   res.writeHead(200, {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': '*',
     'Access-Control-Allow-Headers': '*',
     'Access-Control-Allow-Private-Network': 'true',
   });
   res.end('ok');
   // 调用 hooks
   options?.hooks?.afterInspectRequest?.(options, { file, line, column });
   // 打开 IDE
   launchEditor(file, line, column, options?.editor, options?.openIn, options?.pathFormat);
}

export function createServer(callback: (port: number) => void, options: CodeOptions, record: RecordInfo) {
  const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url?.startsWith(TraceHtmlURL)) {
      respondTrace(req, res);
    } else if (req.url?.startsWith(TraceDataURL)) {
      storeTraceData(req, res, record);
    } else if (req.url?.startsWith(TraceSourceURL)) {
      traceSourceCode(req, res, record, options);
    } else if (req.url === '/favicon.ico') {
      return;
    } else {
      openEditor(req, res, options);
    }
  });

  // 寻找可用接口
  portFinder.getPort({ port: DefaultPort }, (err: Error, port: number) => {
    if (err) {
      throw err;
    }
    server.listen(port, () => {
      callback(port);
    });
  });
}

export async function startServer(options: CodeOptions, record: RecordInfo) {
  if (!record.port) {
    if (!record.findPort) {
      record.findPort = new Promise((resolve) => {
        createServer((port: number) => {
          resolve(port);
        }, options, record);
      });
    }
    record.port = await record.findPort;
  }
}
