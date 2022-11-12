import { authenticate } from '@loopback/authentication';
import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Task,
  User,
} from '../models';
import {TaskRepository} from '../repositories';

@authenticate('jwt')
export class TaskUserController {
  constructor(
    @repository(TaskRepository)
    public taskRepository: TaskRepository,
  ) { }

  @get('/tasks/{id}/creator', {
    responses: {
      '200': {
        description: 'Creator of Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async getCreator(
    @param.path.string('id') id: typeof Task.prototype.id,
  ): Promise<User> {
    return this.taskRepository.creator(id);
  }

  @get('/tasks/{id}/assignee', {
    responses: {
      '200': {
        description: 'Assignee of Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async getAssignee(
    @param.path.string('id') id: typeof Task.prototype.id,
  ): Promise<User> {
    return this.taskRepository.assignee(id);
  }
}
