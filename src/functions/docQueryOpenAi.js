const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const validateToken = require('../lib/validateToken')
// require("dotenv").config();

app.http('docQueryOpenAi', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const accesstoken = request.headers.get('Authorization')
      await validateToken(accesstoken, { role: [`${process.env.appName}.admin`] })
      const openai = new OpenAI()

      // Payload fra klienten
      const formPayload = await request.formData()
      const fileStreams = formPayload.getAll('filer')
      const assistantId = formPayload.get('assistant_id')
      const newThread = (formPayload.get('new_thread') === 'true')
      let thread = formPayload.get('thread_id')
      const message = formPayload.get('message')

      console.log('newThread', newThread, typeof (newThread))

      // Lager vector store
      const vectorStore = await openai.beta.vectorStores.create({
        name: 'docQueryVectorStore',
        expires_after: {
          anchor: 'last_active_at',
          days: 1
        }
      })

      // Lastert opp fil(er) til vector store og oppdaterer
      await openai.beta.vectorStores.fileBatches.uploadAndPoll(
        vectorStore.id,
        { files: fileStreams }
      )
      console.log('ai', assistantId)
      console.log('vs', vectorStore.id)

      await openai.beta.assistants.update(assistantId, {
        tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } }
      })

      // Lager en ny tråd - Her må det lages en test for å sjekke om man skal fortsette på en eksisterende tråd
      if (newThread) {
        console.log('Lager ny tråd')
        thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: message // Dette er brukerspørsmålet
            }
          ]
        })
      } else {
        console.log('Henter eksisterende tråd')
      }

      // Hjelperfunksjon for å hente ut siste melding i en tråd
      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistantId
      })

      console.log('run Forest:', run)

      let messages
      if (run.status === 'completed') {
        messages = await openai.beta.threads.messages.list(run.thread_id)
      } else {
        console.log(run.status)
      }

      const respons = {
        run: run.status,
        thread_id: thread.id,
        assistant_id: run.assistant_id,
        messages: messages.data
      }

      console.log('Responsen er da: ', respons.messages[1].content[0].text.value)
      return { jsonBody: respons }
    } catch (error) {
      return {
        status: 401,
        body: JSON.stringify({ error: error.message })
      }
    }
  }
})
