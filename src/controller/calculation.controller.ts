import {
  ApiType,
  QueryParameters,
  Response,
  ResponseBody,
} from '../model/api.model';
import {Calculation} from '../model/calculation.model';
import {CalculationRepository} from '../repository/calculation.repository';
import {Controller} from './controller';

export class CalculationController extends Controller {
  constructor(private calculationRepository: CalculationRepository) {
    super();
  }

  async find(params: QueryParameters): Promise<Response<Calculation[]>> {
    let records: Calculation[] = [];
    let count = 0;
    const promises = [];

    promises.push(
      this.calculationRepository.find(params).then((res: Calculation[]) => {
        records = res;
      }),
    );

    promises.push(
      this.calculationRepository.count(params).then((res: number) => {
        count = res;
      }),
    );

    return Promise.all(promises)
      .then(() => {
        const result: ResponseBody<Calculation[]> = {
          data: records,
          metadata: {
            total_items: count,
          },
        };
        return this.createSuccessResponse(result);
      })
      .catch(err => {
        return this.createErrorResponse(err);
      });
  }

  async findOne(id: string): Promise<Response<Calculation>> {
    return this.calculationRepository
      .findOne(id)
      .then(result => {
        if (result) {
          return this.createSuccessResponse(result);
        } else {
          return this.createNotFoundResponse();
        }
      })
      .catch(err => {
        return this.createErrorResponse(err);
      });
  }

  async create(prod: Calculation): Promise<Response<Calculation>> {
    return this.calculationRepository
      .create(prod)
      .then(result => {
        return this.createCreatedResponse(result);
      })
      .catch(err => {
        return this.createErrorResponse(err);
      });
  }

  async update(
    id: string,
    calculation: Calculation,
  ): Promise<Response<Calculation>> {
    return this.calculationRepository
      .update(id, calculation)
      .then(result => {
        return this.createSuccessResponse(result);
      })
      .catch(err => {
        return this.createErrorResponse(err);
      });
  }

  async delete(id: string): Promise<Response<null>> {
    return this.calculationRepository
      .delete(id)
      .then(() => {
        return this.createEmptyResponse();
      })
      .catch(err => {
        return this.createErrorResponse(err);
      });
  }
}
