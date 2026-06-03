import path from 'path';

export const ULF_SERVER_PORT = 3001;
export const VITE_SERVER_PORT = 5173;
export const PANDOC_SERVER_PORT = 3030;

export const ULF_SERVER_URL = 'http://localhost:' + ULF_SERVER_PORT;
export const VITE_SERVER_URL = 'http://localhost:' + VITE_SERVER_PORT;
export const PANDOC_SERVER_URL = 'http://localhost:' + PANDOC_SERVER_PORT;

export const EXPORTS_DIR = path.resolve(process.cwd(), 'exports');
export const DOCUMENTS_DIR = path.resolve(process.cwd(), 'public', 'documents');
export const SRME_PATH = path.resolve(process.cwd(), 'server', 'SRME.json');

export const DOCUMENT_HEADER_TEMPLATE_PATH = path.resolve(process.cwd(), 'server', 'ejs_templates', 'playlistControls.ejs');
export const DOCUMENT_CARD_TEMPLATE_PATH = path.resolve(process.cwd(), 'server', 'ejs_templates', 'documentCard.ejs');
export const DOCUMENT_VIEWER_TEMPLATE_PATH = path.resolve(process.cwd(), 'server', 'ejs_templates', 'documentViewer.ejs');

export const FOOTER_TEMPLATE_PATH = path.resolve(process.cwd(), 'server', 'ejs_templates', 'documentFooter.ejs');

export const DISABLED_DISCIPLINES: string[] = [
    // 'EES022 Introdução à Mecânica dos Sólidos',
    // 'EES003 Resistência dos Materiais',
    // 'FIS087 FOO',
    // 'MAT002 Cálculo 3',
    // 'EMA091 Mecânica dos fluidos',
    // 'EMA093 Processos de Fabricação por Usinagem',
    // 'Test file'
];
