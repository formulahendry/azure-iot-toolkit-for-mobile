export class Utility {
    public static isApp(): boolean {
        return !document.URL.startsWith('http');
    }

    public static getHostName(iotHubConnectionString: string): string {
        let result = /^HostName=([^=]+);/.exec(iotHubConnectionString);
        return result[1];
    }

    public static validConnectionString(iotHubConnectionString: string): boolean {
        let result = iotHubConnectionString.match(/^\s*HostName=(.*?)\.azure\-devices\.net;SharedAccessKeyName=(.*?);SharedAccessKey=(.*?)\s*$/);
        if (result && result[1] && result[2] && result[3]) {
            return true;
        }
        return false;
    }
}
