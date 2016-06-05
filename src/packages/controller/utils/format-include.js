import { singularize } from 'inflection';

export default function formatInclude(model, include, fields, relationships) {
  return relationships.reduce((included, value) => {
    const relationship = model.getRelationship(value);

    if (!relationship) {
      return included;
    }

    if (include.indexOf(value) >= 0) {
      const {
        model: {
          serializer: {
            attributes: relatedAttrs
          }
        }
      } = relationship;

      let fieldsForRelationship = fields[singularize(value)];

      if (fieldsForRelationship) {
        fieldsForRelationship = fieldsForRelationship.filter(attr => {
          return relatedAttrs.indexOf(attr) >= 0;
        });
      } else {
        fieldsForRelationship = relatedAttrs;
      }

      included[value] = [
        'id',
        ...fieldsForRelationship
      ];
    } else {
      included[value] = ['id'];
    }

    return included;
  }, {});
}
