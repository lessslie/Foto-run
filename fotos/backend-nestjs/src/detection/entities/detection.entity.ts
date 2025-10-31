import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Runner } from '../../runners/entities/runner.entity';

@Entity('detections')
export class Detection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  image_url: string;

  @Column()
  plate_number: number;

  @Column('decimal', { precision: 5, scale: 2 })
  confidence: number;

  @Column('jsonb')
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @Column('jsonb', { nullable: true })
  ocr_analysis?: {
    mean_intensity: number;
    std_intensity: number;
    edge_density: number;
    area: number;
    method: string;
  };

  @ManyToOne(() => Runner, runner => runner.detections, { nullable: true })
  @JoinColumn({ name: 'runner_id' })
  runner: Runner;

  @CreateDateColumn()
  detected_at: Date;
}