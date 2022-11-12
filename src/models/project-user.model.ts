import {Entity, model, property, belongsTo} from '@loopback/repository';
import { User, UserWithRelations } from './user.model';
import {Project, ProjectWithRelations} from './project.model';
import {ERole} from '../constants';

@model()
export class ProjectUser extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(ERole),
    },
  })
  role: ERole;

  @belongsTo(() => User)
  userId: string;

  @belongsTo(() => Project)
  projectId: string;

  constructor(data?: Partial<ProjectUser>) {
    super(data);
  }
}

export interface ProjectUserRelations {
  // describe navigational properties here
  project?: ProjectWithRelations;
  user?: UserWithRelations;

}

export type ProjectUserWithRelations = ProjectUser & ProjectUserRelations;
