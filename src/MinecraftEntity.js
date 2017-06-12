"use strict"
const EventEmitter = require('events').EventEmitter

class MinecraftEntity extends EventEmitter {
  constructor(server, id, type, pos = {x: 0, y: 0, z: 0}, look = {yaw: 0, pitch: 0}, onGround = false) {
    super()
    var self = this
    this._server = server
    this.clients = server.clients
    this.type = type
    this.pos = pos
    this.look = look
    this.onGround = onGround
    this._init = false
    this.id = id
    this.clientsInRange = []
    this.clients.inRange(pos, 10 * 16, cl => self.clientsInRange.push(cl))
    this._server.entities.add(this)
  }
  init() {
    if(this._init) throw new Error('Cannot `init` MinecraftEntity twice')
    this._init = true
  }
  tick() {
    this._server.clients.inRange(this.pos, 10 * 16, cl => {
      console.log('cl')
    })
    console.log('done')
  }
}

module.exports = MinecraftEntity