declare var appInsights;

export class AppInsightsClient {

  public static sendEvent(eventName: string, connectionString?: string,  properties?: { [key: string]: string; }): void {
    properties = this.addIoTHubHostName(connectionString, properties);
    appInsights.trackEvent(eventName, properties);
  }

  private static addIoTHubHostName(iotHubConnectionString?: string, properties?: { [key: string]: string; }): any {
    let newProperties = properties ? properties : {};

    if (iotHubConnectionString) {
        let iotHubHostName = /^HostName=([^=]+);/.exec(iotHubConnectionString);
        if (iotHubHostName && iotHubHostName[1]) {
          newProperties.IoTHubHostName = iotHubHostName[1];
        }
    }
    return newProperties;
  }
}
