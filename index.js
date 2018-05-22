const nodepath = require('path')
const fs = require('fs')
const os = require('os')

// Parse configuration file
// File must be text file with KEY=VALUE pair (shell style) settings
// Return Map with key/values
const parse = (path, opts = {}) => {
  const abortOnError = opts.abortOnError || false
  const cfg = new Map()

  if (!fs.existsSync(path)) {
    const err = `${path} does not exist`
    if (abortOnError) throw new Error(err)
    else {
      console.log(err)
      return cfg
    }
  }

  const content = fs.readFileSync(path, 'utf8').split('\n')

  content.forEach(l => {
    if (!l.includes('=')) return
    const [key, value] = l.split('=')
    if (key && key.length > 0) cfg.set(key, value || '')
  })

  // console.log('parse', path, cfg)
  return cfg
}

// Merge two or more Maps
// Returns single merged Map
const mergeCfg = (configs) => {
  const config = new Map()

  configs.forEach(_cfg => {
    for (const [key, value] of _cfg.entries()) {
      config.set(key, value)
    }
  })

  // console.log('mergeCfg', config)
  return config
}

// Write configuration (Map) to temporary text file
// as KEY=VALUE pair (shell style) settings
// Returns path to temp file
const write = (cfg) => {
  const tmpFile = `${os.tmpdir()}/.env.${Date.now().toString(16)}`
  let content = ''

  for (const [key, value] of cfg.entries()) {
    content += `${key}=${value}\n`
  }

  // console.log(content)

  fs.writeFileSync(tmpFile, content)
  // console.log('Wrote', tmpFile)
  return tmpFile
}

let dotenv;

module.exports = function (options) {
  const t = options.types;

  return {
    visitor: {
      MemberExpression: function MemberExpression(path, state) {
        if(t.isAssignmentExpression(path.parent) && path.parent.left === path.node) return;
        if (path.get("object").matchesPattern("process.env")) {
          if (!dotenv) {
            const configDir = nodepath.dirname(state.opts.path)
            const cfgDefault = parse(nodepath.join(configDir, '.env.defaults'))
            const cfgEnv = parse(state.opts.path)
            const cfg = mergeCfg([cfgDefault, cfgEnv])
            const tmpFile = write(cfg)

            state.opts.path = tmpFile
            dotenv = require('dotenv').config(state.opts);
            let dotenvExpand;
            try { dotenvExpand = require('dotenv-expand'); } catch(e) {}
            if (dotenvExpand) dotenvExpand(dotenv);

            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
            else console.log(`Temporary file ${tmpFile} not found`)

            console.log('babel-plugin-inline-env: ', dotenv.parsed)
          }
          const key = path.toComputedKey();
          if (t.isStringLiteral(key)) {
            const name = key.value;
            const value = state.opts.env && name in state.opts.env ? state.opts.env[name] : process.env[name];
            const me = t.memberExpression;
            const i = t.identifier;
            const le = t.logicalExpression;

            path.replaceWith(
              le('||',
                le('&&',
                  le('&&', i('process'), me(i('process'), i('env'))),
                  me(i('process.env'), i(name))
                ),
                t.valueToNode(value)
              )
            );
          }
        }
      }
    }
  };
};
