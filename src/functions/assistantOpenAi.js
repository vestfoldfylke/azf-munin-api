const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
require("dotenv").config();

// Denne funksjonen er ikke ferdig.....
// Kun prototypet for å testet om man får returnert en thread_id fra openai

app.http('assistantOpenAi', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
      const openai = new OpenAI();
      const userBody = await request.text();
      const userBodyJson = await JSON.parse(userBody);

      const thread = await openai.beta.threads.create();

      const message = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: userBodyJson.question
        }
      );

      let run = await openai.beta.threads.runs.createAndPoll(
        thread.id, // Sett inn userBodyJson.thread her siden
        { 
          assistant_id: userBodyJson.assistant_id, // Dette er læreplanassistenten
          instructions: "Svar alltid kort og konkret på spørsmålet. Svar på norsk."
        }
      );

      const m = [];
      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(
          run.thread_id
        );
        for (const message of messages.data.reverse()) {
          console.log(`${message.role} > ${message.content[0].text.value}`);
          m.push(`${message.role} > ${message.content[0].text.value}`);
        }
      } else {
        console.log(run.status);
      }

      return {
        body: m
      };
    }
});