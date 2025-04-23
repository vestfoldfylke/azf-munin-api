const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const validateToken = require('../lib/validateToken')
// require("dotenv").config();

app.http('noraChat', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const accesstoken = request.headers.get('Authorization')
      await validateToken(accesstoken, { role: [`${process.env.appName}.basic`, `${process.env.appName}.admin`, `${process.env.appName}.admin`] })
      const userMessage = await request.text()
      const userMessageJson = await JSON.parse(userMessage)

      const openai = new OpenAI({
        baseURL: process.env.base_url_hf_nora,
        apiKey: process.env.HUGGINGFACEHUB_API_TOKEN
      })

      const respons = await openai.chat.completions.create({
        model: 'norallm/normistral-7b-warm-instruct',
        messages: [{
          role: 'user',
          content: userMessageJson.question
        }],
        stream: false,
        max_tokens: userMessageJson.parameters.max_tokens,
        max_new_tokens: userMessageJson.parameters.max_new_tokens,
        top_k: userMessageJson.parameters.top_k,
        top_p: userMessageJson.parameters.top_p,
        temperature: userMessageJson.parameters.temperature,
        do_sample: userMessageJson.parameters.do_sample,
        repetition_penalty: userMessageJson.parameters.repetition_penalty,
        return_full_text: userMessageJson.parameters.return_full_text,
        stop: userMessageJson.parameters.stop
      })

      const m = await respons
      return {
        body: m.choices[0].message.content
      }
    } catch (error) {
      return {
        status: 401,
        body: JSON.stringify({ error: error.message })
      }
    }
  }
})
