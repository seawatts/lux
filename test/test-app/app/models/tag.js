import { Model } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class Tag extends Model {
  static belongsTo = {
    post: {
      inverse: 'tag'
    }
  };
}

export default Tag;
