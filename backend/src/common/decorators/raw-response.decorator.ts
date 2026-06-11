import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'rawResponse';

/**
 * Marks a route whose return value must NOT be wrapped in the JSON success
 * envelope (e.g. HTML pages, file streams). The ResponseInterceptor passes
 * the value through untouched.
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
