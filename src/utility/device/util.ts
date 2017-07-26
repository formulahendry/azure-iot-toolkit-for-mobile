declare var CryptoJS: any;

export class Util {
  static getOptionsFromConnectionString(connectionString) {
    let connectionStringArray: string[] = connectionString.replace(/\s/g, '').split(';');
    let connectionObject: any = {};
    let options: any = {};
    connectionStringArray.forEach(function (item) {
      let items = item.split('=');
      connectionObject[items[0]] = items[1];
    });

    options.host = connectionObject.HostName;
    options.port = 443;
    options.clientId = connectionObject.DeviceId;
    options.username = connectionObject.HostName + '/' + connectionObject.DeviceId + '/DeviceClientType=azure-iot-device%2F1.1.2&api-version=2016-11-14';
    options.password = this.getSaSToken(connectionObject);
    return options;
  }

  static getSaSToken(connectionObject) {
    var sr = this.encodeUriComponentStrict(connectionObject.HostName + '/devices/' + connectionObject.DeviceId);
    var se = Math.round(new Date().getTime() / 1000) + 24 * 3600;
    var StringToSign = sr + '\n' + se;
    var SharedKey = connectionObject.SharedAccessKey;
    var sig = this.encodeUriComponentStrict(CryptoJS.HmacSHA256(StringToSign, CryptoJS.enc.Base64.parse(SharedKey)).toString(CryptoJS.enc.Base64));
    return 'SharedAccessSignature sr=' + sr + '&sig=' + sig + '&se=' + se;
  }

  static encodeUriComponentStrict(str) {
    // this stricter version of encodeURIComponent is a recommendation straight out of the MDN docs, see:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#Description
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }
}
