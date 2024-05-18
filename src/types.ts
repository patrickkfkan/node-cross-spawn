import { CommonSpawnOptions } from 'child_process';

export type CrossSpawnOptions<T extends CommonSpawnOptions> = T & {
    forceShell?: boolean;
}

export interface ParsedSpawnParams<T extends CommonSpawnOptions> {
    command: string;
    args: string[];
    options: CrossSpawnOptions<T>;
    file?: string;
    original: {
        command: string;
        args: string[];
    }
}
