import { z } from 'zod';

export const SRME = z.object({
    'ID': z.number(),
    'Classification': z.string(),
    'Discipline': z.string(),
    'Source': z.string(),
    'Description': z.string(),
    'SRME': z.object({
        'Total Attempts': z.number(),
        'Attempts Without Help': z.number(),
        'Attempts With Help': z.number(),
        'LAS': z.string().nullable(),
        'DSLA': z.number().nullable(),
        'LaMI': z.number().nullable(),
        'PMG-D': z.number().nullable(),
        'PMG-X': z.number().nullable(),
    }),
    'Attempts': z.array(
        z.object({
            'Timestamp': z.string(),
            'Code': z.number(),
        })
    )
});

export type SRMEEntry = z.infer<typeof SRME>;