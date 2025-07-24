import { NextRequest, NextResponse } from 'next/server';
import { createResource, updateResourceStatus } from '@/lib/actions/resources';
import { ingestDocument } from '@/lib/rag-ingestion';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const lessonId = formData.get('lessonId') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'No lesson ID provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, DOCX, and PPTX files are allowed.' },
        { status: 400 }
      );
    }
    
    // Create resource record in database
    const resourceFormData = new FormData();
    resourceFormData.append('name', file.name);
    resourceFormData.append('fileType', file.type);
    resourceFormData.append('lessonId', lessonId);
    
    const result = await createResource(resourceFormData);
    
    if (!result.success || !result.resource) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create resource' },
        { status: 500 }
      );
    }
    
    // Convert file to buffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Start RAG ingestion process (async, don't wait for completion)
    const processDocument = async () => {
      try {
        await updateResourceStatus(result.resource.id, 'processing');
        
        await ingestDocument(
          result.resource.id,
          parseInt(lessonId),
          buffer,
          file.name,
          file.type
        );
        
        await updateResourceStatus(result.resource.id, 'completed');
        console.log(`Successfully processed document: ${file.name}`);
      } catch (error) {
        console.error('RAG ingestion failed:', error);
        await updateResourceStatus(result.resource.id, 'error');
      }
    };
    
    processDocument();
    
    return NextResponse.json({
      success: true,
      resource: result.resource,
      message: 'File uploaded successfully. Processing in background.'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}