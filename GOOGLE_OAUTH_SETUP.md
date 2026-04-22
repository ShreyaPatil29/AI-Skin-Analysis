# Google OAuth Setup Instructions

## 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:4000/auth/google/callback`
   - Copy the Client ID and Client Secret

## 2. Environment Configuration

1. Copy the `Backend/env-template.txt` file to `Backend/.env`
2. Fill in the following values:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Session Secret (generate a random string)
SESSION_SECRET=your_session_secret_here

# Gemini AI API Key (get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/skin-ai

# Server Port
PORT=4000
```

## 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Copy the API key to your `.env` file

## 4. Start the Application

1. Start MongoDB (if not already running)
2. Install backend dependencies:
   ```bash
   cd Backend
   npm install
   ```
3. Start the backend server:
   ```bash
   npm start
   ```
4. Install frontend dependencies:
   ```bash
   cd Fronted
   npm install
   ```
5. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 5. Test the Authentication Flow

1. Open `http://localhost:5173` in your browser
2. Click "Sign In" in the navbar or "Try Analysis" on the homepage
3. You should be redirected to Google OAuth
4. After successful authentication, you'll be redirected back to the application
5. You should now be able to access the Analysis page

## Authentication Flow

- **Sign In Button**: Redirects to Google OAuth
- **Try Analysis Button**: If not authenticated, redirects to sign-in first, then to analysis
- **Protected Routes**: Analysis and Assistant pages require authentication
- **User Menu**: Shows user info and sign-out option when authenticated

## Troubleshooting

- Make sure MongoDB is running
- Check that all environment variables are set correctly
- Verify Google OAuth credentials are valid
- Ensure the callback URL matches exactly in Google Console
- Check browser console for any CORS or authentication errors

