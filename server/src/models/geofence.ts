import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";
import { Events } from "./events";

@Entity()
export class Geofences {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 10, scale: 6 })
  latitude: number;

  @Column("decimal", { precision: 10, scale: 6 })
  longitude: number;

  @Column("decimal", { default: -1 })
  radius: number;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @OneToMany(() => Events, (event) => event.geofence, {
    onDelete: "CASCADE",
  })
  events: Events[];
}
