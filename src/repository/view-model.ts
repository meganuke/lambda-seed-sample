import {Repository} from './repository';

export class ViewModel extends Repository {
  async query(query: string, parameters?: any[]): Promise<any> {
    const uppedQuery = query.toUpperCase().slice(0, 6);
    if (
      uppedQuery === 'INSERT' ||
      uppedQuery === 'DELETE' ||
      uppedQuery === 'UPDATE'
    ) {
      throw new Error('Operation not Available for view models');
    }
    return super.query(query, parameters);
  }

  async create(params: any): Promise<any> {
    throw new Error('Operation not Available for view models');
  }

  async update(key: any, params: any): Promise<any> {
    throw new Error('Operation not Available for view models');
  }

  async delete(params: any): Promise<any> {
    throw new Error('Operation not Available for view models');
  }
}
