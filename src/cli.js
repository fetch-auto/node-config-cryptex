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
    .command("encrypt <plaintext>", "Encrypt secret in 1 or more environments")
    .option("e", {
        alias: "environment",
        describe: "Encrypt for a specific env. If not specified an encrypted value will be returned for all envs in your cryptex.json",
        nargs: 1
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

const encryptRunner = async argv => {
    return Promise.map(getEnvironments(argv), async env => await encryptForEnv(argv.plaintext, env));
};

const encryptForEnv = async (plaintext, env) => {
    const cryptexInstance = new cryptex.Cryptex({env});
    const res = await encryptSecrets([{decryptedVal: plaintext}], cryptexInstance);

    log("Encrypted " + plaintext + " in env " + chalk.blue(env));
    log(chalk.green(res[0].encryptedVal));
};

run(encryptRunner)(argv);


