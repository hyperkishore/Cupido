const fs = require('fs');
const ts = require('typescript');
const path = require('path');

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2019,
  esModuleInterop: true,
  jsx: ts.JsxEmit.React,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  resolveJsonModule: true,
  allowSyntheticDefaultImports: true,
};

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions,
    fileName: filename,
  });
  module._compile(outputText, filename);
};

require.extensions['.tsx'] = require.extensions['.ts'];
require.extensions['.json'] = (module, filename) => {
  const content = fs.readFileSync(filename, 'utf8');
  module.exports = JSON.parse(content);
};

module.exports = { register: () => undefined };
