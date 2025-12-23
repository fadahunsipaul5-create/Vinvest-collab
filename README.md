# Sec-Insights-App

A comprehensive financial analysis and insights platform with AI-powered chatbot capabilities.

## Features

### File Upload & Context Integration
- **File Upload Endpoint**: `/api/file-upload/`
- **Supported Formats**: PDF, DOCX, DOC, TXT, CSV, XLSX, XLS
- **Integration**: Uploaded files are processed and stored in Chroma for vector-based semantic search
- **Chatbot Integration**: Uploaded file context is automatically included in chatbot responses

### Chatbot with File Context
- **Enhanced Chat**: The chatbot now includes context from user-uploaded files
- **External Processing**: Files are processed by external endpoint at `http://34.68.84.147:8080/api/user_data_upload`
- **Context Retrieval**: File context is fetched from `http://34.68.84.147:8080/api/user_data_context`

### Financial Analysis
- Real-time financial data analysis
- Interactive charts and visualizations
- Company comparison tools
- Industry benchmarking

### Authentication
- Secure user authentication
- Token-based API access
- User session management

## API Endpoints

### File Upload
```
POST /api/file-upload/
Content-Type: multipart/form-data
Authorization: Bearer <token>

Parameters:
- files: Array of files (PDF, DOCX, DOC, TXT, CSV, XLSX, XLS)
- company_context: Optional company context
- description: Optional description
- upload_timestamp: Optional timestamp
```

### Chat with File Context
```
POST /api/chat/
Content-Type: application/json
Authorization: Bearer <token>

The chatbot automatically includes context from user's uploaded files
```

## Setup

1. Install dependencies
2. Configure environment variables
3. Run migrations
4. Start the development server

## Usage

1. **Upload Files**: Use the file upload interface to upload financial documents
2. **Chat with Context**: Ask questions and the chatbot will include context from your uploaded files
3. **Analyze Data**: Use the financial analysis tools to explore company data

## Technical Details

### File Processing Flow
1. User uploads files via frontend
2. Files sent to external endpoint for processing
3. Files stored in Chroma for vector search
4. Context retrieved and included in chatbot responses

### External Endpoints
- **File Upload**: `http://34.68.84.147:8080/api/user_data_upload`
- **Context Retrieval**: `http://34.68.84.147:8080/api/user_data_context`

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.
