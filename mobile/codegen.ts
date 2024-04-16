import {CodegenConfig} from '@graphql-codegen/cli';
import {BASE_URL} from './src/constants/App';

const config: CodegenConfig = {
  schema: BASE_URL + '/api',
  // this assumes that all your source files are in a top-level `src/` directory - you might need to adjust this to your file structure
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    './gql-generated/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  ignoreNoDocuments: true,
  //   emitLegacyCommonJSImports: false,
};

export default config;
