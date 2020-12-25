const {
  implementHook,
  invokeHook,
} = require('@owo/lib/hook');

const { defaultError } = require('./middleware');

const
express = require('express'),
helmet = require('helmet'),
bodyParser = require('body-parser'),
cookieParser = require('cookie-parser');

const {
  httpLogger,
} = require('./middleware')

const logger = require('@owo/lib/logger')('@owo/plugin/server/lib/cli');

const serverUp = async (owo, args = {}) => {

  const { plugin: { server : { buildResourceRouter } } } = owo;

  const {
    port,
    iface,
  } = args;

  const app = express();

  const grandRouter = express.Router();

  // put basic middleware up here
  // TODO: allow reducers to modify top level middleware
  grandRouter.use(helmet());
  grandRouter.use(httpLogger(logger));
  grandRouter.use(cookieParser());
  grandRouter.use(bodyParser.json());
  grandRouter.use(bodyParser.urlencoded({extended: true}));
  grandRouter.use(defaultError);

  // mutable router.
  let resourceRouter = await buildResourceRouter()

  grandRouter.use((req, res, next) => {
    resourceRouter(req, res, next);
  });

  implementHook('rebuildResourceRouter', async () => {

    const newResourceRouter = await buildResourceRouter();
    resourceRouter = newResourceRouter;

  });

  app.use(grandRouter);

  app.listen(port, iface);

  invokeHook('keepSealionAlive');

  return `sealion watching on ${iface}:${port}`

};

module.exports = {
  serverUp,
};
