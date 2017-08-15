import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { Items } from '../../global/items';

@Component({
  templateUrl: 'control-switch-setting.html'
})
export class ControlSwitchSetting {
  deviceId: string;
  titleOn: string;
  titleOff: string;
  valueOn: string;
  valueOff: string;
  check: boolean = false;
  index: number = null;

  constructor(public navParams: NavParams, public viewCtrl: ViewController, public globalItems: Items, public nativeStorage: NativeStorage) {
    this.deviceId = this.navParams.get('deviceId');
    let element = this.navParams.get('element');
    if (element) {
      this.index = this.globalItems.controlPageElement[this.deviceId].indexOf(element);
      this.titleOn = element.titleOn;
      this.titleOff = element.titleOff;
      this.valueOn = element.valueOn;
      this.valueOff = element.valueOff;
      this.check = element.check;
    }
  }

  save() {
    let elements = this.globalItems.controlPageElement[this.deviceId];
    let newElement = {type: 'switch', titleOn: (this.titleOn ? this.titleOn : 'on'), titleOff: (this.titleOff ? this.titleOff : 'off'), valueOn: (this.valueOn ? this.valueOn : 'on'), valueOff: (this.valueOff ? this.valueOff : 'off'), check: this.check};
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
