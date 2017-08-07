import { Component, ViewChild } from '@angular/core';

import { NavController, NavParams, Tabs } from 'ionic-angular';

import { SubscribePage } from '../subscribe/subscribe';

import { PublishPage } from '../publish/publish';

import { SimulatePage } from '../simulate/simulate';

import { Items } from '../../global/items';


@Component({
  selector: 'page-device',
  templateUrl: 'device.html'
})
export class DevicePage {
  selectedItem: any;
  tab1Root = SubscribePage;
  tab2Root = PublishPage;
  tab3Root = SimulatePage;
  tab1Title = 'Monitor';
  tab2Title = 'Control';
  tab3Title = 'Simulate';
  @ViewChild('tabs') tabRef: Tabs;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
  }

  cleanUnreadNumber() {
    this.globalItems.unreadMessageNumber[this.selectedItem.deviceId] = 0;
  }
}
