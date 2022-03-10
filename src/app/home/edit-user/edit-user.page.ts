import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Storage } from '@capacitor/storage';
import {
  ActionSheetController,
  AlertController,
  NavController,
} from '@ionic/angular';
import { from, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService, UserDetails } from 'src/app/auth/auth.service';
import { LocalFile, PhotoHandleService } from 'src/app/photo-handle.service';

import { format, formatISO, parseISO } from 'date-fns';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.page.html',
  styleUrls: ['./edit-user.page.scss'],
})
export class EditUserPage implements OnInit, OnDestroy {
  defaultImgUrl = '../../../assets/noImage.png';
  image: LocalFile;
  isUserLoading = false;
  isImageLoading = true;
  maxDate = formatISO(new Date());

  userDetails: UserDetails = {
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: new Date('2000-01-01'),
  };
  form: FormGroup;

  private deleteImageSub: Subscription;
  private getImageSub: Subscription;

  constructor(
    private authService: AuthService,
    private actionSheetCtrl: ActionSheetController,
    private photoHandleService: PhotoHandleService,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.getImageSub = this.photoHandleService
      .getImage()
      .subscribe((imgRes) => {
        if (imgRes) {
          this.isImageLoading = false;
          this.image = imgRes;
        }
      });
    // const formattedString = format(new Date(), 'yyyy-MM-dd');

    // Storage.set({ key: 'profileImg', value: '1646904798975.jpeg' });

    // Read Image
    Storage.get({ key: 'profileImg' as string }).then((resImg) => {
      if (!resImg || !resImg.value) {
        console.log('not found!');
        return;
      }

      this.photoHandleService.loadImage(resImg.value).then((res) => {
        this.getImageSub = res.subscribe((image) => {
          if (image) {
            this.isImageLoading = false;
            this.image = image;
          }
        });
      });
    });

    // Read User Data
    this.isUserLoading = true;
    Storage.get({ key: 'userData' }).then((resUser) => {
      this.authService.getUserDetails().subscribe((userData) => {
        if (userData) {
          this.userDetails = userData;
        }

        this.form = new FormGroup({
          firstName: new FormControl(this.userDetails.firstName, {
            updateOn: 'blur',
            validators: [Validators.required],
          }),
          lastName: new FormControl(this.userDetails.lastName, {
            updateOn: 'blur',
            validators: [Validators.required],
          }),
          phone: new FormControl(this.userDetails.phone, {
            updateOn: 'blur',
            validators: [Validators.required],
          }),
          birthDate: new FormControl(
            new Date(this.userDetails.birthDate).toISOString(),
            {
              updateOn: 'blur',
              validators: [Validators.required],
            }
          ),
        });
        this.isUserLoading = false;
      });
    });
  }

  onViewWillEnter() {}

  onUpdateImage() {
    this.actionSheetCtrl
      .create({
        header: 'Choose Upload Image',
        buttons: [
          {
            text: 'Camera capture',
            handler: () => {
              this.cameraCapture();
            },
          },
          {
            text: 'Gallery Upload',
            handler: () => {
              this.galleryUpload();
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

  cameraCapture() {
    this.photoHandleService.captureImage().then(() => {});
  }

  galleryUpload() {
    this.photoHandleService.selectImage();
  }

  onEdit() {
    const formValues: UserDetails = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      phone: this.form.value.phone,
      birthDate: this.form.value.birthDate,
    };
    console.log(this.form.value);

    this.authService.setUserDetails(formValues).subscribe(() => {
      this.form.reset();
      this.navCtrl.navigateBack('/home');
    });
  }
  onDelete() {
    this.alertCtrl
      .create({
        header: 'Confirm deleting Image',
        buttons: [
          {
            text: 'Delete',
            handler: () => {
              this.deleteImageSub = this.photoHandleService
                .deleteImage(this.image)
                .subscribe((image) => {
                  if (image) {
                    return;
                  } else {
                    Storage.remove({
                      key: 'profileImg',
                    });
                    this.isImageLoading = true;
                    this.image = null;
                  }
                });
            },
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ],
      })
      .then((alertEl) => {
        alertEl.present();
      });
  }

  ngOnDestroy(): void {
    if (this.deleteImageSub) {
      this.deleteImageSub.unsubscribe();
    }
    if (this.getImageSub) {
      this.getImageSub.unsubscribe();
    }
  }
}
