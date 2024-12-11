const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const axios = require('axios')

app.http('wakeNoraDev', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (myTimer, context) => {
    context.log('Timer function processed request.')
    try {
      const openai = new OpenAI({
        baseURL: process.env.base_url_hf_nora,
        apiKey: process.env.HUGGINGFACEHUB_API_TOKEN
      })

      const wakeNora = async () => openai.chat.completions.create({
        model: 'norallm/normistral-7b-warm-instruct',
        messages: [{
          role: 'user',
          content: 'Nora du må våkne!'
        }],
        stream: false,
        max_tokens: 500,
        max_new_tokens: 1024,
        top_k: 64,
        top_p: 0.9,
        stop: ['<|im_end|>'],
        temperature: 0.2,
        do_sample: true,
        repetition_penalty: 1.0,
        return_full_text: true
      })

      const wakeNB = async () => {
        const response = await axios.post(
          process.env.base_url_hf_nbtranscript,
          'WakeWake',
          {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.HUGGINGFACEHUB_API_TOKEN}`,
          'Content-Type': 'audio/flac'
        }
          }
        )
        return response.data
      }

      const w1 = await wakeNora()
      const w2 = await wakeNB() 
      console.log("Nora: ", w1)
      console.log("NB: ", w2)
    } catch (error) {
      console.log(error.message)
    }
  }
})
