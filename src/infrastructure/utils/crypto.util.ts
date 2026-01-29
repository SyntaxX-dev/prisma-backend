import { randomBytes } from 'crypto';

/**
 * Utilitário para geração criptograficamente segura de valores aleatórios
 * 
 * IMPORTANTE: Nunca use Math.random() para valores de segurança!
 * Use estas funções para tokens, códigos, IDs, etc.
 */
export class CryptoUtil {
  /**
   * Gera bytes aleatórios criptograficamente seguros
   * @param length Número de bytes a gerar
   * @returns Buffer com bytes aleatórios
   */
  static randomBytes(length: number): Buffer {
    return randomBytes(length);
  }

  /**
   * Gera uma string hexadecimal aleatória criptograficamente segura
   * @param length Número de bytes (a string terá length * 2 caracteres hex)
   * @returns String hexadecimal
   */
  static randomHex(length: number = 16): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Gera um código numérico aleatório criptograficamente seguro
   * @param digits Número de dígitos (ex: 6 para código de 6 dígitos)
   * @returns String com código numérico
   */
  static randomNumericCode(digits: number = 6): string {
    if (digits < 1 || digits > 10) {
      throw new Error('Número de dígitos deve estar entre 1 e 10');
    }

    // Gera bytes suficientes para garantir aleatoriedade
    const bytes = randomBytes(4);
    const randomValue = bytes.readUInt32BE(0);
    
    // Calcula o range (ex: para 6 dígitos, range é 100000 a 999999)
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const range = max - min + 1;
    
    // Usa módulo para garantir que está no range
    const code = min + (randomValue % range);
    
    return code.toString().padStart(digits, '0');
  }

  /**
   * Gera um ID único usando timestamp + bytes aleatórios
   * Formato: timestamp-hex
   * @param randomBytesLength Número de bytes aleatórios (padrão: 8)
   * @returns String com ID único
   */
  static generateUniqueId(randomBytesLength: number = 8): string {
    const timestamp = Date.now();
    const random = randomBytes(randomBytesLength).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Embaralha um array usando algoritmo Fisher-Yates com aleatoriedade criptográfica
   * @param array Array a ser embaralhado
   * @returns Novo array embaralhado (não modifica o original)
   */
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Gera índice aleatório criptograficamente seguro
      const randomBytes = CryptoUtil.randomBytes(4);
      const randomValue = randomBytes.readUInt32BE(0);
      const j = randomValue % (i + 1);
      
      // Troca elementos
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Gera uma senha segura aleatória criptograficamente segura
   * Formato: 12 caracteres com letras maiúsculas, minúsculas, números e símbolos
   * @param length Comprimento da senha (padrão: 12)
   * @returns String com senha segura
   */
  static generateSecurePassword(length: number = 12): string {
    if (length < 8) {
      throw new Error('Senha deve ter pelo menos 8 caracteres');
    }

    // Caracteres permitidos
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@$!%*?&';
    const allChars = lowercase + uppercase + numbers + symbols;

    // Garante que a senha tenha pelo menos um de cada tipo
    const bytes = randomBytes(length);
    let password = '';
    
    // Adiciona pelo menos um de cada tipo
    password += lowercase[bytes[0] % lowercase.length];
    password += uppercase[bytes[1] % uppercase.length];
    password += numbers[bytes[2] % numbers.length];
    password += symbols[bytes[3] % symbols.length];

    // Preenche o resto com caracteres aleatórios
    for (let i = 4; i < length; i++) {
      const randomIndex = bytes[i] % allChars.length;
      password += allChars[randomIndex];
    }

    // Embaralha a senha para não ter padrão previsível
    const passwordArray = password.split('');
    return CryptoUtil.shuffleArray(passwordArray).join('');
  }
}
