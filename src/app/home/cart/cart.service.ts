import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { BehaviorSubject, from } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { CategoriesService, Product } from '../categories/categories.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cart = new BehaviorSubject<Product[]>([]);

  constructor(private catService: CategoriesService) {}
  getCart() {
    return this.cart.asObservable();
  }

  getNumberOfProducts() {
    return this.getCart().pipe(
      take(1),
      map((cart) => {
        if (cart) {
          return cart.length;
        } else {
          return 0;
        }
      })
    );
  }

  autoFetchCart() {
    let cartData: Product[];
    return from(Storage.get({ key: 'cartItems' })).pipe(
      switchMap((cartItemsData) => {
        if (!cartItemsData || !cartItemsData.value) {
          throw new Error('There is no Cart Data in Storage');
        } else {
          const cartItems = JSON.parse(cartItemsData.value);
          // const cartItem = cartItems.value;
          return this.catService.fetchSomeProduct(cartItems);
        }
      }),
      map((fetchedData) => {
        cartData = fetchedData;
        return cartData;
      }),
      tap((cart) => {
        this.cart.next(cart);
      }),
      map((cart) => cart)
    );
  }

  addItemToCard(newProduct: Product) {
    let exist = false;
    let newCart: Product[];
    return this.getCart().pipe(
      take(1),
      map((cart) => {
        for (const item in cart) {
          if (cart[item].id === newProduct.id) {
            exist = true;
          }
        }

        if (!exist) {
          newCart = [
            ...cart,
            {
              id: newProduct.id,
              name: newProduct.name,
              price: newProduct.price,
              productImg: newProduct.productImg,
              weight: newProduct.weight,
            },
          ];
        } else {
          newCart = [...cart];
        }
        return newCart;
      }),
      tap((cartUpdated) => {
        this.cart.next(cartUpdated);
      })
    );
  }

  removeItemFromCard(id: string) {
    return this.getCart().pipe(
      take(1),
      map((cart) => {
        const prevCart = cart.filter((product) => product.id !== id);
        return prevCart;
      }),
      tap((prevCart) => {
        this.cart.next(prevCart);
      })
    );
  }
}
