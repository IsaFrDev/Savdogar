import { supabase } from '../supabase';

export const storageService = {
    /**
     * Rasmni Supabase Storage-ga yuklash
     * @param bucket 'store-assets' yoki 'avatars'
     * @param path Fayl manzili (masalan: 'logos/my-store.png')
     * @param file Fayl obyekti
     */
    async uploadFile(bucket: string, path: string, file: File) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Public URL olish
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    },

    /**
     * Mahsulot rasmini yuklash
     */
    async uploadProductImage(storeId: number, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${storeId}/products/${fileName}`;

        return this.uploadFile('store-assets', filePath, file);
    },

    /**
     * Do'kon logosini yuklash
     */
    async uploadStoreLogo(storeId: number, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo.${fileExt}`;
        const filePath = `${storeId}/${fileName}`;

        return this.uploadFile('store-assets', filePath, file);
    }
};
