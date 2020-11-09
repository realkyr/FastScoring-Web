import React from 'react'
import { Layout, Button, Input } from 'antd'
import { LoginOutlined } from '@ant-design/icons'
import OtpInput from 'react-otp-input'
import { Link } from 'react-router-dom'
export default function LoginScreen () {
  const { useState } = React
  const [otpShown, setOTPShown] = useState(false)
  const [otp, setOTP] = useState('')

  let screen
  if (!otpShown) {
    screen = (
      <>
        <Input placeholder="E-Mail" type="email" />
        <Button
          style={{ marginTop: '5px' }}
          onClick={() => { setOTPShown(true) }}
          type="primary"
          shape="round"
          icon={<LoginOutlined />}
          size="large">
          Log In
        </Button>
      </>
    )
  } else {
    screen = (
      <>
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
        <Link to="/">
        <Button
          style={{ marginTop: '5px' }}
          onClick={() => { setOTPShown(true) }}
          type="primary"
          shape="round"
          icon={<LoginOutlined />}
          size="large">
          Confirm
        </Button>
        </Link>
        <Button type="link" size={'small'}>
          resend
        </Button>
      </>
    )
  }
  return (
    <Layout
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        height: '100vh'
      }}>
      <h1>Login Screen</h1>
      {screen}
      {/* <Link to="/register">
        Register ?
      </Link> */}
    </Layout>
  )
}
