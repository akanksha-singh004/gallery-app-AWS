# 📸 Cloud Photo Gallery

A high-performance, full-stack photo gallery application featuring professional organization tools, instant thumbnail generation, and secure cloud storage.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Key Features

*   **📂 Folder Organization:** Create custom folders and organize your photos instantly.
*   **🖱️ Drag & Drop:**
    *   **Upload:** Drag photos from your computer anywhere onto the page to upload.
    *   **Organize:** Drag photos within the gallery and drop them into folders to move them.
*   **🖼️ Smart Thumbnails:** Automatic image resizing using AWS Lambda and Sharp (Linux x64 optimized).
*   **🔐 Secure Auth:** User authentication and private storage powered by AWS Cognito.
*   **⚡ Modern UI:** Sleek, responsive interface built with React, Vite, and Framer Motion.
*   **☁️ Serverless Backend:** Scalable architecture using AWS SAM (S3, DynamoDB, Lambda, API Gateway).

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (Build Tool)
- Zustand (State Management)
- Framer Motion (Animations)
- Lucide React (Icons)

**Backend (AWS):**
- AWS SAM (Serverless Application Model)
- S3 (Image Storage)
- DynamoDB (Metadata)
- Lambda (Serverless Logic)
- Cognito (Authentication)
- API Gateway (REST API)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- AWS CLI configured with your credentials
- AWS SAM CLI installed

### 2. Backend Setup (AWS)
```bash
cd lambdas/thumbnailer
npm install # Installs Linux-optimized sharp

cd ../..
sam build
sam deploy --guided
```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env.local` file and add your AWS credentials:
   ```env
   VITE_API_URL=your_api_gateway_url
   VITE_COGNITO_USER_POOL_ID=your_user_pool_id
   VITE_COGNITO_CLIENT_ID=your_client_id
   VITE_CDN_URL=your_s3_bucket_url/thumbnails
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## 📦 Deployment

### Frontend (Vercel)
1. Import the repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Add the environment variables listed above in the Vercel Dashboard.

### Backend (AWS)
Updates are handled via `sam deploy`. All infrastructure is managed as code in `template.yaml`.

## 📄 License
Distributed under the MIT License.
