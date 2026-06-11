import { defineConfig } from 'vite';
import { ULF_SERVER_URL } from './config';
import { code_bundler } from './vite_plugins/code_bundler';
import { snippet_expander } from './vite_plugins/snippet_expander';

process.env.LAUNCH_EDITOR = 'C:\\Users\\Dell\\AppData\\Local\\Programs\\Antigravity IDE\\Antigravity IDE.exe';

export default defineConfig({
    server: {
        proxy: {
            '/api': ULF_SERVER_URL,
            '/events': ULF_SERVER_URL,
        },
    },
    plugins: [
        code_bundler(),
        snippet_expander(),
    ]
});
