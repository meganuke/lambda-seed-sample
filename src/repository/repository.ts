import {Client} from 'pg';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {DataFilter, QueryParameters} from '../model/api.model';

type Credentials = {
  password: string;
  user: string;
  host: string;
  port: number;
  database: string;
  ssl?: boolean | {rejectUnauthorized: boolean; ca?: string};
};

export class Repository {
  readonly table: string = '';
  readonly fillable: string[] = [];
  readonly selectable: string[] = [];
  readonly softDelete: boolean = false; // if is true system will not remove the record on delete. System only set deleted attribute to true.
  pk = 'id'; // by default all primary keys should be id
  credentials: Credentials;

  constructor() {
    const types = require('pg').types;
    types.setTypeParser(20, function (val: any) {
      return parseInt(val, 10);
    });

    this.credentials = {
      password: '',
      user: '',
      host: '',
      port: 5432,
      database: '',
      ssl: {rejectUnauthorized: false},
    };
  }

  async fetchCredentials(): Promise<Credentials> {
    if (process.env.USE_SECRETS_MANAGER === 'false') {
      const credentials = {
        password: process.env.PGPASSWORD || '',
        user: process.env.PGUSER || '',
        host: process.env.PGHOST || '',
        port: parseInt(process.env.PGPORT ?? '5432'),
        database: process.env.PGDATABASE || '',
        ssl: false,
      };
      return Promise.resolve(credentials);
    }
    try {
      const secretName = 'core/database/credentials';

      const secretsManagerClient = new SecretsManagerClient({
        region: process.env.AWS_REGION,
      });
      const command = new GetSecretValueCommand({SecretId: secretName});
      const response = await secretsManagerClient.send(command);

      if (response.SecretString) {
        const parsedSecret = JSON.parse(response.SecretString);

        const credentials: Credentials = {
          password: parsedSecret.password,
          user: parsedSecret.user,
          host: parsedSecret.host,
          port: parsedSecret.port,
          database: parsedSecret.database,
          ssl: {rejectUnauthorized: false},
        };

        return Promise.resolve(credentials);
      } else {
        // Handle the case where the secret is binary

        const sb = response.SecretBinary;
        console.error('secret is binary');
        return Promise.reject('secret is binary');
      }
    } catch (error) {
      console.error(`Error retrieving secret: `, error);
      return Promise.reject(error);
    }
  }

  async query(query: string, parameters?: any[]): Promise<any> {
    if (this.table == '') {
      throw new Error('No table specified');
    }

    try {
      if (this.credentials.password === '') {
        this.credentials = await this.fetchCredentials();
      }

      const connection = new Client({
        user: this.credentials.user,
        password: this.credentials.password,
        host: this.credentials.host,
        port: this.credentials.port,
        database: this.credentials.database,
        ssl: this.credentials.ssl,
      });
      connection.connect();

      return connection
        .query(query, parameters)
        .then(result => {
          //console.log('Query executed with result: ', result.rows);
          connection.end();
          return Promise.resolve(result);
        })
        .catch(e => {
          console.error('Error in DB query', e);
          connection.end();
          throw new Error('DB Error'); // for aws Alarms
        });
    } catch (error) {
      console.log(error);
      console.log('make sure you have set .env variables');
      return Promise.reject(error);
    }
  }

  /**
   * find all
   * @param fields
   */
  async findAll(fields: string[] = ['*']): Promise<any> {
    const sql = `SELECT ${fields.join()} FROM ${this.table}`;
    return this.query(sql)
      .then(res => {
        return Promise.resolve(res.rows);
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }

  /**
   * Find by paratemers with pagination
   */
  async find(
    params: QueryParameters,
    fields: string[] = ['*'],
  ): Promise<any[]> {
    let where: string[] = [];
    let values: string[] = [];

    const extras = this.getPagingStatement(params);
    [where, values] = this.getWhereAndValue(params);
    const orderByStatement = this.getOrderString(params);

    let sql = `SELECT ${fields.join(', ')} FROM ${this.table}`;
    if (where.length > 0) {
      sql += ` WHERE ${where.join(' and ')}`;
    }
    sql += orderByStatement;
    sql += extras;

    return this.query(sql, values)
      .then(res => {
        return Promise.resolve(res.rows);
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }

  /**
   *   Converts the filter array's values to string of where conditions with placeholders and
   a string array of values to replace the placeholders.
   * @param fromParams => QueryParams to provide .filters to work with
   * @returns [where, values] => list of where conditions and a list of values for these conditions
   * @protected
   */
  protected getWhereAndValue(
    fromParams: QueryParameters,
  ): [where: string[], values: string[]] {
    const where: string[] = [];
    const values: string[] = [];
    if (fromParams.filters) {
      let i = 1;
      let includeDeleted: boolean = false;
      for (const filter of fromParams.filters) {
        // const jsonFilter = JSON.parse(filter);

        if (filter.condition === 'includeDeleted') {
          if (filter.value === true || filter.value === 'true') {
            includeDeleted = true;
          }
        } else {
          const [w, v] = this.resolveWhereAndValue(filter, i);
          where.push(w);
          if (v) {
            values.push(v);
            i++;
          }
        }
      }
      if (this.softDelete && !includeDeleted) {
        where.push(`${this.table}.deleted = $${i++}`);
        values.push('false');
      }
    }

    return [where, values];
  }

  protected resolveWhereAndValue(
    filter: DataFilter,
    i: number,
  ): [where: string, values: string] {
    let where: string = '';
    let value: string = '';
    let field: string = filter.name!;
    let table: string = this.table;

    if (field.includes('.')) {
      const fieldSubstrings = field.split('.');
      field = fieldSubstrings[1];
    }
    if (filter.condition) {
      if (filter.condition === 'isNull') {
        where = `${table}.${field} is null`;
      } else if (filter.condition === 'isNotNull') {
        where = `${table}.${field} is not null`;
      } else if (filter.condition === 'in') {
        where = `${table}.${field} = ANY ($${i})`;
        value = filter.value as string;
      } else if (filter.condition === 'notIn') {
        where = `NOT ${table}.${field} = ANY ($${i})`;
        value = filter.value as string;
      } else if (
        filter.condition === 'like' ||
        filter.condition === 'contains'
      ) {
        where = `${table}.${field} LIKE $${i}`;
        value = '%' + filter.value + '%';
      } else if (filter.condition === 'iLike') {
        where = `${table}.${field} ILIKE $${i}`;
        value = '%' + filter.value + '%';
      } else if (filter.condition === 'anyOfAny') {
        let conditionString = '(';
        for (const v of filter.value as string) {
          conditionString += `$${i++} = ANY (${table}.${field}) OR `;
          value = v;
        }
        where = conditionString.substring(0, conditionString.length - 4) + ')';
      } else {
        where = `${table}.${field} ${filter.condition} $${i}`;
        value = filter.value as string;
      }
    } else {
      where = `${table}.${field} = $${i}`;
      value = filter.value as string;
    }
    return [where, value];
  }

  /**
   * Creates a simple SQL offset and limit statement
   * @param fromParams to provide the offset and page_size values for the statement
   * @protected
   */
  protected getPagingStatement(fromParams: QueryParameters): string {
    let resultOffset = '';
    let resultLimit = '';
    let result = '';

    if (fromParams) {
      if (fromParams.offset) {
        resultOffset = ` OFFSET ${fromParams.offset ?? 0} `;
        result += resultOffset;
      }

      if (fromParams.page_size) {
        resultLimit = ` LIMIT ${fromParams.page_size ?? 500}`;
        result += resultLimit;
      }
    }

    return result;
  }

  /**
   * Converts the params.orderBys to one SQL order by statement
   * @param fromParams => to provide .orderBys to work with
   * @protected
   */
  protected getOrderString(fromParams: QueryParameters): string {
    let result = '';
    const orderByParts = [];
    if (fromParams && fromParams.order_bys) {
      for (const orderBy of fromParams.order_bys ?? []) {
        let field: string = orderBy.field;
        let table: string = this.table;
        if (field.includes('.')) {
          const fieldSubstrings = field.split('.');
          table = 'public.' + fieldSubstrings[0];
          field = fieldSubstrings[1];
        } else if (field.includes(':')) {
          const fieldSubstrings = field.split(':');
          field = fieldSubstrings[1];

          if (field) {
            orderByParts.push(`${field} ${orderBy.direction ?? 'ASC'}`);
            field = '';
          }
        }

        if (field && field !== '') {
          orderByParts.push(`${table}.${field} ${orderBy.direction ?? 'ASC'}`);
        }
      }
      if (orderByParts.length > 0) {
        result = ` ORDER BY ${orderByParts.join(', ')}`;
      }
    }
    return result;
  }

  /**
   * find one
   * @param id
   * @param fields
   */
  async findOne(id: any, fields: string[] = ['*']): Promise<any> {
    const sql = `SELECT ${fields.join()} FROM ${this.table}  WHERE '${this.pk} = $1`;

    return this.query(sql, [id])
      .then(res => {
        return Promise.resolve(res.rows[0]);
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }

  /**
   * count
   * @param params
   */
  async count(params: any): Promise<number> {
    let where: string[] = [];
    let values: string[] = [];

    [where, values] = this.getWhereAndValue(params);

    let sql = `SELECT count( ${this.pk} ) FROM ${this.table}`;

    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' and ');
    }

    return this.query(sql, values)
      .then(res => {
        return Promise.resolve(parseInt(res.rows[0].count));
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }

  /**
   * Create
   * @param params
   */
  async create(params: any): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];

    let i = 1;
    for (const field of Object.keys(params)) {
      if (this.fillable.indexOf(field) < 0) {
        console.log(field + ' field is not in the fillable list, skipping it.');
        continue;
        //throw new Error(field + ' field is not in the fillable list');
      }
      fields.push(field);
      values.push(params[field]);
      placeholders.push('$' + i);
      i++;
    }

    const sql = `INSERT INTO '${this.table} (${fields.join()}) VALUES (${placeholders.join()}) RETURNING *`;

    return this.query(sql, values)
      .then(res => {
        return Promise.resolve(res.rows[0]);
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }

  /**
   * Update
   * @param key
   * @param params
   */
  async update(key: any, params: any): Promise<any> {
    const updateSet: string[] = [];
    const values: any[] = [key];

    let i = 2;
    for (const field of Object.keys(params)) {
      if (this.fillable.indexOf(field) < 0) {
        console.log(field + ' field is not in the fillable list, skipping it.');
        continue;
        //throw new Error(field + ' field is not in the fillable list');
      }
      updateSet.push(field + ' = $' + i + ' ');
      values.push(params[field]);
      i++;
    }

    const sql = `UPDATE ${this.table} SET ${updateSet.join()} WHERE ${this.pk} = $1 RETURNING *`;

    return this.query(sql, values)
      .then(res => {
        return Promise.resolve(res.rows[0]);
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }

  // @FIXME: not sure how this is working
  async delete(params: any): Promise<any> {
    const where = [];
    const values = [];
    let i = 1;

    for (const filter of Object.keys(params)) {
      where.push(`${filter} = $${i}`);
      values.push(params[filter]);
      i++;
    }

    if (where.length < 1) {
      throw new Error('no parameters in delete request');
    }

    const sql = this.softDelete
      ? `UPDATE ${this.table} SET deleted = true WHERE ${where.join(' and ')}`
      : `DELETE FROM ${this.table} WHERE ${where.join(' and ')}`;

    return this.query(sql, values)
      .then(res => {
        return Promise.resolve(res.rows[0]);
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }

  /**
   * @param key
   * @param field
   * @param value
   * @param isArray
   * @param type
   */
  async appendToField(
    key: any,
    field: string,
    value: any,
    isArray: boolean = true,
    type: string,
  ) {
    const sql =
      `UPDATE ${this.table} SET ${field} = ` + isArray
        ? `array_append(${field}, ${value}::${type})`
        : value + `WHERE ${this.pk} = ${key}`;

    return this.query(sql, [])
      .then(res => {
        return Promise.resolve(res.rows[0]);
      })
      .catch(e => {
        return Promise.reject(e.message);
      });
  }
}
