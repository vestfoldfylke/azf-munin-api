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
            const run = await openai.beta.threads.createAndRun({
              assistant_id: "asst_O7ctrFrE5tSJHHS2ACs5Jq1q",
              thread: {
                messages: [
                  { role: "user", content: "Skriv en oppsummering" },
                ],
              },
            });
            
            const threadMessages = await openai.beta.threads.messages.list(run.thread_id);

        return { body: run.thread_id };
    }
});
