// Test middleware file for turbopack-next15 demo
// 
// ⚠️ This file should be REMOVED once Turbopack fixes the middleware issue ⚠️
// 
// Purpose: Demonstrates that code-inspector now works with Turbopack when:
// 1. The custom turbopackFilePattern is configured in next.config.ts
// 2. The pattern excludes middleware files (e.g., '**/app/**/*.{jsx,tsx,js,ts,mjs,mts}')
// 
// Without the custom pattern, Turbopack will crash due to a known issue.
// The plugin will show a warning if turbopackFilePattern is not configured.
// 
// This is a temporary workaround. Track the issues for removal:
// - https://github.com/vercel/next.js/issues/79592
// - https://github.com/zh-lx/code-inspector/issues/357

export function middleware() {
  // Empty middleware - its presence is enough to test the workaround
}