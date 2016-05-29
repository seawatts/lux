import { Model } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class Author extends Model {
  static hasMany = {
    posts: {
      inverse: 'author'
    }
  };
}

export default Author;
