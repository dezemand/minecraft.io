"use strict"
import Events from '../EventEmitter'
import {createServer, Server, Client} from 'minecraft-protocol'
import * as NanoTimer from 'nanotimer'
import MinecraftClient from './Client'
import MinecraftClientStore from './Store/Client'
import MinecraftEntityStore from './Store/Entity'
import Debug from '../Debug'

const debug: Debug = new Debug('MinecraftServer')

export default class MinecraftServer extends Events {
  public clients: MinecraftClientStore = new MinecraftClientStore()
  public entities: MinecraftEntityStore = new MinecraftEntityStore()
  private server: Server = null
  public startTime: Date = new Date()
  private timer: NanoTimer = new NanoTimer()
  readonly tickInterval = 1000 / 20

  constructor (public options) {
    super()
    debug.log('Constructed')
  }

  public listen (port: number = 25565, host: string = '0.0.0.0'): void {
    if (this.server !== null)
      throw new Error(`Cannot listen twice`)
    this.options.port = port
    this.options.host = host
    this.server = createServer(this.options)
    this.initEvents()
    this.timer.setInterval(this.tick.bind(this), [], this.tickInterval + 'u')
    debug.log(`Listening on ${host}:${port}, ticking every ${this.tickInterval} ms`)
  }

  private initEvents (): void {
    this.server.on('login', this.addClient.bind(this))

    // Temp events
    this.clients.on('chat', (client: MinecraftClient, data) => {
      const msg = `<${client.userName}> ${data.message}`
      this.clients.all((cl: MinecraftClient) => cl.sendMessage({text: msg}))
      console.log(msg)
    })
    this.clients.on('command', (client: MinecraftClient, cmd) => {
      if(cmd.name === 'gamemode')
        client.gameMode = parseInt(cmd.getArgs(2)[0])
      else if(cmd.name === 'latency')
        client.sendMessage({text: 'Latency: ' + client.latency + 'ms'})
      else if(cmd.name === 'heal')
        client.updateHealth(20, 20)
      else
        client.sendMessage({text: 'Command not found', italic: true, color: 'gray'})
    })
    this.clients.on('disconnected', (client: MinecraftClient) => {
      this.clients.all((cl: MinecraftClient) => {
        cl.infoPlayerLeft([client])
        cl.sendMessage({color: 'yellow', translate: 'multiplayer.player.left', 'with': [client.userName]})
      })
      console.log(`${client.userName} left the game`)
      this.updatePlayerCount()
    })
    this.clients.on('initiated', (client: MinecraftClient) => {
      client.sendMessage({text: 'Welcome, ' + client.userName + '!'})
    })
    this.clients.on('gameModeChange', (client: MinecraftClient) => {
      client.sendMessage({
        text: 'Your gamemode has been changed',
        italic: true,
        color: 'gray'
      })
    })
  }

  private addClient (rawClient: Client): void {
    debug.log(`Client joined, uuid: ${rawClient.uuid}`)
    const client: MinecraftClient = new MinecraftClient(rawClient, this)
    if(this.clients.find({uuid: client.uuid}).length !== 0)
      client.kick({text: 'UUID Duplicate'})
    client.init()
  }

  get maxPlayers(): number {
    return this.server.maxPlayers
  }

  updatePlayerCount () {
    this.server.playerCount = this.clients.size
  }

  tick () {
    this.clients.all(client => client.tick())
    this.entities.all(entity => entity.tick())
  }
}