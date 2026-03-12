'use strict'

const path = require('path')
const fs = require('fs')
const {RuleTester} = require('eslint')
const semver = require('semver')
const rule = require('../../../lib/rules/check-require')

const fixture_path = path.join(__dirname, '..', '..', 'fixtures', 'valid')
const fixture = fs.readFileSync(fixture_path, 'utf8')

const node_version = semver.parse(process.versions.node)

{
  const Suite = new RuleTester({
    languageOptions: {
      ecmaVersion: 2018
    , sourceType: 'script'
    }
  })

  const valid = [
    {code: 'const a = require("http")'}
  , {code: fixture}
  , {code: 'var a = require("eslint/lib/rules/utils/ast-utils")'}
  ]

  const invalid = [{
    code: 'const thing = require("biscuits")'
  , errors: [{
      message: 'Missing dependency: "biscuits". Not listed in package.json'
    }]
  }, {
    code: 'const thing = require("internal/constants")'
  , errors: [{
      message: 'Missing dependency: "internal". Not listed in package.json'
    }]
  }, {
    code: 'const thing = require("node:fake")'
  , errors: [{
      message: 'Invalid NodeJS builtin: "node:fake". Module does not exist'
    }]
  }]

  if (node_version.major >= 16) {
    valid.push({code: 'const net = require("node:net")'})
  } else {
    invalid.push({

      code: 'const thing = require("node:net")'
    , errors: [{
        message: 'Invalid NodeJS builtin: "node:net". Module does not exist'
      }]
    })
  }

  Suite.run('check-require', rule, {valid, invalid})
}

{
  const Suite = new RuleTester({
    languageOptions: {
      ecmaVersion: 2018
    , sourceType: 'script'
    }
  })

  Suite.run('check-require with options', rule, {
    valid: [
      {code: 'const a = require("http")'}
    , {code: fixture}
    , {code: 'const thing = require("biscuits")', options: ["always", {root: __dirname}]}
    ]
  , invalid: [{
      code: 'var a = require("eslint/lib/rules/utils/ast-utils")'
    , options: ["always", {root: __dirname}]
    , errors: [{
        message: 'Missing dependency: "eslint". Not listed in package.json'
      }]
    }]
  })
}
