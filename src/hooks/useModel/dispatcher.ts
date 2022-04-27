export default class Dispatcher {
  data = {}
  callbacks = {}
  update = (namespace: string) => {
    this.callbacks[namespace]
    this.callbacks[namespace]?.forEach((callback: (val: any) => void) => callback(this.data[namespace]))
  }
}
