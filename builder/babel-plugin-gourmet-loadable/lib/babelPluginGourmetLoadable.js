"use strict";

const MM3 = require("imurmurhash");

// Options:
//  - libraryName: library name to trigger the `modules` population. E.g. "@gourmet/react-loadable"
//  - modules: whether to populate 'modules' field (default: false)
//  - resolveModule(moduleName, refPath): resolve the module and returns a path of the module file
//    that is relative to the project working directory.
module.exports = function babelPluginGourmetLoadable({types: t}) {
  function _evalString(path, context, throwOnExpr) {
    const res = path.evaluate();
    if (res.confident && typeof res.value === "string")
      return res.value;
    if (throwOnExpr)
      throw Error(`'${context}' must have a string literal as only argument.`);
    return null;
  }

  function _processBinding(bindingName, path, state) {
    const binding = path.scope.getBinding(bindingName);
    const filePath = state.opts.resolveModule(state.file.opts.filename);

    binding.referencePaths.forEach(refPath => {
      const callExpression = refPath.parentPath;

      if (!callExpression.isCallExpression())
        return;

      const args = callExpression.get("arguments");
      if (args.length !== 1) throw callExpression.error;

      const options = args[0];
      if (!options.isObjectExpression())
        return;

      const properties = options.get("properties");
      const propertiesMap = {};

      properties.forEach(property => {
        const key = property.get("key");
        propertiesMap[key.node.name] = property;
      });

      if (!propertiesMap.loader)
        return;

      const loaderMethod = propertiesMap.loader.get("value");
      const modules = [];

      loaderMethod.traverse({
        Import(path) {
          const callExpression = path.parentPath;
          const moduleName = _evalString(callExpression.get("arguments")[0], "import()");
          if (moduleName) {
            const relPath = state.opts.resolveModule(moduleName, state.file.opts.filename);
            if (relPath)
              modules.push(relPath);
          }
        }
      });

      if (!propertiesMap.id) {
        const items = [filePath];

        modules.forEach(path => {
          items.push(":", path);
        });

        if (propertiesMap.signature) {
          const sig = _evalString(propertiesMap.signature.get("value"), "signature", true);
          items.push(":", sig);
        }

        const mm3 = MM3();
        items.forEach(item => mm3.hash(item));
        const id = mm3.result().toString(36);

        propertiesMap.loader.insertAfter(
          t.objectProperty(
            t.identifier("id"),
            t.stringLiteral(id)
          )
        );
      }

      if (state.opts.modules && !propertiesMap.modules && modules.length) {
        propertiesMap.loader.insertAfter(
          t.objectProperty(
            t.identifier("modules"),
            t.arrayExpression(modules.map(path => t.stringLiteral(path)))
          )
        );
      }
    });
  }

  return {
    visitor: {
      CallExpression(path, state) {
        if (!t.isIdentifier(path.node.callee, {name: "require"}))
          return;

        if (path.scope.hasBinding("require", true))
          return;

        const lib = _evalString(path.get("arguments.0"), "require()");

        if (!lib || lib !== state.opts.libraryName)
          return;

        const parent = path.parentPath;

        if (!parent.isVariableDeclarator())
          return;

        _processBinding(parent.node.id.name, path, state);
      },

      ImportDeclaration(path, state) {
        if (path.node.source.value !== state.opts.libraryName)
          return;

        const defaultSpecifier = path.get("specifiers").find(specifier => {
          return specifier.isImportDefaultSpecifier();
        });

        if (!defaultSpecifier)
          return;

        _processBinding(defaultSpecifier.node.local.name, path, state);
      }
    }
  };
};
