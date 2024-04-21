const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
require("dotenv").config();

app.http("basicOpenAiChat", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const openai = new OpenAI();
    const userMessage = await request.text();
    const userMessageJson = await JSON.parse(userMessage);
    const model = await userMessageJson.model;
    const kontekst = await userMessageJson.kontekst;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: kontekst },
        { role: "user", content: JSON.parse(userMessage).message },
      ],
      model: model,
    });
    return {
      body: completion.choices[0].message.content + userMessageJson.model,
    };
  },
});
