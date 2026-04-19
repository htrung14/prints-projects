import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Demo-only relaxations. Revisit before Phase 1 ships.
    rules: {
      // We use plain <img> for Unsplash placeholder URLs to keep the demo
      // dependency-free; switch to next/image when real photos land in /public.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Site-extracted design references live here — third-party snippets we
    // study for inspiration, not files we ship or maintain. No point linting
    // their generated tailwind configs.
    "design-extract-output/**",
  ]),
]);

export default eslintConfig;
