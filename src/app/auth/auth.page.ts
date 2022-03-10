import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthService, AuthResponseData } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = false;
  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.authService.getUserIsAuthenticated().subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        return;
      } else {
        this.router.navigate(['/info-slider']);
      }
    });
  }

  // Authenticate Function
  authenticate(email: string, password: string) {
    this.isLoading = true;
    this.loadingCtrl
      .create({
        keyboardClose: true,
        message: 'Logging in..',
      })
      .then((loadingEl) => {
        loadingEl.present();
        let authObserv = new Observable<AuthResponseData>();
        if (this.isLogin) {
          authObserv = this.authService.login(email, password);
        } else {
          authObserv = this.authService.signUp(email, password);
        }
        authObserv.subscribe(
          (resData) => {
            console.log(resData);
            this.isLoading = false;
            loadingEl.dismiss();
            this.router.navigateByUrl('/info-slider');
          },
          (errorRes) => {
            loadingEl.dismiss();
            const errorCode = errorRes.error.error
              ? errorRes.error.error.message
              : '';
            let message = 'Could not sign you up, Please try again.';
            if (errorCode === 'EMAIL_EXISTS') {
              message = 'This Email address already exists!';
            } else if (errorCode === 'EMAIL_NOT_FOUND') {
              message = 'This Email address Not found!';
            } else if (errorCode === 'INVALID_PASSWORD') {
              message = 'This password is not correct!';
            }
            console.log(message);
            this.showAlert(message);
          }
        );
      });
  }

  // switchLog Function
  switchAuth() {
    this.isLogin = !this.isLogin;
  }

  // onSubmit Function
  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;

    this.authenticate(email, password);
    form.reset();
  }

  private showAlert(errorMessage: string) {
    this.alertCtrl
      .create({
        header: 'Authentication failed',
        message: errorMessage,
        buttons: ['Okay'],
      })
      .then((alertEl) => {
        alertEl.present();
      });
  }
}
