import path, { isAbsolute, dirname } from 'path';
import fs from 'fs';
import { startServer } from './server';
import type { CodeOptions, RecordInfo } from '../shared';
import {
  PathName,
  isJsTypeFile,
  getFilePathWithoutExt,
  fileURLToPath,
  AstroToolbarFile,
  getIP,
} from '../shared';
import { getEnhancedTraceCode } from './scripts';

let compatibleDirname = '';
if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

// 这个路径是根据打包后来的
export const clientJsPath = path.resolve(compatibleDirname, './client.umd.js');
const jsClientCode = fs.readFileSync(clientJsPath, 'utf-8');

export function getInjectedCode(options: CodeOptions, record: RecordInfo) {
  let code = `'use client';`;
  code += getEliminateWarningCode();
  if (options?.hideDomPathAttr) {
    code += getHidePathAttrCode();
  }
  code += getWebComponentCode(options, record.port);
  code += getEnhancedTraceCode(options, record.port, record.base);
  return `/* eslint-disable */\n` + code.replace(/\n/g, '');
}

export function getWebComponentCode(options: CodeOptions, port: number) {
  const {
    hotKeys = ['shiftKey', 'altKey'],
    showSwitch = false,
    hideConsole = false,
    autoToggle = true,
    behavior = {},
    ip = false,
  } = options || ({} as CodeOptions);
  const { locate = true, copy = false } = behavior;
  return `
;(function (){
  if (typeof window !== 'undefined') {
    if (!document.documentElement.querySelector('code-inspector-component')) {
      var script = document.createElement('script');
      script.setAttribute('type', 'text/javascript');
      script.textContent = ${`${jsClientCode}`};
  
      var inspector = document.createElement('code-inspector-component');
      inspector.port = ${port};
      inspector.hotKeys = '${(hotKeys ? hotKeys : [])?.join(',')}';
      inspector.showSwitch = !!${showSwitch};
      inspector.autoToggle = !!${autoToggle};
      inspector.hideConsole = !!${hideConsole};
      inspector.locate = !!${locate};
      inspector.copy = ${typeof copy === 'string' ? `'${copy}'` : !!copy};
      inspector.ip = '${getIP(ip)}';
      document.documentElement.append(inspector);
    }
  }
})();
`;
}

export function getEliminateWarningCode() {
  return `
  ;(function(){
    if (globalThis.__code_inspector_warning) {
      return;
    };
    var originWarn = console.warn;
    var warning = "Extraneous non-props attributes";
    var path = "${PathName}";
    console.warn = function () {
      globalThis.__code_inspector_warning = true;
      var args = Array.prototype.slice.call(arguments);
      var firstParam = args && args[0];
      if (typeof firstParam === 'string' && firstParam.indexOf(warning) !== -1 && firstParam.indexOf(path) !== -1) {
        return;
      } else {
        originWarn.apply(null, args);
      };
    };
  })();
  `;
}

export function getHidePathAttrCode() {
  return `
  ;(function(){
    if (typeof window === 'undefined' || globalThis.__code_inspector_observed) {
      return;
    };
    function observe() {
      document.querySelectorAll("[${PathName}]").forEach((node) => {
        node["${PathName}"] = node.getAttribute("${PathName}");
        node.removeAttribute("${PathName}");
      });
      setTimeout(observe, 1000);
    }
    observe();
    globalThis.__code_inspector_observed = true;
  })();
  `;
}

// normal entry file
function recordEntry(record: RecordInfo, file: string) {
  if (!record.entry && isJsTypeFile(file) && !file.includes('/.svelte-kit/')) {
    record.entry = getFilePathWithoutExt(file);
  }
}

export async function getCodeWithWebComponent(
  options: CodeOptions,
  file: string,
  code: string,
  record: RecordInfo
) {
  // start server
  await startServer(options, record);

  // injectTo
  if (options?.injectTo) {
    if (!isAbsolute(options.injectTo)) {
      console.error(
        `"injectTo" in code-inspector-plugin must be an absolute file path!`
      );
    } else if (!isJsTypeFile(options.injectTo)) {
      console.error(
        `The ext of "injectTo" in code-inspector-plugin must in '.js/.ts/.mjs/.mts/.jsx/.tsx'`
      );
    } else {
      record.entry = getFilePathWithoutExt(options.injectTo);
    }
  }

  recordEntry(record, file);

  // 注入消除 warning 代码
  if (
    (isJsTypeFile(file) && getFilePathWithoutExt(file) === record.entry) ||
    file === AstroToolbarFile
  ) {
    const injectCode = getInjectedCode(options, record);
    if (options.importClient === 'code') {
        code = `${injectCode};${code}`;
    } else {
      writeEslintRcFile(record.output);
      const webComponentNpmPath = writeWebComponentFile(
        record.output,
        injectCode,
        record.port
      );
      if (!file.match(webComponentNpmPath)) {
        code = `import '${webComponentNpmPath}';${code}`;
      }
    }
  }
  return code;
}

function writeEslintRcFile(targetPath: string) {
  const eslintFilePath = path.resolve(targetPath, './.eslintrc.js');
  if (!fs.existsSync(eslintFilePath)) {
    const content = `
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6
  },
}
`;
    fs.writeFileSync(eslintFilePath, content, 'utf-8');
  }
}

function writeWebComponentFile(
  targetPath: string,
  content: string,
  port: number,
) {
  const webComponentFileName = `append-code-${port}.js`;
  const webComponentNpmPath = `code-inspector-plugin/dist/${webComponentFileName}`;
  const webComponentFilePath = path.resolve(targetPath, webComponentFileName);
  fs.writeFileSync(webComponentFilePath, content, 'utf-8');
  return webComponentNpmPath;
}
