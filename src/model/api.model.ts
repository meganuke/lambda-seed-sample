import {Calculation} from './calculation.model';

interface ResponseHeaders {
  'Access-Control-Allow-Headers': '*';
  'Access-Control-Allow-Origin': '*';
  'Access-Control-Allow-Methods': '*';
}

export interface ResponseBody<T> {
  data: T;
  metadata?: {
    total_items: number;
    items_per_page?: number;
    current_page?: number;
    total_pages?: number;
  };
  links?: {
    self: string;
    next: string;
    prev: string;
    first: string;
    last: string;
  };
}

export interface Response<T> {
  statusCode: number;
  body: string | undefined;
  headers: ResponseHeaders;
}

export interface DataFilter {
  name: string;
  operator?: string;
  value: any;
  condition?: string;
}

export interface SortField {
  field: string;
  direction?: 'ASC' | 'DESC';
}

export interface QueryParameters {
  //page?: number;
  //limit?: number;
  offset?: number;
  page_size?: number;
  filters?: DataFilter[];
  string_filters?: string[]; // because of the way the API Gateway maps query parameters
  order_bys?: SortField[];
  string_order_bys?: string[]; // because of the way the API Gateway maps query parameters
}

export interface ControllerError {
  statusCode: number;
  message: string;
}

export type ApiType =
  | null
  | string
  | string[]
  | boolean
  | number
  | number[]
  | Calculation
  | Calculation[];
