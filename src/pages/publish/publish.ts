import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ToastController } from 'ionic-angular';

import { Items } from '../../global/items';

@Component({
  selector: 'page-publish',
  templateUrl: 'publish.html'
})
export class PublishPage {
  selectedItem: any;
  message: string;
  transport: any;
  switchStatus: boolean;
  temperature: number;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, public toastCtrl: ToastController) {
    this.selectedItem = navParams.data;
    this.transport = this.globalItems.transport;
  }

  sendMessage() {
    if (!this.message) {
      let toast = this.toastCtrl.create({
        message: 'Error! The message is empty.',
        showCloseButton: true,
        duration: 2000
      });
      toast.present();
      return;
    }
    this.transport.send(this.selectedItem.deviceId, this.message);
    let toast = this.toastCtrl.create({
      message: 'Message has been sent.',
      showCloseButton: true,
      duration: 2000
    });
    toast.present();
  }

  handleSwitch() {
    if (this.switchStatus) {
      this.message = 'on';
    } else {
      this.message = 'off';
    }
  }

  handleRange() {
    this.message = this.temperature.toString();
  }
}
