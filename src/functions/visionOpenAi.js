const { app } = require('@azure/functions');
const { OpenAI } = require("openai");
require("dotenv").config();

app.http('visionOpenAi', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const openai = new OpenAI();
        const params = await JSON.parse(await request.text());

        const response = await openai.chat.completions.create({
            model: params.model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: params.question },
                  {
                    type: "image_url",
                    image_url: {
                      "url": params.bilde_url,
                    },
                  },
                ],
              },
            ],
          });
          console.log(response.choices[0]);
          return {
            body: JSON.stringify(response.choices[0])
          };
    }
});
