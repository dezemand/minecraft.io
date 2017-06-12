"use strict"

export default class EventEmitter {
  private EEEvents: Map<string, Set<any>> = new Map()
  private EEOnceEvents: Set<any> = new Set()
  public EEMaxListeners: number = 20

  public on(event: string, callback) {
    if(!this.EEEvents.has(event))
      this.EEEvents.set(event, new Set())
    if(this.EEEvents.get(event).size > this.EEMaxListeners)
      console.warn(`Event ${event} has more than ${this.EEMaxListeners}, memory leak?`)
    this.EEEvents.get(event).add(callback)
  }

  public once(event: string, callback) {
    this.EEOnceEvents.add(callback)
    this.on(event, callback)
  }

  public emit(event: string, ...data) {
    if(!this.EEEvents.has(event))
      return
    for(let callback of this.EEEvents.get(event)) {
      callback(...data)
      if(this.EEOnceEvents.has(callback)) {
        this.EEEvents.get(event).delete(callback)
        this.EEOnceEvents.delete(callback)
      }
    }
  }

  public removeListener(event: string, callback) {
    if(!this.EEEvents.has(event))
      return
    this.EEEvents.get(event).delete(callback)
  }
}
