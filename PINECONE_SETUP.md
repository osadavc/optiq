# Pinecone Inference Setup Guide

This application uses Pinecone's hosted inference API for document embedding and search. Here's how to set it up:

## 1. Create a Pinecone Account
- Sign up at [pinecone.io](https://pinecone.io)
- Get your API key from the dashboard

## 2. Configure Environment Variables
Add these to your `.env.local` file:
```
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=optiq-documents
```

## 3. Index Configuration

### Option A: Create Index with Inference (Recommended)
When you first run the application, it will attempt to create an index automatically. However, for full inference support, you may need to:

1. Go to your Pinecone console
2. Create a new index named `optiq-documents` (or your custom name)
3. Configure it with:
   - **Dimensions**: 1024 (or as required by your chosen model)
   - **Metric**: Cosine
   - **Cloud**: AWS
   - **Region**: us-east-1
   - **Enable Inference**: Configure with a hosted embedding model

### Option B: Manual Setup
If automatic creation doesn't work, create the index manually in the Pinecone console with the specifications above.

## 4. Supported Document Types
The RAG ingestion pipeline supports:
- **PDF files** - Extracted using pdf-parse
- **DOCX files** - Extracted using mammoth
- **PPTX files** - Extracted using pptx2json

## 5. How It Works

### Document Upload Flow:
1. User uploads a file (PDF/DOCX/PPTX)
2. Document is parsed and text is extracted
3. Text is chunked into smaller segments (1000 chars with 200 char overlap)
4. Chunks are stored in Pinecone with metadata
5. Pinecone automatically generates embeddings using its hosted model

### Metadata Stored:
- `resourceId`: Database ID of the resource
- `lessonId`: ID of the associated lesson  
- `fileName`: Original filename
- `fileType`: MIME type of the file
- `chunkIndex`: Index of the text chunk
- `text`: The actual text content
- `startChar`/`endChar`: Position in original document
- `wordCount`: Number of words in chunk
- `title`: Document title (if available)
- `author`: Document author (if available)  
- `pageCount`: Number of pages (for PDFs)

## 6. Processing Status
Resources have a `processingStatus` field that tracks:
- `pending`: Just uploaded, waiting to be processed
- `processing`: Currently being ingested into Pinecone
- `completed`: Successfully processed and searchable
- `error`: Processing failed

## 7. Search (Future Implementation)
Once properly configured with inference, you'll be able to:
- Search across all documents
- Filter by lesson
- Get semantic matches for queries
- Retrieve relevant document chunks

## Troubleshooting

### Common Issues:
1. **"Index not found"** - Make sure the index name matches your environment variable
2. **"Dimension mismatch"** - Ensure your index dimensions match the embedding model
3. **"Processing failed"** - Check Pinecone logs and ensure sufficient quota
4. **"Search not working"** - Verify inference is properly configured on your index

### Logs:
Check the application logs for detailed information about:
- Document parsing
- Chunk creation
- Pinecone operations
- Processing status updates

## Costs
- Pinecone charges based on index size and operations
- Monitor your usage in the Pinecone dashboard
- Consider implementing cleanup for old documents if needed