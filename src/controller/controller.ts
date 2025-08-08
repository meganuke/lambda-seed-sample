import {
  ApiType,
  ControllerError,
  Response,
  ResponseBody,
} from '../model/api.model';

export class Controller {
  createSuccessResponse(body: ResponseBody<ApiType>): Response<ApiType> {
    const responseBody: ResponseBody<ApiType> = {
      ...body,
    };
    return this.createResponse(responseBody, 200);
  }

  createCreatedResponse(data: ResponseBody<ApiType>): Response<ApiType> {
    const responseBody: ResponseBody<ApiType> = {
      ...data,
    };
    return this.createResponse(responseBody, 201);
  }

  createNotFoundResponse(): Response<ApiType> {
    const responseBody: ResponseBody<ApiType> = {
      data: 'Not Found',
    };
    return this.createResponse(responseBody, 404);
  }

  createErrorResponse(error = '500'): Response<ApiType> {
    const responseBody: ResponseBody<ApiType> = {
      data: error,
    };
    return this.createResponse(responseBody, 500);
  }

  createEmptyResponse(): Response<ApiType> {
    const responseBody: ResponseBody<ApiType> = {
      data: null,
    };
    return this.createResponse(responseBody, 204);
  }

  createMalformedResponse(
    statusCode = 400,
    errorMsgs: string[] = [],
  ): Response<ApiType> {
    const responseBody: ResponseBody<ApiType> = {
      data: errorMsgs,
    };
    return this.createResponse(responseBody, statusCode);
  }

  createFailureReponse(error: ControllerError): Response<ApiType> {
    return this.createResponse({data: error.message}, error.statusCode);
  }

  createForbiddenResponse(): Response<ApiType> {
    return this.createResponse({data: 'Forbidden'}, 403);
  }

  createUnauthorizedResponse(): Response<ApiType> {
    return this.createResponse({data: 'Unauthorized'}, 401);
  }

  createResponse(
    body: ResponseBody<ApiType>,
    statusCode: number,
  ): Response<ApiType> {
    const response: Response<ApiType> = {
      statusCode: statusCode,
      body: JSON.stringify(body),
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
      },
    };
    return response;
  }
}
