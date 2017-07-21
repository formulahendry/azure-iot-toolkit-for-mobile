import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Items } from '../../global/items';

@Component({
  selector: 'page-subscribe',
  templateUrl: 'subscribe.html'
})
export class SubscribePage {
  selectedItem: any;
  displayMessages: any[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items) {
    this.selectedItem = navParams.data;
    this.displayMessages = this.globalItems.message;
  }

}
