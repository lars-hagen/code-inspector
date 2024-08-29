/// <reference types="vite/client" />

interface Window {
  __code_inspector_console: {
    [key: string]: ConsoleConstructor;
  };
  __code_inspector_trace: boolean;
}