const functions = require('firebase-functions')
const admin = require('firebase-admin')
const serviceAccount = require('./fastscoring-7adb34525352.json')

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const mailgun = require("mailgun-js")
const api_key = '***sensitivedata***'
const DOMAIN = 'mail.slippingsloth.com'
const mg = mailgun({apiKey: api_key, domain: DOMAIN})

const express = require('express')
const { request } = require('express')
const app = express()

const cors = require('cors')
app.use(cors({ origin: true }))

app.get('/', function(req, res) {
  res.send('Hello World')
})

const makeOTP = (length) => {
  var result           = '';
  var characters       = '0123456789'
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

exports.userAuth = functions.firestore
  .document('emails_auth/{docid}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return 1
    if (!(change.after.data().status === 'pending')) return 1
    const OTP = makeOTP(6)
    await change.after.ref.collection('OTP').doc(change.after.id).set({
      otp: OTP,
      time_remaining: 90
    })
    const data = {
      from: 'Fast Scoring <no-reply@fastscoring.com>',
      to: `${change.after.data().email} ${change.after.data().email}`,
      subject: 'Your Email Verification',
      text: 'your OTP is ' + OTP
    };
    mg.messages().send(data, function (error, body) {
      if (error) console.log('error', error)
      else console.log(body)
    })
  })

app.post('/request', async (req, res) => {
  const db = admin.firestore()
  const ref = db.collection('emails_auth').doc()
  try {
    await ref.set({
      email: req.body.email
    })
    res.send({ status: 'success', data: { id: ref.id } })
  } catch (error) {
    res.status(400).send(error)
  }
})
  

app.post('/auth', async (req, res) => {
  const db = admin.firestore()
  let userDoc
  const ref = db.collection('emails_auth').where('email', '==', req.body.email)
  const docs = await ref.get()
  console.log(docs)
  if (docs.size < 1) {
    res.status(401).send({ message: 'there is no email request in database'})
    return
  }
  docs.forEach(d => {
    userDoc = d
  })

  const otpRef = userDoc.ref.collection('OTP').doc(userDoc.id)
  const otpDoc = await otpRef.get()
  if (!otpDoc.exists) {
    res.status(401).send({ message: 'there is no OTP in database'})
    return
  }
  console.log(otpDoc.data().otp)
  if (req.body.otp === otpDoc.data().otp) {
    let user
    try {
      user = await admin.auth().getUserByEmail(req.body.email)
    } catch (error) {
      user = await admin.auth().createUser({
        email: req.body.email
      })
    }
    try {
      userDoc.ref.update({
        status: 'success'
      })
      const customToken = await admin.auth().createCustomToken(user.uid)
      res.send({
        status: 'success',
        access_token: customToken
      })
    } catch (error) {
      console.log('Error creating custom token:', error)
      res.status(401).send(error)
    }
    return
  }
  res.status(401).send({ message: 'รหัส OTP ไม่ถูกต้อง'})
})

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app)
