import { Model } from 'LUX_LOCAL';

class Author extends Model {
  static hasMany = {
    posts: {
      inverse: 'author'
    }
  };
}

export default Author;
