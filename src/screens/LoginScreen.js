import React, { useEffect } from 'react'
import { Layout, Button, Input, message, Spin } from 'antd'
import { LoginOutlined, LoadingOutlined } from '@ant-design/icons'
import OtpInput from 'react-otp-input'
import { Redirect } from 'react-router-dom'
import axios from 'axios'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

export default function LoginScreen () {
  const { useState } = React
  const [auth, setAuth] = useState(null)
  const [email, setEmail] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [otpShown, setOTPShown] = useState(false)
  const [otp, setOTP] = useState('')

  const isEmailValid = email => {
    if (typeof email === 'string') email = email.trim()
    const reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (reg.test(email) === false) {
      return false
    }
    return true
  }

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) setAuth(true)
      else setAuth(false)
    })
  }, [])

  const loadingIcon = <LoadingOutlined style={{ marginRight: '5px', color: 'white' }} spin />

  let screen
  if (!otpShown) {
    screen = (
      <>
        <Input
          onChange={e => {
            setEmail(e.target.value)
          }}
          value={email}
          style={{ maxWidth: '355px' }}
          placeholder="E-Mail"
          type="email"
        />
        <Button
          style={{ marginTop: '5px' }}
          onClick={async () => {
            setLoading(true)
            if (isEmailValid(email)) {
              const db = firebase.firestore()
              // search if there is email on firestore
              let ref = db.collection('emails_auth').where('email', '==', email)
              const docs = await ref.get()
              if (docs.size < 1) ref = db.collection('emails_auth').doc()
              else docs.forEach(d => { ref = d.ref })
              await ref.set({
                email,
                status: 'pending'
              })
              setOTPShown(true)
              setLoading(false)
              message.success('E-mail ถูกต้อง')
            } else {
              setLoading(false)
              message.error('E-mail ไม่ถูกต้อง')
            }
          }}
          type="primary"
          shape="round"
          icon={
            !isLoading
              ? <LoginOutlined />
              : <Spin indicator={loadingIcon} />
          }
          size="large">
          Log In
        </Button>
      </>
    )
  } else {
    screen = (
      <>
        <p>กรุณากรอกรหัส OTP ที่ได้รับใน E-mail ภายในเวลา 15 นาที</p>
        <OtpInput
          inputStyle={{
            width: '1em',
            margin: '0 5px',
            height: '3rem',
            fontSize: '2rem',
            borderRadius: '4px',
            border: '1px solid rgba(0,0,0,0.3)'
          }}
          value={otp}
          onChange={setOTP}
          numInputs={6}
        />
        <Button
          style={{ marginTop: '5px' }}
          onClick={async () => {
            setLoading(true)
            try {
              const res = await axios.post(
                'https://us-central1-fastscoring.cloudfunctions.net/api/auth',
                {
                  email,
                  otp
                }
              )
              console.log(res.data)
              await firebase.auth().signInWithCustomToken(res.data.access_token)
              message.success('ยืนยันตัวตนสำเร็จ')
              setLoading(false)
              setAuth(true)
            } catch (error) {
              message.error('รหัส OTP ไม่ถูกต้อง')
              setLoading(false)
              console.log(error)
            }
          }}
          type="primary"
          shape="round"
          icon={
            !isLoading
              ? <LoginOutlined />
              : <Spin indicator={loadingIcon} />
          }
          size="large">
          Confirm
        </Button>
        <Button type="link" size={'small'}>
          resend
        </Button>
      </>
    )
  }
  if (auth) return <Redirect to="/" />
  return (
    <Layout
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        height: '100vh'
      }}>
      {
        auth === null
          ? <Spin indicator={loadingIcon} />
          : <>
            <h1>Login Screen</h1>
            {screen}
          </>
      }
    </Layout>
  )
}
