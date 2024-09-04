
const { app } = require('@azure/functions');
const { OpenAI } = require("openai");
// const validateToken = require('../lib/validateToken');

app.http('wakeNoraDev', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // const accesstoken = request.headers.get("Authorization");
            // await validateToken(accesstoken, { role: [`${process.env.appName}.basic`, `${process.env.appName}.admin`] });

            
            const openai = new OpenAI({
                "baseURL": process.env.base_url_hf_nora,
                "apiKey": process.env.HUGGINGFACEHUB_API_TOKEN
            })
            
            const respons = await openai.chat.completions.create({
                "model": "norallm/normistral-7b-warm-instruct",
                "messages": [{
                    "role": "user",
                    "content": "Nora du må våkne!"
                }],
                stream: false,
                max_tokens: 500,
                max_new_tokens: 1024,
                top_k: 64,
                top_p: 0.9,
                stop: ['<|im_end|>'],
                temperature: 0.2,
                do_sample: true,
                repetition_penalty: 1.0,
                return_full_text: true
            });
            
            const m = await respons;
            console.log(m.choices[0].message.content);
    } catch (error) {
        console.log(error.message) 
    }
    }
});
