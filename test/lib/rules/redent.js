'use strict'

const path = require('path')
const fs = require('fs')

const {RuleTester} = require('eslint')
const rule = require('../../../lib/rules/indent')

const fixture_path = path.join(__dirname, '..', '..', 'fixtures')
const basic = fs.readFileSync(path.join(fixture_path, 'valid'), 'utf8')
const chaining = fs.readFileSync(path.join(fixture_path, 'optional-chaining'), 'utf8')
const rangeerror = fs.readFileSync(path.join(fixture_path, 'range-error'), 'utf8')
const inconsistent_whitespace = fs.readFileSync(
  path.join(fixture_path, 'inconsistent-whitespace')
, 'utf8'
)
const first = fs.readFileSync(path.join(fixture_path, 'first'), 'utf8')

const Suite = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020
  , sourceType: 'script'
  }
, rules: {
    "indent": 0,
  }
})

Suite.run('sensible/indent', rule, {
  valid: [
    {code: inconsistent_whitespace}
  , {code: chaining}
  , {code: basic}
  , {
      code: rangeerror
    , options: [2, {
        "FunctionExpression": {
          "parameters": "first"
        },
        "FunctionDeclaration": {
          "parameters": "first",
          "body": 1
        },
        "CallExpression": {
          "arguments": "first"
        },
      }]
    }
  , {
      code: first
    , options: [2, {
        "CallExpression": {
          "arguments": "first"
        },
      }]
    }
  ]
, invalid: [{
    code: 'var x = {\n  a: 1\n  , b: 2\n}\n'
  , output: 'var x = {\n  a: 1\n, b: 2\n}\n'
  , errors: [{
      message: 'Expected indentation of 0 spaces but found 2.'
    , type: 'Punctuator'
    }]
  }]
})
