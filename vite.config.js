import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from 'lovable-tagger';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
        resolve: {
            alias: {
                '@': '/src',
            },
            dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
        },
        server: {
            port: 8080,
        },
    });
});
