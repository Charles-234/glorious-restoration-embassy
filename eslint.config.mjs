import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "artifacts/**",
    "backend/.venv/**",
    "backend/venv/**",
    "next-env.d.ts",
  ]),
]);
