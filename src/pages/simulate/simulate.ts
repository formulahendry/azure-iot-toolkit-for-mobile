import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { Gyroscope, GyroscopeOptions, GyroscopeOrientation } from '@ionic-native/gyroscope';

import { Transport as DeviceTransport } from '../../utility/device/transport';
import { Items } from '../../global/items';
import { AppInsightsClient } from '../../utility/appInsightsClient';

@Component({
  selector: 'page-simulate',
  templateUrl: 'simulate.html'
})
export class SimulatePage {
  selectedItem: any;
  message: string;
  orientation: GyroscopeOrientation;
  transport: DeviceTransport;
  mqttConnOpts: any;
  mqttD2COpts: any;
  mqttC2DOpts: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, public platform: Platform, private gyroscope: Gyroscope) {
    this.orientation = { x: 0, y: 0, z: 0, timestamp: 0 };
    this.selectedItem = navParams.data;
    if (platform.is('android') || platform.is('ios')) {
      let options: GyroscopeOptions = {
        frequency: 400
      };

      this.gyroscope.watch(options)
        .subscribe((orientation: GyroscopeOrientation) => {
          this.orientation = orientation;
        });
    }
  }

  setGyroscope() {
    AppInsightsClient.sendEvent('Get Gyroscope Data', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });
    this.message = `{x: ${this.orientation.x.toFixed(3)}, y: ${this.orientation.y.toFixed(3)}, z: ${this.orientation.z.toFixed(3)}}`;
  }

  connect() {
    var simulatePage = this;

    this.transport = new DeviceTransport(this.selectedItem.deviceConnectionString, 60);
    this.mqttConnOpts = this.transport.getOptions();
    this.transport.connect(() => {
      simulatePage.mqttD2COpts = {
        topic: 'devices/' + simulatePage.mqttConnOpts.clientId + '/messages/events/',
        qos: 0,
      };
      simulatePage.mqttC2DOpts = {
        topic: 'devices/' + simulatePage.mqttConnOpts.clientId + '/messages/devicebound/#',
        qos: 0,
      };
      simulatePage.transport.publish(simulatePage.mqttD2COpts.topic, simulatePage.message, 0, false);
      simulatePage.transport.disconnect();
    }, null);
  }

  sendMessage() {
    AppInsightsClient.sendEvent('Send D2C Message', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });
    if (!this.message) {
      alert('Error: The message is empty.');
      return;
    }

    this.connect();
  }
}
