import { Serializer } from 'LUX_LOCAL';

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
