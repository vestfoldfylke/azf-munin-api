# Hugin AZF-api

## Introduksjon
I dette repositoriet finner du API-ene for Hugin AZF-prosjektet. API-ene er skrevet i JavaScript og brukes for å kommunisere med ulike AI-modeller og tjenester.

## Tilgjengelige endepunkter

Dette repositoriet inneholder følgende endepunkter:

### assistantOpenAi
Dette endepunktet brukes for å kommunisere med OpenAI's Assistants API. Assistants API brukes for å generere tekst basert på brukerens inndata, med støtte for kontekst og tråd-baserte samtaler.

For å fungere riktig anbefales det å bruke følgende parametere når du sender en forespørsel til assistantOpenAi-endepunktet:
```json
{
    "assistant_id": "asst_...",
    "new_thread": false,
    "thread_id": "thread_...",
    "messageHistory": [
        {"role": "user", "content": "<Tidligere spørsmål>"},
        {"role": "assistant", "content": "<Tidligere svar>"}
    ],
    "tile": "labs"  // Valgfritt, brukes for å velge riktig API-nøkkel
}
```

Svaret fra assistantOpenAi-endepunktet vil se slik ut:
```json
{
    "run": "completed",
    "thread_id": "thread_...",
    "assistant_id": "asst_...",
    "messages": [
        {
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
    ]
}
```

### noraChat
Dette endepunktet brukes for å kommunisere med Hugging Face inference API og er konfigurert med den norske NoraLLM-modellen (normistral-7b-warm-instruct).

For optimal bruk anbefales følgende parametere når du sender en forespørsel til noraChat-endepunktet:
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

### multimodalOpenAi
Dette endepunktet brukes for å analysere både tekst og bilder ved hjelp av OpenAI's multimodale modeller som GPT-4 Vision.

```json
{
    "model": "gpt-4-vision-preview",
    "message": "Forklar hva som vises på dette bildet.",
    "bilde_base64String": "data:image/jpeg;base64,...",
    "kontekst": "Du er en hjelpsom assistent som analyserer bilder.",
    "messageHistory": [],
    "temperature": 0.7
}
```

### multimodalMistral
Dette endepunktet brukes for å analysere både tekst og bilder ved hjelp av Mistral AI's multimodale modeller.

```json
{
    "model": "mistral-large-latest",
    "message": "Beskriv dette bildet for meg.",
    "bilde_base64String": ["data:image/jpeg;base64,..."],
    "kontekst": "Du er en hjelpsom assistent som analyserer bilder.",
    "messageHistory": [],
    "temperature": 0.7
}
```

### responseOpenAi
Dette endepunktet brukes til å sende forespørsler til OpenAI sin nyere Responses API, med støtte for både tekst, bilder og dokumenter.

```json
{
    "model": "gpt-4o",
    "userMessage": "Analyser denne informasjonen og gi meg en oppsummering.",
    "response_id": null,
    "imageBase64": ["data:image/jpeg;base64,..."],
    "dokFiles": []
}
```

### structuredOpenAi
Dette endepunktet brukes for å få strukturerte svar fra OpenAI API ved hjelp av response_format-parameteren.

```json
{
    "model": "gpt-4",
    "message": "Gi meg informasjon om Norge.",
    "kontekst": "Du er en hjelpsom assistent som gir strukturert informasjon.",
    "messageHistory": [],
    "bilde_base64String": "",
    "temperature": 0.7,
    "response_format": { "type": "json_object" }
}
```

### docQueryOpenAiV2
Dette endepunktet brukes for å stille spørsmål til dokumenter ved hjelp av OpenAI sin file_search-funksjonalitet.

For å laste opp filer og stille spørsmål, bruk FormData med følgende felt:
- `filer`: PDF-dokumenter du vil stille spørsmål til
- `new_thread`: "true" for å starte en ny samtale, "false" for å fortsette en eksisterende
- `vectorStore_id`: ID til en eksisterende vector store (brukes når new_thread er "false")
- `response_id`: ID til forrige respons for å bygge på kontekst (kan være "null")
- `userMessage`: Spørsmålet du vil stille til dokumentene

### ttsOpenAi
Dette endepunktet brukes for å konvertere tekst til tale ved hjelp av OpenAI sin text-to-speech API.

```json
{
    "tekst": "Hei, dette er en test av tekst-til-tale-funksjonen."
}
```

### nbTranscript
Dette endepunktet brukes for å laste opp lydfiler for transkribering. Endepunktet lagrer filene i Azure Blob Storage.

Bruk FormData med følgende felt:
- `filer`: Lydfilen som skal transkriberes
- `filnavn`: Navnet på filen
- `spraak`: Språket i lydfilen
- `format`: Filformatet
- `upn`: Brukerens UPN (User Principal Name)

## Autentisering
Alle endepunkter krever autentisering ved hjelp av en Azure AD-token. Denne tokenen må inneholde de riktige rollene for å få tilgang til de ulike endepunktene.