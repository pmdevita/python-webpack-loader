const cmd = require('node-cmd')
const execSync = require('child_process').execSync;
const fs = require('fs');
const { sep: slash } = require('path');
const path = require('path');
const loaderUtils = require('loader-utils');

const spawn = require('child_process').spawn;

const properName = name => name.replace(/^./, c => c.toUpperCase());
const listify = array => array.join(', ')
    // make a comma-separated list ending with a '&' separator
    .replace(/(, )[^,]*$/, s => ' & ' + s.split(', ')[1]);

let checkedImportlab = false;
let hasImportlab = false;
let pipenvLocation = null;
const importlabScript = `${__dirname}${slash}importlab_tree.py`

module.exports = function (source) {

    const compilers = {
        transcrypt: {
            switches: '-n -m',
            folder: `__target__`,
            install: 'pip install transcrypt',
            python_version: '3.x',
            sourcemaps: true
        },
        jiphy: {
            switches: '',
            folder: `.${slash}`,
            install: 'pip install jiphy',
            python_version: '2.x',
            sourcemaps: false
        },
        pj: {
            switches: '--inline-map --source-name %f -s -',
            folder: `.${slash}`,
            install: 'pip install javascripthon',
            python_version: '3.x',
            streaming: true,
            sourcemaps: true
        }
    };

    const options = loaderUtils.getOptions(this);
    const compilerName = options && options.compiler || 'transcrypt';
    const compiler = compilers[compilerName];
    compiler.name = compilerName;
    const entry = this._module.resource;
    //console.log(`py-loader: compiling ${entry} with ${compilerName}...`);
    const basename = path.basename(entry, ".py");
    const srcDir = path.dirname(entry, ".py");

    let pythonLocation = "python";
    let runPyScriptCommand = "python -m"
    if (options.pipenv != null) {
        if (pipenvLocation == null) {
            let location = execSync("pipenv --venv", {'cwd': options.pipenv}).toString()
            if (location.substring(0, 46) != "No virtualenv has been created for this project") {
                pipenvLocation = location.trim()
            }
        }
    }

    if (options.venv || options.pipenv) {
        if (options.pipenv) {
            venvLocation = pipenvLocation;
        } else {
            let venvLocation = path.resolve(options.venv);
        }
        if (process.platform == "win32") {
            pythonLocation = `${venvLocation}${slash}Scripts${slash}python.exe`;
            runPyScriptCommand = `${venvLocation}${slash}Scripts${slash}python.exe -m`;
        } else {
            pythonLocation = `${venvLocation}${slash}bin${slash}python`;
            runPyScriptCommand = `${venvLocation}${slash}bin${slash}python -m`;
        }
    }

    if (!checkedImportlab) {
        let modules = JSON.parse(execSync(`${runPyScriptCommand} pip list --format json`));
        for (let i of modules) {
            if (i['name'] == "importlab") {
                hasImportlab = true;
                break;
            }
        }
        checkedImportlab = true;
    }

    if (hasImportlab) {
        let files = JSON.parse(execSync(`${pythonLocation} ${importlabScript} ${entry}`, {'cwd': srcDir}));
        for (let i of files) {
            this.addDependency(i);
        }
    }

    if (!compiler) {
        throw new Error(`py-loader only supports ${
            listify(Object.keys(compilers).map(properName))
        } compilers at present. See README.md for information on using it with others.`);
    }





    const callback = this.async();

    if (compiler.streaming) {
        compiler.switches = compiler.switches.replace('%f', basename);

        var child = spawn(compiler.name, compiler.switches.split(' '));
        child.stdin.write(source);

        var data = '';
        var error = '';
        child.stdout.on('data', function (js) {
            data = data + js;
        });
        child.stderr.on('data', function (msg) {
            error = error + msg;
        });
        child.on('exit', function () {
            if (compiler.sourcemaps) {
                sourcemapLine = data.split('\n').splice(-3,1)[0]; // Javascripthon specific?
                sourceMap = new Buffer(sourcemapLine.substring(sourcemapLine.indexOf('base64,') + 7), 'base64').toString();
                callback(error, data, sourceMap); }
            else {
                callback(error, data);
            }

        });
        child.on('error', function(err) {
            console.error(`Some error occurred on ${properName(compiler.name)} compiler execution. Have you installed ${properName(compiler.name)}? If not, please run \`${compiler.install}\` (requires Python ${compiler.python_version})`);
            callback(err);
        });
        child.stdin.end();
    }
    else {
        cmd.get(`${runPyScriptCommand} ${compiler.name} ${compiler.switches} ${srcDir}${slash}${basename}.py`, function(err, data, stderr) {

            if (!entry.toLowerCase().endsWith(".py")) {
                console.warn("This loader only handles .py files. This could be a problem with your webpack.config.js file. Please add a rule for .py files in your modules entry.");
                callback(null, source);
            }

            if (!err) {
                const filename = `${srcDir}${slash}${compiler.folder}${slash}${basename}.js`;
                js = fs.readFileSync(filename, "utf8");
                // fs.unlinkSync(filename);

                if (compiler.sourcemaps) {
                    // const sourceMapFile = `${srcDir}${slash}${compiler.folder}${slash}extra${slash}sourcemap${slash}${basename}.js`;
                    const sourceMapFile = `${srcDir}${slash}${compiler.folder}${slash}${basename}`;
                    sourceMap = fs.readFileSync(sourceMapFile + ".map", "utf8")
                    // fs.unlinkSync(sourceMapFile + ".map");
                    // callback(null, js, sourceMap);
                    callback(null, `export * from "./${compiler.folder}/${basename}.js"`);
                } else {
                    callback(null, js);
                }

            }
            else {
                // console.error(`Some error occurred on ${properName(compiler.name)} compiler execution. Have you installed ${properName(compiler.name)}? If not, please run \`${compiler.install}\` (requires Python ${compiler.python_version})`);
                callback(err);
                console.error(data);
                // console.error(stderr);
            }

        });
    }
}
