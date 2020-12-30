import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    // TODO
    const checkCustomersExists = await this.customersRepository.findByEmail(
      email,
    );

    if (checkCustomersExists) {
      throw new AppError('Email addres alredy used');
    }

    const custumer = await this.customersRepository.create({
      email,
      name,
    });
    return custumer;
  }
}

export default CreateCustomerService;
