import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@capacitor/storage';
import { Subscription } from 'rxjs';
import { AuthService, UserDetails } from './auth/auth.service';
import { LocalFile, PhotoHandleService } from './photo-handle.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  defaultImgUrl = '../../../assets/noImage.png';

  userDetails: UserDetails;
  image: LocalFile;

  isUserLoading = false;
  isImageLoading = true;
  private prevAuthState = false;
  private authSub: Subscription;
  private getImageSub: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private photoHandleService: PhotoHandleService
  ) {}
  ngOnInit() {
    this.isUserLoading = true;

    this.getImageSub = this.photoHandleService
      .getImage()
      .subscribe((imgRes) => {
        if (imgRes) {
          this.isImageLoading = false;
          this.image = imgRes;
        }
      });

    // Get User Image
    Storage.get({ key: 'profileImg' as string }).then((resImg) => {
      if (!resImg || !resImg.value) {
        console.log('not found!');
        return;
      }

      this.photoHandleService.loadImage(resImg.value).then((res) => {
        res.subscribe((image) => {
          if (image) {
            this.isImageLoading = false;
            console.log('getFile: ', image, this.isImageLoading);
            this.image = image;
          }
        });
      });
    });

    // Get User Data
    this.authService.getUserDetails().subscribe((userData) => {
      this.userDetails = userData;
      this.isUserLoading = false;
    });
    Storage.get({ key: 'userData' }).then((data) => {
      if (!data || !data.value) {
        return;
      }
      this.authService.setUserDetails(JSON.parse(data.value));
    });

    this.authSub = this.authService
      .getUserIsAuthenticated()
      .subscribe((isAuthenticated) => {
        if (!isAuthenticated && this.prevAuthState !== isAuthenticated) {
          this.router.navigateByUrl('/auth');
        } else {
          this.prevAuthState = isAuthenticated;
        }
      });
  }

  ionViewWillEnter() {}

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }
}
