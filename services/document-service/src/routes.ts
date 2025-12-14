import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createLogger } from '@splits-network/shared-logging';
import { DocumentService } from './service.js';
import multipart from '@fastify/multipart';

const logger = createLogger({ serviceName: 'document-service' });

export async function registerRoutes(fastify: FastifyInstance, service: DocumentService) {
    // Register multipart for file uploads
    await fastify.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
        },
    });

    /**
     * POST /documents/upload
     * Upload a new document
     */
    fastify.post(
        '/documents/upload',
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const data = await request.file();

                if (!data) {
                    return reply.status(400).send({ error: 'No file provided' });
                }

                // Get form fields
                const fields: any = {};
                for await (const part of request.parts()) {
                    if (part.type === 'field') {
                        fields[part.fieldname] = (part as any).value;
                    }
                }

                const { entity_type, entity_id, document_type, uploaded_by_user_id } = fields;

                if (!entity_type || !entity_id || !document_type) {
                    return reply.status(400).send({
                        error: 'Missing required fields: entity_type, entity_id, document_type',
                    });
                }

                // Read file buffer
                const buffer = await data.toBuffer();

                const document = await service.uploadDocument({
                    file: buffer,
                    filename: data.filename,
                    entityType: entity_type,
                    entityId: entity_id,
                    documentType: document_type,
                    uploadedByUserId: uploaded_by_user_id,
                    metadata: fields.metadata ? JSON.parse(fields.metadata) : undefined,
                });

                logger.info({ id: document.id }, 'Document uploaded via API');

                return reply.status(201).send(document);
            } catch (error: any) {
                logger.error({ error: error.message }, 'Upload endpoint error');
                return reply.status(500).send({
                    error: error.message || 'Failed to upload document',
                });
            }
        }
    );

    /**
     * GET /documents/:id
     * Get a document by ID with signed download URL
     */
    fastify.get(
        '/documents/:id',
        async (
            request: FastifyRequest<{ Params: { id: string } }>,
            reply: FastifyReply
        ) => {
            try {
                const { id } = request.params;

                const document = await service.getDocument(id);

                if (!document) {
                    return reply.status(404).send({ error: 'Document not found' });
                }

                return reply.send(document);
            } catch (error: any) {
                logger.error({ error: error.message }, 'Get document error');
                return reply.status(500).send({
                    error: 'Failed to get document',
                });
            }
        }
    );

    /**
     * GET /documents
     * List documents with filters
     */
    fastify.get(
        '/documents',
        async (
            request: FastifyRequest<{
                Querystring: {
                    entity_type?: string;
                    entity_id?: string;
                    document_type?: string;
                    uploaded_by_user_id?: string;
                    limit?: string;
                    offset?: string;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const {
                    entity_type,
                    entity_id,
                    document_type,
                    uploaded_by_user_id,
                    limit,
                    offset,
                } = request.query;

                const result = await service.listDocuments({
                    entity_type,
                    entity_id,
                    document_type,
                    uploaded_by_user_id,
                    limit: limit ? parseInt(limit, 10) : undefined,
                    offset: offset ? parseInt(offset, 10) : undefined,
                });

                return reply.send(result);
            } catch (error: any) {
                logger.error({ error: error.message }, 'List documents error');
                return reply.status(500).send({
                    error: 'Failed to list documents',
                });
            }
        }
    );

    /**
     * DELETE /documents/:id
     * Delete a document
     */
    fastify.delete(
        '/documents/:id',
        async (
            request: FastifyRequest<{ Params: { id: string } }>,
            reply: FastifyReply
        ) => {
            try {
                const { id } = request.params;

                await service.deleteDocument(id);

                return reply.status(204).send();
            } catch (error: any) {
                logger.error({ error: error.message }, 'Delete document error');
                return reply.status(500).send({
                    error: 'Failed to delete document',
                });
            }
        }
    );

    /**
     * GET /documents/entity/:entityType/:entityId
     * Get all documents for a specific entity
     */
    fastify.get(
        '/documents/entity/:entityType/:entityId',
        async (
            request: FastifyRequest<{
                Params: { entityType: string; entityId: string };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const { entityType, entityId } = request.params;

                const documents = await service.getDocumentsByEntity(
                    entityType,
                    entityId
                );

                return reply.send({ documents });
            } catch (error: any) {
                logger.error({
                    error: error.message,
                }, 'Get documents by entity error');
                return reply.status(500).send({
                    error: 'Failed to get documents',
                });
            }
        }
    );

    /**
     * PATCH /documents/:id/status
     * Update document processing status (internal endpoint)
     */
    fastify.patch(
        '/documents/:id/status',
        async (
            request: FastifyRequest<{
                Params: { id: string };
                Body: {
                    status: 'pending' | 'processing' | 'processed' | 'failed';
                    metadata?: Record<string, any>;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const { id } = request.params;
                const { status, metadata } = request.body;

                if (!status) {
                    return reply.status(400).send({
                        error: 'Missing required field: status',
                    });
                }

                const document = await service.updateProcessingStatus(
                    id,
                    status,
                    metadata
                );

                return reply.send(document);
            } catch (error: any) {
                logger.error({ error: error.message }, 'Update status error');
                return reply.status(500).send({
                    error: 'Failed to update document status',
                });
            }
        }
    );

    /**
     * GET /health
     * Health check endpoint
     */
    fastify.get('/health', async (_request, reply) => {
        return reply.send({ 
            status: 'healthy', 
            service: 'document-service',
            timestamp: new Date().toISOString(),
        });
    });
}
