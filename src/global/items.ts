import { Injectable } from '@angular/core';
import { Transport } from '../utility/transport';

@Injectable()
export class Items {
  items: any[] = [];
  transport: Transport;
  connectionStatus: string = 'disconnected';
  message: Array<{ deviceId: string, message: string, time: string}> = [];

  constructor() {}

  query(params?: any) {
    if (!params)
      return this.items;

    return this.items.filter((item) => {
      for (let key in params) {
        let field = item[key];
        if (typeof field === 'string' && field.toLowerCase().indexOf(params[key].toLowerCase()) >= 0) {
          return item;
        } else if (field === params[key]) {
          return item;
        }
      }
      return null;
    });
  }

  add(item: any) {
    this.items.push(item);
  }

  delete(item: any) {
    this.items.splice(this.items.indexOf(item), 1);
  }
}
