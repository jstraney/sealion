# Install

## Things to Know

By default, initializing a sealion directory and running installation is done separately. Initializing the project will create the directory structure, initialize a git repo, but will not create your database for you by default.

## Examples

### Manually Edit Default Settings

Running `sealion init` creates the project directory with a dummy `.env` file which you must change out with your own settings. `sealion init` will not create your database for you will not create your database for you without extra options passed.

```sh
sealion init
# edit your environment variables
nano .env
sealion install
```

### Run In One Step

You can initalize the directory and install the project in one command but note:

* The database user needs to be able to create the database
* Or the database needs to have been made already

If you use the root mysql user, please consider changing the setting in the .env file after install.

```sh
# install using mysql
sealion init --install --db-url mysql://root:pass@hostname:ort/dbname
```

