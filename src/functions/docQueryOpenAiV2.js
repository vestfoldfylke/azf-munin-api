const { app } = require('@azure/functions')
const { OpenAI } = require('openai')
const validateToken = require('../lib/validateToken')
const { logger } = require('@vtfk/logger')

app.http('docQueryOpenAiV2', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const accesstoken = request.headers.get('Authorization')
      await validateToken(accesstoken, { role: [`${process.env.appName}.admin`] })
      logger('info', ['docQueryOpenAiV2', 'Token validert'])
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
      logger('info', ['docQueryOpenAiV2', 'Ny tråd:', newThread])
      if (newThread === 'true') {
        // Lager vector store
        try {
          vectorStore = await openai.beta.vectorStores.create({
            name: 'docQueryVectorStore',
            expires_after: {
              anchor: 'last_active_at',
              days: 1
            }
          })
        } catch (error) {
          logger('error', ['docQueryOpenAiV2', 'Error creating vector store', error.message])
          throw new Error('Failed to create vector store')
        }

        // Lastert opp fil(er) til vector store og oppdaterer
        try {
          await openai.beta.vectorStores.fileBatches.uploadAndPoll(
            vectorStore.id,
            { files: fileStreams }
          )
        } catch (error) {
          logger('error', ['docQueryOpenAiV2', 'Error uploading files to vector store', error.message])
          throw new Error('Failed to upload files to vector store')
        }

        try {
          thread = await openai.beta.threads.create({
            messages: [
              {
          role: 'user',
          content: message // Dette er brukerspørsmålet
              }
            ]
          })
        } catch (error) {
          logger('error', ['docQueryOpenAiV2', 'Error creating thread', error.message])
          throw new Error('Failed to create thread')
        }
      } else {
        // Hvis dokumenetene allerede er lastet opp og vi har en eksisterende tråd og vector store så fortsetter vi på det vi har

        // Retrieve vector store and thread
        try {
          vectorStore = await openai.beta.vectorStores.retrieve(formPayload.get('vectorStore_id'))
        } catch (error) {
          logger('error', ['docQueryOpenAiV2', 'Error retrieving vector store', error.message])
          throw new Error('Failed to retrieve vector store')
        }
        try {
          thread = await openai.beta.threads.retrieve(formPayload.get('thread_id'))
        } catch (error) {
          logger('error', ['docQueryOpenAiV2', 'Error retrieving thread', error.message])
          throw new Error('Failed to retrieve thread')
        }
        // Oppdaterer tråden med ny melding
        try {
          await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: message
          })
        } catch (error) {
          logger('error', ['docQueryOpenAiV2', 'Error creating message in thread', error.message])
          throw new Error('Failed to create message in thread')
        }
      }

      try {
        await openai.beta.assistants.update(assistantId, {
          tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } }
        })
      } catch (error) {
        logger('error', ['docQueryOpenAiV2', 'Error updating assistant', error.message])
        throw new Error('Failed to update assistant')
      }

      // Kjører assistenten med tråden
      logger('info', ['docQueryOpenAiV2', 'Run startded', thread.id, assistantId])
      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistantId
      })

      let messages // Global variabel for å lagre meldingene
      if (run.status === 'completed') {
        logger('info', ['docQueryOpenAiV2', 'Run completed', run.thread_id, run.assistant_id])
        messages = await openai.beta.threads.messages.list(run.thread_id)
        // console.log("Meldinger:", messages.data);
        for (const message of messages.data.reverse()) {
          console.log(`${message.role} > ${message.content[0].text.value}`)
        }
      } else {
        logger('error', ['docQueryOpenAiV2', 'Run not completed', run.thread_id, run.assistant_id, run.status])
        throw new Error('Run not completed')
      }

      const respons = {
        run: run.status,
        thread_id: thread.id,
        assistant_id: run.assistant_id,
        messages: messages.data,
        vectorStore_id: vectorStore.id
      }
      logger('info', ['docQueryOpenAiV2', 'Success'])
      return { jsonBody: respons }
    } catch (error) {
      return {
        status: 401,
        body: JSON.stringify({ error: error.message })
      }
    }
  }
})
