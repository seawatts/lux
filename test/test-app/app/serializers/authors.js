import { Serializer } from '/Users/zacharygolba/.nvm/versions/node/v6.2.0/lib/node_modules/lux-framework';

class AuthorsSerializer extends Serializer {
  attributes = [
    'name',
    'createdAt'
  ];

  hasMany = [
    'posts'
  ];
}

export default AuthorsSerializer;
