import { Injectable } from '@nestjs/common';
import { cloudinary } from '../config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  async uploadProfileImage(file: Express.Multer.File): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'profile-images',
        transformation: [
          { 
            width: 400, 
            height: 400, 
            crop: 'fill', 
            gravity: 'face',
            quality: 'auto',
            format: 'auto'
          }
        ],
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      });
      
      return result.secure_url;
    } catch (error) {
      throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
    }
  }

  async uploadImageFromBuffer(buffer: Buffer, folder: string = 'uploads'): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${buffer.toString('base64')}`,
        {
          folder,
          transformation: [
            { 
              width: 400, 
              height: 400, 
              crop: 'fill', 
              gravity: 'face',
              quality: 'auto',
              format: 'auto'
            }
          ],
          resource_type: 'image'
        }
      );
      
      return result.secure_url;
    } catch (error) {
      throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Erro ao deletar imagem: ${error.message}`);
    }
  }

  extractPublicIdFromUrl(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\./);
      return matches ? matches[1] : null;
    } catch (error) {
      return null;
    }
  }
}
