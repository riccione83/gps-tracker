/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "query GetUsers {\n    users {\n      id\n      name\n      email\n      devices {\n        serial\n        id\n      }\n    }\n  }": types.GetUsersDocument,
    "query GetPositions($deviceId: Int!) {\n    positions(deviceId: $deviceId) {\n      latitude\n      longitude\n      timestamp\n    }\n  }": types.GetPositionsDocument,
    "mutation CreateDevice($userId: Int!,$serial: String!,$description: String!){\n    createDevice(userId: $userId, serial:$serial, description: $description) {\n    id\n    serial\n    description\n  }\n}": types.CreateDeviceDocument,
    "mutation DeleteDevice($id: Int!){\n  deleteDevice(id: $id)\n}": types.DeleteDeviceDocument,
    "query GetDevice($id: Int!) {\n  device(id: $id) {\n    id\n    serial\n    positions {\n      latitude\n      longitude\n      timestamp\n    }\n  }\n}": types.GetDeviceDocument,
    "query CheckDevice($serial: String!) {\n  checkDevice(serial: $serial) {\n    id\n    serial\n    description\n  }\n}\n": types.CheckDeviceDocument,
    "query GetDevices($userId: Int!) {\n  user(id: $userId) {\n    devices {\n      id\n      description\n    }\n  }\n}": types.GetDevicesDocument,
    "query GetLatestPositions($userId: Int!) {\n  latestPosition(id: $userId) {\n    description\n    serial\n    coord {\n      latitude\n      longitude\n    }\n  }\n}": types.GetLatestPositionsDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetUsers {\n    users {\n      id\n      name\n      email\n      devices {\n        serial\n        id\n      }\n    }\n  }"): (typeof documents)["query GetUsers {\n    users {\n      id\n      name\n      email\n      devices {\n        serial\n        id\n      }\n    }\n  }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetPositions($deviceId: Int!) {\n    positions(deviceId: $deviceId) {\n      latitude\n      longitude\n      timestamp\n    }\n  }"): (typeof documents)["query GetPositions($deviceId: Int!) {\n    positions(deviceId: $deviceId) {\n      latitude\n      longitude\n      timestamp\n    }\n  }"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation CreateDevice($userId: Int!,$serial: String!,$description: String!){\n    createDevice(userId: $userId, serial:$serial, description: $description) {\n    id\n    serial\n    description\n  }\n}"): (typeof documents)["mutation CreateDevice($userId: Int!,$serial: String!,$description: String!){\n    createDevice(userId: $userId, serial:$serial, description: $description) {\n    id\n    serial\n    description\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "mutation DeleteDevice($id: Int!){\n  deleteDevice(id: $id)\n}"): (typeof documents)["mutation DeleteDevice($id: Int!){\n  deleteDevice(id: $id)\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetDevice($id: Int!) {\n  device(id: $id) {\n    id\n    serial\n    positions {\n      latitude\n      longitude\n      timestamp\n    }\n  }\n}"): (typeof documents)["query GetDevice($id: Int!) {\n  device(id: $id) {\n    id\n    serial\n    positions {\n      latitude\n      longitude\n      timestamp\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query CheckDevice($serial: String!) {\n  checkDevice(serial: $serial) {\n    id\n    serial\n    description\n  }\n}\n"): (typeof documents)["query CheckDevice($serial: String!) {\n  checkDevice(serial: $serial) {\n    id\n    serial\n    description\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetDevices($userId: Int!) {\n  user(id: $userId) {\n    devices {\n      id\n      description\n    }\n  }\n}"): (typeof documents)["query GetDevices($userId: Int!) {\n  user(id: $userId) {\n    devices {\n      id\n      description\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetLatestPositions($userId: Int!) {\n  latestPosition(id: $userId) {\n    description\n    serial\n    coord {\n      latitude\n      longitude\n    }\n  }\n}"): (typeof documents)["query GetLatestPositions($userId: Int!) {\n  latestPosition(id: $userId) {\n    description\n    serial\n    coord {\n      latitude\n      longitude\n    }\n  }\n}"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;