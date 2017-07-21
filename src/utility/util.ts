declare var CryptoJS: any;
declare var jQuery: any;

export class Util {
  static str2ab(str) {
    str = decodeURI(encodeURIComponent(str));
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  static getSASToken(account, key, keyName) {
    var sr = account + '.azure-devices.net';
    var se = Math.round(new Date().getTime() / 1000) + 60;
    var stringtosign = sr + '\n' + se;
    var sig = Util.encodeUriComponentStrict(CryptoJS.HmacSHA256(stringtosign, CryptoJS.enc.Base64.parse(key)).toString(CryptoJS.enc.Base64));
    return 'SharedAccessSignature sr=' + sr + '&sig=' + sig + '&se=' + se + '&skn=' + keyName;
  }

  static encodeUriComponentStrict(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }

  static Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = '';
    len = array.length;
    i = 0;
    while (i < len) {
      c = array[i++];
      switch (c >> 4) {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
          // 0xxxxxxx
          out += String.fromCharCode(c);
          break;
        case 12: case 13:
          // 110x xxxx   10xx xxxx
          char2 = array[i++];
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          // 1110 xxxx  10xx xxxx  10xx xxxx
          char2 = array[i++];
          char3 = array[i++];
          out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
          break;
      }
    }

    return out;
  }

  static restAPI(account, key, keyName, method, path, header, body, success, fail) {
    var sasToken = this.getSASToken(account, key, keyName);
    var apiVersionString = 'api-version=2016-11-14';
    if (path.indexOf('?') !== -1) {
      path += ('&' + apiVersionString);
    } else {
      path += ('?' + apiVersionString);
    }
    var url = 'https://iothub-rest-api.azurewebsites.net/' + account + path;
    if (typeof header === 'function') {
      success = header;
      fail = body;
      header = {};
      body = null;
    } else if (typeof body === 'function') {
      fail = success;
      success = body;
      body = null;
    } else if (typeof header === 'string') {
      fail = success;
      success = body;
      body = header;
      header = {};
    }

    header = header || {};
    header.Authorization = sasToken;

    fail = fail || function () { };

    jQuery.ajax({
      url: url,
      type: method,
      headers: header,
      data: body
    }).done(success).fail(fail);
  }
}
