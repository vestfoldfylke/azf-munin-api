const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const validateToken = require('../lib/validateToken')
// require("dotenv").config();

app.http('assistantOpenAi', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const accesstoken = request.headers.get('Authorization')
      await validateToken(accesstoken, { role: [`${process.env.appName}.basic`, `${process.env.appName}.admin`] })
      const openai = new OpenAI()
      const params = JSON.parse(await request.text())
      let thread // = formPayload.get('thread_id')

      // Sjekker om det skal opprettes en ny tråd eller om det skal brukes en eksisterende
      if (params.new_thread) {
        // Lager en ny tråd
        thread = await openai.beta.threads.create({
          messages: params.messageHistory
        })
      } else {
        // Henter en eksisterende tråd
        thread = await openai.beta.threads.retrieve(params.thread_id)
        // Oppdaterer tråden med siste melding i messageHistory
        const messageLength = params.messageHistory.length
        await openai.beta.threads.messages.create(thread.id, {
          role: 'user',
          content: params.messageHistory[messageLength - 1].content // Siste melding i messageHistory
        })
      }

      // Kjører tråden på valgt assistent
      const run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        {
          assistant_id: params.assistant_id
        }
      )

      // List messages in thread
      let messages // Global variabel for å lagre meldingene
      if (run.status === 'completed') {
        messages = await openai.beta.threads.messages.list(run.thread_id)
      } else {
        // console.log(run.status)
      }
      // console.log('Meldinger', messages)

      const respons = {
        run: run.status,
        thread_id: thread.id,
        assistant_id: run.assistant_id,
        messages: messages.data
      }

      return {
        body: JSON.stringify(respons)
      }
    } catch (error) {
      return {
        status: 401,
        body: JSON.stringify({ error: error.message })
      }
    }
  }
})
