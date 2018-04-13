# Node-config-cryptex

[![Build Status](https://travis-ci.org/fetch-auto/node-config-cryptex.svg?branch=master)](https://travis-ci.org/fetch-auto/node-config-cryptex)

Use AWS KMS to securely encrypt your secrets and inject the decrypted values into your [node-config](https://github.com/lorenwest/node-config) configuration at run time.

Written as a plugin for [node-config](https://github.com/lorenwest/node-config)

## Purpose

Node-config is a great for configuration but doesn't provide any out of the box support for encrypting sensitive data (db passwords, api keys etc).  I also really like the approach taken by the [Cryptex library](https://github.com/TomFrost/Cryptex) when working with AWS KMS.

This library wraps the cryptex module for all management of KMS data keys as well as encryption/decryption of secrets.  It injects the resulting values into your config so you never have to store plaintext secrets into your repo

## Installation

```
npm install --save node-config-cryptex
```

## Configuration

1. In the AWS console create create a customer management key https://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html.
2. Ensure that your application has permissions to encrypt/decrypt using this key.  You may also need to give permission to your developer's IAM profiles if they need to run your application locally.

3. Create a data key:
    ```
    aws kms generate-data-key-without-plaintext \
      --key-id alias/YOUR_KEY_ALIAS \
      --key-spec AES_256 \
      --output text \
      --query CiphertextBlob
    ```
4. Create a cryptex config as documented [here](https://github.com/TomFrost/Cryptex/blob/master/README.md#5-save-your-secrets). The name of your deployment environments ex: `dev, prd` should match the deployment environments used in your node-config configuration files.  **NOTE: don't put your secrets in the secrets section of the cryptext config. We'll put these inline with the rest of your config**
5. Encrypt a secret -
    If you installed node-config-cryptex globally, you'll have a CLI tool that can encrypt and decrypt your keys according to your `cryptex.json`. <br/>
        <br/>
        If you want to get a value for a specific environment use the `-e` option. Otherwise you'll get a value for every environment specified in your cryptex.json.

    The encrypted values will have the prefix `CRYPT:`. You'll want to copy and paste the whole thing including the prefix into your config.

    ```
    $ ncc encrypt -e prd -v mypassword
    CRYPT:Q+JfrQS5DtSjqWHu1oO4HqctA2hVw4VhaDQfBCuvO8U=
    ```
    <br/>
   If you have existing secrets in your config files you can just specify a path in your config tree with the `-p` option. For example let's say I have a config file like so:

   ```yml
   db:
    user: app
    password: myPassword
   ...
   ```

   I can run this command to encrypt my database password:

   ```
    $ ncc encrypt -e prd -p db.password
    CRYPT:Q+JfrQS5DtSjqWHu1oO4HqctA2hVw4VhaDQfBCuvO8U=
   ```

    <br/>
    Run `ncc --help` for more information.

6. Add the encrypted value into your config file ex:
    ```yml
    db:
        user: db_user
        password: CRYPT:Q+JfrQS5DtSjqWHu1oO4HqctA2hVw4VhaDQfBCuvO8U=
    ```

## Usage
All secrets **MUST be loaded before config.get is called**. Once `config.get` is called the value becomes immutable so if we call `config.get` we can't update the encrypted value with the decrypted one.

The easiest way is calling config.loadSecrets before your app entry point is required.

```js
const config = require("node-config-cryptex");

config.loadSecrets().then(() => {
    require("./app.js");
});
```

Or if you're into async

```js
const config = require("node-config-cryptex");

await config.loadSecrets();
require("./app.js");
```

## CLI usage

Since config is a peer dependency (we do this so ncc is using the same version as your app) **Do not run this globally**. It won't work since there won't be a node-config for it to use. Instead run it from your node modules ie. `./node_modules/.bin/ncc`

### ./node_modules/.bin/ncc encrypt [parameters]

Get an encrypted value to store in your configuration files.

#### Parameters

`-e / --environment`: Specify an environment in your cryptex.json to use for encryption. If not specified we'll return a value for every env in your cryptex.json

`-v / --value`: Specify a plaintext value to encrypt. Either this OR `-p` must be specified

`-p / --path`: A path in your configuration to the value to encrypt. We'll use `node-config` in the specified environment to load your configuration tree and then retrieve the value at the given path. This value is then encrypted.

### ./node_modules/.bin/ncc decrypt [parameters]

Get the plaintext value of an encrypted secret.

#### Parameters

`-e / --environment`: Specify an environment in your cryptex.json to use for decryption. If not specified we'll return a value for every env in your cryptex.json

`-v / --value`: Specify an encrypted value to decrypt. Either this OR `-p` must be specified

`-p / --path`: A path in your configuration to the value to decrypt. We'll use `node-config` in the specified environment to load your configuration tree and then retrieve the value at the given path. This value is then decrypted.

## Dependencies

Node 6 and up is supported


