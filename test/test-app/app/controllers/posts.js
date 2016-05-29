import { Controller } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class PostsController extends Controller {
  params = [
    'title',
    'body',
    'isPublic'
  ];

  beforeAction = [
    function (req, res) {
      res.setHeader('X-Controller', 'Posts');
    }
  ];
}

export default PostsController;
