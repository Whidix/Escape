import { mkdir, access } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

/**
 * Get the upload directory path from environment variable or use default
 */
export function getUploadDir(): string {
	return process.env.UPLOAD_DIR || './uploads';
}

/**
 * Get the full path for an uploaded file
 */
export function getUploadPath(filename: string): string {
	return join(getUploadDir(), filename);
}

/**
 * Ensure the upload directory exists, create it if not
 */
export async function ensureUploadDir(): Promise<void> {
	const uploadDir = getUploadDir();
	try {
		await access(uploadDir);
	} catch {
		await mkdir(uploadDir, { recursive: true });
	}
}

/**
 * Sanitize a filename by removing or replacing unsafe characters
 */
export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/_{2,}/g, '_')
		.replace(/^_+|_+$/g, '');
}

/**
 * Generate a unique filename using a random hash and original filename
 */
export function generateUniqueFilename(originalFilename: string): string {
	const ext = originalFilename.split('.').pop() || '';
	const hash = randomBytes(16).toString('hex');
	const sanitized = sanitizeFilename(originalFilename.replace(`.${ext}`, ''));
	return `${hash}_${sanitized}.${ext}`;
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase();
	const mimeTypes: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp'
	};
	return mimeTypes[ext || ''] || 'application/octet-stream';
}
