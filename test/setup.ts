import { TextDecoder, TextEncoder } from 'node:util';

global.TextEncoder = TextEncoder;
// @ts-expect-error: ok
global.TextDecoder = TextDecoder;
