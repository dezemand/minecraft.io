"use strict"
const MinecraftServer = require('./dist/Minecraft/Server').default

const server = new MinecraftServer({
  motd: 'A Javascript server!',
  version: '1.12'
})
server.createWorld({
  type: 0, // Overworld
  name: 'Example World'
}, true)

server.listen(25565)
