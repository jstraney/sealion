const requireDir = require('require-dir');

const {
  sealionCorePath,
  sealionProjectPath,
} = require('../lib/sealion');

const {
  implementReduce,
  implementHook,
  invokeReduce,
} = require('../lib/hook');

const buildResourceRouter = require(sealionCorePath('router'));

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  up: {
    description: 'starts up a sealion project',
    usage: 'sealion up',
  },
}));

module.exports = async () => {

  const {
    SEALION_PORT = 8080,
    SEALION_IFACE = '127.0.0.1',
  } = process.env;

  const
  express = require('express'),
  helmet = require('helmet'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser');

  const { defaultError } = require('../lib/middleware');

  const app = express();

  requireDir(sealionProjectPath('plugin'));

  const grandRouter = express.Router();

  grandRouter.use(helmet());
  grandRouter.use(cookieParser());
  grandRouter.use(bodyParser.json());
  grandRouter.use(bodyParser.urlencoded({extended: true}));
  grandRouter.use(defaultError);

  // mutable router.
  let resourceRouter = await buildResourceRouter();

  grandRouter.use((req, res, next) => {
    resourceRouter(req, res, next);
  });

  implementHook('rebuildResourceRouterCache', async () => {
    // TODO: check for memory issues from this approach
    // I would hate for dangling refs to exhaust memory
    const newResourceRouter = await buildResourceRouter();
    resourceRouter = newResourceRouter;

  });

  app.use(grandRouter);

  app.listen(SEALION_PORT, SEALION_IFACE);

  return `sealion watching on ${SEALION_IFACE}:${SEALION_PORT}`

};
