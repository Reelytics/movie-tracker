# AI Vision-based Ticket Scanning Service

This service replaces the previous OCR implementation with a more advanced AI-powered approach
using multiple vision API providers for improved accuracy and reliability.

## Features

- Provider-agnostic design with support for multiple AI vision APIs
- Configurable and easily extendable to add new providers
- Built-in error handling, logging, and rate limiting
- API key management using environment variables
- Testing mechanisms to validate providers

## Supported Vision Providers

- OpenAI GPT-4 Vision 
- Anthropic Claude Vision
- Google Gemini Vision
- Microsoft Azure Computer Vision (optional)

## Usage

### API Key Setup

Create a `.env` file based on the `.env.example` template and add your API keys for the providers you want to use.

Example:
```
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

### API Endpoints

#### Scan a Ticket
```
POST /api/tickets/scan
```
- Requires authentication
- Upload a ticket image with the field name `ticketImage`
- Optional: Specify a provider with the form field `provider`

#### Save Ticket Data
```
POST /api/tickets/save
```
- Requires authentication
- Send ticket data in request body

#### Get User Tickets
```
GET /api/tickets/tickets
```
- Requires authentication
- Returns all tickets for the authenticated user

#### Get Available Providers
```
GET /api/tickets/providers
```
- Requires authentication
- Returns all available providers and their status

#### Set Active Provider
```
POST /api/tickets/providers/set-active
```
- Requires authentication
- Request body: `{ "providerName": "provider-name" }`

#### Test All Providers
```
GET /api/tickets/providers/test
```
- Requires authentication
- Tests connection to all available providers

## Architecture

The system is designed with clean separation of concerns and follows SOLID principles:

1. **Abstraction Layer**: Vision providers implement a common interface
2. **Provider Registry**: Central registry for managing available providers
3. **Scanning Service**: High-level service for extracting ticket information
4. **Testing Utility**: Allows testing and comparing results from different providers

## Adding a New Provider

1. Create a new class that extends `BaseVisionProvider`
2. Implement the required methods: `extractTicketData()` and `testConnection()`
3. Add the provider to the registry in `visionProviderRegistry.ts`

## Error Handling

The service includes comprehensive error handling with:
- Request validation
- API error handling
- Exponential backoff for retries
- Logging of all errors
- Graceful handling of missing or invalid data

## Security

- API keys are stored in environment variables
- Authentication is required for all endpoints
- Input validation for all requests
- Prevention of directory traversal attacks
