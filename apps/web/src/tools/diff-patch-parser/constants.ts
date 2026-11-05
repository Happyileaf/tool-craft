/**
 * Unified Diff / Patch 解析器内常量：真实 git diff 示例，
 * 覆盖新文件、删除行、重命名、多个 hunk 与 No newline 标记。
 */

/** 载入示例按钮使用的完整 patch 文本（解析零错误） */
export const SAMPLE_PATCH = `diff --git a/src/utils/slugify.ts b/src/utils/slugify.ts
new file mode 100644
index 0000000..9f2a1b3
--- /dev/null
+++ b/src/utils/slugify.ts
@@ -0,0 +1,4 @@
+export function slugify(input: string): string {
+  return input.trim().toLowerCase().replace(/\\s+/g, '-');
+}
+
diff --git a/package.json b/package.json
index a1b2c3d..e4f5a6b 100644
--- a/package.json
+++ b/package.json
@@ -3,6 +3,6 @@
   "version": "1.2.0",
   "private": true,
   "scripts": {
-    "lint": "eslint .",
+    "lint": "eslint . --max-warnings=0",
     "test": "vitest run"
   },
@@ -14,5 +14,6 @@
     "react": "^19.0.0",
     "typescript": "catalog:",
+    "vitest": "catalog:",
     "antd": "^6.6.5"
   }
 }
diff --git a/README.md b/README.zh.md
similarity index 88%
rename from README.md
rename to README.zh.md
index 7c8d9e0..1a2b3c4 100644
--- a/README.md
+++ b/README.zh.md
@@ -1,4 +1,4 @@
 # ToolCraft
-Online toolbox for developers.
+面向开发者的在线工具箱。
 All parsing runs locally in your browser.
-Last updated: 2026.
\\ No newline at end of file
+Last updated: 2026.
\\ No newline at end of file
`;

/** 变更类型对应的中文标签与 Tag 颜色 */
export const CHANGE_TYPE_META: Record<
  string,
  { label: string; color: string }
> = {
  added: { label: '新增', color: 'green' },
  deleted: { label: '删除', color: 'red' },
  modified: { label: '修改', color: 'blue' },
  renamed: { label: '重命名', color: 'orange' },
  copied: { label: '复制', color: 'purple' },
};
