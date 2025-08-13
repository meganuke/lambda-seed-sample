import {User} from '../model/user.model';

export const getUserFromToken = (idToken: string): User => {
  const tokenSections = idToken.split('.');
  const tokenBody = Buffer.from(tokenSections[1], 'base64').toString('utf8');
  const tokenBodyJson = JSON.parse(tokenBody);

  const user: User = {
    id: tokenBodyJson['custom:uuid'],
    username: tokenBodyJson['username'],
  };

  return user;
};
