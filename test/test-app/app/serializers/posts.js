import { Serializer } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class PostsSerializer extends Serializer {
  attributes = [
    'title',
    'body',
    'createdAt',
    'updatedAt'
  ];

  hasOne = [
    'author'
  ];
}

export default PostsSerializer;
