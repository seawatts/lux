import { Serializer } from 'LUX_LOCAL';

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
