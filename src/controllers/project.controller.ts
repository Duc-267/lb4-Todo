import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/core';
import {
  AnyObject,
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import {Project, ProjectUser} from '../models';
import {ProjectRepository, ProjectUserRepository} from '../repositories';
import * as _ from 'lodash';
import { ERole } from '../constants';

@authenticate('jwt')
export class ProjectController {
  constructor(
    @repository(ProjectRepository)
    public projectRepository : ProjectRepository,
    @repository(ProjectUserRepository)
    public projectUserRepository : ProjectUserRepository,
  ) {}

  @post('/projects')
  @response(200, {
    description: 'Project model instance',
    content: {'application/json': {schema: getModelSchemaRef(Project)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {
            title: 'NewProject',
            exclude: ['id', 'createdAt', 'updatedAt', 'isDeleted', 'createdBy'],
          }),
        },
      },
    })
    project: Omit<Project, 'id'>,
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<void> {
    const userId = currentUser.id;
    _.set(project, 'createdBy', userId);
    const createdProject = await this.projectRepository.create(project)
    const projectId = createdProject.id;
    const projectUser  = {
      userId,
      projectId,
      role: ERole.ADMIN,
    };
    await this.projectUserRepository.create(projectUser);
  } 

  @get('/projects/count')
  @response(200, {
    description: 'Project model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Project) where?: Where<Project>,
  ): Promise<Count> {
    return this.projectRepository.count(where);
  }

  @get('/projects')
  @response(200, {
    description: 'Array of Project model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Project, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Project) filter?: Filter<Project>,
  ): Promise<Project[]> {
    return this.projectRepository.find(filter);
  }

  @patch('/projects')
  @response(200, {
    description: 'Project PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {partial: true}),
        },
      },
    })
    project: Project,
    @param.where(Project) where?: Where<Project>,
  ): Promise<Count> {
    return this.projectRepository.updateAll(project, where);
  }

  @get('/projects/{id}')
  @response(200, {
    description: 'Project model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Project, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Project, {exclude: 'where'}) filter?: FilterExcludingWhere<Project>
  ): Promise<Project> {
    return this.projectRepository.findById(id, filter);
  }

  @patch('/projects/{id}')
  @response(204, {
    description: 'Project PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {partial: true}),
        },
      },
    })
    project: Project,
  ): Promise<void> {
    await this.projectRepository.updateById(id, project);
  }

  @put('/projects/{id}')
  @response(204, {
    description: 'Project PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() project: Project,
  ): Promise<void> {
    await this.projectRepository.replaceById(id, project);
  }

  @del('/projects/{id}')
  @response(204, {
    description: 'Project DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.projectRepository.deleteById(id);
  }
}
