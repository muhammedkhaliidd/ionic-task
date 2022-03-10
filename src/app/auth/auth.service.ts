import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from './user.model';
import { Storage } from '@capacitor/storage';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  // ? for Optional property
  registered?: boolean;
}

export interface UserDetails {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private userDetails = new BehaviorSubject<UserDetails>({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: new Date('2000-01-01'),
  });
  private user = new BehaviorSubject<User>(null);
  private activeTimeoutTimer: any;
  constructor(private http: HttpClient) {}
  ngOnDestroy() {
    clearTimeout(this.activeTimeoutTimer);
  }

  getUserDetails() {
    return this.userDetails.asObservable();
  }

  setUserDetails(userInfo: UserDetails) {
    this.userDetails.next(userInfo);
    Storage.remove({ key: 'userData' }).then(() => {
      Storage.set({ key: 'userData', value: JSON.stringify(userInfo) });
    });
    return this.getUserDetails();
  }

  signUp(userEmail: string, userPassword: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.authKey}`,
        {
          email: userEmail,
          password: userPassword,
          returnSecureToken: true,
        }
      )
      .pipe(
        tap((resData) => {
          this.setUserData(resData);
        })
      );
  }

  login(userEmail: string, userPassword: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.authKey}`,
        {
          email: userEmail,
          password: userPassword,
          returnSecureToken: true,
        }
      )
      .pipe(
        tap((resData) => {
          this.setUserData(resData);
        })
      );
  }

  getUserIsAuthenticated() {
    return this.user.asObservable().pipe(
      map((user) => {
        if (user) {
          // !! to force return boolean Value
          return !!user.getToken();
        } else {
          return false;
        }
      })
    );
  }

  getUserId() {
    return this.user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user.id;
        } else {
          return null;
        }
      })
    );
  }

  getUserData() {
    return this.user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user;
        } else {
          return null;
        }
      })
    );
  }

  // Auto Login Function
  autoLogin() {
    return from(Storage.get({ key: 'authData' })).pipe(
      map((storedData) => {
        if (!storedData || !storedData.value) {
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as {
          userId: string;
          token: string;
          tokenExpirationDate: string;
          email: string;
        };
        const expirationTime = new Date(parsedData.tokenExpirationDate);
        if (expirationTime <= new Date()) {
          return null;
        }
        const user = new User(
          parsedData.userId,
          parsedData.email,
          parsedData.token,
          expirationTime
        );
        return user;
      }),
      tap((user) => {
        if (user) {
          this.user.next(user);
          this.autoLogout(user.getTokenDuration());
        }
      }),
      map((user) => !!user)
    );
  }

  logout() {
    if (this.activeTimeoutTimer) {
      clearTimeout(this.activeTimeoutTimer);
    }
    this.user.next(null);
    Storage.remove({ key: 'authData' });
  }

  // Store UserDetails Data Function
  storeUserDetails(
    firstName: string,
    lastName: string,
    birthDate: Date,
    phone: string
  ) {
    const userData = JSON.stringify({
      firstName,
      lastName,
      birthDate,
      phone,
    });
    return from(Storage.set({ key: 'userData', value: userData })).pipe(
      map(() => JSON.parse(userData)),
      tap((user) => {
        this.userDetails.next(user);
      })
    );
  }

  private autoLogout(duration: number) {
    if (this.activeTimeoutTimer) {
      clearTimeout(this.activeTimeoutTimer);
    }
    this.activeTimeoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  private setUserData(userData: AuthResponseData) {
    const expirationTime = new Date(
      new Date().getTime() + +userData.expiresIn * 1000
    );
    const user = new User(
      userData.localId,
      userData.email,
      userData.idToken,
      expirationTime
    );
    this.user.next(user);
    this.autoLogout(user.getTokenDuration());
    this.storeAuthData(
      userData.localId,
      userData.idToken,
      expirationTime.toISOString(),
      userData.email
    );
  }

  // Store Auth Data Function
  private storeAuthData(
    userId: string,
    token: string,
    tokenExpirationDate: string,
    email: string
  ) {
    const data = JSON.stringify({
      userId,
      token,
      tokenExpirationDate,
      email,
    });
    Storage.set({ key: 'authData', value: data });
  }
}
