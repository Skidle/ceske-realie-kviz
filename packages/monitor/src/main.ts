// Entry point. Nothing but the exit, so cli.ts stays importable from a test.
import { runCli } from './cli.ts';

process.exit(await runCli(process.argv));
