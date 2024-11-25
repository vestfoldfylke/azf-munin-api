const { app } = require('@azure/functions')
const { OpenAI } = require('openai')

app.timer('wakeNora', {
  schedule: '0 55 5-13 * * 1-5', // Pinger Nora mellom 07:55 og 15:55 på hverdager (Legg til 2 timer for UTC)
  handler: async (myTimer, context) => {
    context.log('Timer function processed request.')
    try {
      const openai = new OpenAI({
        baseURL: process.env.base_url_hf_nora,
        apiKey: process.env.HUGGINGFACEHUB_API_TOKEN
      })

      const wakeNora = await openai.chat.completions.create({
        model: 'norallm/normistral-7b-warm-instruct',
        messages: [{
          role: 'user',
          content: 'Nora du må våkne!'
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
      })

      const wakeNB = await fetch(
        process.env.base_url_hf_nbtranscript,
        {
            headers: { 
                "Accept" : "application/json",
                "Authorization": `Bearer ${process.env.HUGGINGFACEHUB_API_TOKEN}`,
                "Content-Type": "audio/flac" 
            },
            method: "POST",
            body: "WakeWake",
        }
    );

      const w1 = wakeNora
      const w2 = wakeNB
      console.log(w1.choices[0].message.content)
      console.log(w2)
    } catch (error) {
      console.log(error.message)
    }
  }
})
