import js from "@eslint/js";
import tseslint from "typescript-eslint";

const globals = Object.fromEntries(
  [
    "console",
    "process",
    "Buffer",
    "URL",
    "Blob",
    "setTimeout",
    "clearTimeout",
    "chrome",
    "document",
    "window",
    "localStorage",
    "sessionStorage",
    "navigator",
    "matchMedia",
    "getComputedStyle",
    "innerWidth",
    "scrollTo",
    "HTMLElement",
    "File",
    "StorageEvent",
    "TextEncoder",
    "crypto",
  ].map((name) => [name, "readonly"]),
);
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "artifacts/**",
      ".npm-cache/**",
      "next-env.d.ts",
      "public/pdf.worker.min.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);
