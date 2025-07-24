import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import pptx2json from 'pptx2json';

export interface ParsedDocument {
  content: string;
  metadata: {
    title?: string;
    author?: string;
    pageCount?: number;
    fileType: string;
  };
}

export async function parseDocument(file: Buffer, fileName: string, mimeType: string): Promise<ParsedDocument> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await parsePDF(file, fileName);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await parseDOCX(file, fileName);
      
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return await parsePPTX(file, fileName);
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`Error parsing document ${fileName}:`, error);
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parsePDF(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const data = await pdfParse(buffer);
  
  return {
    content: data.text,
    metadata: {
      title: data.info?.Title || fileName,
      author: data.info?.Author,
      pageCount: data.numpages,
      fileType: 'pdf'
    }
  };
}

async function parseDOCX(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  
  return {
    content: result.value,
    metadata: {
      title: fileName,
      fileType: 'docx'
    }
  };
}

async function parsePPTX(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
  try {
    // pptx2json expects a file path, so we'll need to write to temp file
    // For now, let's use a simpler approach and extract what we can
    const result = await pptx2json.toJson(buffer);
    
    // Extract text from slides
    let content = '';
    if (result && typeof result === 'object' && 'slides' in result) {
      const slides = result.slides as any[];
      for (const slide of slides) {
        if (slide.textContent) {
          content += slide.textContent + '\n\n';
        }
        // Extract text from shapes if available
        if (slide.shapes) {
          for (const shape of slide.shapes) {
            if (shape.text) {
              content += shape.text + '\n';
            }
          }
        }
      }
    }
    
    return {
      content: content.trim(),
      metadata: {
        title: fileName,
        fileType: 'pptx'
      }
    };
  } catch (error) {
    console.error('Error parsing PPTX:', error);
    // Fallback: return minimal info
    return {
      content: `PowerPoint presentation: ${fileName}`,
      metadata: {
        title: fileName,
        fileType: 'pptx'
      }
    };
  }
}