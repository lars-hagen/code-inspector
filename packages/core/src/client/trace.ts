export function enhanceTrace(ip: string, port: number){
  if (typeof window === 'undefined' || window.__code_inspector_trace) {
    return;
  };
  window.__code_inspector_trace = true;

  // 记录原始的 console 能力
  if (!window.__code_inspector_console) {
    window.__code_inspector_console = {};
  }

  console.trace = async function(...args) {
    const consoleQueue: { key: string, args: any[] }[] = [];
    // 代理 console 能力，将 console 事件收集进队列，等待当前的异步 console.group 完成后再执行 */
    Object.keys(console).forEach(key => {
      if (key !== 'trace') {
        // 记录原始的 console
        if (!window.__code_inspector_console[key]) {
          window.__code_inspector_console[key] = console[key as keyof typeof console];
        }
        // @ts-ignore
        console[key] = (...args: any[]) => {
          consoleQueue.push({
            key,
            args
          });
        };
      }
    });

    const error = new Error();
    // 过滤掉[错误]和[当前这个函数]的调用栈
    const stack = error && error.stack && error.stack.split('\n').slice(2) || [];
    // 处理 stack 获取编译后的 list
    const compiledList = stack.map(item => {
      item = item.trimStart();

      /*  划分出 at XXX 的信息 */
      const messageRegex = /(^at\s(\S+)\s)|(^at\s)/;
      const messageMatches = messageRegex.exec(item) || [];

      /*  at XXX 的信息 */
      let message = messageMatches[0] || '';

      /* 本地服务文件路径 */
      let filePath = item.slice(message.length);
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

      return { file, line, column, message };
    });

    let sourceList = [];

    await new Promise(res => {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", `http://${ip}:${port}/trace/transform-to-source`, true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.send(JSON.stringify(compiledList));
      xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            sourceList = JSON.parse(xhr.responseText);
            res(1); 
          } else {
            res(1);
          };
        };
      };
    });

    /* 恢复 console 能力 */
    Object.keys(console).forEach(key => {
      if (key !== 'trace') {
        // @ts-ignore
        console[key] = window.__code_inspector_console[key];
      }
    });

    console.group(...args);
    console.groupEnd();

    /* 执行队列事件 */
    consoleQueue.forEach(item => {
      // @ts-ignore
      console[item.key](...item.args);
    });
  };
}