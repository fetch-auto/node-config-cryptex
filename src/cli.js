#!/usr/bin/env node
const pkg = require("../package.json");
const {encryptSecrets} = require("./cryptex");
const cryptex = require("cryptex");
const Promise = require("bluebird");
const path = require("path");

const chalk = require("chalk");
const log = console.log;

const argv = require("yargs")
    .usage("Usage: $0 [options] <command>")
    .command("encrypt", "Encrypt secret in 1 or more environments")
    .option("e", {
        alias: "environment",
        describe: "Encrypt for a specific env. If not specified an encrypted value will be returned for all envs in your cryptex.json",
        nargs: 1
    })
    .option("v", {
        alias: "value",
        describe: "Specify a plaintext value to encrypt. Ex: `myPassword`. Either this OR `-p` must be set.",
        nargs: 1
    })
    .option("p", {
        alias: "path",
        describe: "Specify a path to a value in your configuration. We use node-config to load the config in the specified env and then read and encrypt the value. Ex: `db.password`. Either this OR `-v` must be set.",
        nargs: 1
    })
    .check(argv => {
        if (!argv.path && !argv.value) {
            throw new Error("Must specify a value or a path to a value in your config to encrypt");
        }
        else if (argv.path && argv.value) {
            throw new Error("Must specify a value or a path to a value in your config to encrypt. You cannot specify both");
        }
        return true;
    })
    .version(pkg.version)
    .help("help")
    .strict(true)
    .argv;

const run = runner => async argv => {
    try {
        await runner(argv);
        process.exit(0);
    } catch (e) {
        console.error("Error running command " + argv._[0], e);
        process.exit(1);
    }
};

const getEnvironments = argv => {
    if (argv.environment) {
        return [argv.environment];
    }

    try {
        const config = require(path.join(process.cwd(), "cryptex.json"));
        return Object.keys(config);
    } catch (e) {
        throw new Error("cryptex.json was not found or was malformed. Make sure it's in your current working dir");
    }
};

const getValue = (argv, env) => {
    if (argv.value) {
        return argv.value;
    }
    delete require.cache[require.resolve("config")];
    process.env.NODE_CONFIG_ENV = env;
    //We must wait to require config until after we set the NODE_CONFIG_ENV
    const config = require("config");
    return config.get(argv.path);
};

const encryptRunner = async argv => {
    return Promise.map(getEnvironments(argv), async env => await encryptForEnv(getValue(argv, env),  env));
};

const encryptForEnv = async (plaintext, env) => {
    const cryptexInstance = new cryptex.Cryptex({env});
    const res = await encryptSecrets([{decryptedVal: plaintext}], cryptexInstance);

    log("Encrypted " + plaintext + " in env " + chalk.blue(env));
    log(chalk.green("CRYPT:" + res[0].encryptedVal));
};

run(encryptRunner)(argv);


