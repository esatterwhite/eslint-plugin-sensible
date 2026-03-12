'use strict'

const path = require('path')
const requireindex = require('requireindex')

// Load all rules
const rules = requireindex(path.join(__dirname, 'rules'))

// Export for legacy config (ESLint < 9)
module.exports.rules = rules

// Export for flat config (ESLint >= 9)
module.exports.default = {
  rules
}

// Convenience exports for flat config
module.exports.configs = {
  recommended: {
    plugins: {
      sensible: {
        rules
      }
    },
    rules: {
      'sensible/indent': ['error', 2]
    }
  }
}
