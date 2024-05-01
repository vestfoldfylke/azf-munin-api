const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
require("dotenv").config();

app.http("basicOpenAiChat", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const openai = new OpenAI();
    const params = await JSON.parse(await request.text());

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: params.kontekst },
        { role: "user", content: params.message },
      ],
      model: params.model,
    });
    console.log("completion:", completion);
    return {
      body: JSON.stringify(completion)
    };
  },
});
