"use strict"
import {Event} from '../../Enums'

export default class MinecraftStore {
  stored: Map<number | string, any> = new Map()
  events: Map<Event, Set<any>> = new Map()

  add (id: number | string, item: any): boolean {
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

  get array(): Array<any> {
    const arr: Array<any> = []
    for(let obj of this.stored.values())
      arr.push(obj)
    return arr
  }

  get size(): number {
    return this.stored.size
  }

  on (event: Event, callback: any) {
    if(!this.events.has(event))
      this.events.set(event, new Set())
    this.events.get(event).add(callback)
  }

  all(callback: any) {
    if(!this.stored)
      return
    for(let item of this.stored.values())
      callback(item)
  }
}
