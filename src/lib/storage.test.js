import { publicUrl, removeStoredImage, uploadBarbershopImage, uploadAvatar } from './storage';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('./supabase', () => {
  const bucket = {
    upload: jest.fn(() => Promise.resolve({ error: null })),
    remove: jest.fn(() => Promise.resolve({ error: null })),
    getPublicUrl: jest.fn((path) => ({ data: { publicUrl: `https://cdn/${path}` } })),
  };
  return { supabase: { storage: { from: jest.fn(() => bucket) } } };
});

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('base64data')),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('base64-arraybuffer', () => ({
  decode: jest.fn(() => new ArrayBuffer(8)),
}));

const bucket = supabase.storage.from('qualquer');

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bucket.upload.mockResolvedValue({ error: null });
    bucket.remove.mockResolvedValue({ error: null });
    bucket.getPublicUrl.mockImplementation((path) => ({ data: { publicUrl: `https://cdn/${path}` } }));
    FileSystem.readAsStringAsync.mockResolvedValue('base64data');
  });

  describe('publicUrl', () => {
    it('retorna nulo quando nao ha caminho', () => {
      expect(publicUrl('avatars', null)).toBeNull();
    });

    it('monta a url publica a partir do caminho', () => {
      expect(publicUrl('avatars', 'u1/foto.jpg')).toBe('https://cdn/u1/foto.jpg');
    });
  });

  describe('uploadBarbershopImage', () => {
    it('envia a imagem e retorna o caminho', async () => {
      const result = await uploadBarbershopImage('shop-1', 'file://foto.jpg');
      expect(bucket.upload).toHaveBeenCalledWith(
        expect.stringContaining('shop-1/'),
        expect.anything(),
        expect.objectContaining({ contentType: 'image/jpeg', upsert: false })
      );
      expect(result).toEqual({ path: expect.stringContaining('shop-1/') });
    });

    it('lanca quando o upload falha', async () => {
      bucket.upload.mockResolvedValue({ error: new Error('upload negado') });
      await expect(uploadBarbershopImage('shop-1', 'file://foto.jpg')).rejects.toThrow('upload negado');
    });
  });

  describe('uploadAvatar', () => {
    it('envia o avatar para o bucket de avatars', async () => {
      const result = await uploadAvatar('u1', 'file://foto.jpg');
      expect(result).toEqual({ path: expect.stringContaining('u1/') });
    });
  });

  describe('removeStoredImage', () => {
    it('nao chama remove quando o caminho e vazio', async () => {
      await removeStoredImage('avatars', null);
      expect(bucket.remove).not.toHaveBeenCalled();
    });

    it('remove a imagem do bucket', async () => {
      await removeStoredImage('avatars', 'u1/foto.jpg');
      expect(bucket.remove).toHaveBeenCalledWith(['u1/foto.jpg']);
    });

    it('lanca quando a remocao falha', async () => {
      bucket.remove.mockResolvedValue({ error: new Error('remocao negada') });
      await expect(removeStoredImage('avatars', 'u1/foto.jpg')).rejects.toThrow('remocao negada');
    });
  });
});
