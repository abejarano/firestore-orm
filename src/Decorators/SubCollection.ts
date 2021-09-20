import { plural } from "pluralize";
import { IEntityConstructor, IEntity } from "../types";
import { getMetadataStorage } from "../Metadata/MetadataUtils";

export function SubCollection(
  entityConstructor: IEntityConstructor,
  entityName?: string
) {
  return function (parentEntity: IEntity, propertyKey: string) {
    getMetadataStorage().setCollection({
      entityConstructor,
      name: entityName || plural(entityConstructor.name),
      parentEntityConstructor: parentEntity.constructor as IEntityConstructor,
      propertyKey,
    });
  };
}
