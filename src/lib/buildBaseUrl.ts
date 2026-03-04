const buildFullEndpointUrl = (base_url: string, path: string, queryParams: any, variables: any[]) => {
    if (!base_url) return "";

    const base = base_url.endsWith("/") ? base_url.slice(0, -1) : base_url;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const toQuery = [...queryParams].filter((p) => p.key?.trim() !== "");

    // if (auth_type_id == 2) {
    //     if (typeof authConfig.key == 'string' && authConfig.key.trim() !== '') {
    //         toQuery.push(authConfig)
    //     }

    // }

    const queryString = toQuery.length ? "?" + toQuery.map(({ key, value }) => `${key}=${String(value)}`).join("&") : "";

    const text = `${base}${cleanPath}${queryString}`;

    if (text === undefined || text === null) return text;
    let parts: (string | number)[] = [];
    if (typeof text === "string") {
        parts = text.split(/{{(.*?)}}/g); // split and preserve variables
    } else if (typeof text === "number") {
        parts = [text]; // wrap number
    } else {
        // fallback for object, array, boolean, etc.
        parts = [String(text)];
    }

    return parts;
    // return <UrlExtractor url={`${base}${cleanPath}${queryString}`} variables={variables} />;
};
