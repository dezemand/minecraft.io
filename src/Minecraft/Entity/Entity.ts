"use strict"
import Events from '../../EventEmitter'
import MinecraftClient from '../Client'
import MinecraftServer from '../Server'

export default class MinecraftEntity extends Events {
  protected inited: boolean = false
  public clientsInRange: Array<MinecraftClient> = []

  constructor (public server: MinecraftServer, public id, public type, public pos, public look, public onGround: boolean = false) {
    super()
    this.server.clients.inRange(pos, 10 * 16, cl => this.clientsInRange.push(cl))
    this.server.entities.add(this)
  }

  init() {
    if(this.inited)
      throw new Error('Cannot init MinecraftEntity twice')
    this.inited = true
  }

  tick() {

  }
}
