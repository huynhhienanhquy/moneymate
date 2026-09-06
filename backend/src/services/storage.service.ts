import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface ObjectStorage {
  put(scope: string, file: Express.Multer.File): Promise<{ key: string; url: string }>;
  read(url: string): Promise<Buffer>;
  remove(url: string): Promise<void>;
}

function safeExtension(file: Express.Multer.File) {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf'
  };
  return extensions[file.mimetype] || '';
}

class LocalObjectStorage implements ObjectStorage {
  private root = path.resolve(process.cwd(), 'uploads');

  async put(scope: string, file: Express.Multer.File) {
    const key = `${scope}/${randomUUID()}${safeExtension(file)}`;
    const target = path.resolve(this.root, key);
    if (!target.startsWith(this.root + path.sep)) throw new Error('Invalid storage path');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.buffer);
    return { key, url: `/uploads/${key.replace(/\\/g, '/')}` };
  }

  async remove(url: string) {
    const relative = url.replace(/^\/uploads\//, '');
    const target = path.resolve(this.root, relative);
    if (!target.startsWith(this.root + path.sep)) throw new Error('Invalid storage path');
    await fs.rm(target, { force: true });
  }

  async read(url: string) {
    const relative = url.replace(/^\/uploads\//, '');
    const target = path.resolve(this.root, relative);
    if (!target.startsWith(this.root + path.sep)) throw new Error('Invalid storage path');
    return fs.readFile(target);
  }
}

class S3ObjectStorage implements ObjectStorage {
  private bucket = process.env.S3_BUCKET!;
  private publicUrl = process.env.S3_PUBLIC_URL!.replace(/\/$/, '');
  private client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
  });

  async put(scope: string, file: Express.Multer.File) {
    const key = `${scope}/${randomUUID()}${safeExtension(file)}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size
    }));
    return { key, url: `${this.publicUrl}/${key}` };
  }

  async remove(url: string) {
    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) throw new Error('Attachment URL does not belong to configured storage');
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: url.slice(prefix.length) }));
  }

  async read(url: string) {
    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) throw new Error('Attachment URL does not belong to configured storage');
    const result = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: url.slice(prefix.length),
    }));
    if (!result.Body) throw new Error('Attachment content not found');
    return Buffer.from(await result.Body.transformToByteArray());
  }
}

export function createObjectStorage(): ObjectStorage {
  if (process.env.STORAGE_DRIVER !== 's3') return new LocalObjectStorage();
  for (const name of ['S3_BUCKET', 'S3_REGION', 'S3_PUBLIC_URL']) {
    if (!process.env[name]) throw new Error(`${name} is required when STORAGE_DRIVER=s3`);
  }
  return new S3ObjectStorage();
}
