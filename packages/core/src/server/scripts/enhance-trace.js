function (ip, port, base){
  if (typeof window === 'undefined' || globalThis.__code_inspector_trace) {
    return;
  };
  /* 记录 filePath <-> uniqueKey 的映射关系 */
  globalThis.__code_inspector_trace = new Map();
  /* 未处理的 filePath <-> uniqueKey 映射队列，定时向服务器推送 */
  globalThis.__code_inspector_trace_uniqueKey_queues = [];
  /* 推送任务的 timeout */
  globalThis.__code_inspector_trace_request_timer = null;

  console.trace = function(...args) {
    const error = new Error();
    /* 过滤掉[错误]和[当前这个函数]的调用栈 */
    const stack = error.stack?.split?.('\n')?.slice?.(2) || [];

    console.group(...args);
    stack.forEach(item => {
      item = item.trimStart();

      /*  划分出 at XXX 的信息 */
      const messageRegex = /(^at\s(\S+)\s)|(^at\s)/;
      const messageMatches = messageRegex.exec(item) || [];

      /*  at XXX 的信息 */
      let message = messageMatches[0] || '';

      /* 本地服务文件路径 */
      let filePath = item.slice(message?.length);
      /* 文件路径可能被 () 包裹，去掉包裹 */
      if (filePath.startsWith('(')) {
        filePath = filePath.slice(1);
      }
      if (filePath.endsWith(')')) {
        filePath = filePath.slice(0, filePath.length - 1);
      }

      /* 解析文件路径获取 [file:line:column] or [file:line] or [file] */
      let file, line, column;
      const lastColonIndex = filePath.lastIndexOf(':');
      const penultimateColonIndex = filePath.lastIndexOf(':', lastColonIndex - 1);
      if (/^.*?:\d+:\d+$/.test(filePath)) {
        column = Number(filePath.slice(lastColonIndex + 1));
        line = Number(filePath.slice(penultimateColonIndex + 1, lastColonIndex));
        file = filePath.slice(0, penultimateColonIndex);
      } else if (/^.*?:\d+$/.test(filePath)) {
        line = Number(filePath.slice(penultimateColonIndex + 1, lastColonIndex));
        file = filePath.slice(0, penultimateColonIndex);
      } else {
        file = filePath;
      }

      /* file 可能带有 hash 需要去掉, 例如: vue.js?v=e8ksan */
      if (file.indexOf('?') !== -1) {
        const lastQueryIndex = file.lastIndexOf('?');
        if (!/\//.test(file.slice(lastQueryIndex))) {
          file = file.slice(0, lastQueryIndex);
        }
      }

      let fileName = file.slice(file.lastIndexOf('/') + 1);
      let uniqueKey = globalThis.__code_inspector_trace.get(file);
      if (!uniqueKey) {
        uniqueKey = 1e4 + globalThis.__code_inspector_trace.size;
        globalThis.__code_inspector_trace.set(file, uniqueKey);
        /* 新的 uniqueKey 映射添加到队列中去 */
        globalThis.__code_inspector_trace_uniqueKey_queues.push({
          uniqueKey,
          file,
        })
      }

      const traceFile = `http://${ip}:${port}/t/${uniqueKey}/${fileName}?r=${line ?? ''}&c=${column ?? ''}`;
      console.log(message + traceFile);
    });
    console.groupEnd();

    if (globalThis.__code_inspector_trace_request_timer) {
      clearTimeout(globalThis.__code_inspector_trace_request_timer);
    }
    /*  向服务器推送映射队列 */
    globalThis.__code_inspector_trace_request_timer = setTimeout(() => {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", `http://${ip}:${port}/trace-data`, true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(globalThis.__code_inspector_trace_uniqueKey_queues));

      globalThis.__code_inspector_trace_request_timer = null;
      globalThis.__code_inspector_trace_uniqueKey_queues = [];
    });
  };
}