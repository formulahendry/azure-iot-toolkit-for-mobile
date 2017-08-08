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
  transport: DeviceTransport;
  interval: number = 5000;
  canGetGyroscope: boolean = false;
  connectionStatus: string = 'disconnected';
  intervalFunc: NodeJS.Timer;
  frequentOpt: string = 'start';
  mqttConnOpts: any;
  mqttD2COpts: any;
  mqttC2DOpts: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, public platform: Platform, private gyroscope: Gyroscope, public alertCtrl: AlertController) {
    this.orientation = { x: 0, y: 0, z: 0, timestamp: 0 };
    this.selectedItem = navParams.data;
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
    this.connectionStatus = 'disconnected';
    this.connect();
  }

  setGyroscope() {
    AppInsightsClient.sendEvent('Get Gyroscope Data', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });
    this.message = `{x: ${this.orientation.x.toFixed(3)}, y: ${this.orientation.y.toFixed(3)}, z: ${this.orientation.z.toFixed(3)}}`;
  }

  connect(message: string = null) {
    var simulatePage = this;

    this.connectionStatus = 'connecting';
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
      simulatePage.connectionStatus = 'connected';
      if (message)
        simulatePage.transport.publish(simulatePage.mqttD2COpts.topic, message, 0, false);
    }, () => {
      simulatePage.connectionStatus = 'disconnected';
    });
  }

  sendMessage() {
    AppInsightsClient.sendEvent('Send D2C Message', this.selectedItem.iotHubConnectionString, { deviceId: this.selectedItem.deviceId });
    if (!this.message) {
      alert('Error: The message is empty.');
      return;
    }
    if (this.connectionStatus === 'disconnected') {
      this.connect(this.message);
    } else if (this.connectionStatus === 'connecting') {
      alert('Error: The service is connecting, try it later');
    } else {
      this.transport.publish(this.mqttD2COpts.topic, this.message, 0, false);
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
              this.intervalFunc = setInterval(() => {
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
      this.intervalFunc = setInterval(() => {
        this.frequentlySendMessage();
      }, this.interval);
    }
  }

  frequentlySendMessage() {
    let message = `{x: ${this.orientation.x.toFixed(3)}, y: ${this.orientation.y.toFixed(3)}, z: ${this.orientation.z.toFixed(3)}}`;
    if (this.connectionStatus === 'disconnected') {
      this.connect(message);
    } else if (this.connectionStatus === 'connected') {
      this.transport.publish(this.mqttD2COpts.topic, message, 0, false);
    }
  }

  stopInterval(click: string = null) {
    if (click) {
      this.frequentOpt = 'start';
    }
    if (this.intervalFunc)
      clearInterval(this.intervalFunc);
    this.intervalFunc = null;
  }
}
