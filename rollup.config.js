import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/api.ts",
  output: {
    file: "./dist/index.js",
    format: "esm",
  },
  plugins: [typescript()],
};
