import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminResetUserPasswordCommand,
  AdminSetUserPasswordCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';

export class CognitoService {
  cognitoClient: CognitoIdentityProviderClient;
  poolId: string;

  constructor(poolId: string) {
    this.cognitoClient = new CognitoIdentityProviderClient();
    this.poolId = poolId;
  }

  async createCognitoUser(
    username: string,
    email: string,
    uuid: string,
  ): Promise<boolean> {
    try {
      const params = {
        UserPoolId: this.poolId,
        Username: username,
        UserAttributes: [
          {
            Name: 'custom:uuid',
            Value: uuid,
          },
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'name',
            Value: username,
          },
        ],
      };
      //let result = false;
      const command = new AdminCreateUserCommand(params);
      const user = await this.cognitoClient.send(command);
      console.log('cognito user created', user);

      const attributeParams = {
        UserPoolId: this.poolId,
        Username: username,
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
      };
      const attributeUpdatecommand = new AdminUpdateUserAttributesCommand(
        attributeParams,
      );
      await this.cognitoClient.send(attributeUpdatecommand);
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.resolve(false);
    }
  }

  async resetUserPassword(username: string): Promise<boolean> {
    const params = {
      UserPoolId: this.poolId,
      Username: username,
    };

    const command = new AdminResetUserPasswordCommand(params);
    return this.cognitoClient
      .send(command)
      .then(data => {
        console.log('password has been reset', data);
        return Promise.resolve(true);
      })
      .catch(error => {
        console.error('error reseting user password');
        console.error(error);
        return Promise.resolve(false);
      });
  }

  async setUserPassword(username: string, password: string): Promise<boolean> {
    const params = {
      UserPoolId: this.poolId,
      Username: username,
      Password: password,
      Permanent: true,
    };
    const command = new AdminSetUserPasswordCommand(params);
    return this.cognitoClient
      .send(command)
      .then(data => {
        console.log('password set', data);
        return Promise.resolve(true);
      })
      .catch(error => {
        console.error('error seting user password');
        console.error(error);
        return Promise.resolve(false);
      });
  }

  async disableUser(username: string): Promise<boolean> {
    const params = {
      UserPoolId: this.poolId,
      Username: username,
    };

    const command = new AdminDisableUserCommand(params);
    return this.cognitoClient
      .send(command)
      .then(data => {
        console.log('user disabled', data);
        return Promise.resolve(true);
      })
      .catch(error => {
        console.log('error disabling user');
        console.error(error);
        return Promise.resolve(false);
      });
  }

  async enableUser(username: string): Promise<boolean> {
    const params = {
      UserPoolId: this.poolId,
      Username: username,
    };

    const command = new AdminEnableUserCommand(params);
    return this.cognitoClient
      .send(command)
      .then(data => {
        console.log('user enabled', data);
        return Promise.resolve(true);
      })
      .catch(error => {
        console.log('error enabling user');
        console.error(error);
        return Promise.resolve(false);
      });
  }

  async forceUserLogout(username: string): Promise<boolean> {
    const params = {
      UserPoolId: this.poolId,
      Username: username,
    };

    const command = new AdminUserGlobalSignOutCommand(params);
    return this.cognitoClient
      .send(command)
      .then(data => {
        console.log('user logged out', data);
        return Promise.resolve(true);
      })
      .catch(error => {
        console.log('error forcing logout user');
        console.error(error);
        return Promise.resolve(false);
      });
  }
}
