const axios = require("axios");
const qs = require('qs');
const SESSION_TOKEN_SECRET = 'this-is-a-very-secret-token';
const VERIFY_FORM_URL = 'url-to-your-application-hosting-the-verification-form';
const TWILLIO_AUTH_TOKEN = 'your-twillio-auth-token';
const TWILLIO_SERVICE_ID = 'your-twillio-service-id';
const TWILLIO_SERVICE_URL = `https://verify.twilio.com/v2/Services/${TWILLIO_SERVICE_ID}`;
const TWILLIO_VERIFICATIONS_URL = `${TWILLIO_SERVICE_URL}/Verifications`;
const TWILLIO_VERIFY_CHECK_URL = `${TWILLIO_SERVICE_URL}/VerificationCheck`;
/**
/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {

  if (event.user.app_metadata.phone_number_verified === true) {
    return;
  }

  const data = qs.stringify({
    'To': event.user.user_metadata.phone_number,
    'Channel': 'sms'
    });

  const config = {
    method: 'post',
    url: TWILLIO_VERIFICATIONS_URL,
    headers: {
      'Authorization': TWILLIO_AUTH_TOKEN
    },
    data : data
  };

  try {
    const response = await axios(config);
    console.log(JSON.stringify(response.data));
      const sessionToken = api.redirect.encodeToken({
      secret: SESSION_TOKEN_SECRET,
      payload: {
        iss: `https://${event.request.hostname}/`,
      },
    });

    api.redirect.sendUserTo(VERIFY_FORM_URL, {
      query: {
        session_token: sessionToken,
        redirect_uri: `https://${event.request.hostname}/continue`,
      }
    });

  } catch(error){
    console.log(error);
    api.access.deny(`Invalid phone number!`);
  }
};


/**
* Handler that will be invoked when this action is resuming after an external redirect. If your
* onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onContinuePostLogin = async (event, api) => {
  let decodedToken;
  try {
    decodedToken = api.redirect.validateToken({
      secret: SESSION_TOKEN_SECRET,
      tokenParameterName: 'session_token',
    });
  } catch (error) {
    console.log(error.message);
    return api.access.deny('Error occurred during redirect.');
  }

  try {
    const customClaims = decodedToken.other;
    const verificationCode = customClaims['verification_code'];
    if (!verificationCode) {
      api.access.deny(`You must provide a verification code.`);
    }


    const data = qs.stringify({
    'Code': verificationCode,
    'To': event.user.user_metadata.phone_number
    });
    var config = {
      method: 'post',
      url: TWILLIO_VERIFY_CHECK_URL,
      headers: {
        'Authorization': TWILLIO_AUTH_TOKEN
      },
      data : data
    };
    const response = await axios(config);

    if (response.data.valid !== true) {
      api.access.deny(`Invalid verification code!`);
    }

    api.user.setAppMetadata('phone_number_verified', true);
    api.user.setAppMetadata('phone_number', response.data.to);


  } catch(error) {
    console.log(error);
    api.access.deny(`Failed to verify the code with Twillio!`);
  }

};
