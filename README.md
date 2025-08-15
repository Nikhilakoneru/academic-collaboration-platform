# Academic Collaboration Platform

A web-based collaborative document editor for academic writing, built using AWS serverless architecture.

## Overview

This platform allows multiple users to collaborate on documents in real-time. It's designed as a simplified alternative to Google Docs, focused specifically on academic document creation. Users can create, edit, share, and collaborate on documents through a web interface.

## Problem Statement

Academic collaboration often requires multiple authors to work on the same document. Traditional methods like emailing document versions back and forth lead to version control issues and merge conflicts. This platform provides a centralized solution where all collaborators can work on the same document simultaneously.

I used  HCL instead of python because when I was learning about terraform and was following the tutorials they all used HCL, so that's where I forgot to use python. By the time I realized we were supposed to use Python, I was already deep into HCL with half my infrastructure done. I made the call to stick with it rather than restart. HCL ended up being pretty easy too and it was like JSON.

## Features

- **User Authentication**: Email/password based signup and login
- **Document Management**: Create, read, update, and delete documents
- **Document Sharing**: Share documents with other users via email
- **Real-time Editing**: Multiple users can edit the same document 
- **Rich Text Editor**: Basic text formatting capabilities
- **Auto-save**: Documents save automatically during editing

## Technology Stack

### Frontend
- React 18 - UI framework
- Quill.js - Rich text editor
- Tailwind CSS - Utility-first CSS framework
- Headless UI - Unstyled accessible UI components
- Heroicons - SVG icon set
- React Hot Toast - Toast notifications
- Vite - Build tool and dev server
- Framer Motion - Animation library

### Backend
- AWS Lambda - Serverless compute
- AWS API Gateway - REST and WebSocket APIs
- AWS DynamoDB - NoSQL database
- AWS Cognito - User authentication
- AWS S3 - Static hosting and storage

### Infrastructure
- Terraform - Infrastructure as Code

## Live Demo

URL: http://academic-collab-frontend-111311033838.s3-website-us-east-1.amazonaws.com

Test Account:
- Email: `test@example.com`
- Password: `Test123!`

## Installation

### Prerequisites
- Node.js 18 or higher
- AWS Account with appropriate permissions
- AWS CLI configured
- Terraform installed

### Setup Steps

1. Clone the repository:
```bash
git clone https://github.com/Nikhilakoneru/academic-collaboration-platform
cd academic-collaboration-platform
```

2. Install dependencies:
```bash
npm install
```

3. Deploy AWS infrastructure:
```bash
cd infrastructure
./deploy.sh
```

4. Start development server:
```bash
npm run dev
```

## Architecture

The application follows a serverless architecture pattern:

```
Frontend (React) -> API Gateway -> Lambda Functions -> DynamoDB
                 -> WebSocket API -> Lambda Handler -> DynamoDB
```

### Database Schema

Single-table design in DynamoDB:
- Primary Key (PK) and Sort Key (SK) for main access patterns
- Global Secondary Index (GSI1) for user document queries
- Entity types: USER, DOC, CONN (connections)

## API Endpoints

### REST API
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user  
- `GET /auth/verify` - Verify token
- `GET /documents` - List user's documents
- `POST /documents` - Create document
- `PUT /documents/{id}` - Update document
- `DELETE /documents/{id}` - Delete document

### WebSocket API
- `$connect` - Establish connection
- `$disconnect` - Close connection
- `JOIN_DOCUMENT` - Join document session
- `LEAVE_DOCUMENT` - Leave document session
- `DOCUMENT_UPDATE` - Send/receive updates

## Testing

### Running All Tests

```bash
cd testing
chmod +x *.sh
./run-all.sh
```

This will run:
- Login authentication test
- Complete CRUD operations test (create, read, update, delete)

### Individual Test Scripts

Located in the `testing/` folder:

```bash
cd testing

# Test login endpoint
./login.sh

# Test all CRUD operations
./crud.sh

# Basic API test
./test.sh

# Check AWS infrastructure status
./check.sh

# Fix deployment issues (redeploys backend)
./fix.sh
```

### Manual Testing

1. Open http://localhost:3000 (local) or the live demo URL
   ![Login Page](/public/image1.png)

2. Sign up or login with test@example.com / Test123!
   ![Sign Up / Login Screen](/public/image2.png)

3. Create a new document
   ![Create Document](/public/image3.png)

4. Edit the document content
   ![Document Editor](/public/image4.png)

5. Refresh the page - document should persist
   ![Document Persistence](/public/image5.png)

6. Share document with another email
![Document Sharing and Realtime Sync](/public/image6.png)

7. Open same document in multiple tabs to test realtime sync
![Shows number of people shared with](/public/image7.png)


### Troubleshooting

If tests return empty responses or errors:
```bash
cd testing
./fix.sh
```

This will redeploy the Lambda function code. If issues persist, check logs:
```bash
aws logs tail /aws/lambda/academic-collab-auth --follow
aws logs tail /aws/lambda/academic-collab-documents --follow
```

## Current Limitations

- **WebSocket functionality not fully implemented** - Real-time sync works but lacks conflict resolution
- **No export functionality** - Cannot export to PDF or other formats
- **Limited text formatting** - Basic formatting only, no tables or images
- **No version history** - Cannot view or restore previous versions
- **No offline support** - Requires constant internet connection
- **Mobile responsiveness** - Not optimized for mobile devices
- **No citation management** - No built-in bibliography tools

## Deployment

The application is deployed to AWS using Terraform:
```bash
cd infrastructure
./deploy.sh          # Deploy infrastructure
./deploy-backend.sh  # Update Lambda functions
```

## Cost Considerations

The infrastructure is designed to operate within AWS Free Tier limits:
- Lambda: 1 million requests/month
- DynamoDB: 25 GB storage
- API Gateway: 1 million API calls/month
- S3: 5 GB storage

Expected monthly cost for typical usage: $0-5

## Future Work

- Implement operational transformation for conflict-free collaborative editing
- Add PDF and LaTeX export functionality
- Implement version control and revision history
- Add comment and annotation features
- Improve mobile responsiveness
- Add offline capability with sync

## Author

Nikhila Koneru(002032245) - Cloud Computing Final Project

## References

1. AWS Lambda Developer Guide. Amazon Web Services. https://docs.aws.amazon.com/lambda/
2. Amazon API Gateway Developer Guide. Amazon Web Services. https://docs.aws.amazon.com/apigateway/
3. Amazon DynamoDB Developer Guide. Amazon Web Services. https://docs.aws.amazon.com/dynamodb/
4. Amazon Cognito Developer Guide. Amazon Web Services. https://docs.aws.amazon.com/cognito/
5. Amazon S3 User Guide. Amazon Web Services. https://docs.aws.amazon.com/s3/
6. AWS SDK for JavaScript v3 Developer Guide. Amazon Web Services. https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
7. WebSocket API in Amazon API Gateway. Amazon Web Services. https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html
8. React Documentation. Meta. https://react.dev/
9. Quill Rich Text Editor Documentation. Quill. https://quilljs.com/docs/quickstart/
10. Tailwind CSS Documentation. Tailwind Labs. https://tailwindcss.com/docs/installation
11. Headless UI Documentation. Tailwind Labs. https://headlessui.com/
12. Heroicons. Tailwind Labs. https://heroicons.com/
13. Framer Motion Documentation. Framer. https://www.framer.com/motion/
14. React Hot Toast Documentation. Timo Lins. https://react-hot-toast.com/
15. Vite Documentation. Vite. https://vitejs.dev/guide/
16. Terraform Documentation. HashiCorp. https://www.terraform.io/docs
17. Terraform AWS Provider Documentation. HashiCorp. https://registry.terraform.io/providers/hashicorp/aws/latest/docs
18. HashiCorp Configuration Language (HCL) Documentation. HashiCorp. https://developer.hashicorp.com/terraform/language
19. DeBrie, Alex. "The What, Why, and When of Single-Table Design with DynamoDB." 2020. https://www.alexdebrie.com/posts/dynamodb-single-table/
20. AWS Serverless Architecture Guide. Amazon Web Services. https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html
21. Node.js Documentation. OpenJS Foundation. https://nodejs.org/docs/
22. MDN Web Docs - WebSocket API. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
23. AWS Well-Architected Framework. Amazon Web Services. https://aws.amazon.com/architecture/well-architected/
