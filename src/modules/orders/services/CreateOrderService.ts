import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

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
    const findCustomer = await this.customersRepository.findById(customer_id);

    if (!findCustomer) {
      throw new AppError('Costumer does not exists');
    }

    const findProducts = await this.productsRepository.findAllById(products);

    if (!findProducts || products.length !== findProducts.length) {
      throw new AppError('One or more of products do not exist');
    }

    // const parsedFindProducts = findProducts.map(product => ({
    //   product_id: product.id,
    //   price: product.price,
    //   stockAmount: product.quantity,
    // }));

    const productList = products.map(product => {
      const productData = findProducts.filter(item => item.id === product.id);
      const { price, quantity, name } = productData[0];

      if (product.quantity > quantity) {
        throw new AppError(`Quantity of ${name} exceeds the stock limit`);
      }

      const changedProduct = {
        product_id: product.id,
        price,
        quantity: product.quantity,
      };

      return changedProduct;
    });

    const order = await this.ordersRepository.create({
      customer: findCustomer,
      products: productList,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
