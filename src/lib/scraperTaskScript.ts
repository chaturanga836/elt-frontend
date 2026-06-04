/** True when the unified connection is the plugin-provisioned scrape endpoint. */
export function isScrapeUrlConnection(connection: {
  name?: string;
  prototype_id?: string | null;
}): boolean {
  const name = (connection.name || '').trim().toLowerCase();
  return name === 'scrape url' || name.includes('scrape');
}

/** Task script for parsing scraper REST output (HTTP runs on pipeline REST node). */
export function buildParseScraperTaskScript(connectionId: number, connectionName: string): string {
  return `# Parses JSON from pipeline REST node "${connectionName}" (connection id ${connectionId}).
# The scrape HTTP call is NOT made here — add REST Endpoint on the pipeline and select that connection.

def main(input_data):
    outer = input_data or {}
    scraper = outer.get("data") or {}
    payload = scraper.get("data") if isinstance(scraper.get("data"), dict) else scraper
    return {
        "url": payload.get("url"),
        "title": payload.get("title"),
        "text": (payload.get("text") or "")[:2000],
        "links": payload.get("links") or [],
    }
`;
}
