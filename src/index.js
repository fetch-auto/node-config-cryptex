const config = require("config");
const traverse = require("traverse");
const _ = require("lodash");
const {decryptSecrets} = require("./cryptex");

const loadSecrets = async (cryptexInstance) =>{
    const secretsToDecrypt = findSecrets();
    return decryptSecrets(secretsToDecrypt, cryptexInstance);
};

const findSecrets = () => {
    const originalConfig = config.util.toObject(config);

    const parametersToReplace = [];
    traverse(originalConfig).forEach(function (item) {
        if (this.isLeaf && typeof item === "string" && item.startsWith("CRYPT:")) {
            parametersToReplace.push({path:this.path.join("/"), encryptedVal: item.replace("CRYPT:", "")});
        }
    });
    return parametersToReplace;
};

const applySecrets = (secrets) => {
    const objectToMerge = {};
    _.each(secrets, secret => {
        _.set(objectToMerge, secret.path.split("/"), secret.decryptedVal);
    });

    config.util.extendDeep(config, objectToMerge);
    return config;
};

//Cryptex instance can be injected for testing purposes
const _loadAndApply = async (cryptexInstance) => {
    try {
        const secretsToApply = await loadSecrets(cryptexInstance);
        return applySecrets(secretsToApply);
    } catch (err) {
        console.error("Error loading secrets", err);
        throw err;
    }
};


const loadAndApply = async () => {
    return _loadAndApply();
};


module.exports._loadAndApply = _loadAndApply;
module.exports.loadAndApply = loadAndApply;
module.exports.default = loadAndApply;