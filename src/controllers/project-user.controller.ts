import { authenticate } from '@loopback/authentication';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  post,
} from '@loopback/rest';
import {Project, ProjectUser, User} from '../models';
import {ProjectRepository, ProjectUserRepository} from '../repositories';
@authenticate('jwt')
export class ProjectUserController {
  constructor(
    @repository(ProjectUserRepository)
    public projectUserRepository : ProjectUserRepository,
    @repository(ProjectRepository)
    public projectRepository : ProjectRepository,
  ) {}

  @get('/project-users/count')
  @response(200, {
    description: 'ProjectUser model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(ProjectUser) where?: Where<ProjectUser>,
  ): Promise<Count> {
    return this.projectUserRepository.count(where);
  }

  @get('/project-users')
  @response(200, {
    description: 'Array of ProjectUser model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ProjectUser, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(ProjectUser) filter?: Filter<ProjectUser>,
  ): Promise<ProjectUser[]> {
    return this.projectUserRepository.find(filter);
  }

  @get('/project-users/{id}')
  @response(200, {
    description: 'ProjectUser model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ProjectUser, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(ProjectUser, {exclude: 'where'}) filter?: FilterExcludingWhere<ProjectUser>
  ): Promise<ProjectUser> {
    return this.projectUserRepository.findById(id, filter);
  }

  @post('/project-users')
  @response(200, {
    description: 'ProjectUser model instance',
    content: {'application/json': {schema: getModelSchemaRef(ProjectUser)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {
            title: 'NewProjectUser',
            exclude: ['id'],
          }),
        },
      },
    })
    projectUser: Omit<ProjectUser, 'id'>,
  ): Promise<ProjectUser> {
    return this.projectUserRepository.create(projectUser);
  }
  
  @patch('/project-users/{id}')
  @response(204, {
    description: 'ProjectUser PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {partial: true}),
        },
      },
    })
    projectUser: ProjectUser,
  ): Promise<void> {
    await this.projectUserRepository.updateById(id, projectUser);
  }

  @put('/project-users/{id}')
  @response(204, {
    description: 'ProjectUser PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() projectUser: ProjectUser,
  ): Promise<void> {
    await this.projectUserRepository.replaceById(id, projectUser);
  }

  @del('/project-users/{id}')
  @response(204, {
    description: 'ProjectUser DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.projectUserRepository.deleteById(id);
  }
  @get('/projects/{id}/creator', {
    responses: {
      '200': {
        description: 'Creator of to Project',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async getUser(
    @param.path.string('id') id: typeof Project.prototype.id,
  ): Promise<User> {
    return this.projectRepository.creator(id);
  }
}
