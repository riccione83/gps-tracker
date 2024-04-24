import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";
import { GPSPosition } from "./position";
import { Geofences } from "./geofence";
import { Events } from "./events";

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serial: string;

  @Column()
  description: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @OneToMany(() => GPSPosition, (gps) => gps.device, { onDelete: "CASCADE" })
  positions: GPSPosition[];

  @OneToMany(() => Events, (event) => event.device, { onDelete: "CASCADE" })
  events: Events[];
}
