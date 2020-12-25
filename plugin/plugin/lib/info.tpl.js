module.exports = () => ({
  name: '<<<PLUGIN-NAME>>>',
  description: '<<<PLUGIN-NAME>>> plugin',
  version: '1.x-0.0',
  dependencies: [
    'sealion',
    // add any other non-basic core dependencies here. remember, these
    // will be loaded before your plugin.
  ],
});
