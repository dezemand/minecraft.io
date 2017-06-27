"use strict"
import {Event} from '../../Enums'

export default class MinecraftStore {
  protected stored: Map<number | string, any> = new Map()
  protected events: Map<Event, Set<any>> = new Map()

  protected add (id: number | string, item: any): boolean {
    if(this.stored.has(id))
      return false
    this.stored.set(id, item)
    for(let event of this.events.keys())
      item.on(event, (...args) => {
        for(let callback of this.events.get(event))
          callback.apply(null, [item].concat(args))
      })
    return true
  }

  public get array (): Array<any> {
    const arr: Array<any> = []
    for(let obj of this.stored.values())
      arr.push(obj)
    return arr
  }

  public get size (): number {
    return this.stored.size
  }

  public on (event: Event, callback: any): void {
    if(!this.events.has(event))
      this.events.set(event, new Set())
    this.events.get(event).add(callback)
  }

  public all (callback: any): void {
    if(!this.stored)
      return
    for(let item of this.stored.values())
      callback(item)
  }
}
