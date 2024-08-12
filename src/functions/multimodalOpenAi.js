const { app } = require("@azure/functions");
const { OpenAI } = require("openai");
const validateToken = require("../lib/validateToken");
// require("dotenv").config();

app.http("multimodalOpenAi", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const openai = new OpenAI();
    const params = await JSON.parse(await request.text());
    const accesstoken = request.headers.get("Authorization");

    try {
      // Validate the token and the role of the user
      await validateToken(accesstoken, { role: ["hugin.basic", "hugin.admin"] })  

      msg = [{ role: "system", content: params.kontekst }];
      msg.push(...params.messageHistory);

      if (params.bilde_base64String !== "") {
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
        msg.push({ role: "user", content: params.message });
      }

      //const moderation = await openai.moderations.create({ input: "I want to kill them." });
      //console.log(params.msg);
      //console.log(JSON.stringify(moderation));

      const completion = await openai.chat.completions.create({
        messages: msg,
        model: params.model,
        temperature: params.temperature,
      });

      return {
        body: JSON.stringify(completion),
      };
    } catch (error) {
      return {
        status: 401,
        body: JSON.stringify({ error: error.message }),
      }
    }
  },
});
