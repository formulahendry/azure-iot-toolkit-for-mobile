import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { Transport as DeviceTransport } from '../../utility/device/transport';
import { Items } from '../../global/items';

@Component({
  selector: 'page-simulate',
  templateUrl: 'simulate.html'
})
export class SimulatePage {
  selectedItem: any;
  message: string;
  mqttConnOpts: any;
  mqttD2COpts: any;
  mqttC2DOpts: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items) {
    this.selectedItem = navParams.data;
    if (this.globalItems.device.connectionStatus !== 'disconnected') {
      this.globalItems.device.transport.disconnect();
    }
    this.connect();
  }

  connect() {
    var simulatePage = this;

    this.globalItems.device.connectionStatus = 'connecting';
    this.globalItems.device.transport = new DeviceTransport(this.selectedItem.deviceConnectionString, 60);
    this.mqttConnOpts = this.globalItems.device.transport.getOptions();
    this.globalItems.device.transport.connect(() => {
      simulatePage.mqttD2COpts = {
        topic: 'devices/' + simulatePage.mqttConnOpts.clientId + '/messages/events/',
        qos: 0,
      };
      simulatePage.mqttC2DOpts = {
        topic: 'devices/' + simulatePage.mqttConnOpts.clientId + '/messages/devicebound/#',
        qos: 0,
      };
      simulatePage.globalItems.device.connectionStatus = 'connected';
    }, (err) => {
      simulatePage.globalItems.device.connectionStatus = 'disconnected';
      console.log(err);
    });
  }

  sendMessage() {
    if (this.globalItems.device.connectionStatus !== 'connected') {
      if (this.globalItems.device.connectionStatus === 'disconnected') {
        this.connect();
      }
      alert('No connection. Try again a few seconds later.');
      return;
    }

    if (!this.message) {
      alert('Error: The message is empty.');
      return;
    }

    this.globalItems.device.transport.publish(this.mqttD2COpts.topic, this.message, 0, false);
  }
}
