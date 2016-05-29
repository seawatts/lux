import { Controller } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class ApplicationController extends Controller {
  beforeAction = [
    function (req, res) {
      res.setHeader('X-Powered-By', 'Lux');
    }
  ];
}

export default ApplicationController;
