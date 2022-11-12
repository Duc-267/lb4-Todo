import { HttpErrors } from '@loopback/rest';
import { ERole } from '../constants';
import { ProjectUser, Task, ProjectUserRelations, Project, ProjectRelations } from '../models';
import {ProjectUserRepository, ProjectRepository, TaskRepository} from '../repositories';

type ValidateTaskProps = {
    projectId: string, 
    userId: string, 
    projectUserRepository: ProjectUserRepository, 
    projectRepository: ProjectRepository, 
    taskRepository: TaskRepository,
    task: Omit<Task, 'id'>,
}

type ValidateTaskResult = {
    userProject: ProjectUser & ProjectUserRelations ,
    project: Project & ProjectRelations
}

export async function validateTask(props: ValidateTaskProps): Promise <ValidateTaskResult> {
    const {projectId, userId, projectUserRepository, projectRepository, taskRepository, task} = props;
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new HttpErrors.NotFound('Project not found');
    }
    const userProject = await projectUserRepository.findOne({
      where: {
        userId: userId,
        projectId: projectId,
      },
    });
    if (!userProject) {
      throw new HttpErrors.NotFound('User not found in project');
    }
    if (task?.asignedTo) {
      const userProject = await projectUserRepository.findOne({
        where: {
          userId: task?.asignedTo,
          projectId: projectId,
        },
      });
      if (!userProject) {
        throw new HttpErrors.NotFound('User not found in project');
      }
    }
    if(task?.linkedTo) {
      const linkedTask = await taskRepository.findById(task?.linkedTo);
      if (!linkedTask) {
        throw new HttpErrors.NotFound('Linked Task not found');
      }
      if (linkedTask.projectId !== projectId) {
        throw new HttpErrors.NotFound('Linked Task not found in project');
      }
    }
    if (userProject.role === ERole.USER && task?.asignedTo) {
        throw new HttpErrors.BadRequest('You can not assign a task to another user');
    }
    return {
        userProject,
        project,
    }
}