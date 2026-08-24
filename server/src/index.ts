import { env } from '../env.ts'
import app from './server.ts'
import { initializeEmail } from './services/email.ts'

const startServer = async () => {
  await initializeEmail()

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`)
    console.log(`Environment: ${env.APP_STAGE}`)
  })
}

startServer()