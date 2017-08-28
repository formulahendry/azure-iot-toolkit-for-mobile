import { Component, ViewChild } from '@angular/core';

import { ActionSheetController, ModalController, NavController, NavParams, Platform, Tabs } from 'ionic-angular';

import { SubscribePage } from '../subscribe/subscribe';

import { PublishPage } from '../publish/publish';

import { SimulatePage } from '../simulate/simulate';

import { Items } from '../../global/items';
import { ControlButtonSetting } from '../control-settings/control-button-setting';
import { ControlSwitchSetting } from '../control-settings/control-switch-setting';
import { ControlRangeSetting } from '../control-settings/control-range-setting';


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
  isTab2: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, public modalCtrl: ModalController, public actionSheetCtrl: ActionSheetController, public platform: Platform) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
  }

  selectTab() {
    let activeTab = this.tabRef.getSelected().tabTitle;
    if (activeTab === this.tab2Title) {
      this.isTab2 = true;
    } else {
      this.isTab2 = false;
      if (activeTab === this.tab1Title) {
        this.cleanUnreadNumber();
      }
    }
  }

  cleanUnreadNumber() {
    this.globalItems.unreadMessageNumber[this.selectedItem.deviceId] = 0;
  }

  addControlElement() {
    let activeTab = this.tabRef.getSelected().tabTitle;
    if (activeTab === this.tab2Title) {
      let action = this.actionSheetCtrl.create({
        title: 'Choose component type:',
        buttons: [
          {
            text: 'Button',
            icon: !this.platform.is('ios') ? 'game-controller-a' : null,
            handler: () => {
              action.dismiss()
                .then(() => {
                  let modal = this.modalCtrl.create(ControlButtonSetting, { deviceId: this.selectedItem.deviceId });
                  modal.present();
                });
              return false;
            }
          },
          {
            text: 'Switch',
            icon: !this.platform.is('ios') ? 'switch' : null,
            handler: () => {
              action.dismiss()
                .then(() => {
                  let modal = this.modalCtrl.create(ControlSwitchSetting, { deviceId: this.selectedItem.deviceId });
                  modal.present();
                });
              return false;
            }
          },
          {
            text: 'Slide Bar',
            icon: !this.platform.is('ios') ? 'options' : null,
            handler: () => {
              action.dismiss()
                .then(() => {
                  let modal = this.modalCtrl.create(ControlRangeSetting, { deviceId: this.selectedItem.deviceId });
                  modal.present();
                });
              return false;
            }
          },
          {
            text: 'Cancel',
            role: 'cancel',
            icon: !this.platform.is('ios') ? 'close' : null
          }
        ]
      });
      action.present();
    }
  }
}
