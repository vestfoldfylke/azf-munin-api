const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
const validateToken = require("../lib/validateToken");
// require("dotenv").config();

app.http('assistantOpenAi', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
      try {
        const accesstoken = request.headers.get("Authorization");
        await validateToken(accesstoken, { role: ["hugin.basic", "hugin.admin"] });
        const openai = new OpenAI();
        const params = JSON.parse(await request.text());

        // Sjekker om det skal opprettes en ny tråd eller om det skal brukes en eksisterende
        let thread;
        if (params.new_thread) {
          thread = await openai.beta.threads.create();
        } else {
          thread = await openai.beta.threads.retrieve(params.thread_id);
        }

        // Legger til brukerens spørsmål i tråden
        const message = await openai.beta.threads.messages.create(
          thread.id,
          {
            role: "user",
            content: params.question
          }
        );

        // Kjører tråden på valgt assistent
        const run = await openai.beta.threads.runs.createAndPoll(
          thread.id,
          {
            assistant_id: params.assistant_id,
          },
        );
        console.log("Ass_id", params.assistant_id)

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

        let respons = {
          run: run.status,
          thread_id: thread.id,
          assistant_id: run.assistant_id,
          messages: messages.data
        }

        return {
          body: JSON.stringify(respons)
        };
      } catch (error) {
          return {
            status: 401,
            body: JSON.stringify({ error: error.message }),
        }
      }
    }
});