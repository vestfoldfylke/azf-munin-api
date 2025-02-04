const { app } = require('@azure/functions')
const { Mistral } = require('@mistralai/mistralai');
const validateToken = require('../lib/validateToken')

app.http('multimodalMistral', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // const openai = new OpenAI()
        const pixtral = new Mistral({apiKey: process.env.MISTRAL_API_KEY});
        const params = await JSON.parse(await request.text())
        let msg
    
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
        console.log("Ny spørring til Pixtral")
        try {
          msg = [{ role: 'system', content: params.kontekst }]
          msg.push(...params.messageHistory)
    
          if (params.bilde_base64String !== '') {
            console.log("Bilde!!!")
            console.log(params.messageHistory.at(-1).content)
            msg.push(
              {
                role: "user",
                content: [
                  { type: "text", text: params.message },
                  {
                    type: "image_url",
                    imageUrl: params.bilde_base64String,
                  },
                ],
              },
            )
          } else {
            console.log("Ikke bilde!!!")
            // msg.push({ role: 'user', content: params.message })
          }
        } catch (error) {
          return {
            jsonBody: { error: error.response?.data || error?.stack || error.message }
          }
        }
        try {
          const completion = await pixtral.chat.complete({
            messages: msg,
            model: params.model,
            temperature: params.temperature
          })
    
          return {
            body: JSON.stringify(completion)
          }
        } catch (error) {
          return {
            jsonBody: { error: error.response?.data || error?.stack || error.message }
          }
        }
      }
    })
  