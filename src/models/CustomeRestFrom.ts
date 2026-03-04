import { KeyValuePair } from "@/types/restForm";

export class RestFromDefaults {
    connectionName = '';
    description = '';
    url = '';
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET";
    params: KeyValuePair[] = [];
    headers: KeyValuePair[] = [];
    body: any = {}
}