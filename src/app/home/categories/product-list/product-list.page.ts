import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Storage } from '@capacitor/storage';
import {
  ActionSheetController,
  LoadingController,
  NavController,
  NavParams,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CartService } from '../../cart/cart.service';

import { CategoriesService, Product } from '../categories.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.page.html',
  styleUrls: ['./product-list.page.scss'],
})
export class ProductListPage implements OnInit, OnDestroy {
  isProductsLoading = false;
  cateName: string;
  products = [];
  catImage: string;

  cartNumberOfProducts = 0;

  cart: Product[];

  isProductActive = false;
  iconName = {
    active: 'checkmark-outline',
    notActive: 'add-outline',
  };
  private getCartNumSub: Subscription;
  private fetchProductsSub: Subscription;
  private addSub: Subscription;
  private removeItemFromSub: Subscription;

  constructor(
    private catService: CategoriesService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private cartService: CartService,
    private actionSheetCtrl: ActionSheetController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.isProductsLoading = true;
    this.cateName = this.activatedRoute.snapshot.paramMap.get('cateName');
    if (!this.cateName) {
      return;
    } else {
      this.fetchProductsSub = this.catService
        .fetchCatProducts(this.cateName)
        .subscribe((resData) => {
          this.products = resData.products;
          this.catImage = resData.catImage;
          this.isProductsLoading = false;
        });
    }
  }

  ionViewWillEnter() {
    this.cartService.autoFetchCart().subscribe((cartProducts) => {
      this.cart = cartProducts;
      this.getCartNumSub = this.cartService
        .getNumberOfProducts()
        .subscribe((lengthNumber) => {
          this.cartNumberOfProducts = lengthNumber;
        });
    });
  }

  addToCart(event: any, product: Product) {
    if (!event.target.classList.contains('active')) {
      event.target.classList.add('active');
      event.target.children[0].setAttribute('name', this.iconName.active);
      this.addSub = this.cartService
        .addItemToCard(product)
        .subscribe((cartLength) => {
          const newProduct = { category: this.cateName, id: product.id };
          Storage.get({ key: 'cartItems' }).then((resData) => {
            if (!resData || !resData.value) {
              Storage.set({
                key: 'cartItems',
                value: JSON.stringify([newProduct]),
              });
            } else {
              const oldCartStorage = JSON.parse(resData.value);
              let exist = false;
              for (const item in oldCartStorage) {
                if (oldCartStorage[item].id === product.id) {
                  exist = true;
                }
              }
              if (!exist) {
                const newCart = oldCartStorage.concat(newProduct);
                Storage.set({
                  key: 'cartItems',
                  value: JSON.stringify(newCart),
                });
              }
            }
          });

          this.getCartNumSub = this.cartService
            .getNumberOfProducts()
            .subscribe((lengthNumber) => {
              this.cartNumberOfProducts = lengthNumber;
            });
        });
    } else {
      event.target.classList.remove('active');
      event.target.children[0].setAttribute('name', this.iconName.notActive);
      this.loadingCtrl
        .create({
          message: 'Cancelling your Product..',
        })
        .then((loadingEl) => {
          loadingEl.present();
          this.removeItemFromSub = this.cartService
            .removeItemFromCard(product.id)
            .subscribe((cartData) => {
              loadingEl.dismiss();
              Storage.get({ key: 'cartItems' }).then((resData) => {
                if (!resData || !resData.value) {
                  return;
                } else {
                  const oldCartStorage = JSON.parse(resData.value);
                  const newArray = oldCartStorage.filter(
                    (item: any) => item.id !== product.id
                  );
                  Storage.set({
                    key: 'cartItems',
                    value: JSON.stringify(newArray),
                  });
                }
              });
              this.getCartNumSub = this.cartService
                .getNumberOfProducts()
                .subscribe((lengthNumber) => {
                  this.cartNumberOfProducts = lengthNumber;
                });
            });
        });
    }

    // else {
    //   event.target.classList.add('active');
    //   event.target.children[0].setAttribute('name', this.iconName.active);
    //   this.cartService.addItemToCard(product).subscribe((cartLength) => {
    //     this.cartNumberOfProducts = cartLength;
    //   });
    // }
  }

  opanProduct(cateName: string, id: string) {
    this.navCtrl.navigateForward(`/home/categories/${cateName}/${id}`);
  }

  onSortBy() {
    this.actionSheetCtrl
      .create({
        header: 'Order By',
        buttons: [
          {
            text: 'Ascending',
            handler: () => {
              const oldProducts = this.products;

              oldProducts.sort(
                (a, b) => parseFloat(a.price) - parseFloat(b.price)
              );
              this.products = oldProducts;
            },
          },
          {
            text: 'Descending',
            handler: () => {
              const oldProducts = this.products;

              oldProducts.sort(
                (a, b) => parseFloat(a.price) - parseFloat(b.price)
              );
              oldProducts.reverse();
              this.products = oldProducts;
            },
          },

          {
            text: 'Cancel',

            role: 'cancel',
          },
        ],
      })
      .then((actionSheetEl) => {
        actionSheetEl.present();
      });
  }
  onFilter() {}

  ngOnDestroy(): void {
    if (this.getCartNumSub) {
      this.getCartNumSub.unsubscribe();
    }
    if (this.fetchProductsSub) {
      this.fetchProductsSub.unsubscribe();
    }
    if (this.addSub) {
      this.addSub.unsubscribe();
    }
    if (this.removeItemFromSub) {
      this.removeItemFromSub.unsubscribe();
    }
  }

  checkId(id: string) {
    const cart = this.cart;
    let status = false;
    for (const item in cart) {
      if (cart[item].id === id) {
        status = true;
      }
    }
    return status;
  }
}
