# Hugin Azure Functions API

## 📋 Oversikt

Hugin Azure Functions API er en API-tjeneste bygget på Microsoft Azure Functions. Dette repositoriet inneholder en samling av HTTP-utløste funksjoner som gir tilgang til ulike AI-modeller og tjenester, inkludert OpenAI, Mistral AI og Hugging Face.

### 🎯 Hovedfunksjoner

- **Multimodal AI-analyse**: Støtte for tekst, bilder og dokumenter
- **Assistentbaserte samtaler**: Tråd-baserte AI-assistenter med kontekst
- **Norsk språkmodell**: Dedikert støtte for norsk via NoraLLM
- **Dokumentanalyse**: Spørsmål til PDF-dokumenter med file search
- **Tale-til-tekst og tekst-til-tale**: Audio transkripsjon og TTS-tjenester
- **Sikker autentisering**: Azure AD-basert autorisasjon med rollehåndtering

### 🏗️ Arkitektur

```
Azure Functions (Node.js 18.x)
├── HTTP Triggere (API Endpunkter)
├── Timer Triggers (Keep-alive funksjoner)
├── Azure Blob Storage (Fil lagring)
├── OpenAI API Integrasjon
├── Mistral AI Integrasjon
└── Hugging Face Integrasjon
```

## 🚀 Tilgjengelige API-endepunkter

### 1. assistantOpenAi
**Formål**: Kommuniserer med OpenAI's Assistants API for tråd-baserte samtaler med AI-assistenter.

**Roller**: `${appName}.basic`, `${appName}.admin`, `${appName}.skolebotter`, `${appName}.orgbotter`

**Request Format**:
```json
{
    "assistant_id": "asst_...",
    "new_thread": true,
    "thread_id": "thread_...",
    "messageHistory": [
        {"role": "user", "content": "Hei, kan du hjelpe meg?"},
        {"role": "assistant", "content": "Selvfølgelig! Hva kan jeg hjelpe deg med?"}
    ],
    "tile": "labs"
}
```

**Response Format**:
```json
{
    "run": "completed",
    "thread_id": "thread_abc123",
    "assistant_id": "asst_def456", 
    "messages": [
        {
            "id": "msg_ghi789",
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": {
                        "value": "Her er svaret på spørsmålet ditt...",
                        "annotations": []
                    }
                }
            ]
        }
    ]
}
```

**Tile-parameter**: Velger API-nøkkel basert på bruksområde:
- `labs`: Laboratorium/testing
- `orgbotter`: Organisasjonsbotter
- `skolebotter`: Skole-relaterte botter
- `fartebot`: Kollektivtransport

### 2. noraChat
**Formål**: Kommuniserer med norsk NoraLLM-modell via Hugging Face.

**Roller**: `${appName}.basic`, `${appName}.admin`

**Request Format**:
```json
{
    "question": "Hva er hovedstaden i Norge?",
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

**Response**: Returnerer ren tekst fra modellen.

### 3. multimodalOpenAi
**Formål**: Analyserer tekst og bilder med OpenAI's multimodale modeller.

**Roller**: `${appName}.basic`, `${appName}.admin`

**Request Format**:
```json
{
    "model": "gpt-4-vision-preview",
    "message": "Beskriv dette bildet i detalj.",
    "bilde_base64String": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "kontekst": "Du er en hjelpsom assistent som analyserer bilder nøyaktig.",
    "messageHistory": [
        {"role": "user", "content": "Forrige spørsmål"},
        {"role": "assistant", "content": "Forrige svar"}
    ],
    "temperature": 0.7
}
```

### 4. multimodalMistral
**Formål**: Analyserer tekst og bilder med Mistral AI's modeller.

**Roller**: `${appName}.basic`, `${appName}.admin`

**Request Format**:
```json
{
    "model": "mistral-large-latest",
    "message": "Analyser dette bildet og gi en detaljert beskrivelse.",
    "bilde_base64String": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."],
    "kontekst": "Du er en ekspert på bildeanalyse.",
    "messageHistory": [],
    "temperature": 0.7
}
```

### 5. responseOpenAi
**Formål**: Bruker OpenAI's nyeste Responses API med støtte for web search og multimodale inndata.

**Roller**: `${appName}.basic`, `${appName}.admin`, `${appName}.dokumentchat`

**Request Format**:
```json
{
    "model": "gpt-4o",
    "userMessage": "Søk opp informasjon om norske fjorder og gi meg en oppsummering.",
    "response_id": null,
    "imageBase64": ["data:image/jpeg;base64,..."],
    "dokFiles": []
}
```

**Funksjoner**:
- Web search for oppdatert informasjon
- Støtte for bilder og dokumenter
- Kontekstbevaring med response_id

### 6. structuredOpenAi
**Formål**: Genererer strukturerte JSON-svar fra OpenAI.

**Roller**: `${appName}.basic`, `${appName}.admin`

**Request Format**:
```json
{
    "model": "gpt-4",
    "message": "Lag en oversikt over norske fylker med befolkning.",
    "kontekst": "Du returnerer alltid strukturert data i JSON-format.",
    "messageHistory": [],
    "bilde_base64String": "",
    "temperature": 0.7,
    "response_format": { "type": "json_object" }
}
```

### 7. docQueryOpenAiV2
**Formål**: Stiller spørsmål til dokumenter ved hjelp av OpenAI's file search.

**Roller**: `${appName}.admin`, `${appName}.dokumentchat`

**Request Format** (FormData):
```javascript
const formData = new FormData();
formData.append('filer', pdfFile);
formData.append('new_thread', 'true');
formData.append('vectorStore_id', 'vs_abc123');
formData.append('response_id', 'null');
formData.append('userMessage', 'Hva handler dette dokumentet om?');
```

**Funksjoner**:
- Laster opp PDF-dokumenter
- Oppretter vector stores for søk
- Kontekstbevaring mellom spørsmål
- Automatisk utløp av vector stores (1 dag)

### 8. ttsOpenAi
**Formål**: Konverterer tekst til tale ved hjelp av OpenAI's TTS API.

**Roller**: `${appName}.basic`, `${appName}.admin`

**Request Format**:
```json
{
    "tekst": "Dette er teksten som skal konverteres til tale."
}
```

**Response**: Base64-encoded audio-data.

### 9. nbTranscript
**Formål**: Laster opp lydfiler til Azure Blob Storage for transkripsjon.

**Roller**: `${appName}.admin`, `${appName}.transkripsjon`

**Request Format** (FormData):
```javascript
const formData = new FormData();
formData.append('filer', audioFile);
formData.append('filnavn', 'opptak.wav');
formData.append('spraak', 'nb-NO');
formData.append('format', 'wav');
formData.append('upn', 'bruker@domain.no');
```

### 10. wakeNora / wakeNoraDev
**Formål**: Timer-funksjoner som holder AI-modeller varme og tilgjengelige.

**Schedule**: `0 55 5-13 * * 1-5` (Hverdager 07:55-15:55 norsk tid)

**Funksjoner**:
- Pinger NoraLLM-modell
- Pinger NB-transkripsjon
- Forebygger cold start-problemer

## 🔐 Autentisering og autorisasjon

### Azure AD-integrering
Alle endepunkter krever gyldig Azure AD-token med riktige roller.

**Token-format**: `Authorization: Bearer <access_token>`

### Tilgjengelige roller
- `${appName}.basic`: Grunnleggende tilgang til de fleste endepunkter
- `${appName}.admin`: Full tilgang til alle endepunkter
- `${appName}.dokumentchat`: Tilgang til dokumentanalyse
- `${appName}.transkripsjon`: Tilgang til audio-transkripsjon
- `${appName}.skolebotter`: Tilgang til skole-relaterte assistenter
- `${appName}.orgbotter`: Tilgang til organisasjons-assistenter

### Rollevalidering
```javascript
const validateToken = require('../lib/validateToken');

// Valider token og roller
await validateToken(accessToken, { 
    role: [`${process.env.appName}.basic`, `${process.env.appName}.admin`] 
});
```

## ⚙️ Miljøvariabler

### Påkrevde Azure-variabler
```bash
# Azure AD
tenantId=<Azure-tenant-ID>
audience=<API-audience>
applicationId=<Azure-app-ID>
appName=<App-navn-for-roller>

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=<Azure-storage-connection>
AZURE_STORAGE_CONTAINER_NAME=<Container-navn>

# OpenAI API-nøkler (forskjellige kontekster)
OPENAI_API_KEY=<Hoved-OpenAI-nøkkel>
OPENAI_API_KEY_LABS=<Labs-OpenAI-nøkkel>
OPENAI_API_KEY_ORGBOTTER=<Org-botter-nøkkel>
OPENAI_API_KEY_SKOLEBOTTER=<Skole-botter-nøkkel>
OPENAI_API_KEY_KOLLEKTIV=<Kollektiv-nøkkel>

# Andre AI-tjenester
MISTRAL_API_KEY=<Mistral-AI-nøkkel>
HUGGINGFACEHUB_API_TOKEN=<Hugging-Face-token>

# Hugging Face endpoints
base_url_hf_nora=<NoraLLM-endpoint>
base_url_hf_nbtranscript=<NB-transkripsjon-endpoint>
```

## 🛠️ Utvikling

### Forutsetninger
- Node.js 18.x eller nyere
- Azure Functions Core Tools v4
- Azure CLI (for deployment)
- Git

### Lokal utvikling

1. **Klon repositoriet**:
```bash
git clone <repository-url>
cd azf-hugin-api
```

2. **Installer avhengigheter**:
```bash
npm install
```

3. **Sett opp miljøvariabler**:
Opprett `local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "tenantId": "your-tenant-id",
    "audience": "your-audience",
    // ... andre miljøvariabler
  }
}
```

4. **Start lokal utvikling**:
```bash
npm start
# eller
func start
```

### Prosjektstruktur
```
azf-hugin-api/
├── src/
│   ├── functions/           # Azure Functions
│   │   ├── assistantOpenAi.js
│   │   ├── docQueryOpenAiV2.js
│   │   ├── multimodalMistral.js
│   │   ├── multimodalOpenAi.js
│   │   ├── nbTranscript.js
│   │   ├── noraChat.js
│   │   ├── responseOpenAi.js
│   │   ├── structuredOpenAi.js
│   │   ├── ttsOpenAi.js
│   │   ├── wakeNora.js
│   │   └── wakeNoraDev.js
│   └── lib/
│       └── validateToken.js  # Auth-bibliotek
├── .github/
│   └── workflows/           # CI/CD workflows
├── .vscode/                # VS Code-konfigurasjon
├── host.json              # Azure Functions-konfigurasjon
├── package.json           # Node.js-avhengigheter
└── README.md
```

## 🚢 Deployment

### Automatisk deployment via GitHub Actions

**Test-miljø**: Utløses ved push til `main`-branch
**Produksjon**: Utløses ved publisering av release

### Manuell deployment

```bash
# Bygg og deploy til Azure
func azure functionapp publish <your-function-app-name>

# Med spesifikk slot
func azure functionapp publish <your-function-app-name> --slot staging
```
### Logging
Alle funksjoner bruker `@vtfk/logger` for strukturert logging:

```javascript
const { logger } = require('@vtfk/logger');

logger('info', ['functionName', 'Message', additionalData]);
logger('error', ['functionName', 'Error occurred', error.message]);
```

## 🔧 Avhengigheter

### Hovedavhengigheter
```json
{
  "@azure/functions": "^4.4.0",
  "@azure/storage-blob": "^12.26.0", 
  "@mistralai/mistralai": "^1.3.4",
  "@vtfk/logger": "^6.3.3",
  "openai": "^4.92.0",
  "validate-azure-ad-token": "^2.2.0"
}
```

### AI/ML-integrasjoner
- **OpenAI**: Multimodale modeller
- **Mistral AI**: Multimodale modeller
- **Hugging Face**: NoraLLM (norsk språkmodell)

## 🤝 Bidrag

### Retningslinjer
1. Fork repositoriet
2. Opprett en feature branch (`git checkout -b feature/ny-funksjon`)
3. Commit endringene (`git commit -am 'Legg til ny funksjon'`)
4. Push til branch (`git push origin feature/ny-funksjon`)
5. Opprett en Pull Request

## 📝 Lisens

Dette prosjektet er utviklet for Telemark og Vestfold Fylkeskommune og er underlagt organisasjonens retningslinjer for kodebruk og distribusjon.

## 📞 Support og kontakt

For spørsmål eller support:
- Opprett en issue i GitHub
- Kontakt utviklingsteamet i Telemark og Vestfold Fylkeskommune
- Se dokumentasjon for detaljer om spesifikke endepunkter

---

**Utviklet med ❤️ av**: Telemark og Vestfold Fylkeskommune
