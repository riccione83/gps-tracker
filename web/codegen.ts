import { CodegenConfig } from "@graphql-codegen/cli";
import { API_URL } from "../web/src/constrant/index";
const config: CodegenConfig = {
  schema: API_URL + "/api",
  // this assumes that all your source files are in a top-level `src/` directory - you might need to adjust this to your file structure
  documents: ["src/**/*.{ts,tsx}"],
  generates: {
    "./src/gql-generated/": {
      preset: "client",
      plugins: [],
      presetConfig: {
        gqlTagName: "gql",
      },
    },
  },
  ignoreNoDocuments: true,
  //   emitLegacyCommonJSImports: false,
};

export default config;
