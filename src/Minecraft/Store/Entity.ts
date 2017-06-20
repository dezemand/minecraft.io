"use strict"
import MinecraftStore from './Store'
import MinecraftEntity from '../Entity/Entity'
import MinecraftClient from '../Client'
import {Position, StoreQuery} from '../../Interfaces'

export default class MinecraftStoreEntity extends MinecraftStore {
  find (query: StoreQuery = {}): Set<MinecraftEntity> {
    let results: Set<MinecraftEntity> = new Set()
    for (let entity of this.stored.values()) {
      if (query.id !== undefined && query.id === entity.id)
        results.add(entity)
      if (query.world !== undefined && query.world === entity.world)
        results.add(entity)
    }
    return results
  }

  addEntity (entity: MinecraftEntity) {
    return super.add(entity.id, entity)
  }

  inRange (pos: Position, range: number, callback: (MinecraftClient) => void): void {
    this.all((cl: MinecraftClient) => {
      if ((cl.pos.x - range) > pos.x) return
      if ((cl.pos.x + range) < pos.x) return
      if ((cl.pos.y - range) > pos.y) return
      if ((cl.pos.y + range) < pos.y) return
      callback(cl)
    })
  }
}