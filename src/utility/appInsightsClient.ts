'use strict';
import { Utility } from './utility';

declare var appInsights;

export class AppInsightsClient {

  public static sendEvent(eventName: string, connectionString?: string,  properties?: { [key: string]: string; }): void {
    properties = this.addIoTHubHostName(connectionString, properties);
    appInsights.trackEvent(eventName, properties);
  }

  private static addIoTHubHostName(iotHubConnectionString?: string, properties?: { [key: string]: string; }): any {
    let newProperties = properties ? properties : {};

    if (iotHubConnectionString) {
      let iotHubHostName = Utility.getHostName(iotHubConnectionString);
      if (iotHubHostName) {
        newProperties.IoTHubHostName = iotHubHostName;
      }
    }
    return newProperties;
  }
}
