import {Repository} from './repository';

export class UserRepository extends Repository {
  readonly table = 'public.user';
  readonly selectable = ['id', 'username', 'name', 'email', 'enabled'];
  readonly fillable = ['username', 'email', 'name', 'email', 'enabled'];
}
