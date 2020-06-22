import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });
    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const allProducts = await this.ormRepository.findByIds(products);

    return allProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productList = await this.ormRepository.findByIds(products);
    const changedProductList = productList.map(item => {
      const quantities = products.filter(quantity => item.id === quantity.id);
      const { quantity } = quantities[0];
      return {
        ...item,
        quantity: item.quantity - quantity,
      };
    });

    await this.ormRepository.save(changedProductList);

    return changedProductList;
  }
}

export default ProductsRepository;
