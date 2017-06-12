"use strict"

class MinecraftStore {
  constructor() {
    this._stored = {}
    this._listening = {}
  }
  add(id, item) {
    if(this._stored[id]) return false
    this._stored[id] = item
    for(var eventName in this._listening)
      if(this._listening.hasOwnProperty(eventName))
        this._bindListener(item, eventName)
    return true
  }
  get array() {
    var items = this._stored
    return Object.keys(items).map(k => items[k])
  }
  get length() {
    return Object.keys(this._stored).length
  }
  on(eventName, executer) {
    if(!this._listening[eventName]) this._listening[eventName] = [executer]
    else this._listening.push(executer)
  }
  all(callback) {
    for(var k in this._stored) {
      if(!this._stored.hasOwnProperty(k)) continue;
      callback(this._stored[k])
    }
  }
  _bindListener(client, event) {
    var listeners = this._listening[event]
    client.on(event, function() {
      var eventArgs = [].slice.apply(arguments)
      listeners.forEach(executer => {
        var args = [client]
        eventArgs.forEach(arg => args.push(arg))
        executer.apply(null, args)
      })
    })
  }
}

module.exports = MinecraftStore