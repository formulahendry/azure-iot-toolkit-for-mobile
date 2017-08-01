import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DevicePage } from '../device/device';
import { Utility } from '../../utility/utility';
import * as iothub from 'azure-iothub';
import { ConnectionString } from 'azure-iot-device';
import { AlertController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';

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
  consumerGroup: string;
  transport: Transport;

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, private network: Network, private localNotifications: LocalNotifications, public alertCtrl: AlertController, public nativeStorage: NativeStorage) {
    this.connect();
  }

  connect() {
    this.nativeStorage.getItem('iotHubConnection')
      .then(
      data => {
        console.log(data);
        this.iotHubConnectionString = data.iotHubConnectionString;
        this.consumerGroup = data.consumerGroup;
        let match = this.iotHubConnectionString.match(/^\s*HostName=(.*?)\.azure\-devices\.net;SharedAccessKeyName=(.*?);SharedAccessKey=(.*?)\s*$/);

        if (!match || !match[1] || !match[2] || !match[3]) {
          alert('Invalid IoT Hub Connection String');
          this.setConnectionString();
          return;
        }

        this.transport = this.globalItems.transport;
        this.listDevices();
        if (this.globalItems.connectionStatus !== 'disconnected') {
          this.transport.disconnectEH();
          this.transport.disconnectIH();
        }
        this.startTransport();
      },
      error => {
        this.iotHubConnectionString = '';
        this.consumerGroup = '$Default';
        this.setConnectionString();
      }
    );
  }

  startTransport() {
    this.globalItems.connectionStatus = 'connecting';

    let success = () => {
      deviceListPage.globalItems.connectionStatus = 'connected';
    };

    let fail = () => {
      deviceListPage.globalItems.connectionStatus = 'disconnected';
    };

    if (!this.transport.initializeIH(this.iotHubConnectionString, this.consumerGroup)) {
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

    this.globalItems.transport = this.transport;
  }

  listDevices(refresher = null) {
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

  setConnectionString() {
    let enterConnectionString = this.alertCtrl.create({
      title: 'IoT Hub Connection String',
      inputs: [
        {
          name: 'iotHubConnectionString',
          placeholder: 'IoT Hub Connection String',
          value: this.iotHubConnectionString
        },
        {
          name: 'consumerGroup',
          placeholder: 'Consumer Group',
          value: this.consumerGroup
        }
      ],
      buttons: [
        {
          text: 'Save',
          handler: data => {
            this.nativeStorage.setItem('iotHubConnection', data);
            this.connect();
          }
        },
        {
          text: 'Cancel',
          handler: data => {
            return;
          }
        }
      ]
    });
    enterConnectionString.present();
  }
}
