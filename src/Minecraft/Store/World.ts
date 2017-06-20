"use strict"
import MinecraftStore from './Store'
import MinecraftWorld from '../World'

export default class MinecraftWorldStore extends MinecraftStore {
  addWorld (world: MinecraftWorld, isDefault: boolean = false): boolean {
    world.setStore(this, this.worldId)
    if (!this.add(world.id, world))
      return false
    if (isDefault)
      this._defaultWorld = world.id
  }

  private _worldId: number = 0
  private _defaultWorld: number

  public get defaultWorld (): MinecraftWorld {
    if (this._defaultWorld === null)
      throw new Error('Cannot use default world without setting it first')
    return this.stored.get(this._defaultWorld)
  }

  private get worldId (): number {
    return this._worldId++
  }
}
