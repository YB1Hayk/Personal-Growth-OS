import { ProjectsRepository } from './projects.repository';
import { CreateProjectInput, UpdateProjectInput } from './projects.schema';

export class ProjectsService {
  private repository: ProjectsRepository;

  constructor() {
    this.repository = new ProjectsRepository();
  }

  async createProject(data: CreateProjectInput) {
    return this.repository.create(data);
  }

  async updateProject(id: string, data: UpdateProjectInput) {
    return this.repository.update(id, data);
  }

  async getAllProjects() {
    return this.repository.findAll();
  }
}
