const functions = require('firebase-functions')
const admin = require('firebase-admin')
const serviceAccount = require('./fastscoring-7adb34525352.json')
const mail = require('./mail.json')
const { google } = require('googleapis')

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const auth = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets'
  ])

auth.authorize((err, tokens) => {
  if (err) {
    console.log(err);
    return
  } else {
    console.log("Successfully connected!");
  }
})

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const mailgun = require("mailgun-js")
const api_key = mail.apiKey
const DOMAIN = mail.domain
const mg = mailgun({apiKey: api_key, domain: DOMAIN})

const express = require('express')
const { request } = require('express')
const app = express()

const cors = require('cors')
app.use(cors({ origin: true }))

app.get('/', (req, res) => {
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
    mg.messages().send(data, (error, body) => {
      if (error) {
        console.log('error', error)
        return 0
      }
      else {
        console.log(body)
        return 1
      }
    })
    return 1
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

exports.createSheet = functions.firestore
.document('quizzes/{qid}')
.onCreate( async (snap, context) => {
  // Get an object representing the document
  // e.g. {'name': 'Marie', 'age': 66}
  // const newValue = snap.data()

  // perform desired operations ...
  const drive = google.drive({version: 'v3', auth})
  const sheets = google.sheets({version: 'v4', auth})
  
  const resource = {
    properties: {
      title: snap.data().name + ' Result',
    },
  }

  // create sheet
  sheets.spreadsheets.create({
    resource,
    fields: 'spreadsheetId',
  }, (err, spreadsheet) => {
    if (err) {
      // Handle error.
      console.log(err);
      return 0
    } else {
      const resource = {
        values: [
          ['Student ID', 'Question No.', 'User Choices', 'Answer Chocies']
        ]
      }
  
      // console.log(orderRanking)
      const sheets = google.sheets({version: 'v4', auth})
      sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheet.data.spreadsheetId,
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        resource,
      }, (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
        } else {
          console.log('%d cells updated.', result.data.updatedCells);
        }
      })
      // success give permissions
      drive.permissions.create({
        resource: {
          'type': 'user',
          'role': 'writer',
          'emailAddress': 'yora46@gmail.com'
        },
        fileId: spreadsheet.data.spreadsheetId,
      }, (err, res) => {
        if (err) {
          // Handle error...
          console.error(err);
        } else {
          console.log('Yora Owner Successful Permission')
        }
      })
      drive.permissions.create({
        resource: {
          'type': 'anyone',
          'role': 'reader',
        },
        fileId: spreadsheet.data.spreadsheetId,
      }, (err, res) => {
        if (err) {
          // Handle error...
          console.error(err);
        } else {
          console.log('Anyone can read')
        }
      })
      console.log(`Spreadsheet ID: ${spreadsheet.data.spreadsheetId}`)
      snap.ref.update({
        ranking_sheet: spreadsheet.data.spreadsheetId
      })
      return 1
    }
  })
})

exports.writeRanking = functions.firestore
  .document('exams/{eid}')
  .onWrite(async (change, context) => {
    // if delete
    const data = !change.after.exists? change.before.data() : change.after.data()
    const quiz = await data.quiz.get()

    if (!quiz.data()['ranking_sheet']) return

    const db = admin.firestore()
    const examsets = {}
    const exams_order = []
    const examsetdocs = await db.collection('exams')
      .where('status', '==', 'done')
      .where('quiz', '==', data.quiz)
      .orderBy('sid')
      .get()
    examsetdocs.forEach(doc => {
      exams_order.push(doc.id)
      examsets[doc.id] = doc.data()
    })

    let rows = []
    exams_order.forEach(id => {
      let student = Object.values(examsets[id].result).map((clause, i) => (
        [i ? '' : examsets[id].sid, i+1, `[${clause.user_choice.join(', ')}]`, `[${clause.correct_choice.join(', ')}]`]
      ))
      rows = [...rows, ...student]
    })

    console.log(rows)
    rows = [
      ['Student ID', 'Question No.', 'User Choices', 'Answer Chocies'],
      ...rows
    ]

    const resource = {
      values: rows
    }

    // // update google sheet
    const sheets = google.sheets({version: 'v4', auth})
    const request = {
      // The ID of the spreadsheet to update.
      spreadsheetId: quiz.data()['ranking_sheet'],  // TODO: Update placeholder value.
      range: 'A1:D'
    }
    const response = (await sheets.spreadsheets.values.clear(request)).data
    console.log(JSON.stringify(response, null, 2));
    const update_res = (await sheets.spreadsheets.values.update({
      spreadsheetId: quiz.data()['ranking_sheet'],
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource,
    })).data
    console.log(JSON.stringify(update_res, null, 2));
  })

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app)
