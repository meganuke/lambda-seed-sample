import {APIGatewayProxyEvent} from 'aws-lambda';
import {QueryParameters} from '../model/api.model';

export const parseParameters = (
  event: APIGatewayProxyEvent,
): QueryParameters => {
  const queryParams: QueryParameters = {
    offset: event.queryStringParameters?.offset
      ? parseInt(event.queryStringParameters.offset, 10)
      : undefined,
    page_size: event.queryStringParameters?.page_size
      ? parseInt(event.queryStringParameters.page_size, 10)
      : undefined,
    filters: [],
    order_bys: [],
  };

  if (event.queryStringParameters?.string_filters) {
    queryParams.filters = event.queryStringParameters.string_filters
      .split(',')
      .map(filter => {
        return JSON.parse(filter);
      });
  }

  if (event.queryStringParameters?.string_order_bys) {
    queryParams.order_bys = event.queryStringParameters.string_order_bys
      .split(',')
      .map(orderBy => {
        return JSON.parse(orderBy);
      });
  }

  return queryParams;
};
