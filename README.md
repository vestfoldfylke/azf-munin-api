# Hugin AZF-api's

## Introduction
In this repository you will find the API's for the Hugin AZF project. The API's are written in Javascript. The API's are used to communicate with the Hugin-project.

There are three endpoints in this repository:
 * basicOpenAiChat
 * assistantOpenAI
 * noraChat

 ### basicOpenAiChat
 This endpoint is used to communicate with the OpenAI API. The OpenAI API is used to generate text based on the input text. The input text is the text that the user sends to the API. The output text is the text that the OpenAI API generates based on the input text.

 ### assistantOpenAI
This endpoint is used to communicate with the OpenAI API. The OpenAI API is used to generate text based on the input text. The input text is the text that the user sends to the API. The output text is the text that the OpenAI API generates based on the input text. This endpoint is slightly more advanced than the basicOpenAiChat endpoint.

To function properly it is recommended to use the following parameters when sending a request to the assistantOpenAI endpoint:
```json
{
	"assistant_id": "asst_...",
	"new_thread": false,
	"thread_id": "thread_...",
	"question": "<Spørsmål fra brukeren>"
}
```

The return object from the assistantOpenAI endpoint will look like this:
```json
{
	"run": "completed",
	"thread_id": "thread_...",
	"assistant_id": "asst_...",
	"messages": {
		"id": "msg_...",
		"object": "thread.message",
		"created_at": 1714472342,
		"assistant_id": "asst_...",
		"thread_id": "thread_...",
		"run_id": "run_...",
		"role": "assistant",
		"content": [
			{
				"type": "text",
				"text": {
					"value": "<Svar på siste spørsmål>",
					"annotations": []
				}
			}
		],
		"attachments": [],
		"metadata": {}
	}
}
```


### noraChat
This endpoint is used to communicate with the Hugging Face inference API and is currently set up with the norwegian NoraLLM model.

To function properly it is recommended to use the following parameters when sending a request to the noraChat endpoint:
```json
{
    "question": "Hva kalles en tradisjonell norsk festdrakt?",
    "parameters": {
        "stream": false,
        "max_tokens": 500,
        "max_new_tokens": 1024,
        "top_k": 64,
        "top_p": 0.9,
        "stop": ["<|im_end|>"],
        "temperature": 0.2,
        "do_sample": true,
        "repetition_penalty": 1.0,
        "return_full_text": true
    }
}
```