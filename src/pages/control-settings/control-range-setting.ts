import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { Items } from '../../global/items';
import { sprintf } from 'sprintf-js';

@Component({
  templateUrl: 'control-range-setting.html'
})
export class ControlRangeSetting {
  deviceId: string;
  title: string;
  minValue: number;
  maxValue: number;
  value: number;
  step: number = 1;
  format: string;
  index: number = null;

  constructor(public navParams: NavParams, public viewCtrl: ViewController, public globalItems: Items, public nativeStorage: NativeStorage) {
    this.deviceId = this.navParams.get('deviceId');
    let element = this.navParams.get('element');
    if (element) {
      this.index = this.globalItems.controlPageElement[this.deviceId].indexOf(element);
      this.title = element.title;
      this.minValue = element.minValue;
      this.maxValue = element.maxValue;
      this.value = element.value;
      this.step = element.step;
      this.format = element.format;
    }
  }

  save() {
    if (!this.minValue || !this.maxValue || this.maxValue < this.minValue) {
      alert('Error: Invalid range value');
      return;
    }
    if (this.format) {
      try {
        sprintf(this.format, 0);
      } catch (e) {
        alert('Error: Invalid value format');
        return;
      }
    }
    let elements = this.globalItems.controlPageElement[this.deviceId];
    let newElement = {type: 'range', title: this.title, minValue: this.minValue, maxValue: this.maxValue, format: this.format, step: (this.step ? this.step : 1), value: this.value};
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
