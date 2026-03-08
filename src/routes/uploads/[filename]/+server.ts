import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params }) => {
	const filename = params.filename as string;

	if (!filename || typeof filename !== 'string' || filename.includes('..') || filename.includes('/')) {
		return new Response('Invalid filename', { status: 400 });
	}

	try {
		const uploadsDir = env.UPLOAD_DIR || join(process.cwd(),'uploads');
		const filepath = join(uploadsDir, filename);

		if (!existsSync(filepath)) {
			return new Response('File not found', { status: 404 });
		}

		// Verify the file is within uploads directory (prevent directory traversal)
		if (!filepath.startsWith(uploadsDir)) {
			return new Response('Access denied', { status: 403 });
		}

		const fileBuffer = await readFile(filepath);
		
		// Determine content type based on file extension
		const ext = (filename as string).split('.').pop()?.toLowerCase() || '';
		const contentTypes: Record<string, string> = {
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'png': 'image/png',
			'gif': 'image/gif',
			'webp': 'image/webp',
			'svg': 'image/svg+xml'
		};
		const contentType = contentTypes[ext] || 'application/octet-stream';

		return new Response(fileBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400'
			}
		});
	} catch (error) {
		console.error('File serving error:', error);
		return new Response('Internal server error', { status: 500 });
	}
};
