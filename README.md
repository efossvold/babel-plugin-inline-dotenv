# babel-plugin-inline-env

Forked from `babel-plugin-inline-env` and inspired by `node-dotenv-extended` to support a common `.env.defaults` file which other `.env.*` can inherit from. Load your `.env` and replace `process.env.MY_VARIABLE` with the value you set. Variable expansion (as in dotenv-expand) is supported. This means any variables in `.env.defaults` can also be expanded in the `.env.*` files.

It replaces `process.env.MY_VARIABLE` with:

    process && process.env && process.env.MY_VARIABLE || 'value assigned to variable in dotenv'

This way, if the value is available at runtime it will be used instead.

## Installation

```sh
$ npm install babel-plugin-inline-env
```

## Usage

### Via `.babelrc` (Recommended)

Without options:

**.babelrc**

```js
{
  "plugins": ["inline-env"]
}
```

With options:

```js
{
  "plugins": [["inline-env",{
    path: 'path/to/.env'
  }]]
}
```

### Via CLI

```sh
$ babel --plugins inline-env script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["inline-env"]
});
```
