import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import {} from '@modules/products/dtos/ICreateProductDTO';
import OrdersProducts from '../infra/typeorm/entities/OrdersProducts';
import { connect } from 'net';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO

    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not exists.');
    }

    const produtosFind = await this.productsRepository.findAllById(products);

    if (produtosFind.length !== products.length) {
      throw new AppError('Producsts invalid.');
    }
    let invalidQuantity = false;
    produtosFind.forEach((product, index) => {
      if (products[index].quantity > product.quantity) {
        invalidQuantity = true;
      }
    });

    if (invalidQuantity) {
      throw new AppError('Producsts quantity is invalid.');
    }

    const productsFormatted = produtosFind.map((product, index) => {
      return {
        price: product.price,
        product_id: product.id,
        quantity: products[index].quantity,
      };
    });

    const orderSalved = await this.ordersRepository.create({
      customer,
      products: productsFormatted,
    });

    const { order_products } = orderSalved;

    const orderedProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        produtosFind.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return orderSalved;
  }
}

export default CreateOrderService;
