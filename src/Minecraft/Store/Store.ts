"use strict"

export default class MinecraftStore {
  stored: Map<string, any> = new Map()
  events: Map<string, Set<any>> = new Map()

  add(id: any, item: any): boolean {
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

  on(event: string, callback: any) {
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
