"use strict"
import MinecraftStore from './Store'
import MinecraftClient from '../Client'
import {Position, StoreQuery} from '../../Interfaces'
import {Event} from '../../Enums'

export default class MinecraftStoreClient extends MinecraftStore {
  find (query: StoreQuery = {}): Set<MinecraftClient> {
    let results: Set<MinecraftClient> = new Set()
    for(let client of this.stored.values()) {
      if(query.id !== undefined && query.id === client.id)
        results.add(client)
      if(query.uuid !== undefined && query.uuid === client.uuid)
        results.add(client)
      if(query.userName !== undefined && query.userName === client.userName)
        results.add(client)
      if (query.world !== undefined && query.world === client.world)
        results.add(client)
    }
    return results
  }

  addClient (client: MinecraftClient): boolean {
    if (!this.add(client.id, client))
      return false
    client.on(Event.ClientDisconnect, () => this.del(client))
    return true
  }

  others(client: MinecraftClient): (MinecraftClient) => void {
    return callback => {
      for(let otherClient of this.stored.values())
        if(client.uuid !== otherClient.uuid)
          callback(client)
    }
  }

  inRange(pos: Position, range: number, callback: (MinecraftClient) => void): void {
    this.all((cl: MinecraftClient) => {
      if((cl.pos.x - range) > pos.x) return
      if((cl.pos.x + range) < pos.x) return
      if ((cl.pos.z - range) > pos.z) return
      if ((cl.pos.z + range) < pos.z) return
      callback(cl)
    })
  }

  del (client: MinecraftClient): void {
    this.stored.delete(client.id)
  }
}