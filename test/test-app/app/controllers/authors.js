import { Controller } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class AuthorsController extends Controller {
  params = [
    'name'
  ];

  beforeAction = [
    function (req, res) {
      res.setHeader('X-Controller', 'Authors');
    }
  ];
}

export default AuthorsController;
