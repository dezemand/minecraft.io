"use strict"

// TODO: Register commands and let them work with TAB completion

class MinecraftChatCommand {
  constructor(str) {
    this.name = str.split(' ')[0].split('/')[1]
    this.raw = str
  }
  getArgs(length = 1) {
    if(length < 1) length = 1
    if(this.raw.indexOf(' ') === -1) return ''
    var args = this.raw.split(' ')
    args.splice(0, 1)
    var last = args.splice(length - 1, args.length - length + 1)
    args.push(last.join(' '))
    return args
  }
}
module.exports = MinecraftChatCommand