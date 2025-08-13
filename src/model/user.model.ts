// this is the basic cognito-connected user, // it can be extended with additional properties as needed

import {SimplifiedPersonName} from './api.model';

export interface User {
  id?: string;
  username: string;
  name?: SimplifiedPersonName;
  email?: string;
  enabled?: boolean;
}
