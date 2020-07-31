
<div align="center">
  <img width="160" height="160"
    src="https://cdn.worldvectorlogo.com/logos/python-5.svg">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" hspace="20"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>Python Webpack Loader - Hacky Python Discord Code Jam Edition</h1>
</div>

Loads Python files and transpile to JavaScript using the awesome [Transcrypt](http://www.transcrypt.org/), ~~[Jiphy](https://github.com/timothycrosley/jiphy) or [Javascripthon](https://github.com/metapensiero/metapensiero.pj) compilers~~.

Right now, I have just patched this to get it working with modern Transcrypt. It only supports Transcrypt but I'm open to pull requests.


## Install

```bash
pip install transcrypt  # or jiphy, or javascripthon
npm install --save-dev py-loader
```

You may specify `jiphy` instead of `transcrypt` if you prefer. In this case, ensure that `options.compiler` in `webpack.config.js` is set to `jiphy` (see below). The compiler option for Javascripthon is `pj`.

## Usage

**src/main.py**
```py
print("hello world")
```

### Configuration

**webpack.config.js**
```js
module.exports = {
    entry: ['./src/main.py'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.py$/,
                use: [
                    {
                        loader: 'py-loader',
                        options: {
                            compiler: 'transcrypt',
                            venv: "./venv" // Optional path to virtual environment to use for compilation
                        }
                    }
                ]
            },
            {
                test: /\.js$/,
                enforce: 'pre',             // After the python is converted to JS, it loads through the JS loader
                use: ['source-map-loader'], // Do this to get your sourcemaps (kinda) working
            }
        ]
    }
};
```

### VueJS support

`py-loader` can also be used to compile .vue Single File Components used by [VueJS](https://www.vuejs.org). This assumes that you already have `vue-loader` set up and working with javascript .vue files. Modify your `vue-loader` config file as shown:

```js
  loaders: {
    'py': require.resolve('py-loader')
  },
```

An example of a simple VueJS app written in (mostly) Python can be seen in the `examples/vue-demo` folder.

***Caveats***
* Only tested with Transcrypt
* The import statement for loading sub-components still looks a bit weird
* ~~Web-pack entry point is still a javascript file~~ Not anymore

## Extend

`py-loader` can be extended to use other Python compilers. Just fork this repo and extend the `compilers` object in `index.js`.

Please submit a pull request with your addition.


## Contributors

- DuncanMacWeb (https://github.com/DuncanMacWeb)
- Sebastian Silva (https://github.com/icarito)
- Ryan Liao (https://github.com/pirsquare)
