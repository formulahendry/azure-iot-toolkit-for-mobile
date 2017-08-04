import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { HelloIonicPage } from '../pages/hello-ionic/hello-ionic';
import { DevicePage } from '../pages/device/device';
import { DeviceList } from '../pages/device-list/device-list';
import { SubscribePage } from '../pages/subscribe/subscribe';
import { PublishPage } from '../pages/publish/publish';
import { SimulatePage } from '../pages/simulate/simulate';
import { IothubConnection } from '../pages/iothub-connection/iothub-connection';

import { Items } from '../global/items';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { Gyroscope } from '@ionic-native/gyroscope';
import { NativeStorage } from '@ionic-native/native-storage';

@NgModule({
  declarations: [
    MyApp,
    HelloIonicPage,
    DevicePage,
    DeviceList,
    SubscribePage,
    PublishPage,
    SimulatePage,
    IothubConnection
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HelloIonicPage,
    DevicePage,
    DeviceList,
    SubscribePage,
    PublishPage,
    SimulatePage,
    IothubConnection
  ],
  providers: [
    Items,
    StatusBar,
    SplashScreen,
    Network,
    LocalNotifications,
    Gyroscope,
    NativeStorage,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
