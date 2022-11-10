import {
    repository,
  } from '@loopback/repository';
  import {inject} from '@loopback/core';
  import {
    post,
    getModelSchemaRef,
    requestBody,
  } from '@loopback/rest';
  import * as _ from 'lodash';
  import {
    PasswordHasherBindings,
    TokenServiceBindings,
    UserServiceBindings,
  } from '../keys';
  import {User} from '../models';
  import {
    Credentials,
    UserRepository,
  } from '../repositories';
  import {validateCredentials, JWTService, MyUserService, BcryptHasher} from '../services';
  import {CredentialsRequestBody} from '../types/credential-schema';
  
  export class AuthController {
    constructor(
      @repository(UserRepository)
      public userRepository: UserRepository,
      @inject(PasswordHasherBindings.PASSWORD_HASHER)
      public hasher: BcryptHasher,
      @inject(UserServiceBindings.USER_SERVICE)
      public userService: MyUserService,
      @inject(TokenServiceBindings.TOKEN_SERVICE)
      public jwtService: JWTService,
    ) {}
  
    @post('/sign-up', {
      responses: {
        '200': {
          description: 'Sign up a new user',
          content: {'application/json': {schema: getModelSchemaRef(User)}},
        },
      },
    })
    async signup(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(User, {
              title: 'NewUser',
              exclude: ['id'],
            }),
          },
        },
      })
      userData: Omit<User, 'id'>,
    ) {
      await validateCredentials(
        _.pick(userData, ['email', 'password']),
        this.userRepository,
      );
      userData.password = await this.hasher.hashPassword(userData.password);
      const savedUser = await this.userRepository.create(userData);
      return _.omit(savedUser, 'password');
    }
  
    @post('/log-in', {
      responses: {
        '200': {
          description: 'Token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    })
    async login(
      @requestBody(CredentialsRequestBody) credentials: Credentials,
    ): Promise<{token: string}> {
      const user = await this.userService.verifyCredentials(credentials);
      const userProfile = await this.userService.convertToUserProfile(user);
      const token = await this.jwtService.generateToken(userProfile);
      return Promise.resolve({token});
    }
  
  }