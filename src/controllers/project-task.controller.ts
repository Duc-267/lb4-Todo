import { Project } from './../models/project.model';
import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/core';
import {
  Filter,
  repository,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import { UserProfile} from '@loopback/security';
import {
  Task,
} from '../models';
import { ERole, EStatus } from '../constants';
import {TaskRepository, ProjectUserRepository, ProjectRepository} from '../repositories';
import { validateTask } from '../services';
import * as _ from 'lodash';

@authenticate('jwt')
export class ProjectTaskController {
  constructor(
    @repository(ProjectRepository) 
    protected projectRepository: ProjectRepository,
    @repository(TaskRepository)
    public taskRepository: TaskRepository,
    @repository(ProjectUserRepository)
    public projectUserRepository: ProjectUserRepository,
  ) { }

  @get('/projects/{projectId}/tasks', {
    responses: {
      '200': {
        description: 'Array of Project has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('projectId') projectId: string,
    @param.query.object('filter') filter?: Filter<Task>,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser?: UserProfile,
  ): Promise<Task[]> {
    const userId: string = currentUser?.id;
    filter = {
      where: {
        ...filter?.where,
        isDeleted: false,
      }
    }
    const tasks = await this.projectRepository.tasks(projectId).find(filter);
    if (!tasks.length) {
      throw new HttpErrors.NotFound('Tasks not found');
    }
    const userProject = await this.projectUserRepository.findOne({
      where: {
        userId,
        projectId,
      },
    });
    if (!userProject) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource');
    }
    return userProject?.role === ERole.ADMIN 
    ? tasks 
    : tasks.filter(task => task.createdBy == userId || task.asignedTo == userId || !task.isCreatedByAdmin);
  }

  @post('/projects/{projectId}/tasks', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(Task)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTask',
            exclude: ['id', 'projectId', 'status', 'createdAt', 'updatedAt', 'isDeleted','isCreatedByAdmin', 'createdBy'],
            optional: ['asignedTo', 'linkedTo']
          }),
        },
      },
    })
    @param.path.string('projectId') projectId: string,
    task: Omit<Task, 'id'>,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<Task> {
    const userId: string = currentUser?.id;
    const relations = await validateTask({
      projectId,
      userId,
      projectUserRepository: this.projectUserRepository,
      projectRepository: this.projectRepository,
      taskRepository: this.taskRepository,
      task
    });
    const newTask = {
      ...task,
      projectId,
      status: EStatus.TODO,
      isDeleted: false,
      isCreatedByAdmin: relations.userProject?.role === ERole.ADMIN,
      createdBy: userId,
    }
    return this.taskRepository.create(newTask);
  }

  @patch('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '204': {
        description: 'Project.Task PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {partial: true}),
        },
      },
    })
    task: Task,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<void> {
    const userId: string = currentUser?.id;
    const relations = await validateTask({
      projectId,
      userId,
      projectUserRepository: this.projectUserRepository,
      projectRepository: this.projectRepository,
      taskRepository: this.taskRepository,
      task: _.omit(task, ['id'])
    });
    if (task?.createdBy !== userId && task?.asignedTo !== userId && relations.userProject?.role !== ERole.ADMIN) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource');
    }
    const newTask = {
      ...task,
      updatedAt: new Date()
    }
    await this.taskRepository.updateById(taskId, newTask);
  }

  @get('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(Task, {includeRelations: true})}},
      },
    },
  })
  async findById(
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<Task> {
    const userId: string = currentUser?.id;
    const task = await this.taskRepository.findById(taskId);
    if (task.projectId !== projectId) {
      throw new HttpErrors.NotFound('Task not found in project');
    }
    if (task?.createdBy !== userId && task?.asignedTo !== userId) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource');
    }
    if (task.isDeleted) {
      throw new HttpErrors.NotFound('Task not found');
    }
    return task;
  }


  @put('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '204': {
        description: 'Project.Task PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {partial: true}),
          },
        },
      })
    task: Task,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<void> {
    const userId: string = currentUser?.id;
    const relations = await validateTask({
      projectId,
      userId,
      projectUserRepository: this.projectUserRepository,
      projectRepository: this.projectRepository,
      taskRepository: this.taskRepository,
      task: _.omit(task, ['id'])
    });
    if (task?.createdBy !== userId && task?.asignedTo !== userId && relations.userProject?.role !== ERole.ADMIN) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource');
    }
    const newTask = {
      ...task,
      updatedAt: new Date(),
      isDeleted: false
    }
    await this.taskRepository.replaceById(taskId, newTask);
  }

  @del('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '204': {
        description: 'Project.Task DELETE success',
        },
      },
    })
  async deleteById(
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<void> {
    const userId: string = currentUser?.id;
    const task = await this.taskRepository.findById(taskId);
    const relations = await validateTask({
      projectId,
      userId,
      projectUserRepository: this.projectUserRepository,
      projectRepository: this.projectRepository,
      taskRepository: this.taskRepository,
      task: _.omit(task, ['id'])
    });
    if (task?.createdBy !== userId && task?.asignedTo !== userId && relations.userProject?.role !== ERole.ADMIN) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource');
    }
    const newTask = {
      ...task,
      updatedAt: new Date(),
      isDeleted: true
    }
    await this.taskRepository.replaceById(taskId, newTask);
  }

  @del('/projects/{projectId}/tasks/{taskId}/force', {
    responses: {
      '204': {
        description: 'Project.Task FORCE DELETE success',
      },
    },
  })
  async forceDeleteById(
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<void> {
    const userId: string = currentUser?.id;
    const task = await this.taskRepository.findById(taskId);
    const relations = await validateTask({
      projectId,
      userId,
      projectUserRepository: this.projectUserRepository,
      projectRepository: this.projectRepository,
      taskRepository: this.taskRepository,
      task: _.omit(task, ['id'])
    });
    if (task?.createdBy !== userId && task?.asignedTo !== userId && relations.userProject?.role !== ERole.ADMIN) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource');
    }
    await this.taskRepository.deleteById(taskId);
  }
}

  
