const {
  implementHook,
  implementReduce,
} = require('@owo/lib/hook');

const logger = require('@owo/lib/logger')('<<<PLUGIN-NAME>>>.plugin');

// implement hooks/reducers here

module.exports = (owo) => {

  // return your api here so it is accessible from owo
  // or from (plugin/custom/<<<PLUGIN-NAME>>>.plugin)
  return {};

};
