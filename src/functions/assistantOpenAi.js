const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
require("dotenv").config();

app.http('assistantOpenAi', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
      const openai = new OpenAI();
      const userBody = await request.text();
      const userBodyJson = await JSON.parse(userBody);

      // Sjekker om det skal opprettes en ny tråd eller om det skal brukes en eksisterende
      let thread;
      if (userBodyJson.new_thread) {
        thread = await openai.beta.threads.create();
      } else {
        thread = await openai.beta.threads.retrieve(userBodyJson.thread_id);
      }

      // Legger til brukerens spørsmål i tråden
      const message = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: userBodyJson.question
        }
      );

      // Kjører tråden på valgt assistent
      const run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        {
          assistant_id: userBodyJson.assistant_id,
        },
      );

      let messages;
      if (run.status === 'completed') {
        messages = await openai.beta.threads.messages.list(
          run.thread_id
        );
        // console.log("Meldinger:", messages.data);
        for (const message of messages.data.reverse()) {
          console.log(`${message.role} > ${message.content[0].text.value}`);
        }
      } else {
        console.log(run.status);
      }

      // console.log("Run:", run);
      let responsObjekt = {
        run: run.status,
        thread_id: thread.id,
        assistant_id: run.assistant_id,
        messages: messages.data
      }

      r = JSON.stringify(responsObjekt);

      return {
        body: r
      };
    }
});