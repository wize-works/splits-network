import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ServiceRegistry } from '../../clients';
import { AuthenticatedRequest } from '../../rbac';

/**
 * Documents Routes
 * - Document upload and management
 */
export function registerDocumentsRoutes(app: FastifyInstance, services: ServiceRegistry) {
    const documentService = () => services.get('document');
    const atsService = () => services.get('ats');
    const getCorrelationId = (request: FastifyRequest) => (request as any).correlationId;

    // Get candidate's own documents
    app.get('/api/candidates/me/documents', {
        schema: {
            description: 'Get my candidate documents',
            tags: ['documents'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const req = request as any;
        const correlationId = getCorrelationId(request);
        const clerkUserId = req.auth?.clerkUserId;

        if (!clerkUserId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            // Get candidate profile using Clerk user ID
            let candidateResponse: any;
            try {
                candidateResponse = await atsService().get(
                    '/candidates/me',
                    undefined,
                    correlationId,
                    {
                        'x-clerk-user-id': clerkUserId,
                    }
                );
            } catch (error: any) {
                // If candidate profile doesn't exist (404), return empty documents list
                if (error.message?.includes('404')) {
                    return reply.send({ data: [] });
                }
                throw error;
            }
            
            if (!candidateResponse.data) {
                return reply.send({ data: [] });
            }

            const candidateId = candidateResponse.data.id;

            // Get documents for this candidate
            const response = await documentService().get<{ documents: any[] }>(
                `/documents/entity/candidate/${candidateId}`,
                undefined,
                correlationId
            );
            
            // Document service returns { documents: [...] }, we need { data: [...] }
            const documents = response.documents || [];
            return reply.send({ data: documents });
        } catch (error: any) {
            request.log.error({ error, clerkUserId }, 'Failed to get candidate documents');
            return reply.status(500).send({ error: 'Failed to load documents' });
        }
    });

    // Upload document
    app.post('/api/documents/upload', {
        schema: {
            description: 'Upload document',
            tags: ['documents'],
            security: [{ clerkAuth: [] }],
            consumes: ['multipart/form-data'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const correlationId = getCorrelationId(request);
        
        try {
            // Parse multipart form data - iterate once through all parts
            let fileBuffer: Buffer | null = null;
            let filename: string | null = null;
            let mimetype: string | null = null;
            const fields: Record<string, any> = {};
            
            for await (const part of request.parts()) {
                if (part.type === 'file') {
                    // Read file into buffer
                    request.log.info({ filename: part.filename, mimetype: part.mimetype }, 'File part found');
                    fileBuffer = await part.toBuffer();
                    filename = part.filename;
                    mimetype = part.mimetype;
                } else {
                    // Store field value
                    request.log.info({ fieldname: part.fieldname, value: (part as any).value }, 'Field part found');
                    fields[part.fieldname] = (part as any).value;
                }
            }
            
            request.log.info({ hasFile: !!fileBuffer, fileSize: fileBuffer?.length, fields }, 'Parsed multipart data');
            
            if (!fileBuffer || !filename) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            // Create FormData to send to document service
            const FormData = (await import('form-data')).default;
            const formData = new FormData();
            
            // Add file as buffer
            formData.append('file', fileBuffer, {
                filename: filename,
                contentType: mimetype || 'application/octet-stream',
            });

            // Add other fields to form data
            Object.entries(fields).forEach(([key, value]) => {
                formData.append(key, value);
            });

            // Forward to document service
            const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3006';
            
            request.log.info('Converting FormData to buffer...');
            
            // Use getBuffer() if available, otherwise stream
            let formDataBuffer: Buffer;
            if (typeof (formData as any).getBuffer === 'function') {
                formDataBuffer = (formData as any).getBuffer();
            } else {
                // Read stream as Buffer (not string)
                formDataBuffer = await new Promise<Buffer>((resolve, reject) => {
                    const chunks: Buffer[] = [];
                    
                    formData.on('data', (chunk: Buffer | string) => {
                        // Ensure chunk is a Buffer
                        const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                        chunks.push(bufferChunk);
                    });
                    
                    formData.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        request.log.info({ totalSize: buffer.length }, 'FormData buffer ready');
                        resolve(buffer);
                    });
                    
                    formData.on('error', (err) => {
                        request.log.error({ error: err }, 'FormData error');
                        reject(err);
                    });
                });
            }
            
            const headers = formData.getHeaders();
            
            request.log.info({ 
                contentType: headers['content-type'],
                contentLength: formDataBuffer.length,
                hasFile: true 
            }, 'Forwarding to document service');
            
            const response = await fetch(`${documentServiceUrl}/documents/upload`, {
                method: 'POST',
                body: formDataBuffer,
                headers: {
                    ...headers,
                    'x-correlation-id': correlationId,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                request.log.error({ status: response.status, error: errorText }, 'Document service upload failed');
                return reply.status(response.status).send({ error: 'Upload failed' });
            }

            const result = await response.json();
            return reply.send(result);
        } catch (error: any) {
            request.log.error({ error: error.message, correlationId }, 'Failed to upload document');
            return reply.status(500).send({ error: 'Upload failed' });
        }
    });

    // Get document by ID
    app.get('/api/documents/:id', {
        schema: {
            description: 'Get document by ID',
            tags: ['documents'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const data = await documentService().get(`/documents/${id}`);
        return reply.send(data);
    });

    // List documents with filters
    app.get('/api/documents', {
        schema: {
            description: 'List documents',
            tags: ['documents'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const queryString = new URLSearchParams(request.query as any).toString();
        const path = queryString ? `/documents?${queryString}` : '/documents';
        const data = await documentService().get(path);
        return reply.send(data);
    });

    // Get documents by entity
    app.get('/api/documents/entity/:entityType/:entityId', {
        schema: {
            description: 'Get documents by entity',
            tags: ['documents'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { entityType, entityId } = request.params as { entityType: string; entityId: string };
        const data = await documentService().get(`/documents/entity/${entityType}/${entityId}`);
        return reply.send(data);
    });

    // Delete document (candidates can delete their own, or roles with permission)
    app.delete('/api/documents/:id', {
        schema: {
            description: 'Delete document',
            tags: ['documents'],
            security: [{ clerkAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const req = request as any;
        const correlationId = getCorrelationId(request);

        // Check if user has permission
        const hasRole = req.auth?.memberships?.some((m: any) => 
            ['recruiter', 'company_admin', 'platform_admin'].includes(m.role)
        );

        if (!hasRole) {
            // Candidates can only delete their own documents
            const userEmail = req.auth?.email;
            if (!userEmail) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            try {
                // Get document details
                const docResponse: any = await documentService().get(`/documents/${id}`, undefined, correlationId);
                const document = docResponse.data;

                // Verify this is a candidate document
                if (document.entity_type !== 'candidate') {
                    return reply.status(403).send({ error: 'Permission denied' });
                }

                // Find candidate by email
                const candidatesResponse: any = await atsService().get(
                    `/candidates?email=${encodeURIComponent(userEmail)}`,
                    undefined,
                    correlationId
                );
                const candidates = candidatesResponse.data || [];
                
                if (candidates.length === 0 || candidates[0].id !== document.entity_id) {
                    return reply.status(403).send({ error: 'Permission denied' });
                }
            } catch (error: any) {
                request.log.error({ error, documentId: id }, 'Failed to verify document ownership');
                return reply.status(403).send({ error: 'Permission denied' });
            }
        }

        await documentService().delete(`/documents/${id}`, correlationId);
        return reply.status(204).send();
    });
}
