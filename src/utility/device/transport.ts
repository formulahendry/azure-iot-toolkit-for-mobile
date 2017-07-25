import { Util } from './util';
import { Subscription } from './data/subscription';

declare var Paho: any;

export class Transport {
  private client: any;
  private subscriptions: Subscription[];
  private connected: boolean;
  private clientId: string;
  private host: string;
  private port: number;

  private options = {
    timeout: 3,
    cleanSession: true,
    mqttVersion: 4,
    useSSL: true,
    onSuccess: this.onConnect,
    onFailure: this.onFail,
    keepAliveInterval: null,
    userName: null,
    password: null,
  };

  constructor(connectionString: string, keepAlive: number) {
    var ops = Util.getOptionsFromConnectionString(connectionString);
    this.options.keepAliveInterval = keepAlive;
    this.options.userName = ops.username;
    this.options.password = ops.password;
    this.host = ops.host;
    this.port = ops.port;
    this.clientId = ops.clientId;
    this.subscriptions = [];

    this.client = new Paho.MQTT.Client(ops.host, ops.port, '/$iothub/websocket?iothub-no-client-cert=true', ops.clientId);
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.dispatchMessage.bind(this);
    // ui fill. not do here
  }

  public getOptions() {
    return {
      host: this.host,
      port: this.port,
      username: this.options.userName,
      password: this.options.password,
      clientId: this.clientId,
      keepAlive: this.options.keepAliveInterval,
    };
  }

  public connect(success: Function, fail: Function) {
    if (success) {
      this.options.onSuccess = () => {
        this.connected = true;
        success();
      };
    } else {
      this.options.onSuccess = this.onConnect;
    }

    if (fail) {
      this.options.onFailure = (err: any) => {
        this.connected = false;
        fail(err);
      };
      this.client.onConnectionLost = (err: any) => {
        this.connected = false;
        fail(err);
      };
    } else {
      this.options.onFailure = this.onFail;
      this.client.onConnectionLost = this.onConnectionLost;
    }

    this.client.connect(this.options);
  }

  public disconnect() {
    this.client.disconnect();
  }

  public subscribe(subscription: Subscription) {
    if (!this.connected) {
      // websocketclient.render.showError("Not connected");
      return false;
    }

    if (subscription.topic.length < 1) {
      // websocketclient.render.showError("Topic cannot be empty");
      return false;
    }

    if (this.subscriptions.some((s) => { return s.topic === subscription.topic; })) {
      // websocketclient.render.showError('You are already subscribed to this topic');
      return false;
    }

    this.client.subscribe(subscription.topic, { qos: subscription.qos });
    this.subscriptions.push(subscription);
    return true;
  }

  public publish(topic: string, payload: string, qos: number, retain: boolean) {

    if (!this.connected) {
      // websocketclient.render.showError("Not connected");
      return false;
    }

    var message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    message.qos = qos;
    message.retained = retain;
    this.client.send(message);
  }

  public unsubscribe(subscription: Subscription) {
    if (subscription !== undefined) {
      this.client.unsubscribe(subscription.topic);
    }
  }

  public getClientId() {
    return this.clientId;
  }

  private onConnect() {
    this.connected = true;
    console.log('connected');
    // $('#publishTopic').val('devices/' + this.clientId + '/messages/events/');
    // TODO ADD INTERFACE MESSAGE, TWIN/METHODS WILL EXTEND THIS INTERFACE
    // this.subscribe('devices/' + this.clientId + '/messages/devicebound/#',0,'ffbb00');
    // websocketclient.subscribe(websocketclient.twinTopic.desired,0,'7cbb00');
    // websocketclient.subscribe(websocketclient.twinTopic.response,0,'00a1f1');
    // websocketclient.subscribe(websocketclient.methodTopic.post,0,'f65314');
  }

  private onFail(err) {
    this.connected = false;
    console.log(err);
    // show error
  }

  private dispatchMessage(message: any) {
    var subscription = this.getSubscriptionForTopic(message.destinationName);

    var messageObj: any = {
      'topic': message.destinationName,
      'retained': message.retained,
      'qos': message.qos,
      'payload': message.payloadString,
      'timestamp': new Date().getTime(),
    };
    subscription.messageHandler(messageObj.topic, messageObj.payload, messageObj);
  }

  private onConnectionLost(responseObject: any) {
    this.connected = false;
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage);
    }
    // $('body.connected').removeClass('connected').addClass('notconnected').addClass('connectionbroke');
    // websocketclient.render.show('conni');
    // websocketclient.render.hide('publish');
    // websocketclient.render.hide('sub');
    // websocketclient.render.hide('messages');
    // websocketclient.render.hide('twin');
    // websocketclient.render.hide('method');

    // Cleanup messages
    // websocketclient.render.clearMessages();

    // Cleanup subscriptions
    this.subscriptions = [];
    // websocketclient.render.clearSubscriptions();
  }

  private getSubscriptionForTopic(topic: string): Subscription {
    var i;
    for (i = 0; i < this.subscriptions.length; i++) {
      if (this.compareTopics(topic, this.subscriptions[i].topicReg)) {
        return this.subscriptions[i];
      }
    }
    return null;
  }

  private compareTopics(topic: string, regexr: RegExp) {
    return regexr.test(topic);
  }
}
