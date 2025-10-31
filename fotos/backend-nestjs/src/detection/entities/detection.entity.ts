import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Runner } from '../../runners/entities/runner.entity';
import { User } from '../../users/entities/user.entity';

@Entity('detections')
export class Detection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  plateNumber: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidence: number;

  @Column()
  imageUrl: string;

  @CreateDateColumn()
  detectedAt: Date;

  @ManyToOne(() => Runner, (runner) => runner.detections, { nullable: true })
  @JoinColumn({ name: 'runnerId' })
  runner: Runner;

  @Column({ nullable: true })
  runnerId: string;

  @ManyToOne(() => User, (user) => user.detections, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;
}
