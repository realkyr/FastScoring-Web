import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import firebase from 'firebase/app'
import 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyAr24CJWPlGFHq-zKTEBqyIOeUr7V79xyA',
  authDomain: 'fastscoring.firebaseapp.com',
  databaseURL: 'https://fastscoring.firebaseio.com',
  projectId: 'fastscoring',
  storageBucket: 'fastscoring.appspot.com',
  messagingSenderId: '875221436773',
  appId: '1:875221436773:web:c86c66e72e662015e8f98c',
  measurementId: 'G-QBE8YVWJZZ'
}

firebase.initializeApp(firebaseConfig)
firebase.analytics()

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
