'use strict'

const path = require('path')
const Module = require('module')

const UNSAFE_MODULE = /^(?:_|internal)/
const internalModules = new Set(Object.keys(process.binding('natives')).filter((name) => {
  return !UNSAFE_MODULE.test(name)
}))

function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

function isBuiltin(name) {
  if (typeof Module.isBuiltin === 'function') return Module.isBuiltin(name)
  return internalModules.has(name)
}

function resolveFrom(fromDir, moduleId) {
  fromDir = path.resolve(fromDir)
  const fromFile = path.join(fromDir, 'noop.js')

  try {
    return Module._resolveFilename(moduleId, {
      id: fromFile
    , filename: fromFile
    , paths: Module._nodeModulePaths(fromDir)
    })
  } catch (err) {
    return null
  }
}

module.exports = {
  meta: {
    type: 'problem'

  , docs: {
      description: 'disallow requires that are not in package.json'
    }
  , schema: [
      {
        enum: ['always', 'never']
      }
    , {
        type: 'object'
      , properties: {
          root: {
            type: 'string'
          }
        }
      , additionalProperties: false
      }
    ]
  , messages: {
      missingDependency: 'Missing dependency: "{{name}}". Not listed in package.json'
    , invalidRequire: 'Missing require: {{path}}. Path does not exist'
    , invalidNodeBuiltin: 'Invalid NodeJS builtin: "{{name}}". Module does not exist'
    }
  }

, create(context) {
    // First we need to find the neareast package.json
    const options = context.options[1] || {}
    const root = options.root || process.cwd()
    const pkgPath = path.join(root, 'package.json')
    const pkgOnDisk = require(pkgPath)
    const pkg = {
      dependencies: {}
    , devDependencies: {}
    , peerDependencies: {}
    , ...pkgOnDisk
    }

    function visit(node) {

      function check(name) {
        if (name.startsWith('node:')) {
          if (!isBuiltin(name)) {
            context.report({
              node
            , messageId: 'invalidNodeBuiltin'
            , data: {name}
            })
          }
        } else if (name[0] === '.' || name[0] === '/') {
          // Local module - ESLint 10: use context.filename instead of context.getFilename()
          const parent = path.dirname(context.filename || context.getFilename())
          if (!resolveFrom(parent, name)) {
            context.report({
              node
            , messageId: 'invalidRequire'
            , data: {
                path: name
              }
            })
          }
        } else {
          // Non local module
          let idx = name.indexOf('/')
          if (idx !== -1) {
            if (name[0] === '@') {
              // Take the first and second
              idx = name.indexOf('/', idx + 1)
              if (idx !== -1) {
                name = name.substring(0, idx)
              }
            } else {
              name = name.substring(0, idx)
            }
          }

          if (isBuiltin(name)) return
          if (has(pkg.dependencies, name)) return
          if (has(pkg.devDependencies, name)) return
          if (has(pkg.peerDependencies, name)) return

          context.report({
            node
          , messageId: 'missingDependency'
          , data: {
              name
            }
          })
        }
      }

      if (node.type !== 'CallExpression') {
        return
      }

      const {callee} = node
      if (callee.type !== 'Identifier') {
        return
      }

      if (callee.name !== 'require') {
        return
      }

      if (node.arguments.length) {
        const arg = node.arguments[0]
        if (arg.type === 'Literal') {
          const name = arg.value
          check(name)
        } else if (arg.type === 'TemplateLiteral') {
          if (arg.quasis.length === 1 && arg.expressions.length === 0) {
            const name = arg.quasis[0].value.raw
            check(name)
          }
        }
      }
    }

    const handlers = {
      CallExpression: visit
    }

    return handlers
  }
}
