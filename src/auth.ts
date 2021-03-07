import {AlpacaClient} from './client/AlpacaClient';
import {AccessToken} from './trader';

/**
 * Check if user is authenticated - in session as well as in the Alpaca
 */
export async function isAuthenticated(accessToken: AccessToken) {
  if (!accessToken) {
    return false;
  }
  const alpacaClient = new AlpacaClient(accessToken);
  let isAuth = await alpacaClient.raw().isAuthenticated();
  if (!isAuth) {
    return false;
  }
  return true;
}
