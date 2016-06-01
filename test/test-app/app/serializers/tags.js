import { Serializer } from 'LUX_LOCAL';

class TagsSerializer extends Serializer {
  attributes = [
    'name'
  ];

  hasOne = [
    'post'
  ];
}

export default TagsSerializer;
