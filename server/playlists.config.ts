export type PlaylistsConfig = {
    folder: string;
    subfolders: {
        subfolder: string;
        playlist: number[];
    }[];
};

export const PLAYLISTS_CONFIG: PlaylistsConfig[] = [
    {
        folder: 'MAT015 Equações Diferenciais A',
        subfolders: [
            {
                subfolder: 'Preparação P3 - Anotações das aulas',
                playlist: [279]
            },
            {
                subfolder: 'Trabalho Avaliativo',
                playlist: [260, 261, 262, 263]
            },
            {
                subfolder: 'Preparação P2 - Prova simulada e lista de exercícios',
                playlist: [247, 248, 249, 250, 264, 268]
            },
            {
                subfolder: 'Preparação P2 - Anotações das aulas',
                playlist: [236, 237, 238, 243, 245, 246]
            },
            {
                subfolder: 'Preparação P1 - Anotações das aulas',
                playlist: [219, 220, 223, 225, 229, 230]
            },
            {
                subfolder: 'Workbook for Dummies - Part 3',
                playlist: [199, 200, 201, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215]
            },
            {
                subfolder: 'Workbook for Dummies - Part 2',
                playlist: [185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 196, 197, 198]
            },
            {
                subfolder: 'Workbook for Dummies - Part 1',
                playlist: [173, 174, 175, 176, 177, 179, 180, 181, 182, 183, 184]
            },
        ]
    },

    {
        folder: 'EMA090 Processos Primários de Fabricação',
        subfolders: [
            {
                subfolder: 'Preparação P3 - Provas anteriores',
                playlist: []
            },
            {
                subfolder: 'Preparação P3 - Anotações das aulas',
                playlist: []
            },
            {
                subfolder: 'Preparação P2 - Provas anteriores',
                playlist: [240, 241]
            },
            {
                subfolder: 'Preparação P2 - Anotações das aulas',
                playlist: [251]
            },
            {
                subfolder: 'Preparação P1 - Provas anteriores',
                playlist: [203, 195, 202]
            },
            {
                subfolder: 'Preparação P1 - Anotações das aulas',
                playlist: [216, 221, 222]
            },
        ]
    },

    {
        folder: 'EES039 Análise Estrutural',
        subfolders: [
            {
                subfolder: 'Preparação TP2 - Anotações das aulas',
                playlist: [275]
            },
            {
                subfolder: 'TP1',
                playlist: [276, 277, 278]
            },
            {
                subfolder: 'Preparação TP1 - Anotações das aulas',
                playlist: [255, 256, 269, 270, 271, 272, 274, 275]
            },
            {
                subfolder: 'Preparação P1 - Provas anteriores',
                playlist: [218, 242]
            },
            {
                subfolder: 'Preparação P1 - Anotações das aulas',
                playlist: [224, 227, 228, 231, 232, 233, 235, 239]
            },
            {
                subfolder: 'Outros',
                playlist: [234]
            }
        ]
    },

    {
        folder: 'ULFN',
        subfolders: [
            {
                subfolder: 'Software documentation',
                playlist: [244, 267, 266, 259, 257]
            },
            {
                subfolder: 'General notes',
                playlist: [273]
            },
            {
                subfolder: 'Performance and implementation',
                playlist: []
            },
            {
                subfolder: 'Showcases',
                playlist: [252, 253, 254]
            }
        ]
    },

    {
        folder: 'EES022 Introdução à Mecânica dos Sólidos',
        subfolders: [
            {
                subfolder: 'Lista 2',
                playlist: [88, 90, 91, 92, 93, 94, 95, 96]
            },
            {
                subfolder: 'Lista 3',
                playlist: [110, 111, 112, 123, 124, 125, 126, 127, 128, 129, 130]
            },
            {
                subfolder: 'Outros',
                playlist: [115, 116, 121, 122]
            }
        ]
    },
    {
        folder: 'Duolingo English Test',
        subfolders: [
            {
                subfolder: 'Init',
                playlist: [170, 171, 172]
            }
        ]
    },
    {
        folder: 'EMC029 Seleção de Materiais',
        subfolders: [
            {
                subfolder: 'Estudos dirigidos',
                playlist: [217, 265, 280]
            }
        ]
    }
];