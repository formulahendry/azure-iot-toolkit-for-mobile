import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as iothub from 'azure-iothub';

@Component({
  selector: 'page-device-info',
  templateUrl: 'device-info.html'
})
export class DeviceInfo {
  infoType: string;
  deviceId: string;
  info: string;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.infoType = this.navParams.get('type');
    this.deviceId = this.navParams.get('deviceId');
    this.info = this.navParams.get('info');
  }

  saveDeviceTwin() {
    let iotHubConnectionString = this.navParams.get('iotHubConnectionString');
    if (!iotHubConnectionString) {
      alert('Error: No IoT Hub Connection String');
      this.navCtrl.pop();
      return;
    }

    try {
      let deviceTwinJson = JSON.parse(this.info);
      let registry = iothub.Registry.fromConnectionString(iotHubConnectionString);
      registry.updateTwin(this.deviceId, this.info, deviceTwinJson.etag, (err, deviceTwin) => {
        if (err) {
          alert(`Error: ${err.message}`);
        } else {
          alert('Updated Successfully');
          this.info = JSON.stringify(deviceTwin, null, 4);
        }
      });
    } catch (e) {
      alert(`Error: ${e.toString()}`);
    }
  }
}
