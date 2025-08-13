import {QueryParameters, ResponseBody, Response} from '../model/api.model';
import {User} from '../model/user.model';
import {UserRepository} from '../repository/user-repository';
import {CognitoService} from '../service/cognito-service';
import {Controller} from './controller';

export class UserController extends Controller {
  constructor(
    private userRepository: UserRepository,
    private cognitoService: CognitoService,
  ) {
    super();
  }

  async find(
    params: QueryParameters,
    currentUser: User,
  ): Promise<Response<User[]>> {
    // @TODO: Implement permissions check based on currentUser
    let records: User[] = [];
    let count = 0;
    const promises = [];

    promises.push(
      this.userRepository.find(params).then(res => {
        records = res;
      }),
    );
    promises.push(
      this.userRepository.count(params).then(res => {
        count = res;
      }),
    );

    return Promise.all(promises)
      .then(() => {
        const result: ResponseBody<User[]> = {
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

  async findOne(id: string, currentUser: User): Promise<Response<User>> {
    //@TODO: Implement permissions check based on currentUser
    return this.userRepository
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

  async create(
    createRequest: User,
    currentUser: User,
  ): Promise<Response<User>> {
    return this.userRepository
      .create(createRequest)
      .then(async (result: User) => {
        const cognitoResult = await this.cognitoService.createCognitoUser(
          result.username,
          result.email as string,
          result.id as string,
        );

        if (!cognitoResult) {
          await this.userRepository.delete({id: result.id});
          console.error('could not create cognito user');
          return this.createErrorResponse('could not create cognito user');
        }

        return this.createCreatedResponse({data: result});
      })
      .catch(err => {
        return this.createErrorResponse(err);
      });
  }

  async update(
    id: string,
    updateRequest: User,
    currentUser: User,
  ): Promise<Response<User>> {
    //@TODO: Implement permissions check based on currentUser
    const user = await this.userRepository.findOne(id);
    if (!user) {
      return this.createNotFoundResponse();
    }

    return this.userRepository
      .update(id, updateRequest)
      .then(async (result: User) => {
        if (user.enabled !== updateRequest.enabled) {
          let cognitoResult;
          if (updateRequest.enabled === true) {
            console.info(`enabling user ${user.username}`);
            cognitoResult = await this.cognitoService.enableUser(
              result.username,
            );
          } else {
            console.info(`disabling user ${user.username}`);
            cognitoResult = await this.cognitoService.disableUser(
              result.username,
            );
          }
          if (!cognitoResult) {
            console.error('Error when enabling/disabling user');
            return this.createErrorResponse();
          }
        }
        return this.createSuccessResponse({data: result});
      })
      .catch(err => {
        return this.createErrorResponse(err);
      });
  }

  async setPassword(
    id: string,
    password: string,
    currentUser: User,
  ): Promise<Response<string>> {
    //@TODO: Implement permissions check based on currentUser
    const user = await this.userRepository.findOne(id);

    if (!user) {
      return this.createNotFoundResponse();
    }

    const cognitoResult = await this.cognitoService.setUserPassword(
      user.username,
      password,
    );

    if (cognitoResult) {
      return this.createSuccessResponse({data: 'Password Set'});
    } else {
      return this.createErrorResponse('could not set user password');
    }
  }

  async resetPassword(
    userId: string,
    currentUser: User,
  ): Promise<Response<string>> {
    //@TODO: Implement permissions check based on currentUser
    const user = await this.userRepository.findOne(userId);

    if (!user) {
      return this.createNotFoundResponse();
    }

    const cognitoResult = await this.cognitoService.resetUserPassword(
      user.username,
    );

    if (cognitoResult) {
      return this.createSuccessResponse({data: 'Password has been Reset'});
    } else {
      return this.createErrorResponse('could not reset user password');
    }
  }

  async forceLogout(
    userId: string,
    currentUser: User,
  ): Promise<Response<string>> {
    //@TODO: Implement permissions check based on currentUser
    const user = await this.userRepository.findOne(userId);

    if (!user) {
      return this.createNotFoundResponse();
    }

    const cognitoResult = await this.cognitoService.forceUserLogout(
      user.username,
    );

    if (cognitoResult) {
      return this.createSuccessResponse({data: 'User has been logged out'});
    } else {
      return this.createErrorResponse('could not log out user');
    }
  }
}
