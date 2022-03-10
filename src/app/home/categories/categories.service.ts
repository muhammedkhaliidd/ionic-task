import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

export interface Product {
  id: string;
  name: string;
  price: string;
  productImg: string;
  weight: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private products = new BehaviorSubject<Product[]>([]);

  constructor(private http: HttpClient) {}

  getProducts() {
    return this.products.asObservable();
  }

  fetchCategories() {
    return this.http.get(
      'https://5bcce576cf2e850013874767.mockapi.io/task/categories'
    );
  }

  fetchCatProducts(name: string) {
    let products: Product[] = [];
    let catImage: string;
    return this.getProducts().pipe(
      take(1),
      switchMap((productsData) =>
        this.http.get(
          'https://5bcce576cf2e850013874767.mockapi.io/task/categories'
        )
      ),
      map((resData) => {
        for (const cate in resData) {
          if (resData[cate].name === name) {
            products = resData[cate].products;
            catImage = resData[cate].category_img;
          }
        }
        return { products, catImage };
      }),
      tap((productsRes) => {
        this.products.next(productsRes.products);
      })
    );
  }

  fetchProduct(category: string, id: string) {
    let products: any;
    let product: any;
    return this.http
      .get('https://5bcce576cf2e850013874767.mockapi.io/task/categories')
      .pipe(
        map((resData) => {
          for (const cate in resData) {
            if (resData[cate].name === category) {
              products = resData[cate].products;
              for (const prod in products) {
                if (products[prod].id === id) {
                  product = products[prod];
                  return product;
                }
              }
            }
          }
        })
      );
  }

  fetchSomeProduct(cart: { category: string; id: string }[]) {
    const cartArray = cart;
    const fetchedCartProducts: Product[] = [];
    return this.http
      .get('https://5bcce576cf2e850013874767.mockapi.io/task/categories')
      .pipe(
        map((resData) => {
          // eslint-disable-next-line guard-for-in
          for (const cartItem in cartArray) {
            for (const cate in resData) {
              if (resData[cate].name === cartArray[cartItem].category) {
                const products = resData[cate].products;
                for (const prod in products) {
                  if (products[prod].id === cartArray[cartItem].id) {
                    const product = products[prod];
                    fetchedCartProducts.push({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      productImg: product.product_img,
                      weight: product.weight,
                    });
                  }
                }
              }
            }
          }
          return fetchedCartProducts;
        })
      );
  }
}
