export class Subscription {
    public topic: string;
    public topicReg: RegExp;
    public qos: number;
    public messageHandler: Function;
}
