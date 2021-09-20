import {
  EntityConstructorOrPath,
  IEntity,
  ITransactionReferenceStorage,
} from "./src/types";
import { getMetadataStorage } from "./src/Metadata/MetadataUtils";
import { BaseFirestoreRepository } from "./src/Repository/BaseFirestoreRepository";
import { FirestoreTransaction } from "./src/Transaction/FirestoreTransaction";

type RepositoryType = "default" | "base" | "custom" | "transaction";

function _getRepository<T extends IEntity = IEntity>(
  entityConstructorOrPath: EntityConstructorOrPath<T>,
  repositoryType: RepositoryType
): BaseFirestoreRepository<T> {
  const metadataStorage = getMetadataStorage();

  if (!metadataStorage.firestoreRef) {
    throw new Error("Firestore must be initialized first");
  }

  const collection = metadataStorage.getCollection(entityConstructorOrPath);

  const isPath = typeof entityConstructorOrPath === "string";
  const collectionName =
    typeof entityConstructorOrPath === "string"
      ? entityConstructorOrPath
      : entityConstructorOrPath.name;

  // TODO: create tests
  if (!collection) {
    const error = isPath
      ? `'${collectionName}' is not a valid path for a collection`
      : `'${collectionName}' is not a valid collection`;
    throw new Error(error);
  }

  const repository = metadataStorage.getRepository(
    collection.entityConstructor
  );

  if (repositoryType === "custom" && !repository) {
    throw new Error(`'${collectionName}' does not have a custom repository.`);
  }

  // If the collection has a parent, check that we have registered the parent
  if (collection.parentEntityConstructor) {
    const parentCollection = metadataStorage.getCollection(
      collection.parentEntityConstructor
    );

    if (!parentCollection) {
      throw new Error(
        `'${collectionName}' does not have a valid parent collection.`
      );
    }
  }

  if (
    repositoryType === "custom" ||
    (repositoryType === "default" && repository)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (repository?.target as any)(entityConstructorOrPath);
  } else {
    return new BaseFirestoreRepository<T>(entityConstructorOrPath);
  }
}

export function getRepository<T extends IEntity>(
  entityConstructorOrPath: EntityConstructorOrPath<T>
) {
  return _getRepository(entityConstructorOrPath, "default");
}

export const runTransaction = async <T>(
  executor: (tran: FirestoreTransaction) => Promise<T>
) => {
  const metadataStorage = getMetadataStorage();

  if (!metadataStorage.firestoreRef) {
    throw new Error("Firestore must be initialized first");
  }

  return metadataStorage.firestoreRef.runTransaction(async (t) => {
    const tranRefStorage: ITransactionReferenceStorage = new Set();
    const result = await executor(new FirestoreTransaction(t, tranRefStorage));

    tranRefStorage.forEach(({ entity, path, propertyKey }) => {
      const record = entity as unknown as Record<string, unknown>;
      record[propertyKey] = getRepository(path);
    });

    return result;
  });
};

// export const createBatch = () => {
//   const metadataStorage = getMetadataStorage();
//
//   if (!metadataStorage.firestoreRef) {
//     throw new Error("Firestore must be initialized first");
//   }
//
//   return new FirestoreBatch(metadataStorage.firestoreRef);
// };
