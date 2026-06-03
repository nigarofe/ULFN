import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { existsSync, appendFileSync } from 'node:fs';

const path = join(process.cwd(), `app.log`);
if (!existsSync(path)) { appendFileSync(path, '', { encoding: 'utf8' }); }

export function logMessage(message: string): void {
    const entry = `${new Date().toISOString()} - ${message}\n`;
    appendFileSync(path, entry, { encoding: 'utf8' });
}

export function withPerformanceLog<T>(label: string, fn: () => T): T {
    const start = performance.now();
    logMessage(`PERFORMANCE: ${label} - started`);

    try {
        const result = fn();
        const duration = (performance.now() - start).toFixed(0);
        logMessage(`PERFORMANCE: ${label} finished in ${duration}ms`);
        return result;
    } catch (err) {
        const duration = (performance.now() - start).toFixed(0);
        const message = err instanceof Error ? err.message : String(err);
        logMessage(`PERFORMANCE: ${label} failed in ${duration}ms - ${message}`);
        throw err;
    }
}
