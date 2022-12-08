export const stringify = (obj) => {
    let params = [];
    for (let key in obj) {
        params.push(`${key}=${obj[key]}`);
    }
    return params.join('&');
}