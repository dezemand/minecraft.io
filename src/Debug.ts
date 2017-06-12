"use strict"
import debug from 'debug'

export default class Debug {
  constructor(public name: string) {}
  private db = debug('minecraft.io:' + this.name)

  log(message: string) {
    this.db(message)
  }
}
