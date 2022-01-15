# Actions Redirect: Mobile phone verification Example

This code uses the same example as the [Actions Redirect: Simple Consent Form Example](https://github.com/dylanswartz/actions-consent-form-example) and the same idea to implement the mobile phone verification.

This sample demonstrates a minimal implementation of the `redirect` protocol. It contains an Auth0 [Action](https://auth0.com/docs/customize/actions) that will redirect the user to a simple form so they can enter a verification code recieved by SMS.

When the user enter the code and clicks the **Verify** button, they are then redirected back to Auth0 to complete the authentication flow. On future logins they will no longer be prompted since the code verification action results are stored in their user profile.

The code verification form is is a basic HTML page with a small bit of JavaScript handle the form submission. In this example we will use [Vercel](https://vercel.com/) to host the form but that you use any hosting provider. 

## Action Setup

To try this rule out with your own Auth0 account using an existing instance of the code verification form, follow these steps:

1. Create a new Auth0 custom Action using the contents of the [`action.js`](action.js) script as a part of the Login Flow.
2. Modify the values for `VERIFY_FORM_URL` and `SESSION_TOKEN_SECRET` in your Action's code
```
https://example-auth0-twillio-phone-verification-action.vercel.app
```

3. Try the Action by following the steps in the next section.

## Run the Action

Try the rule with one of the apps in your account. A simple way to do this is to add `http://jwt.io` as an **Allowed Callback URL** to your app and browse to the following link:  
```

https://AUTH0_DOMAIN/authorize?response_type=token&scope=openid%20profile&client_id=CLIENT_ID&redirect_uri=http://jwt.io&connection=Username-Password-Authentication
```

where:
* `AUTH0_DOMAIN` is your Auth0 account's tenant domain (e.g. `your-account.auth0.com`)
* `CLIENT_ID` is the **Client ID** of your app
* `CONNECTION` is the name of the Auth0 Connection you'd like to log in with. This example only works with `Username-Password-Authentication` since we use the custmised universal login with lock to capture user phone number during sign up.

You will be prompted with an Auth0 Lock page. After you log in for the first time, you will recieve an SMS with verification code and will be redirected to the code verification form. If you enter the code and submit the form, you will be redirected back to Auth0, the authentication flow will complete successfully, and you will end up on http://jwt.io, which will present you with the resulting `id_token` (JWT). If you attempt the log in again with the same user, you will bypass the code verification form since that user's profile was updated with the following `app_metadata`, which is read by the rule:

```json
{
  "phone_number": "user-verified-phone-number",
  "phone_number_verified": true
}
```

## Code Verification Form Setup

> This example uses [Vercel](https://vercel.com/) to host the code verification form however you can use any hosting provider of your choice. 

If you'd like to play around with your own implementation of the code verification form, you can host your own by following these steps:

1. If you haven't done so already, [sign up for a Vercel account](https://vercel.com/signup) and install the [Vercel CLI](https://github.com/vercel/vercel/tree/main/packages/cli) with `npm i -g vercel`. 
1. While you're in the same directory as the `index.html`, simply run the following command to spin it up in vercel:  
  ```bash
  $ vercel
  ```

Press enter for each prompt the `vercel` command gives you to select the defaults. The output of this command will contain the URL of your newly hosted code verification form.

1. In your Action's code be sure to delete the existing `VERIFY_FORM_URL` and replace it with the value that is the URL that was output in the previous step.

1. Try the Action along with your instance of the code verification form by the following the steps in the [Run the Action](#run-the-action) section.

1. If you want make changes to the code verification form, you can upload a new version simply by running the same `vercel` command you did before.

### Trusted Callback URL's

Our sample Action and code verification form make one security compromise for the sake of convenience: the rule passes the Auth0 domain (i.e. `your-tenant.auth0.com`) to the form website and the form uses that to construct a callback URL (i.e. `https://your-tenant.auth0.com/continue`) for returning back to the rule. This is essentially an [open redirect](https://www.owasp.org/index.php/Unvalidated_Redirects_and_Forwards_Cheat_Sheet) and should not be used in production scenarios.

You can lock this down by configuring your form website implementation to only return to a specific URL (i.e. just your Auth0 tenant) instead of one that's generated from a query param. You can then simplify the rule too so it no longer passes the Auth0 domain.

### Data Integrity

As stated, this is a very basic example of using a Actions Redirect to invoke a code verification form. That said, at Auth0 we take security very seriously. The `verificationCode` field (which contains the verication code) that is being passed back to auth0 as a signed token using a shared `SESSION_TOKEN_SECRET`.

In production scenarios where you need assurances of the integrity of the data being returned by the external website (in this case the our hosted code verification form). For example, if you want to be sure that the data truly came from a trusted source, then it should be signed. If the data is sensitive, then it should be encrypted. A good mechanism for doing this is to use a [JWT](http://jwt.io/) (JSON Web Token). You can build a JWT with claims (that you can optionally encrypt) and then sign it with either a secret shared with your Auth0 Action or with a private key, whose public key is known by the action. The action can then verify that the claims are legit and decrypt them, if necessary.
