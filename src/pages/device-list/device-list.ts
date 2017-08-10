import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DevicePage } from '../device/device';
import { IothubConnection } from '../iothub-connection/iothub-connection';
import { Utility } from '../../utility/utility';
import { AppInsightsClient } from '../../utility/appInsightsClient';
import * as iothub from 'azure-iothub';
import { ConnectionString } from 'azure-iot-device';
import { AlertController, IonicApp, ModalController, Platform, ViewController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';

import { Items } from '../../global/items';

import { Util } from '../../utility/service/util';
import { Transport } from '../../utility/service/transport';
import { Network } from '@ionic-native/network';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { AppMinimize } from '@ionic-native/app-minimize';

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

  constructor(public navCtrl: NavController, public navParams: NavParams, public globalItems: Items, private network: Network, private localNotifications: LocalNotifications, private ionicApp: IonicApp, public modalCtrl: ModalController, public nativeStorage: NativeStorage, public viewCtrl: ViewController, public alertCtrl: AlertController, public platform: Platform, public appMinimize: AppMinimize) {
    if (this.platform.is('android')) {
      this.platform.registerBackButtonAction(() => {
        let activePortal = this.ionicApp._loadingPortal.getActive() ||
          this.ionicApp._modalPortal.getActive() ||
          this.ionicApp._toastPortal.getActive() ||
          this.ionicApp._overlayPortal.getActive();

        if (activePortal) {
          activePortal.dismiss();
        } else {
          if (this.navCtrl.canGoBack()) {
            this.navCtrl.pop();
          } else {
            this.appMinimize.minimize();
          }
        }
      });
    }
    this.connect();
  }

  connect() {
    this.nativeStorage.getItem('iotHubConnection')
      .then(
      data => {
        this.iotHubConnectionString = data.iotHubConnectionString;
        this.consumerGroup = data.consumerGroup;
        if (!Utility.validConnectionString(this.iotHubConnectionString)) {
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
      let activePage = this.navCtrl.getActive();
      if (!deviceListPage.globalItems.unreadMessageNumber[device])
        deviceListPage.globalItems.unreadMessageNumber[device] = 0;
      if (activePage.name !== 'DevicePage' || activePage.instance.tabRef.getSelected().tabTitle !== activePage.instance.tab1Title || activePage.instance.selectedItem.deviceId !== device) {
        ++deviceListPage.globalItems.unreadMessageNumber[device];
      }
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
    AppInsightsClient.sendEvent('List Devices', this.iotHubConnectionString);
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
    AppInsightsClient.sendEvent('Device Tapped', this.iotHubConnectionString, { deviceId: item.deviceId });
    this.navCtrl.push(DevicePage, {
      item: item
    });
  }

  itemPressed(event, item) {
    let alert = this.alertCtrl.create({
      title: 'Delete Device',
      message: `Do you want to delete the device ${item.deviceId}`,
      buttons: [
        {
          text: 'Delete',
          handler: () => {
            this.deleteDevice(item.deviceId);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    alert.present();
  }

  doRefresh(refresher) {
    if (!Utility.validConnectionString(this.iotHubConnectionString)) {
      refresher.complete();
      return;
    }
    this.listDevices(refresher);
  }

  setConnectionString() {
    let modal = this.modalCtrl.create(IothubConnection, { iotHubConnectionString: this.iotHubConnectionString, consumerGroup: this.consumerGroup });
    modal.onDidDismiss(data => {
      if (data) {
        this.isLoading = true;
        this.connect();
      } else {
        this.isLoading = false;
      }
    });
    modal.present();
  }

  createDevice() {
    let getDeviceId = this.alertCtrl.create({
      title: 'Create Device',
      message: 'Please enter device id to create',
      inputs: [
        {
          type: 'text',
          name: 'deviceId',
          placeholder: 'Device Id'
        }
      ],
      buttons: [
        {
          text: 'Create',
          handler: data => {
            if (data.deviceId) {
              if (!Utility.validConnectionString(this.iotHubConnectionString)) {
                alert('Invalid IoT Hub Connection String');
              } else {
                let registry = iothub.Registry.fromConnectionString(this.iotHubConnectionString);
                let deviceId = data.deviceId;
                registry.create({ deviceId, }, this.deviceMethodDone('Create'));
              }
            }
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    getDeviceId.present();
  }

  deleteDevice(deviceId: string) {
    if (!Utility.validConnectionString(this.iotHubConnectionString)) {
      alert('Invalid IoT Hub Connection String');
    } else {
      let registry = iothub.Registry.fromConnectionString(this.iotHubConnectionString);
      registry.delete(deviceId, this.deviceMethodDone('Delete'));
    }
  }

  private deviceMethodDone(op: string, label: string = 'Device') {
    return (err, deviceInfo, res) => {
      if (err) {
        AppInsightsClient.sendEvent(`${op} ${label}`, this.iotHubConnectionString, { Result: 'Fail' });
        alert(`[${op}] error: ${err.toString()}`);
      }
      if (res) {
        let result = 'Fail';
        if (res.statusCode < 300) {
          result = 'Success';
        }
        AppInsightsClient.sendEvent(`${op} ${label}`, this.iotHubConnectionString, { Result: result });
        if (result === 'Fail') {
          alert(`[${op}] [${result}] status: ${res.statusCode} ${res.statusMessage}`);
        } else {
          this.listDevices();
        }
      }
    };
  }
}
