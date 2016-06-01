import { Model } from 'LUX_LOCAL';

class Tag extends Model {
  static belongsTo = {
    post: {
      inverse: 'tag'
    }
  };
}

export default Tag;
