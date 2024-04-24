import {gql} from '@apollo/client';

const userQuery = gql(`query GetUsers {
    users {
      id
      name
      email
      devices {
        serial
        id
      }
    }
  }`);

const gpsQuery = gql(`query GetPositions($deviceId: Int!) {
    positions(deviceId: $deviceId) {
      latitude
      longitude
      timestamp
    }
  }`);

const createDeviceMutation =
  gql(`mutation CreateDevice($userId: Int!,$serial: String!,$description: String!){
    createDevice(userId: $userId, serial:$serial, description: $description) {
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
    positions {
      latitude
      longitude
      timestamp
    }
  }
}`);

const checkDeviceQuery = gql(`query CheckDevice($serial: String!) {
  checkDevice(serial: $serial) {
    id
    serial
    description
  }
}
`);

const devicesQuery = gql(`query GetDevices($userId: Int!) {
  user(id: $userId) {
    devices {
      id
      description
    }
  }
}`);

const latestGpsPositions = gql(`query GetLatestPositions($userId: Int!) {
  latestPosition(id: $userId) {
    description
    serial
    coord {
      latitude
      longitude
    }
  }
}`);

const getGeofencesQuery = gql(`query GetGeofences($userId: Int!) {
  geofences(userId: $userId) {
    latitude
    longitude
    radius
  }
}`);

export {
  userQuery,
  gpsQuery,
  createDeviceMutation,
  deleteDeviceMutation,
  deviceQuery,
  devicesQuery,
  checkDeviceQuery,
  latestGpsPositions,
  getGeofencesQuery,
};
