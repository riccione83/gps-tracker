import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";
import { GPSPosition } from "./position";

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
}
