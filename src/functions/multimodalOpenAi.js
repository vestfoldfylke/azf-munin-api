const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
require("dotenv").config();

app.http("multimodalOpenAi", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const openai = new OpenAI();
    const params = await JSON.parse(await request.text());

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: params.kontekst },
        {
          role: "user",
          content: [
            { type: "text", text: params.question },
            {
              type: "image_url",
              image_url: {
                url: params.bilde_url,
              },
            },
          ],
        },
      ],
      model: params.model,
    });

    console.log(completion.choices[0]);
    return {
      body: JSON.stringify(completion),
    };
  },
});
