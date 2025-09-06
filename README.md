# Atlantic Improved - ForceDecks API Interface

A modern Next.js application for interacting with the External ForceDecks API to access team and athlete test data.

## Features

- 🌐 Multi-region support (Australia East, US East, Europe West)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔧 TypeScript for type safety
- 📊 JSON result visualization
- 🚀 Built with Next.js 15 and React 19

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# VALD API (OAuth2 client credentials)
VALD_CLIENT_ID=your_vald_client_id
VALD_CLIENT_SECRET=your_vald_client_secret
VALD_TENANT_ID=your_vald_tenant_id

# Database (Neon Postgres)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxx.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Scenarios Supported

### Scenario 1: Retrieve Tests
- **Endpoint**: `/tests`
- **Description**: Get a collection of tests for a tenant
- **Required**: Tenant ID, Modified From Date
- **Optional**: Profile ID

### Scenario 2: Retrieve Trials
- **Endpoint**: `/v2019q3/teams/{teamId}/tests/{testId}/trials`
- **Description**: Get trials (reps) for a specific test
- **Required**: Team ID, Test ID

### Scenario 3: Retrieve Test Recording
- **Endpoint**: `/v2019q3/teams/{teamId}/tests/{testId}/recording`
- **Description**: Get raw test recording data
- **Required**: Team ID, Test ID
- **Note**: Requires permission from VALD Support Team

### Scenario 4: Result Definitions
- **Endpoint**: `/resultdefinitions` or `/resultdefinition/{resultId}`
- **Description**: Get all or specific result definitions

## Usage

1. **Select Your Region**: Choose the appropriate region from the dropdown
2. **Configure Parameters**: Enter your Tenant ID and set the date filter
3. **Execute API Calls**: Use the action buttons to interact with the API
4. **View Results**: Results are displayed in a formatted JSON view

## API Client

The application includes a TypeScript API client (`src/lib/forcedecks-api.ts`) that provides:

- Type-safe API interactions
- Error handling
- Support for all documented scenarios
- Environment variable configuration

## Development

### Project Structure
```
src/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main interface
│   └── globals.css     # Global styles
└── lib/
    └── forcedecks-api.ts # API client library
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Support

If you're unsure which region-specific URL to use, contact support@vald.com.

For API documentation, visit the Swagger documentation at:
`{your-region-base-url}/swagger/index.html`