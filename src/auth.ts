import {AlpacaClient} from './client/AlpacaClient';
import {AccessToken} from './trader';

/**
 * Check if user is authenticated - in session as well as in the Alpaca
 */
export async function isAuthenticated(
  accessToken: AccessToken,
  isLiveMoney: boolean,
  apikey?: string,
  apisecret?: string
) {
  if (process.env.ALP_OAUTH_DISABLED === 'true') {
    return true;
  }
  if (accessToken || apikey) {
    const alpacaClient = new AlpacaClient(
      accessToken,
      isLiveMoney,
      apikey,
      apisecret
    );
    let isAuth = await alpacaClient.raw().isAuthenticated();
    return isAuth;
  }
  return false;
}
