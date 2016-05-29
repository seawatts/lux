import { Serializer } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class TagsSerializer extends Serializer {
  attributes = [
    'name'
  ];

  hasOne = [
    'post'
  ];
}

export default TagsSerializer;
