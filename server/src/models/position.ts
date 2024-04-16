import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";
import { Device } from "./device";

@Entity()
export class GPSPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 10, scale: 6 })
  latitude: number;

  @Column("decimal", { precision: 10, scale: 6 })
  longitude: number;

  @Column()
  timestamp: Date;

  @ManyToOne(() => Device, (device) => device.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "deviceId" })
  device: Device;
}
