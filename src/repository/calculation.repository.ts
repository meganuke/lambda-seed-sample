import {Repository} from './repository';

export class CalculationRepository extends Repository {
  readonly table = 'public.calculation';
  readonly selectable = ['id', 'operation', 'operands', 'result', 'created_at'];
  readonly fillable = ['operation', 'operands', 'result', 'created_at'];
}
