import {Handler, APIGatewayProxyEvent} from 'aws-lambda';
import {CalculationRepository} from '../repository/calculation.repository';
import {CalculationController} from '../controller/calculation.controller';
import {QueryParameters} from '../model/api.model';
import {parseParameters} from './parameters-parser';

const calculationRepository = new CalculationRepository();
const calculationController = new CalculationController(calculationRepository);

export const find: Handler = (event: APIGatewayProxyEvent) => {
  const params: QueryParameters = parseParameters(event);
  console.log(params);
  return calculationController.find(params);
};

export const findOne: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    //return calculationController.createdMalformedResponse(();
    throw new Error('Malformed request: missing path parameter "id"');
  }
  const id = event.pathParameters?.id;
  const result = await calculationController.findOne(id);
  return result;
};

export const create: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }

  const createRequest = JSON.parse(event.body ?? '{}');
  const result = await calculationController.create(createRequest);
  return result;
};

export const update: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('parameter not provided');
  }

  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const updateRequest = JSON.parse(event.body ?? '{}');
  const id = event.pathParameters?.id;

  const result = await calculationController.update(id, updateRequest);
  return result;
};

export const deleteCalculation: Handler = (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('parameter not provided');
  }

  return calculationController.delete(event.pathParameters.id);
};
