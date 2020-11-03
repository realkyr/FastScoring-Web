import React from 'react'
import { Layout, Button } from 'antd'
import { LoginOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
export default function LoginScreen () {
  return (
    <Layout style={{ justifyContent: 'center', height: '100vh' }}>
      <h1>Login Screen</h1>
      <Link to="/">
        <Button
          type="primary"
          shape="round"
          icon={<LoginOutlined />}
          size="large">
          Log In
        </Button>
      </Link>
      <Link to="/register">
        <a>Register ?</a>
      </Link>
    </Layout>
  )
}
