import { decode, verify, sign } from 'jws';
import {parse} from 'querystring';

const secret = process.env.SESSION_TOKEN_SECRET || "this-is-a-very-secret-token";

export default function (req, res) {
    const {redirect_uri, state, session_token} = req.query;
    const decoded = decode(session_token)
    const verified = verify(session_token, 'HS256', secret);

    if(!verified) throw new Error("Incoming session token cannot be verified.")

    // Log statement to look at decoded information
    console.dir(decoded)

    if(req.method === 'POST') {
      processFormData(req, result => {
        console.log(result);
        const issuedAt = Math.floor(Date.now() / 1000);
        const payload =  {
          ...decoded.payload,
          state,
          iat: issuedAt,
          exp: issuedAt + (60 * 5), // five minutes
          other: {
            verification_code: result.verificationCode,
            tos_last_seen: new Date().toISOString()
          }
        }

        const responseToken = sign({
          header: {
            alg: 'HS256',
            typ: 'JWT',
          },
          encoding: 'utf-8',
          payload,
          secret,
        });

        res.writeHead(302, {
            'Location': `${redirect_uri}?state=${state}&session_token=${responseToken}`
          });
        res.end();
      });
    } else {
      throw new Error("Only HTTP POST is accepted")
    }
};

function processFormData(request, callback) {
  const FORM_URLENCODED = 'application/x-www-form-urlencoded';
  if(request.headers['content-type'] === FORM_URLENCODED) {
      let body = '';
      request.on('data', chunk => {
          body += chunk.toString();
      });
      request.on('end', () => {
          callback(parse(body));
      });
  }
  else {
      callback(null);
  }
}
