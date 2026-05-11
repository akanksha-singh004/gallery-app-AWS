# ☁️ Cloud Photo Gallery — Implementation Plan

> **Stack**: React SPA · AWS S3 · Lambda (Node 18) · DynamoDB · CloudFront · Cognito · API Gateway · SAM
>
> **Status tracking**: `[ ]` Todo · `[/]` In Progress · `[x]` Done

---

## Architecture Overview

```
React SPA (Vite)
  │
  ├──> Cognito (Auth — email/password)
  │
  ├──> API Gateway ──> Lambda: getUploadUrl      ──> S3 originals bucket (pre-signed PUT)
  │                ──> Lambda: confirmUpload     ──> DynamoDB photos table
  │                ──> Lambda: listPhotos        ──> DynamoDB photos table (GSI query)
  │                ──> Lambda: deletePhoto       ──> S3 + DynamoDB
  │
  ├──> S3 originals bucket ──> S3 Trigger ──> Lambda: thumbnailer (Sharp) ──> S3 thumbs bucket
  │
  └──> CloudFront CDN ──> S3 thumbs bucket (public thumbnails)
```

---

## Phase 1 — AWS Infrastructure Setup

### 1.1 S3 Buckets

- [x] Create `gallery-originals-<id>` bucket
  - Private (Block All Public Access = ON)
  - Versioning: optional
- [x] Create `gallery-thumbs-<id>` bucket
  - Block All Public Access OFF (served via CloudFront only)
  - Bucket policy: restrict to CloudFront OAC only

### 1.2 Cognito User Pool

- [x] Create Cognito User Pool
  - Sign-in: email + password
  - App client: **no client secret** (SPA-compatible)
  - Enable SRP auth flow (`USER_SRP_AUTH`)
  - Token expiry: Access 1h, Refresh 30d
- [x] Note down: `UserPoolId` (`eu-north-1_f8IzaRrp1`), `ClientId` (`64fqqxm67m5pkr1rhojg5medd4`), `Region` (`eu-north-1`)

### 1.3 DynamoDB

- [x] Create table `photos`
  - Partition Key (PK): `userId` (String)
  - Sort Key (SK): `photoId` (String)
- [x] Create GSI: `byUploadedAt`
  - PK: `userId`
  - SK: `uploadedAt` (Number)
- [x] Create GSI: `bySize`
  - PK: `userId`
  - SK: `size` (Number)
- [x] Enable On-Demand billing (pay-per-request)

### 1.4 IAM — Lambda Execution Role

- [x] Create IAM role `gallery-lambda-role`
- [x] Attach inline policy:
  ```json
  {
    "Effect": "Allow",
    "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject"],
    "Resource": [
      "arn:aws:s3:::gallery-originals-<id>/*",
      "arn:aws:s3:::gallery-thumbs-<id>/*"
    ]
  }
  ```
- [x] Attach inline policy for DynamoDB:
  ```json
  {
    "Effect": "Allow",
    "Action": ["dynamodb:PutItem","dynamodb:GetItem","dynamodb:Query","dynamodb:DeleteItem","dynamodb:UpdateItem"],
    "Resource": "arn:aws:dynamodb:<region>:<acct>:table/photos*"
  }
  ```
- [x] Attach `AWSLambdaBasicExecutionRole` (CloudWatch logs)

### 1.5 API Gateway

- [x] Create HTTP API (v2) named `gallery-api`
- [x] Enable CORS: origin `http://localhost:5173` + CloudFront domain
- [ ] Add Cognito JWT Authorizer (To be done via SAM)
- [ ] Routes (all protected) (To be done via SAM):
  - `POST /upload-url`
  - `POST /confirm-upload`
  - `GET  /photos`
  - `DELETE /photos/{photoId}`

### 1.6 CloudFront

- [x] Create distribution
  - Origin: `gallery-thumbs-<id>` S3 bucket
  - Origin Access Control (OAC) — not OAI
  - Default cache TTL: 86400s (24h)
  - Compress objects automatically: Yes
- [x] Update thumbs bucket policy to allow only CloudFront OAC
- [x] Note down distribution domain: `https://d5xzrmmwdw3xz.cloudfront.net`

---

## Phase 2 — Lambda Functions (Node 18 ESM)

> All functions use `"type": "module"` (`.mjs` or `package.json` flag).

### 2.1 `getUploadUrl` Lambda

- [x] Create `lambdas/getUploadUrl/index.mjs`
- [x] Set env var: `ORIGINALS_BUCKET`
- [x] Attach `gallery-lambda-role`

### 2.2 `confirmUpload` Lambda

- [x] Create `lambdas/confirmUpload/index.mjs`
- [x] Set env var: `TABLE=photos`

### 2.3 `listPhotos` Lambda

- [x] Create `lambdas/listPhotos/index.mjs`
- [x] Set env vars: `TABLE=photos`, `CDN_URL=https://<dist>.cloudfront.net`

### 2.4 `deletePhoto` Lambda

- [x] Create `lambdas/deletePhoto/index.mjs`
- [x] Set env vars: `ORIGINALS_BUCKET`, `THUMBS_BUCKET`, `TABLE`

### 2.5 `thumbnailer` Lambda (S3 Trigger)

- [x] Create `lambdas/thumbnailer/index.mjs`
- [x] Bundle `sharp` (native binary — must be built for `linux/x64`)
- [x] Set env var: `THUMBS_BUCKET`
- [ ] Add S3 trigger: bucket=`gallery-originals-<id>`, event=`s3:ObjectCreated:*`

---

## Phase 3 — SAM / Serverless Deployment

### 3.1 SAM Template

- [x] Create `template.yaml` at project root
  - Define all 5 Lambda functions
  - Define API Gateway HTTP API + Cognito authorizer
  - Define all env vars per function
  - S3 event source for thumbnailer
- [ ] Define `samconfig.toml` with default deploy params (stack name, region, S3 artifact bucket)

### 3.2 Deployment Steps

- [ ] `sam build` — packages all lambdas (installs sharp as layer or bundled)
- [ ] `sam deploy --guided` — first deploy, save config
- [ ] Subsequent deploys: `sam deploy`
- [ ] Note outputs: API Gateway endpoint URL

---

## Phase 4 — React Frontend (Vite + TypeScript)

### 4.1 Project Bootstrap

- [ ] `npx create-vite@latest . --template react-ts`
- [ ] Install dependencies:
  ```bash
  npm install aws-amplify @aws-amplify/ui-react
  npm install react-router-dom axios
  npm install react-dropzone
  npm install -D @types/node
  ```

### 4.2 Amplify Configuration

- [ ] Create `src/aws-config.ts`
  ```ts
  export const awsConfig = {
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_CLIENT_ID,
        loginWith: { email: true }
      }
    }
  };
  ```
- [ ] Create `.env.local`:
  ```
  VITE_USER_POOL_ID=<your-pool-id>
  VITE_CLIENT_ID=<your-client-id>
  VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
  VITE_CDN_URL=https://<dist-id>.cloudfront.net
  ```

### 4.3 Auth Flow

- [ ] `src/pages/AuthPage.tsx` — Login / Register / Confirm code
  - Use `@aws-amplify/ui-react` `<Authenticator>` component or custom form
  - On success: store JWT access token in memory (not localStorage)
  - Redirect to `/gallery`
- [ ] Auth context `src/context/AuthContext.tsx`
  - Expose `user`, `token`, `signOut`

### 4.4 API Client

- [ ] `src/api/gallery.ts`
  ```ts
  const API = import.meta.env.VITE_API_URL;

  export async function getUploadUrl(token: string, fileName: string, contentType: string) {
    const r = await fetch(`${API}/upload-url`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, contentType })
    });
    return r.json() as Promise<{ url: string; key: string }>;
  }

  export async function confirmUpload(token: string, key: string, size: number, caption?: string) {
    await fetch(`${API}/confirm-upload`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, size, caption })
    });
  }

  export async function listPhotos(token: string, sortBy: 'uploadedAt' | 'size' = 'uploadedAt') {
    const r = await fetch(`${API}/photos?sortBy=${sortBy}`, {
      headers: { Authorization: token }
    });
    return r.json();
  }

  export async function deletePhoto(token: string, photoId: string) {
    await fetch(`${API}/photos/${encodeURIComponent(photoId)}`, {
      method: 'DELETE',
      headers: { Authorization: token }
    });
  }
  ```

### 4.5 Upload Flow

- [ ] `src/components/UploadZone.tsx`
  - Drag-and-drop via `react-dropzone`
  - Accept: `image/*`
  - On drop:
    1. Call `getUploadUrl`
    2. `PUT` file directly to pre-signed S3 URL
    3. Call `confirmUpload`
    4. Refresh photo list
  - Show progress bar per file
  - Show error toast on failure

### 4.6 Gallery Grid

- [ ] `src/pages/GalleryPage.tsx`
  - Fetch photos on mount via `listPhotos`
  - Sort controls: **Date ↑↓ | Size ↑↓**
  - Responsive CSS grid (masonry or uniform grid)
  - Each card: thumbnail from CloudFront + caption + size + date
  - Hover: reveal Delete button + Download button (links to original via new pre-signed GET URL)

### 4.7 Lightbox / Preview

- [ ] `src/components/Lightbox.tsx`
  - Click photo → full-screen overlay
  - Show original via separate `getDownloadUrl` Lambda (pre-signed GET) or direct CloudFront thumb
  - Keyboard: Esc to close, ← → to navigate

### 4.8 Download Original

- [ ] Add 5th Lambda `getDownloadUrl` (pre-signed GET on originals bucket)
- [ ] API route: `GET /photos/{photoId}/download`
- [ ] Frontend: fetch URL then open in new tab / trigger anchor download

### 4.9 UI Design System

- [ ] Dark glassmorphism theme
- [ ] Google Font: **Inter**
- [ ] Color palette:
  - Background: `#0a0a0f`
  - Surface: `rgba(255,255,255,0.05)` with backdrop-blur
  - Accent: `#6c63ff` (purple) + `#00d4ff` (cyan) gradient
- [ ] Micro-animations: card hover lift, upload pulse ring, skeleton loading
- [ ] Fully responsive: mobile → tablet → desktop

---

## Phase 5 — Testing

### 5.1 End-to-End Flow

- [ ] Register new user (email + password)
- [ ] Confirm verification email
- [ ] Log in → land on gallery
- [ ] Drag-and-drop image → upload → see thumbnail appear
- [ ] Sort by date / size
- [ ] Open lightbox → navigate photos
- [ ] Download original (opens pre-signed URL)
- [ ] Delete photo → disappears from grid
- [ ] Log out → redirect to auth

### 5.2 Edge Cases

- [ ] Upload non-image file → blocked at `accept` filter
- [ ] Upload >10 MB file → Lambda timeout / S3 limit check
- [ ] Unauthenticated API call → 401
- [ ] Cross-user access → 403 (userId from JWT, not body)
- [ ] Thumbnailer failure → DLQ / CloudWatch alert
- [ ] CORS headers present on all Lambda responses

---

## Phase 6 — Production Hardening

- [ ] Add CloudWatch alarms: Lambda errors, API 5xx, DynamoDB throttles
- [ ] Enable S3 server-side encryption (SSE-S3 or SSE-KMS)
- [ ] Set S3 lifecycle policy: move originals >90 days to S3-IA
- [ ] WAF on API Gateway (rate limiting per IP)
- [ ] Cognito MFA (optional, TOTP)
- [ ] CloudFront custom domain + ACM SSL cert
- [ ] Versioned Lambda deployments + aliases (blue/green)
- [ ] GitHub Actions CI/CD: `sam build && sam deploy` on push to `main`

---

## File / Folder Structure

```
gallery-app/
├── template.yaml                   # SAM template
├── samconfig.toml
├── lambdas/
│   ├── getUploadUrl/
│   │   └── index.mjs
│   ├── confirmUpload/
│   │   └── index.mjs
│   ├── listPhotos/
│   │   └── index.mjs
│   ├── deletePhoto/
│   │   └── index.mjs
│   ├── getDownloadUrl/
│   │   └── index.mjs
│   └── thumbnailer/
│       ├── index.mjs
│       └── package.json            # sharp dependency
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── .env.local
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── aws-config.ts
│       ├── api/
│       │   └── gallery.ts
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── pages/
│       │   ├── AuthPage.tsx
│       │   └── GalleryPage.tsx
│       ├── components/
│       │   ├── UploadZone.tsx
│       │   ├── PhotoCard.tsx
│       │   ├── PhotoGrid.tsx
│       │   └── Lightbox.tsx
│       └── styles/
│           └── index.css
└── implementation_plan.md          # this file
```

---

## Build Order (Recommended Sequence)

| Step | What | Status |
|------|------|--------|
| 1 | AWS infra — S3, Cognito, DynamoDB | `[ ]` |
| 2 | IAM role + policies | `[ ]` |
| 3 | Lambda: `getUploadUrl` | `[ ]` |
| 4 | Lambda: `confirmUpload` | `[ ]` |
| 5 | Lambda: `listPhotos` | `[ ]` |
| 6 | Lambda: `deletePhoto` | `[ ]` |
| 7 | Lambda: `getDownloadUrl` | `[ ]` |
| 8 | Lambda: `thumbnailer` + S3 trigger | `[ ]` |
| 9 | API Gateway routes + Cognito authorizer | `[ ]` |
| 10 | CloudFront + thumbs bucket policy | `[ ]` |
| 11 | SAM template + first deploy | `[ ]` |
| 12 | React app scaffold + Amplify auth | `[ ]` |
| 13 | Upload flow (dropzone → pre-signed → confirm) | `[ ]` |
| 14 | Gallery grid + sort | `[ ]` |
| 15 | Lightbox + download | `[ ]` |
| 16 | UI polish (dark glass theme, animations) | `[ ]` |
| 17 | End-to-end test | `[ ]` |
| 18 | Production hardening | `[ ]` |
