import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DevicePage } from '../device/device';
import { Utility } from '../../utility/utility';
import * as iothub from 'azure-iothub';
import { ConnectionString } from 'azure-iot-device';

import { Items } from '../../global/items';

import { Util } from '../../utility/service/util';
import { Transport } from '../../utility/service/transport';
import { Network } from '@ionic-native/network';
import { LocalNotifications } from '@ionic-native/local-notifications';


@Component({
  selector: 'page-device-list',
  templateUrl: 'device-list.html'
})
export class DeviceList {
  items: Array<{ deviceId: string, deviceConnectionString: string, iotHubConnectionString: string, connectionState: string }> = [];
  isLoading: boolean = true;
  iotHubConnectionString: string;
  transport: Transport;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, private network: Network, private localNotifications: LocalNotifications) {
    this.transport = this.globalItems.transport;
    this.listDevices();
    if (this.globalItems.connectionStatus === 'disconnected') {
      this.startTransport();
    }
  }

  startTransport() {
    this.globalItems.connectionStatus = 'connecting';

    let success = () => {
      deviceListPage.globalItems.connectionStatus = 'connected';
    };

    let fail = () => {
      deviceListPage.globalItems.connectionStatus = 'disconnected';
    };

    if (!this.transport.initializeIH(this.iotHubConnectionString, '$Default')) {
      this.globalItems.connectionStatus = 'disconnected';
      return;
    }
    var deviceListPage = this;

    this.transport.connectIH(success, fail);

    this.transport.onMessage = (device, message) => {
      let icon = null;
      let image = null;
      if (message === 'Door opened') {
        icon = deviceListPage.globalItems.icon.alert;
        image = deviceListPage.globalItems.image.doorOpened;
      } else if (message === 'Door closed') {
        icon = deviceListPage.globalItems.icon.tick;
        image = deviceListPage.globalItems.image.doorClosed;
      }
      deviceListPage.globalItems.message.unshift({
        deviceId: device,
        message: message,
        time: new Date().toLocaleTimeString(),
        icon: icon,
        image: image
      });
    };

    this.transport.onError = (err) => {
      if (err.condition) {
        deviceListPage.globalItems.connectionStatus = 'disconnected';
      } else {
        deviceListPage.globalItems.connectionStatus = 'connecting';
        deviceListPage.transport.disconnectIH();
        deviceListPage.transport.initializeIH(deviceListPage.iotHubConnectionString, '$Default');
        deviceListPage.transport.connectIH(success, fail);
      }
    };

    this.globalItems.transport = this.transport;
  }

  listDevices(refresher = null) {
    this.iotHubConnectionString = 'HostName=azure-iot-toolkit-for-mobile.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=bl8Ok/bA1infvdDdi8f6XlMmBmT44BrwOkOo7Q+HuZ0=';
    if (Utility.isApp()) {
      let registry = iothub.Registry.fromConnectionString(this.iotHubConnectionString);
      registry.list((err, deviceList) => {
        let items = [];
        deviceList.forEach((device, index) => {
          items.push({
            deviceId: device.deviceId,
            deviceConnectionString: ConnectionString.createWithSharedAccessKey(Utility.getHostName(this.iotHubConnectionString),
              device.deviceId, device.authentication.symmetricKey.primaryKey),
            iotHubConnectionString: this.iotHubConnectionString,
            connectionState: device.connectionState
          });
          if (device.connectionState.toString() === 'Disconnected') {
            for (let item of this.items) {
              if (item.deviceId === device.deviceId && item.connectionState.toString() === 'Connected') {
                this.localNotifications.schedule({
                  id: 1,
                  title: 'Device Status Alert',
                  text: `[${device.deviceId}] is disconnected`,
                });
                break;
              }
            }
          }
        });
        this.items = items;
        this.loadComplete(refresher);
      });
    } else {
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
            iotHubConnectionString: this.iotHubConnectionString,
            connectionState: device.connectionState
          });
        });
      }, (unuse, status, error) => {
        console.log('error');
      });

      this.loadComplete(refresher);
    }
  }

  loadComplete(refresher = null) {
    if (refresher) {
      refresher.complete();
    } else {
      this.isLoading = false;
      if (this.network.type === 'wifi') {
        setTimeout(() => {
          this.listDevices();
        }, 3000);
      }
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
