const { app } = require('@azure/functions')
const validateToken = require('../lib/validateToken')

app.http('nbTranscript', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const accesstoken = request.headers.get('Authorization')
            await validateToken(accesstoken, { role: [`${process.env.appName}.labs`] })
           
            // Payload fra klienten
            const formPayload = await request.formData()
            const fileStreams = formPayload.get('filer')

            console.log(fileStreams)
            const blob = fileStreams;
            const data = await blob.arrayBuffer()
            const response = await fetch(
                process.env.base_url_hf_nbtranscript,
                {
                    headers: { 
                        "Accept" : "application/json",
                        "Authorization": `Bearer ${process.env.HUGGINGFACEHUB_API_TOKEN}`,
                        "Content-Type": "audio/flac" 
                    },
                    method: "POST",
                    body: data,
                }
            );
            const result = await response.json();
            console.log("Her er resultatet: ")

            const respons = {
                data: result
            }
            console.log(respons)
            return { jsonBody: respons };
        } 
        catch (error) {
            return {
              status: 401,
              body: JSON.stringify({ error: error.message })
            }
          }
        }
      });