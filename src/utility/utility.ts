export class Utility {
    public static isApp(): boolean {
        return !document.URL.startsWith('http');
    }

    public static getHostName(iotHubConnectionString: string): string {
        let result = /^HostName=([^=]+);/.exec(iotHubConnectionString);
        return result[1];
    }
}
