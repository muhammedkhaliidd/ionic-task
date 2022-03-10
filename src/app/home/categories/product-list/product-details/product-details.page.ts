import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriesService } from '../../categories.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.page.html',
  styleUrls: ['./product-details.page.scss'],
})
export class ProductDetailsPage implements OnInit {
  isProductLoading = false;
  cateName: string;
  id: string;
  product: any;

  constructor(
    private catService: CategoriesService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.isProductLoading = true;
    this.cateName = this.activatedRoute.snapshot.paramMap.get('cateName');
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!this.cateName || !this.id) {
      return;
    } else {
      this.catService
        .fetchProduct(this.cateName, this.id)
        .subscribe((resData) => {
          this.product = resData;
          this.isProductLoading = false;
        });
    }
  }
}
