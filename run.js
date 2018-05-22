// run.js
const babel = require('@babel/core')
const fs = require('fs')
const plugin = require('./index.js')

const fileName = process.argv[2] || 'example.js'

if (!fs.existsSync(fileName)) throw Error(`File '${fileName}' not found`)

const out = babel.transformFileSync(fileName, {
  plugins: [[plugin, {path: './.env'}]],
  babelrc: false // So we don't get babelrc from whole project
}).code

console.log(out)
