const sinon = require("sinon");
const {encryptSecrets, decryptSecrets} = require("../src/cryptex");
const Promise = require("bluebird");

const expect = require("chai").expect;

describe("cryptex", function () {
    process.env.NODE_CONFIG = JSON.stringify(require("./util/testconfig.json"));

    let decrypt,
        encrypt;

    beforeEach(function () {
        decrypt = sinon.spy((key) => {
            if (key === "123") {
                return Promise.resolve("secret1");
            } else if (key === "456") {
                return Promise.resolve("keyboardCat");
            }
            return Promise.reject(new Error("Unknown key"));
        });

        encrypt = sinon.spy(() => {
           return Promise.resolve("DECRYPTED");
        });
    });

    it("encrypts secrets", async function () {
        const res = await encryptSecrets([{decryptedVal: "mypass"}, {decryptedVal: "secret1"}], {encrypt, decrypt});
        expect(res).to.be.eql([{decryptedVal: "mypass", encryptedVal: "DECRYPTED"}, {decryptedVal: "secret1", encryptedVal: "DECRYPTED"}]);
        sinon.assert.callCount(encrypt, 2);
    });

    it("decrypts secrets", async function () {
        const toDecrypt = [{encryptedVal: "123"}, {encryptedVal: "456"}];
        const res = await decryptSecrets(toDecrypt, {encrypt, decrypt});
        expect(res).to.be.eql([{decryptedVal: "secret1", encryptedVal: "123"}, {decryptedVal: "keyboardCat", encryptedVal: "456"}]);
        sinon.assert.callCount(decrypt, 2);
        sinon.assert.calledWith(decrypt, toDecrypt[0].encryptedVal);
        sinon.assert.calledWith(decrypt, toDecrypt[1].encryptedVal);
    });


});