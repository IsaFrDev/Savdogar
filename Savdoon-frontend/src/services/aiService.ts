import api from './api';

// AI Service for signature and description enhancement
export const aiService = {
    // Enhance signature with AI (make it more beautiful/calligraphic)
    enhanceSignature: async (signatureDataUrl: string): Promise<string> => {
        try {
            const response = await api.post('/ai/enhance-signature/', {
                signature_data: signatureDataUrl
            });
            return response.data.enhanced_signature;
        } catch (error) {
            console.error('AI signature enhancement failed:', error);
            // Return original if AI fails
            return signatureDataUrl;
        }
    },

    // Enhance description with AI (make it more professional)
    enhanceDescription: async (
        description: string,
        context: {
            storeName?: string;
            businessType?: string;
            language?: string;
        }
    ): Promise<{ variants: string[]; enhanced_description: string }> => {
        try {
            const response = await api.post('/ai/enhance-description/', {
                description,
                store_name: context.storeName,
                business_type: context.businessType,
                language: context.language || 'uz'
            });
            return {
                variants: response.data.variants || [response.data.enhanced_description],
                enhanced_description: response.data.enhanced_description
            };
        } catch (error) {
            console.error('AI description enhancement failed:', error);
            return { variants: [description], enhanced_description: description };
        }
    },

    // Generate description from scratch based on context
    generateDescription: async (
        context: {
            storeName: string;
            businessType: string;
            language?: string;
        }
    ): Promise<{ variants: string[]; description: string }> => {
        try {
            const response = await api.post('/ai/generate-description/', {
                store_name: context.storeName,
                business_type: context.businessType,
                language: context.language || 'uz'
            });
            return {
                variants: response.data.variants || [response.data.description],
                description: response.data.description
            };
        } catch (error) {
            console.error('AI description generation failed:', error);
            return { variants: [], description: '' };
        }
    },

    // Generate multiple calligraphic signature variants based on a name
    generateSignatures: async (name: string): Promise<any[]> => {
        try {
            const response = await api.post('/ai/generate-signatures/', { name });
            return response.data.variants;
        } catch (error) {
            console.error('AI signature generation failed:', error);
            return [];
        }
    }
};

export default aiService;
