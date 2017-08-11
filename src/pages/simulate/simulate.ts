import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
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
  interval: number = 5000;
  canGetGyroscope: boolean = false;
  frequentOpt: string = 'start';

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, public platform: Platform, private gyroscope: Gyroscope, public alertCtrl: AlertController) {
    this.orientation = { x: 0, y: 0, z: 0, timestamp: 0 };
    this.selectedItem = navParams.data;
    if (this.globalItems.frequentSendMessageParameter.intervalFunc) {
      if (this.globalItems.frequentSendMessageParameter.deviceId !== this.selectedItem.deviceId) {
        this.stopInterval();
      } else {
        this.frequentOpt = 'stop';
      }
    }
    if (platform.is('android') || platform.is('ios')) {
      this.canGetGyroscope = true;
      let options: GyroscopeOptions = {
        frequency: 400
      };

      this.gyroscope.watch(options)
        .subscribe((orientation: GyroscopeOrientation) => {
          this.orientation = orientation;
        });
    }
    if (this.globalItems.device.connectionStatus !== 'disconnected' && this.globalItems.device.deviceId !== this.selectedItem.deviceId) {
      this.globalItems.device.transport.disconnect();
      this.connect();
    }
  }

  setGyroscope() {
    AppInsightsClient.sendEvent('Get Gyroscope Data', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });
    this.message = `{x: ${this.orientation.x.toFixed(3)}, y: ${this.orientation.y.toFixed(3)}, z: ${this.orientation.z.toFixed(3)}}`;
  }

  connect(message: string = null) {
    var simulatePage = this;

    this.globalItems.device.deviceId = this.selectedItem.deviceId;
    this.globalItems.device.connectionStatus = 'connecting';
    this.globalItems.device.transport = new DeviceTransport(this.selectedItem.deviceConnectionString, 60);
    this.globalItems.device.mqttConnOpts = this.globalItems.device.transport.getOptions();
    this.globalItems.device.transport.connect(() => {
      simulatePage.globalItems.device.mqttD2COpts = {
        topic: 'devices/' + simulatePage.globalItems.device.mqttConnOpts.clientId + '/messages/events/',
        qos: 0,
      };
      simulatePage.globalItems.device.mqttC2DOpts = {
        topic: 'devices/' + simulatePage.globalItems.device.mqttConnOpts.clientId + '/messages/devicebound/#',
        qos: 0,
      };
      simulatePage.globalItems.device.connectionStatus = 'connected';
      if (message)
        simulatePage.globalItems.device.transport.publish(simulatePage.globalItems.device.mqttD2COpts.topic, message, 0, false);
    }, () => {
      simulatePage.globalItems.device.connectionStatus = 'disconnected';
    });
  }

  sendMessage() {
    AppInsightsClient.sendEvent('Send D2C Message', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });
    if (!this.message) {
      alert('Error: The message is empty.');
      return;
    }
    if (this.globalItems.device.connectionStatus === 'disconnected') {
      this.connect(this.message);
    } else if (this.globalItems.device.connectionStatus === 'connecting') {
      alert('Error: The service is connecting, try it later');
    } else {
      this.globalItems.device.transport.publish(this.globalItems.device.mqttD2COpts.topic, this.message, 0, false);
    }
  }

  startInterval() {
    AppInsightsClient.sendEvent('Frequently Send D2C Message', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });

    if (this.interval < 1000) {
      let alert = this.alertCtrl.create({
        title: 'Warning!',
        message: 'The interval is too short! Are you sure to continue?',
        buttons: [
          {
            text: 'Sure',
            handler: () => {
              this.stopInterval();
              this.frequentOpt = 'stop';
              this.globalItems.frequentSendMessageParameter.deviceId = this.selectedItem.deviceId;
              this.globalItems.frequentSendMessageParameter.intervalFunc = setInterval(() => {
                this.frequentlySendMessage();
              }, this.interval);
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]
      });
      alert.present();
    } else {
      this.stopInterval();
      this.frequentOpt = 'stop';
      this.globalItems.frequentSendMessageParameter.deviceId = this.selectedItem.deviceId;
      this.globalItems.frequentSendMessageParameter.intervalFunc = setInterval(() => {
        this.frequentlySendMessage();
      }, this.interval);
    }
  }

  frequentlySendMessage() {
    let message = `{x: ${this.orientation.x.toFixed(3)}, y: ${this.orientation.y.toFixed(3)}, z: ${this.orientation.z.toFixed(3)}}`;
    if (this.globalItems.device.connectionStatus === 'disconnected') {
      this.connect(message);
    } else if (this.globalItems.device.connectionStatus === 'connected') {
      this.globalItems.device.transport.publish(this.globalItems.device.mqttD2COpts.topic, message, 0, false);
    }
  }

  stopInterval(click: string = null) {
    if (click) {
      this.frequentOpt = 'start';
    }
    if (this.globalItems.frequentSendMessageParameter.intervalFunc)
      clearInterval(this.globalItems.frequentSendMessageParameter.intervalFunc);
    this.globalItems.frequentSendMessageParameter.intervalFunc = null;
  }
}
