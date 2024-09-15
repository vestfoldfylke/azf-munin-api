const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const validateToken = require('../lib/validateToken')
// require("dotenv").config();

app.http('multimodalOpenAi', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const openai = new OpenAI()
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

    try {
      msg = [{ role: 'system', content: params.kontekst }]
      msg.push(...params.messageHistory)

      if (params.bilde_base64String !== '') {
        msg.push({
          role: 'user',
          content: [
            { type: 'text', text: params.message },
            {
              type: 'image_url',
              image_url: {
                url: params.bilde_base64String
              }
            }
          ]
        })
      } else {
        msg.push({ role: 'user', content: params.message })
      }

      // const moderation = await openai.moderations.create({ input: "I want to kill them." });
      // console.log(params.msg);
      // console.log(JSON.stringify(moderation));
    } catch (error) {
      return {
        jsonBody: { error: error.response?.data || error?.stack || error.message }
      }
    }
    try {
      const completion = await openai.chat.completions.create({
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
