import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Photo } from '../../photos/photo.entity';  // ← SIN /entities/

@Entity('detections')
export class Detection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Photo, (photo) => photo.detections)
  @JoinColumn({ name: 'photoId' })
  photo: Photo;

  @Column({ type: 'uuid' })
  photoId: string;

  @Column({ type: 'varchar', length: 10 })
  bibNumber: string;

  @Column({ type: 'float', default: 0 })
  confidence: number;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'float' })
  width: number;

  @Column({ type: 'float' })
  height: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
