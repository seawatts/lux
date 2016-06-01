import { Model } from 'LUX_LOCAL';

class Post extends Model {
  static belongsTo = {
    author: {
      inverse: 'posts'
    }
  };
}

export default Post;
