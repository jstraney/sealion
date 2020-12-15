# SEALION

## What's Sealion?

Sealion is an extensible, API driven framework that aims to help you do more with less code using `plugins`:

* Use for microservices
* Use as headless CMS
* Use for testing/stubs
* Use for fun

## Getting Started

First install sealion globally. If you just want to play around, it is easiest to run with `sqlite3`, but the service does support `mysql`, `pgsql` and `mssql`.

```sh
npm i -g sealion

# initialize a new project
sealion init --sqlite3 my-project

cd my-project && sealion migrate up -m install

# run to get help
sealion help

```

See writing your first sealion plugin for help

## Project Goals

* Support a clustered mode with leads and replicas
* Offer sealion plugins for various caching, full-text
* Offer plugins that pub-sub to known services (stripe, paypal, social media)
* Start secondary projects with themable clients (react, php, mobile)
* One day offer a repo/org with downloadable plugins
