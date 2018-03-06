const Cryptex = require("cryptex");
const Promise = require("bluebird");


const decryptSecrets = async (secretsToDecrypt, cryptexInstance) => {
    const cryptex = cryptexInstance ? cryptexInstance : Cryptex;

    return await Promise.map(secretsToDecrypt, async secret => {
        const decryptedVal = await cryptex.decrypt(secret.encryptedVal);
        secret.decryptedVal = decryptedVal;
        return secret;
    });
};

const encryptSecrets = async (secretsToEncrypt, cryptexInstance) => {
    const cryptex = cryptexInstance ? cryptexInstance : Cryptex;

    return await Promise.map(secretsToEncrypt, async secret => {
        const encryptedVal = await cryptex.encrypt(secret.decryptedVal);
        secret.encryptedVal = encryptedVal;
        return secret;
    });
};


module.exports = {decryptSecrets, encryptSecrets};