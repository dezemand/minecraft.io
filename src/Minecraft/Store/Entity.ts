"use strict"
import MinecraftStore from './Store'
import MinecraftEntity from '../Entity/Entity'

export default class MinecraftStoreEntity extends MinecraftStore {
  add(entity: MinecraftEntity) {
    if(!super.add(entity.id, entity))
      return false
    // client.on('disconnected', () => this.stored.delete(client.id))
    return true
  }
}