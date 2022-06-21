export class PubSub {
  subscribers = new Map<string, Array<(...rest) => void>>()
  constructor() {
    this.subscribers = new Map<string, Array<() => void>>()
  }

  subscribe(topic: string, callback: (...rest) => void) {
    const callbacks = this.subscribers.get(topic)
    if (!callbacks) {
      this.subscribers.set(topic, [callback])
    } else{
      this.subscribers.set(topic, callbacks.concat(callback))
    }
  }
  uniqueSubscribe(topic: string, callback: (...rest) => void) {
    this.subscribers.set(topic, [callback])
  }

  remove(topic: string, callback: (...rest) => void) {
    const callbacks = this.subscribers.get(topic)
    if (callbacks) this.subscribers.set(topic, callbacks?.filter(item => item !== callback))
  }

  publish(topic: string, ...rest) {
    const callbacks = this.subscribers.get(topic) || []
    callbacks.forEach(callback => callback(...rest))
  }
}
