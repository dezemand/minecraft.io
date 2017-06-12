"use strict"

export default class MinecraftChatCommand {
  constructor(public raw: string) {}

  name = this.raw.split(' ')[0].substr(1)

  getArgs(length: number = 1): Array<string> {
    if(length < 1)
      length = 1

    if(this.raw.indexOf(' ') === -1)
      return null

    const args: Array<string> = this.raw.split(' ')
    args.splice(0, 1)

    const last: Array<string> = args.splice(length - 1, args.length - length + 1)
    args.push(last.join(' '))

    return args
  }
}