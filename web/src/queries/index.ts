import { gql } from "@/gql-generated/gql";

const userQuery = gql(`query GetUsers {
    users {
      id
      name
      email
      devices {
        serial
        id
        description
      }
    }
  }`);

const getUserQuery = gql(`
query GetUser($userId: Int!) {
    user(id: $userId) {
      id
      name
      email
      devices {
        serial
        description
        id
      }
    }
}
`);

const gpsQuery = gql(`query GetPositions($deviceId: Int!, $for: Date) {
    positions(deviceId: $deviceId, for: $for) {
      latitude
      longitude
      timestamp
      speed
      satellites
      accuracy
      activity
    }
  }`);

const createDeviceMutation =
  gql(`mutation CreateDevice($userId: Int!,$serial: String!,$description: String!){
    createDevice(userId: $userId, serial:$serial, description:$description) {
    id
    serial
    description
  }
}`);

const deleteDeviceMutation = gql(`mutation DeleteDevice($id: Int!){
  deleteDevice(id: $id)
}`);

const deviceQuery = gql(`query GetDevice($id: Int!) {
  device(id: $id) {
    id
    serial
    description
    positions {
      latitude
      longitude
      timestamp
      accuracy
      activity
      speed
      satellites
    }
  }
}`);

const editDeviceMutation =
  gql(`mutation EditDevice($deviceId: Int!, $description: String!) {
  editDevice(deviceId: $deviceId, description: $description) {
    id
    serial
    description
  }
}`);

const createUserMutation = gql(`
mutation CreateUser($name: String!, $email: String!, $password: String!) {
  createUser(name: $name, email: $email, password: $password) {
    id
    name
    email
  }
}`);

const latestGpsPositions = gql(`query GetLatestPositions($userId: Int!) {
  latestPosition(id: $userId) {
    description
    id
    serial
    coord {
      latitude
      longitude
      timestamp
      speed
      satellites
      accuracy
      activity
    }
  }
}`);

export {
  userQuery,
  getUserQuery,
  gpsQuery,
  createDeviceMutation,
  deleteDeviceMutation,
  deviceQuery,
  editDeviceMutation,
  latestGpsPositions,
  createUserMutation,
};
