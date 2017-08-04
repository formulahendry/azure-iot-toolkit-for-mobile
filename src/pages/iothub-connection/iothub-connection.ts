import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { AppInsightsClient } from '../../utility/appInsightsClient';
import { ViewController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';

@Component({
  selector: 'page-iothub-connection',
  templateUrl: 'iothub-connection.html'
})
export class IothubConnection {
  iotHubConnectionString: string;
  consumerGroup: string;

  constructor(public navParams: NavParams, public viewCtrl: ViewController, public nativeStorage: NativeStorage) {
    this.iotHubConnectionString = this.navParams.get('iotHubConnectionString');
    this.consumerGroup = this.navParams.get('consumerGroup');
  }

  save() {
    AppInsightsClient.sendEvent('Save IoT Hub Connection String', this.iotHubConnectionString);
    this.nativeStorage.setItem('iotHubConnection', {iotHubConnectionString: this.iotHubConnectionString, consumerGroup: this.consumerGroup});
    this.viewCtrl.dismiss(true);
  }

  cancel() {
    AppInsightsClient.sendEvent('Cancel for setting IoT Hub Connection String');
    this.viewCtrl.dismiss(false);
  }
}
