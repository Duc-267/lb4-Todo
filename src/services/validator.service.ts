import { HttpErrors } from '@loopback/rest';
import { Credentials, UserRepository } from '../repositories/user.repository';

export async function validateCredentials(credentials: Credentials, userRepository: UserRepository) {
  const regEx = /\S+@\S+\.\S+/;
  const foundUser = await userRepository.findOne({
    where: {
      email: credentials.email
    }
  });
  if (foundUser !== null) {
    throw new HttpErrors.UnprocessableEntity('this email already exists');
  }
  if (credentials.email.length < 8) {
    throw new HttpErrors.UnprocessableEntity('email length should be greater than 8')
  }
  if (credentials.password.length < 8) {
    throw new HttpErrors.UnprocessableEntity("passwordd length should be greater than 8")
  }
  if (!regEx.test(credentials.email)) {
    throw new HttpErrors.UnprocessableEntity('email is not valid')
  }
}

export async function validateEmail(email: string) {

}
