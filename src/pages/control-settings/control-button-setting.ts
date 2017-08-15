import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { Items } from '../../global/items';

@Component({
  templateUrl: 'control-button-setting.html'
})
export class ControlButtonSetting {
  deviceId: string;
  title: string;
  display: string;
  value: string;
  index: number = null;

  constructor(public navParams: NavParams, public viewCtrl: ViewController, public globalItems: Items, public nativeStorage: NativeStorage) {
    this.deviceId = this.navParams.get('deviceId');
    let element = this.navParams.get('element');
    if (element) {
      this.index = this.globalItems.controlPageElement[this.deviceId].indexOf(element);
      this.title = element.title;
      this.display = element.display;
      this.value = element.value;
    }
  }

  save() {
    if (!this.value) {
      alert('Error: The value is empty!');
      return;
    }
    let elements = this.globalItems.controlPageElement[this.deviceId];
    let newElement = {type: 'button', title: this.title, display: (this.display ? this.display : 'Send'), value: this.value};
    if (this.index !== null) {
      elements[this.index] = newElement;
    } else {
      elements.push(newElement);
    }
    this.nativeStorage.setItem('controlPageElement', this.globalItems.controlPageElement);
    this.viewCtrl.dismiss(true);
  }

  cancel() {
    this.viewCtrl.dismiss(false);
  }
}
