import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DevicePage } from '../device/device';
import { Utility } from '../../utility/utility';
import * as iothub from 'azure-iothub';
import { ConnectionString } from 'azure-iot-device';

import { Items } from '../../global/items';

import { Util } from '../../utility/util';
import { Transport } from '../../utility/transport';

@Component({
  selector: 'page-device-list',
  templateUrl: 'device-list.html'
})
export class DeviceList {
  items: Array<{ deviceId: string, deviceConnectionString: string, iotHubConnectionString: string }> = [];
  isLoading: boolean = true;
  iotHubConnectionString: string;
  transport: Transport = new Transport();

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items) {
    this.listDevices();
    if (this.globalItems.connectionStatus === 'disconnected') {
      this.startTransport();
    }
  }

  startTransport() {
    this.globalItems.connectionStatus = 'connecting';

    if (!this.transport.initializeIH(this.iotHubConnectionString, '$Default')) {
      return;
    }
    var deviceList = this;

    this.transport.connectIH(() => {
      deviceList.globalItems.connectionStatus = 'connected';
    }, () => {
      deviceList.globalItems.connectionStatus = 'disconnected';
    });

    this.transport.onMessage = (device, message) => {
      let icon = null;
      let image = null;
      if (message === 'Door opened') {
        icon = deviceList.globalItems.icon.alert;
        image = deviceList.globalItems.image.doorOpened;
      } else if (message === 'Door closed') {
        icon = deviceList.globalItems.icon.tick;
        image = deviceList.globalItems.image.doorClosed;
      }
      deviceList.globalItems.message.push({
        deviceId: device,
        message: message,
        time: new Date().toLocaleTimeString(),
        icon: icon,
        image: image
      });
    };

    this.globalItems.transport = this.transport;
  }

  listDevices(refresher = null) {
    this.iotHubConnectionString = 'HostName=azure-iot-toolkit-for-mobile.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=bl8Ok/bA1infvdDdi8f6XlMmBmT44BrwOkOo7Q+HuZ0=';
    if (Utility.isApp()) {
      let registry = iothub.Registry.fromConnectionString(this.iotHubConnectionString);
      registry.list((err, deviceList) => {
        this.items = [];
        deviceList.forEach((device, index) => {
          this.items.push({
            deviceId: device.deviceId,
            deviceConnectionString: ConnectionString.createWithSharedAccessKey(Utility.getHostName(this.iotHubConnectionString),
              device.deviceId, device.authentication.symmetricKey.primaryKey),
            iotHubConnectionString: this.iotHubConnectionString
          });
        });
        this.loadComplete(refresher);
      });
    } else {
      setTimeout(() => {
        this.items = [];
        let connectionInfo = this.iotHubConnectionString.match(/^\s*HostName=(.*?)\.azure\-devices\.net;SharedAccessKeyName=(.*?);SharedAccessKey=(.*?)\s*$/);

        if (!connectionInfo || !connectionInfo[1] || !connectionInfo[2] || !connectionInfo[3]) {
          return;
        }

        Util.restAPI(connectionInfo[1], connectionInfo[3], connectionInfo[2], 'GET', '/devices', null, null, (deviceList, status, unuse) => {
          deviceList.forEach((device, index) => {
            this.items.push({
              deviceId: device.deviceId,
              deviceConnectionString: ConnectionString.createWithSharedAccessKey(Utility.getHostName(this.iotHubConnectionString),
                device.deviceId, device.authentication.symmetricKey.primaryKey),
              iotHubConnectionString: this.iotHubConnectionString
            });
          });
        }, (unuse, status, error) => {
          console.log('error');
        });

        this.loadComplete(refresher);
      }, 2000);
    }
  }

  loadComplete(refresher = null) {
    if (refresher) {
      refresher.complete();
    } else {
      this.isLoading = false;
    }
  }

  itemTapped(event, item) {
    this.navCtrl.push(DevicePage, {
      item: item
    });
  }

  doRefresh(refresher) {
    this.listDevices(refresher);
  }
}
