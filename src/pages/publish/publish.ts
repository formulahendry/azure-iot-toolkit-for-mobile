import { Component } from '@angular/core';
import { ActionSheetController, ModalController, NavController, NavParams, Platform } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';

import { Items } from '../../global/items';
import { AppInsightsClient } from '../../utility/appInsightsClient';
import { ControlButtonSetting } from '../control-settings/control-settings';

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
  elements: any[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, public actionSheetCtrl: ActionSheetController, public platform: Platform, public modalCtrl: ModalController, public nativeStorage: NativeStorage) {
    this.selectedItem = navParams.data;
    this.transport = this.globalItems.transport;
    if (!this.globalItems.controlPageElement[this.selectedItem.deviceId]) {
      this.globalItems.controlPageElement[this.selectedItem.deviceId] = [];
    }
    this.elements = this.globalItems.controlPageElement[this.selectedItem.deviceId];
  }

  sendMessage(message) {
    AppInsightsClient.sendEvent('Send C2D Message', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });
    if (!message) {
      alert('Error: The message is empty.');
      return;
    }
    this.transport.send(this.selectedItem.deviceId, message);
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

  itemPressed(element) {
    let action = this.actionSheetCtrl.create({
      title: 'Options',
      buttons: [
        {
          text: 'Edit',
          icon: !this.platform.is('ios') ? 'eye' : null,
          handler: () => {
            action.dismiss()
              .then(() => {
                if (element.type === 'button') {
                  let modal = this.modalCtrl.create(ControlButtonSetting, { deviceId: this.selectedItem.deviceId, element: element });
                  modal.present();
                }
              });
            return false;
          }
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: !this.platform.is('ios') ? 'trash' : null,
          handler: () => {
            this.elements.splice(this.elements.indexOf(element), 1);
            this.nativeStorage.setItem('controlPageElement', this.globalItems.controlPageElement);
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
