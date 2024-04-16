import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  Kind,
} from "graphql";
import { MyContext } from "..";
import { sendEmailValidation } from "../comms/mail";
import { Device } from "../models/device";
import { GPSPosition } from "../models/position";
import { User, makeid } from "../models/user";
var passwordHash = require("password-hash");

const DateTimeScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  parseValue(value: any) {
    return new Date(value); // value from the client
  },
  serialize(value: any) {
    return value.getTime(); // value sent to the client
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value); // ast value is always in string format
    }
    return null;
  },
});

const UserGraphType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    devices: { type: new GraphQLList(DeviceGraphType) },
  }),
});

const LatestPositionType = new GraphQLObjectType({
  name: "LatestPosition",
  fields: () => ({
    id: { type: GraphQLString },
    description: { type: GraphQLString },
    serial: { type: GraphQLString },
    coord: { type: GPSGraphType },
  }),
});

const DeviceGraphType: GraphQLObjectType = new GraphQLObjectType({
  name: "Device",
  fields: () => ({
    id: { type: GraphQLInt },
    serial: { type: GraphQLString },
    description: { type: GraphQLString },
    positions: { type: new GraphQLList(GPSGraphType) },
    user: { type: UserGraphType },
  }),
});

const GPSGraphType = new GraphQLObjectType({
  name: "GPS",
  fields: () => ({
    id: { type: GraphQLString },
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    timestamp: { type: DateTimeScalar },
  }),
});

const QueryRoot = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    devices: {
      type: new GraphQLList(DeviceGraphType),
      resolve: async (parent: any, args: any, context: MyContext) => {
        const projects = await context.db.manager.find(Device, {
          relations: {
            user: true,
          },
        });
        return projects;
      },
    },
    device: {
      type: DeviceGraphType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (parent: any, args: any, context: MyContext) => {
        const device = await context.db.manager.findOne(Device, {
          where: { id: args.id },
          relations: {
            positions: true,
          },
        });
        return device;
      },
    },
    checkDevice: {
      type: DeviceGraphType,
      args: { serial: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (parent: any, args: any, context: MyContext) => {
        const device = await context.db.manager.findOne(Device, {
          where: { serial: args.serial },
        });
        return device;
      },
    },
    users: {
      type: new GraphQLList(UserGraphType),
      resolve: async (parent: any, args: any, context: MyContext) => {
        const users = await context.db.manager.find(User, {
          relations: {
            devices: true,
          },
        });
        return users;
      },
    },
    user: {
      type: UserGraphType,
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (parent: any, args: any, context: MyContext) => {
        // const user = context.db.manager.createQueryBuilder().leftJoinAndSelect('user', '')
        const user = await context.db.manager.findOne(User, {
          where: { id: args.id },
          relations: {
            devices: true,
          },
        });
        context.session.user = user;
        return user;
      },
    },
    latestPosition: {
      type: new GraphQLList(LatestPositionType),
      args: { id: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (parent: any, args: any, context: MyContext) => {
        const user = await context.db.manager.findOne(User, {
          where: { id: args.id },
          relations: {
            devices: true,
          },
        });

        const pos = user?.devices.map(async (d) => {
          const gps = await context.db.manager.findOne(GPSPosition, {
            where: {
              device: d,
            },
            order: { id: "DESC" },
          });
          return {
            coord: gps,
            description: d.description,
            id: d.id,
            serial: d.serial,
          };
        });
        return pos;
      },
    },
    positions: {
      type: new GraphQLList(GPSGraphType),
      args: {
        deviceId: { type: new GraphQLNonNull(GraphQLInt) },
        from: { type: DateTimeScalar },
        to: { type: DateTimeScalar },
      },
      resolve: async (parent: any, args: any, context: MyContext) => {
        const device = await context.db.manager.findOne(Device, {
          where: { id: args.deviceId },
        });
        if (device) {
          const gps = await context.db.manager.find(GPSPosition, {
            where: {
              device: device,
            },
            relations: {
              device: true,
            },
          });
          return gps;
        }
        return [];
      },
    },
  }),
});

const MutationRoot = new GraphQLObjectType({
  name: "Mutations",
  fields: () => ({
    createUser: {
      type: UserGraphType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (
        parent: any,
        args: any,
        context: MyContext,
        resolveInfo: any
      ) => {
        const token = makeid(8);
        const user = await context.db.manager.insert(User, {
          name: args.name,
          email: args.email,
          password: passwordHash.generate(args.password),
          emailValidated: false,
          emailValidationKey: token,
        });
        if (user.raw.length > 0) {
          sendEmailValidation(args.email, token);
        }
        return { id: user.raw[0].id, name: args.name, email: args.email };
      },
    },
    createDevice: {
      type: DeviceGraphType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLInt) },
        serial: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent: any, args: any, context: MyContext) => {
        const currentUser = await context.db.manager.findOne(User, {
          where: { id: args.userId },
        });
        if (currentUser) {
          const new_p = await context.db.manager.insert(Device, {
            serial: args.serial,
            user: currentUser,
            description: args.description,
          });
          const device = await context.db.manager.findOne(Device, {
            where: { id: new_p.raw[0].id },
            relations: {
              user: true,
            },
          });
          return device;
        }
      },
    },
    editDevice: {
      type: DeviceGraphType,
      args: {
        deviceId: { type: new GraphQLNonNull(GraphQLInt) },
        description: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (parent: any, args: any, context: MyContext) => {
        const toEdit = await context.db.manager.findOne(Device, {
          where: { id: args.deviceId },
        });
        const edited = await context.db.manager.update(
          Device,
          {
            id: Number(args.deviceId),
          },
          { description: args.description }
        );
        console.info(edited);
        if (edited.affected) {
          return edited.raw;
        } else throw new Error("Device not updated");
      },
    },
    deleteDevice: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (
        parent: any,
        args: any,
        context: MyContext,
        resolveInfo: any
      ) => {
        const project = await context.db.manager.delete(Device, {
          id: args.id,
        });
        return project.affected && project.affected > 0;
      },
    },
  }),
});
export { MutationRoot, QueryRoot };