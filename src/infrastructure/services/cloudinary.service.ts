import { Injectable } from '@nestjs/common';
import { cloudinary, cloudinaryConfig } from '../config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  async uploadProfileImage(file: Express.Multer.File): Promise<string> {
    try {
      // Usar buffer em vez de file.path para compatibilidade com multer em memória
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: 'profile-images',
          transformation: [
            {
              width: 400,
              height: 400,
              crop: 'fill',
              gravity: 'face',
              quality: 'auto',
              format: 'auto',
            },
          ],
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        },
      );

      return result.secure_url;
    } catch (error) {
      throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
    }
  }

  async uploadImageFromBuffer(
    buffer: Buffer,
    folder: string = 'uploads',
  ): Promise<string> {
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
              format: 'auto',
            },
          ],
          resource_type: 'image',
        },
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

  async uploadCommunityImage(file: Express.Multer.File): Promise<string> {
    try {
      // Usar buffer em vez de file.path para compatibilidade com multer em memória
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: 'community-images',
          transformation: [
            {
              width: 800,
              height: 600,
              crop: 'fill',
              gravity: 'center',
              quality: 'auto',
              format: 'auto',
            },
          ],
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        },
      );

      return result.secure_url;
    } catch (error) {
      throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
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

  /**
   * Gera uma assinatura (signature) para upload seguro do frontend
   * Isso permite que o frontend faça upload direto para Cloudinary sem expor as credenciais
   */
  generateUploadSignature(params: {
    folder: string;
    publicId?: string;
    resourceType?: 'image' | 'raw' | 'video' | 'auto';
    allowedFormats?: string[];
    maxFileSize?: number;
  }): {
    signature: string;
    timestamp: number;
    folder: string;
    publicId?: string;
    resourceType: string;
    apiKey: string;
    cloudName: string;
  } {
    const { folder, publicId, resourceType = 'auto' } = params;

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Cloudinary exige que apenas os parâmetros realmente enviados no formulário
    // sejam utilizados para montar o string_to_sign. Como o frontend envia apenas
    // public_id (opcional) e timestamp, assinamos somente esses campos.
    const uploadParams: Record<string, string | number> = {
      timestamp,
    };

    if (publicId) {
      uploadParams.public_id = publicId;
    }

    // Gerar assinatura usando a API secret
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      cloudinaryConfig.api_secret!,
    );

    return {
      signature,
      timestamp,
      folder,
      publicId,
      resourceType,
      apiKey: cloudinaryConfig.api_key!,
      cloudName: cloudinaryConfig.cloud_name!,
    };
  }

  /**
   * Valida se um arquivo existe no Cloudinary
   */
  async validateFileExists(
    publicId: string,
    resourceType: string = 'auto',
  ): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gera URL de thumbnail para uma imagem
   */
  generateThumbnailUrl(
    publicId: string,
    width: number = 200,
    height: number = 200,
  ): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  }

  /**
   * Deleta arquivo do Cloudinary usando publicId
   */
  async deleteFile(
    publicId: string,
    resourceType: string = 'auto',
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  }
}
