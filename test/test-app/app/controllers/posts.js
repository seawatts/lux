import { Controller } from 'LUX_LOCAL';

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
