"use strict";

const npath = require("path");
const resolve = require("resolve");

// Options:
//  - libraryName: library name to trigger the `modules` population. E.g. "@gourmet/react-loadable"
//  - workDir: project working directory to make relative paths
module.exports = function babelPluginGourmetLoadable({types: t}) {
  function _evalString(path, context) {
    const res = path.evaluate();
    if (res.confident && typeof res.value === "string")
      return res.value;
    throw Error(`'${context}' must have a string literal as only argument.`);
  }

  function _relPath(moduleName, refPath, workDir) {
    let path;

    try {
      path = resolve.sync(moduleName, {basedir: npath.dirname(refPath)});
    } catch (err) {
      if (err.code === "MODULE_NOT_FOUND")
        return null;
      throw err;
    }

    path = npath.relative(path, workDir);

    return path.replace(/\\/g, "/");
  }

  function _processBinding(bindingName, path, state) {
    const binding = path.scope.getBinding(bindingName);

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

      if (!propertiesMap.loader || propertiesMap.modules)
        return;

      const loaderMethod = propertiesMap.loader.get("value");
      const modules = [];

      loaderMethod.traverse({
        Import(path) {
          const callExpression = path.parentPath;
          const moduleName = _evalString(callExpression.get("arguments")[0], "import()");
          const relPath = _relPath(moduleName, state.file.opts.filename, state.opts.workDir);
          if (relPath)
            modules.push(relPath);
        }
      });

      if (!modules.length)
        return;

      propertiesMap.loader.insertAfter(
        t.objectProperty(
          t.identifier("modules"),
          t.arrayExpression(modules.map(path => t.stringLiteral(path)))
        )
      );
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

        if (lib !== state.opts.libraryName)
          return;

        const parent = path.parentPath;

        if (!parent.isVariableDeclarator())
          return;

        _processBinding(path.node.id.name, path, state);
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
