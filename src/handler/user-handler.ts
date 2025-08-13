import {Handler, APIGatewayProxyEvent} from 'aws-lambda';
import {UserRepository} from '../repository/user-repository';
import {CognitoService} from '../service/cognito-service';
import {UserController} from '../controller/user-controller';
import {QueryParameters} from '../model/api.model';
import {parseParameters} from '../util/parameters-parser';
import {getUserFromToken} from '../util/user-util';

const userRepository = new UserRepository();
const cognitoService = new CognitoService(process.env.COGNITO_POOL_ID ?? '');
const userController = new UserController(userRepository, cognitoService);

export const find: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const currentUser = getUserFromToken(event.headers.Authorization);
  if (!currentUser.id) {
    throw new Error('authorization token malformed');
  }

  const params: QueryParameters = parseParameters(event);
  return userController.find(params, currentUser);
};

export const findOne: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('Malformed request: missing path parameter "id"');
  }
  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const currentUser = getUserFromToken(event.headers.Authorization);
  if (!currentUser.id) {
    throw new Error('authorization token malformed');
  }

  const id = event.pathParameters?.id;
  const result = await userController.findOne(id, currentUser);
  return result;
};

export const create: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const currentUser = getUserFromToken(event.headers.Authorization);
  if (!currentUser.id) {
    throw new Error('authorization token malformed');
  }

  const createRequest = JSON.parse(event.body ?? '{}');
  const result = await userController.create(createRequest, currentUser);
  return result;
};

export const update: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('parameter not provided');
  }
  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const currentUser = getUserFromToken(event.headers.Authorization);
  if (!currentUser.id) {
    throw new Error('authorization token malformed');
  }

  const updateRequest = JSON.parse(event.body ?? '{}');
  const id = event.pathParameters?.id;

  const result = await userController.update(id, updateRequest, currentUser);
  return result;
};
/*
export const deleteUser: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('parameter not provided');
  }

  return userController.delete(event.pathParameters.id);
};*/

export const resetPassword: Handler = (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('parameter not provided');
  }
  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const currentUser = getUserFromToken(event.headers.Authorization);
  if (!currentUser.id) {
    throw new Error('authorization token malformed');
  }

  return userController.resetPassword(event.pathParameters.id, currentUser);
};

export const setPassword: Handler = (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('parameter not provided');
  }

  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const currentUser = getUserFromToken(event.headers.Authorization);
  if (!currentUser.id) {
    throw new Error('authorization token malformed');
  }

  const request = JSON.parse(event.body ?? '{}');
  return userController.setPassword(
    event.pathParameters.id,
    request.password,
    currentUser,
  );
};

export const forceUserLogout: Handler = async (event: APIGatewayProxyEvent) => {
  if (!event.pathParameters?.id) {
    throw new Error('parameter not provided');
  }
  if (!event.headers.Authorization) {
    throw new Error('missing authorization token');
  }
  const currentUser = getUserFromToken(event.headers.Authorization);
  if (!currentUser.id) {
    throw new Error('authorization token malformed');
  }
  return userController.forceLogout(event.pathParameters.id, currentUser);
};
