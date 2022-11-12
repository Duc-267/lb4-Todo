import { EStatus } from './../constants';
import {Entity, model, property, belongsTo} from '@loopback/repository';
import { User, UserWithRelations } from './user.model';
import {Project, ProjectWithRelations} from './project.model';

@model()
export class Task extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt: Date;

  @property({
    type: 'boolean'
  })
  isCreatedByAdmin?: boolean;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  updatedAt: Date;

  @property({
    type: 'boolean',
    default: false,
  })
  isDeleted?: boolean;

  @property({
    type: 'string',
    jsonSchema: {
      enum: Object.values(EStatus),
    },
  })
  status?: EStatus;

  @belongsTo(() => User, {name: 'creator'})
  createdBy: string;

  @belongsTo(() => User, {name: 'assignee'})
  asignedTo: string;

  @belongsTo(() => Project)
  projectId: string;

  @belongsTo(() => Task, {name: 'linked'})
  linkedTo: string;

  constructor(data?: Partial<Task>) {
    super(data);
  }
}

export interface TaskRelations {
  // describe navigational properties here
  creator?: UserWithRelations;
  assignee?: UserWithRelations;
  linked?: TaskWithRelations;
  project?: ProjectWithRelations;
}

export type TaskWithRelations = Task & TaskRelations;
