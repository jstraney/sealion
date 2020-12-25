# First Plugin

## Setup

Make sure you have [Sealion installed](doc/how-to/install.md).


## Creating a Plugin

Run this from your project directory

```sh
sealion plugin create firstPlugin --include-install
```

once that is run, you'll see that sealion has created a plugin directory for you under `/<project-dir/plugin/custom/firstPlugin`

now run

```sh
sealiion plugin
```

The plugin is listed and has a status of not installed. While we could install the plugin right now It would not really offer any new functionality.

What you *probably* would like to do is create an entity type when the plugin is installed. The way to do this is with a .install.js file! This isn't created by default using the `sealion plugin create` command unless the --include-install option is in place but its easy to add one.

Create a file called `firstPlugin.install.js` in the firstPlugin directory. enter these contents:

```js
const {
  implementHook,
} = require('@owo/lib/hook')

// good practice to make a logger. loggers are namespaced
const logger = require('@owo/lib/logger')('@myProject/firstPlugin.install');

implementHook('firstPluginInstall', async (owo) => {

  logger.info('running install hook for firstPlugin');

  const { plugin: { entity: { getEntityModel } }} = owo

  const entityTypeModel = await getEntityModel('entityType');

  // creates a new table called 'babySealion' with a column
  // for each property. since no columns have isIdKey: true,
  // an 'id' column will be made
  const entityType = await entityTypeModel.create({
    name: 'babySealion',
    label: 'Baby Sealion',
    properties: [
      { name: 'nickname', label: 'NickName', type: 'string', isRequired: true},
      { name: 'saying', label: 'NickName', type: 'string' },
    ]
  });

  logger.info('here is my new entityType %o', entityType);

});
```

Now if you run the following, your new plugin will be installed and the install hook will run.

```sh
sealion plugin install firstPlugin
```

Now if you check your database you'll see a new table created called babySealion with columns of id, nickname and saying

## Creating a CLI

Sealion could be said to be a CLI first architecture. Writing CLI commands makes testing easy. While a CLI is not needed for your plugin, you can create one using the `--include-cli` flag for `sealion plugin create`

Create a file called firstPlugin.cli.js in your plugin directory

```js
const {
  implementReduce,
} = require('@owo/lib/hook');

implementReduce('cliHelp', (allHelp) => {
  ...allHelp,
  firstPlugin: {
    description: 'This is my first plugin. Not bad!',
    usage: 'sealion firstPlugin'
  },
}));

module.exports = (owo, parsedArgs) => {

  return 'Not Bad'

};
```

### CAUTION

Notice here that we are implementing a *Reducer* and not a hook. Reducers must return a value and you will get a warning from the console if you do not. Generally, a reducer is invoked when sealion *wants* something from our code, and a plain hook is invoked to produce some side-effect like writing to a cache or inserting records. Reducers are commonly referred to as hooks unless they need to be distinguished.

### Get Help

You can see your help now by running `sealion help firstPlugin`. And running `sealion firstPlugin` will print "Not Bad".

### Adding CLI Arguments

Modify the .cli.js file to include the following before the exports

```js
implementReduce('firstPluginDefineCliArgs', () => [
  { name: 'nickname', type: String, defaultOption: true },
]);
```

If you run `sealion help firstPlugin` will now see there are options populated in the help page

Now add this to your cli's module.exports

```js
module.exports = (owo, parsedArgs) => {

  const {
    nickname = 'No Name',
  } = parsedArgs;

  return ['Hello', nickname].join(' ')

};
```

### More

See [implementing subCommands](./cli-subcommands)

## Uninstalling Plugin

You might want to clean up the database when the plugin is uninstalled. You might have guessed that we do this with an 'Uninstall' hook. Add this to your firstPlugin.install file:

```js
implementHook('firstPluginUninstall', async (owo) => {

  logger.info('running uninstall hook for firstPlugin');

  const { plugin: { entity: { getEntityModel } }} = owo

  const entityTypeModel = await getEntityModel('entityType');

  // this triggers hooks to remove the entityTypeProperties, bundles
  // and permissions associated with the entityType
  const entityType = await entityTypeModel.remove({
    name: 'babySealion',
  });

  logger.info('bye bye baby sealion');

});
```

Now it is a matter of running

```sh
sealion plugin uninstall firstPlugin
```
