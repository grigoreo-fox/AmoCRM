import Connection from "../src/common/Connection";
import Client from "../src/Client";
import config, { CODE } from "./config";
import APIResponseError from "../src/common/APIResponseError";
import { TokenData } from "../src/interfaces/common";

let url;
jest.setTimeout(60 * 1000);

describe('Token', () => {
    test('throws no code error', () => {
        const client = new Client({
            ...config,
            auth: {
                ...config.auth,
                code: ''
            }
        });
        expect.assertions(1);
        return client.connection.connect()
            .catch(e => {
                expect(e.message).toMatch('NO_AUTH_CODE');
            })
    });
    test('throw api response error', async () => {
        const client = new Client({
            ...config,
            auth: {
                client_id: 'wrong',
                client_secret: 'wrong',
                redirect_uri: 'wrong',
                code: 'wrong_code'
            }
        });
        expect.assertions(1);
        return client.connection.connect()
            .catch(e => {
                expect(e.message).toMatch('API_RESPONSE_ERROR');
            });
    });
    test('connect with code', async () => {
        const client = new Client({
            ...config,
            auth: {
                ...config.auth,
                code: CODE
            }
        });
        const connected = await client.connection.connect();
        expect(connected).toBe(true);
    });
    test('getting refresh token', async () => {
        const client = new Client({
            ...config,
            auth: {
                ...config.auth,
                code: CODE
            }
        });
        await client.connection.connect();
        const token = client.token.getValue();
        const now = new Date;
        const expired = new Date(now.valueOf() - 1000);
        client.token.setValue(<TokenData>{
            ...token,
            expires_at: expired.valueOf()
        });
        await client.connection.update();
        const newToken = client.token.getValue();
        expect(token?.access_token).not.toBe(newToken?.access_token);
    });

    test.only('handle token after connection', async () => {
        const client = new Client({
            ...config,
            auth: {
                ...config.auth,
                code: CODE
            }
        });
        const token: TokenData = await new Promise(resolve => {
            client.token.on('change', resolve);
            client.connection.connect();
        });
        const currentToken = client.token.getValue();
        expect(token?.access_token).toBe(currentToken?.access_token);
    });
});