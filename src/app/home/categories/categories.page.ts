import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CategoriesService } from './categories.service';

import { SwiperComponent } from 'swiper/angular';
// import Swiper core and required modules
import SwiperCore, { Pagination, SwiperOptions, Virtual } from 'swiper';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AuthService } from 'src/app/auth/auth.service';
import { InfoSliderService } from 'src/app/info-slider/info-slider.service';
import { CartService } from '../cart/cart.service';
import { Subscription } from 'rxjs';
// install Swiper modules
SwiperCore.use([Pagination, Virtual]);

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CategoriesPage implements OnInit, OnDestroy {
  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;
  isCategoriesLoading = false;
  isInfoSlidesLoading = false;

  config: SwiperOptions = {
    slidesPerView: 1,

    // spaceBetween: 50,
    pagination: true,
  };

  cartNumberOfProducts = 0;

  infoSlider: any[] = [];
  categories: any;

  private getCartNumSub: Subscription;
  private fetchCategoriesSub: Subscription;
  private infoSlideSub: Subscription;

  constructor(
    private catService: CategoriesService,
    private authService: AuthService,
    private infoService: InfoSliderService,
    private router: Router,
    private navCtrl: NavController,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.isCategoriesLoading = true;
    this.isInfoSlidesLoading = true;

    this.infoSlideSub = this.infoService.getInfoData().subscribe((infoData) => {
      this.infoSlider = infoData;
      this.isInfoSlidesLoading = false;
    });
    this.fetchCategoriesSub = this.catService
      .fetchCategories()
      .subscribe((resData) => {
        this.categories = resData;
        this.isCategoriesLoading = false;
      });
    this.cartService.autoFetchCart().subscribe((cartLength) => {
      if (cartLength) {
        this.getCartNumSub = this.cartService
          .getNumberOfProducts()
          .subscribe((lengthNumber) => {
            this.cartNumberOfProducts = lengthNumber;
          });
      }
    });
  }

  ionViewWillEnter() {
    this.cartService.autoFetchCart().subscribe((cartProducts) => {});
    this.getCartNumSub = this.cartService
      .getNumberOfProducts()
      .subscribe((lengthNumber) => {
        this.cartNumberOfProducts = lengthNumber;
      });
  }

  openCategory(catName: string) {
    if (catName) {
      this.navCtrl.navigateForward(`/home/categories/${catName}`, {
        state: { catName },
      });
    }
  }

  ngOnDestroy(): void {
    if (this.getCartNumSub) {
      this.getCartNumSub.unsubscribe();
    }
    if (this.fetchCategoriesSub) {
      this.fetchCategoriesSub.unsubscribe();
    }
    if (this.infoSlideSub) {
      this.infoSlideSub.unsubscribe();
    }
  }
}
