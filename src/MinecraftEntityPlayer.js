"use strict"
const MinecraftEntity = require('./MinecraftEntity')

class MinecraftEntityPlayer extends MinecraftEntity {
  constructor(client) {
    super(client._server, client.id, 'player', client.pos, client.look)
    this._client = client
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
}

module.exports = MinecraftEntityPlayer