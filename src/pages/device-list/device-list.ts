import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { DevicePage } from '../device/device';
import { Utility } from '../../utility/utility';
import * as iothub from 'azure-iothub';
import { ConnectionString } from 'azure-iot-device';

@Component({
  selector: 'page-device-list',
  templateUrl: 'device-list.html'
})
export class DeviceList {
  items: Array<{ deviceId: string, deviceConnectionString: string, iotHubConnectionString: string }>;
  isLoading: boolean = true;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.items = [];
    let iotHubConnectionString = 'HostName=azure-iot-toolkit-for-mobile.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=bl8Ok/bA1infvdDdi8f6XlMmBmT44BrwOkOo7Q+HuZ0=';
    if (Utility.isApp()) {
      let registry = iothub.Registry.fromConnectionString(iotHubConnectionString);
      registry.list((err, deviceList) => {
        deviceList.forEach((device, index) => {
          this.items.push({
            deviceId: device.deviceId,
            deviceConnectionString: ConnectionString.createWithSharedAccessKey(Utility.getHostName(iotHubConnectionString),
              device.deviceId, device.authentication.SymmetricKey.primaryKey),
            iotHubConnectionString: iotHubConnectionString
          });
        });
        this.isLoading = false;
      });
    } else {
      this.items.push({
        deviceId: 'DoorMonitor-Mock',
        deviceConnectionString: 'HostName=azure-iot-toolkit-for-mobile.azure-devices.net;DeviceId=DoorMonitor;SharedAccessKey=UiTdG5iMFnMk6dnI9GQzq4UKuqAFui1Mq1kq+doHHVQ=',
        iotHubConnectionString: iotHubConnectionString
      });
      this.items.push({
        deviceId: 'DevKit-Mock',
        deviceConnectionString: 'HostName=azure-iot-toolkit-for-mobile.azure-devices.net;DeviceId=DevKit;SharedAccessKey=6lCf2leXhkD7N2pAUsGMx24LnaxfDJ9t5yMgzNmHutg=',
        iotHubConnectionString: iotHubConnectionString
      });
      setTimeout(() => { this.isLoading = false; }, 2000);
    }
  }

  itemTapped(event, item) {
    this.navCtrl.push(DevicePage, {
      item: item
    });
  }
}
