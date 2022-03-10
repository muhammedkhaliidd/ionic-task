import { Component, OnDestroy, OnInit } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CategoriesService, Product } from '../categories/categories.service';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit, OnDestroy {
  isProductsLoading = false;
  products: Product[] = [];
  totalPrice = 0;

  getCartSub: Subscription;
  removeItemFromSub: Subscription;

  constructor(
    private cartService: CartService,
    private catService: CategoriesService,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.isProductsLoading = true;
    this.getCartSub = this.cartService.getCart().subscribe((cartProducts) => {
      if (cartProducts.length > 0) {
        this.products = cartProducts;
      }
      this.isProductsLoading = false;
    });
  }
  ionViewWillEnter() {
    this.cartService.autoFetchCart().subscribe((cartProducts) => {
      // eslint-disable-next-line guard-for-in
      for (const item in this.products) {
        this.totalPrice += this.convertPrice(this.products[item].price);
      }
    });
  }

  convertPrice(price: string) {
    return parseFloat(price.slice(0, -2));
  }

  onCancelProduct(id: string, slidingProduct: IonItemSliding) {
    this.loadingCtrl
      .create({
        message: 'Cancelling your Product..',
      })
      .then((loadingEl) => {
        loadingEl.present();
        this.removeItemFromSub = this.cartService
          .removeItemFromCard(id)
          .subscribe((cartData) => {
            slidingProduct.close();
            loadingEl.dismiss();
            this.products = cartData;
            Storage.get({ key: 'cartItems' }).then((resData) => {
              if (!resData || !resData.value) {
                return;
              } else {
                const oldCartStorage = JSON.parse(resData.value);
                const newArray = oldCartStorage.filter(
                  (item: any) => item.id !== id
                );

                Storage.set({
                  key: 'cartItems',
                  value: JSON.stringify(newArray),
                });
              }
            });
          });
      });
  }

  ngOnDestroy(): void {
    if (this.getCartSub) {
      this.getCartSub.unsubscribe();
    }
    if (this.removeItemFromSub) {
      this.removeItemFromSub.unsubscribe();
    }
  }
}
