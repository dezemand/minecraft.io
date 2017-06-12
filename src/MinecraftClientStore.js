"use strict"
const MinecraftStore = require('./MinecraftStorePrototype')

class MinecraftClientStore extends MinecraftStore {
  find(query = {}) {
    var clients = this._stored
    var list = Object.keys(clients).map(k => clients[k])
    if(query.id !== undefined)
      list.forEach((client, key) => {if(client.id !== query.id) list.splice(key, 1)})
    if(query.uuid !== undefined)
      list.forEach((client, key) => {if(client.uuid !== query.uuid) list.splice(key, 1)})
    if(query.userName !== undefined)
      list.forEach((client, key) => {if(client.userName !== query.userName) list.splice(key, 1)})
    return list
  }
  add(id, client) {
    var self = this
    if(!super.add(id, client)) return false
    client.on('disconnected', () => delete self._stored[id])
  }
  others(client) {
    var clients = this._stored
    return callback => {
      for(var k in clients) {
        if(!clients.hasOwnProperty(k)) continue;
        if(clients[k].uuid == client.uuid) continue;
        callback(clients[k])
      }
    }
  }
  inRange(pos, range, callback) {
    this.all(cl => {
      if((cl.pos.x - range) > pos.x) return
      if((cl.pos.x + range) < pos.x) return
      if((cl.pos.y - range) > pos.y) return
      if((cl.pos.y + range) < pos.y) return
      callback(cl)
    })
  }
}

module.exports = MinecraftClientStore