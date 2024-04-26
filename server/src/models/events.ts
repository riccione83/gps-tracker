import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";
import { Device } from "./device";
import { Geofences } from "./geofence";

@Entity()
export class Events {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: string;

  @ManyToOne(() => Device, (device) => device.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "deviceId" })
  device: Device;

  @ManyToOne(() => Geofences, (geofence) => geofence.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "geofenceId" })
  geofence: Geofences;
}
