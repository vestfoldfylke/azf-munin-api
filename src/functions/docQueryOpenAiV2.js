const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const validateToken = require('../lib/validateToken')
// require("dotenv").config();

app.http('docQueryOpenAiV2', {
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
      const newThread = formPayload.get('new_thread')
      let thread // = formPayload.get('thread_id')
      let vectorStore // = formPayload.get('vectorStore_id')
      const message = formPayload.get('message')

      // Sjekker om vi skal lage ny tråd og vectorstore eller bruke eksisterende
      if (newThread === 'true') {
        // Lager vector store
        vectorStore = await openai.beta.vectorStores.create({
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
        console.log('Så lager vi ny tråd')

        thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: message // Dette er brukerspørsmålet
            }
          ]
        })
      } else {
        // Hvis dokumenetene allerede er lastet opp og vi har en eksisterende tråd og vector store så fortsetter vi på det vi har
        console.log('Henter eksisterende vector store og tråd')
        console.log('Trpåd id:', formPayload.get('thread_id'))
        // Retrieve vector store and thread
        vectorStore = await openai.beta.vectorStores.retrieve(formPayload.get('vectorStore_id'))
        thread = await openai.beta.threads.retrieve(formPayload.get('thread_id'))
        // Oppdaterer tråden med ny melding
        await openai.beta.threads.messages.create(thread.id, {
          role: 'user',
          content: message
        })
      }

      await openai.beta.assistants.update(assistantId, {
        tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } }
      })

      // Kjører assistenten med tråden
      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistantId
      })

      let messages // Global variabel for å lagre meldingene
      if (run.status === 'completed') {
        messages = await openai.beta.threads.messages.list(run.thread_id)
        // console.log("Meldinger:", messages.data);
        for (const message of messages.data.reverse()) {
          console.log(`${message.role} > ${message.content[0].text.value}`)
        }
      } else {
        console.log(run.status)
      }

      const respons = {
        run: run.status,
        thread_id: thread.id,
        assistant_id: run.assistant_id,
        messages: messages.data,
        vectorStore_id: vectorStore.id
      }

      // console.log('Responsen er da: ', respons.messages[1].content[0].text.value)
      return { jsonBody: respons }
    } catch (error) {
      return {
        status: 401,
        body: JSON.stringify({ error: error.message })
      }
    }
  }
})
