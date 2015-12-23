"use strict"
const MinecraftEntity = require('./MinecraftEntity')

class MinecraftEntityPlayer extends MinecraftEntity {
  constructor(client) {
    super(client._server, client.id, 'player', client.pos, client.look, client.onGround)
    var self = this
    this._client = client
    client.on('position', pos => {
      self.pos.x = pos.x
      self.pos.y = pos.y
      self.pos.z = pos.z
      self.clientsInRange.forEach(cl => self.sendPosition(cl, pos))
    })
    client.on('look', look => {
      self.look.yaw = look.yaw
      self.look.pitch = look.pitch
      self.clientsInRange.forEach(cl => self.sendLook(cl))
    })
  }
  spawn(cl) {
    cl.send('named_entity_spawn', {
      entityId: this.id,
      playerUUID: this._client.uuid,
      x: this.pos.x,
      y: this.pos.y,
      z: this.pos.z,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      currentItem: 0,
      metadata: []
    })
  }
  sendPosition(cl, dPos) {
    cl.send('rel_entity_move', {
      entityId: this.id,
      dX: dPos.x,
      dY: dPos.y,
      dZ: dPos.z,
      onGround: this._client.onGround
    })
  }
  sendLook(cl) {
    cl.send('entity_look', {
      entityId: this.id,
      yaw: this.look.yaw,
      pitch: this.look.pitch,
      onGround: this._client.onGround
    })
  }
}

module.exports = MinecraftEntityPlayer