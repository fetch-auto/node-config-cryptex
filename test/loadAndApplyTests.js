const sinon = require("sinon");
const config = require("config");
const mockRequire = require("mock-require");
const importFresh = require("import-fresh");
const Promise = require("bluebird");

const expect = require("chai").expect;

describe("node-config-cryptex", function () {
    describe("loadAndApply", function () {
        process.env.NODE_CONFIG = JSON.stringify(require("./util/testconfig.json"));

        let loadAndApply,
            decrypt;
        beforeEach(function () {
            decrypt = sinon.spy((key) => {
                if (key === "123") {
                    return Promise.resolve("secret1");
                } else if (key === "456") {
                    return Promise.resolve("keyboardCat");
                }
                return Promise.reject(new Error("Unknown key"));
            });

            const testConfig = importFresh("config");
            mockRequire("config", testConfig);

            loadAndApply = importFresh("../src/index")._loadAndApply;
        });

        it("Replaces all secrets", async function () {
            const result = await loadAndApply({decrypt});
            expect(config.util.toObject(result)).to.be.eql({
                "foo": "bar",
                "secret1": "secret1",
                "db": {
                    "host": "localhost:5432",
                    "password": "keyboardCat"
                }
            });
        });

    });
});