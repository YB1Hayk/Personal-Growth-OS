import { LeadsRepository } from './leads.repository';
import { CreateLeadInput } from './leads.schema';

export class LeadsService {
  private repository: LeadsRepository;

  constructor() {
    this.repository = new LeadsRepository();
  }

  async createLead(data: CreateLeadInput) {
    return this.repository.create(data);
  }

  async getLeadsByProject(projectId: string) {
    return this.repository.findAllByProject(projectId);
  }

  async updateLead(id: string, data: any) {
    return this.repository.update(id, data);
  }
}
