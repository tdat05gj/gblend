# Gblend DApp - Deployment Guide

## Vercel Deployment

This project is configured for easy deployment on Vercel. Follow these steps:

### Method 1: Deploy via Vercel CLI

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from the root directory:**
   ```bash
   cd c:\Users\Admin\Desktop\gblend
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Choose your account
   - Link to existing project? `N` (for first deployment)
   - Project name? `gblend-dapp` (or your preferred name)
   - Directory with code? `./` (current directory)

### Method 2: Deploy via Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `gblend` repository

3. **Configure Build Settings:**
   - Framework Preset: `Other`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete

### Environment Variables

If you need to add environment variables (like different contract addresses for production):

1. In Vercel dashboard, go to your project settings
2. Navigate to "Environment Variables"
3. Add any required variables:
   - `VITE_CONTRACT_ADDRESS`: Your deployed contract address
   - `VITE_NETWORK_NAME`: Network name (e.g., "Gblend Testnet")
   - `VITE_RPC_URL`: RPC URL for the network

### Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

### Project Structure

```
gblend/
├── frontend/          # React app source
│   ├── src/
│   ├── dist/         # Build output (generated)
│   └── package.json
├── contracts/        # Smart contracts (not deployed to Vercel)
├── vercel.json       # Vercel configuration
├── .vercelignore     # Files to ignore during deployment
└── README.md
```

### Build Process

The deployment process will:
1. Navigate to the `frontend` directory
2. Install dependencies with `npm install`
3. Build the React app with `npm run build`
4. Serve static files from `frontend/dist`

### Troubleshooting

**Build fails:**
- Check that all dependencies are listed in `frontend/package.json`
- Ensure build command works locally: `cd frontend && npm run build`

**App doesn't load properly:**
- Check browser console for errors
- Verify contract addresses are correct for the target network
- Ensure MetaMask is connected to the right network

**MetaMask connection issues:**
- Make sure your app is served over HTTPS (Vercel provides this automatically)
- Check that Web3 provider initialization is working

### Live Demo

After deployment, your Gblend DApp will be available at:
`https://your-project-name.vercel.app`
