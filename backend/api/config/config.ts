import dotenv from 'dotenv'
dotenv.config() 

export const config = {
  port: process.env.PORT,
  corsOrigins: [process.env.FRONTEND_URL, process.env.FRONTEND_TEST_URL],
  
  // Game settings
  game: {
    gridSize: 20,
    gameSpeed: 200, // ms per tick
    maxPlayers: 8,
    minPlayers: 2,
  },
  
  // Room settings
  room: {
    codeLength: 6,
    maxRooms: 100,
  }
}
