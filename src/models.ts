/**
 * Created by sasha on 19.10.16.
 */
export interface Credentials{
    client_id: string,
    project_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_secret: string,
    redirect_uris:[string]
}
export interface Query{
    limit: number,
    fileExtensions: [string],
    nextPageToken: string,
    auth: any,
    credentials: any
}

