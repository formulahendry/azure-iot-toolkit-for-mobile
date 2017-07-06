import { Component } from '@angular/core';

import { NavController, NavParams } from 'ionic-angular';

import { SubscribePage } from '../subscribe/subscribe';

import { PublishPage } from '../publish/publish';

import { SimulatePage } from '../simulate/simulate';


@Component({
  selector: 'page-device',
  templateUrl: 'device.html'
})
export class DevicePage {
  selectedItem: any;
  tab1Root = SubscribePage;
  tab2Root = PublishPage;
  tab3Root = SimulatePage;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
  }
}
