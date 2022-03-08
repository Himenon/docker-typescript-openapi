import type { RequestInfo, RequestInit, Response } from "node-fetch";

export interface RequestOption {}

export type FetchFunction = (url: RequestInfo, init?: RequestInit) => Promise<Response>;
