const { app } = require('@azure/functions')
const { Mistral } = require('@mistralai/mistralai');
const validateToken = require('../lib/validateToken');
const { logger } = require('@vtfk/logger');

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
          logger('error', ['multimodalMistral - Tokenvalidation', error?.message])
          return {
            status: 401,
            jsonBody: { error: error.response?.data || error.message }
          }
        }

        try {
          msg = [{ role: 'system', content: params.kontekst }]
          msg.push(...params.messageHistory)
    
          if (params.bilde_base64String !== '') {
            logger('info', ['multimodalMistral', 'Bilde er sendt med brukerinput'])
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
          }
        } catch (error) {
          logger('error', ['multimodalMistral - Noe gikk galt med melding/bilde'])
        }
        try {
          const completion = await pixtral.chat.complete({
            messages: msg,
            model: params.model,
            temperature: params.temperature
          })
          logger('info', ['multimodalMistral', 'success'])
          return {
            body: JSON.stringify(completion)
          }
        } catch (error) {
          logger('error', ['multimodalMistral - Noe gikk galt med chat.complete'])
        }
      }
    })
  