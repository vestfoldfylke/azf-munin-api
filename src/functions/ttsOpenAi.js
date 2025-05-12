// Ikke aktiv

const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const validateToken = require('../lib/validateToken')

app.http('ttsOpenAi', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const openai = new OpenAI()
    console.log('Ny spørring til TTS')
    // console.log(await request.text())

    // Parse the input text from the request body
    const params = await JSON.parse(await request.text())
    // console.log('params:', params.tekst)

    // Validate the token and the role of the user
    try {
      const accesstoken = request.headers.get('Authorization')
      await validateToken(accesstoken, { role: [`${process.env.appName}.basic`, `${process.env.appName}.admin`] })
    } catch (error) {
      return {
        status: 401,
        jsonBody: { error: error.response?.data || error?.stack || error.message }
      }
    }
    // Genererer tale fra tekst
    try {
      const tale = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: params.tekst
      })

      return {
        status: 200,
        body: Buffer.from(await tale.arrayBuffer()).toString('base64')
      }
    } catch (error) {
      console.log('Error: ', error)
      return {
        status: 500,
        jsonBody: { error: error.message }
      }
    }
  }
})
