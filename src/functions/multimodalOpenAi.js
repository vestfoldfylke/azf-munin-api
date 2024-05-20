const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
require("dotenv").config();

app.http("multimodalOpenAi", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const openai = new OpenAI();
    const params = await JSON.parse(await request.text());

    console.log(params);

    msg = [{ role: "system", content: params.kontekst }];
    msg.push(...params.messageHistory);

    if (params.bilde_base64String !== "") {
      console.log("Bilde er definert");
      msg.push({
        role: "user",
        content: [
          { type: "text", text: params.message },
          {
            type: "image_url",
            image_url: {
              url: params.bilde_base64String,
            },
          },
        ],
      });
    } else {
      console.log("Bilde er ikke definert");
      msg.push({ role: "user", content: params.message });
    }

    const completion = await openai.chat.completions.create({
      messages: msg,
      model: params.model,
    });

    console.log(completion.choices[0]);
    return {
      body: JSON.stringify(completion),
    };
  },
});
