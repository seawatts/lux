import { Model } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class Post extends Model {
  static belongsTo = {
    author: {
      inverse: 'posts'
    }
  };
}

export default Post;
