import type { IEntityConstructor } from "../types";
import { getMetadataStorage } from "../Metadata/MetadataUtils";
import { plural } from "pluralize";

export function Collection(entityName?: string) {
  return function (entityConstructor: IEntityConstructor) {
    const name = entityName || plural(entityConstructor.name);
    getMetadataStorage().setCollection({
      name,
      entityConstructor,
    });
  };
}
