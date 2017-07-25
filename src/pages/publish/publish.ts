import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

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

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items) {
    this.selectedItem = navParams.data;
    this.transport = this.globalItems.transport;
  }

  sendMessage() {
    if (!this.message) {
      alert('the message is empty');
      return;
    }
    this.transport.send(this.selectedItem.deviceId, this.message);
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
