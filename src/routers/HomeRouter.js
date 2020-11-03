import React from 'react'
import { Layout, Menu } from 'antd'
import { Switch, Route, Redirect, Link } from 'react-router-dom'
import Form from '../screens/MainScreen/FormScreen'
import Quiz from '../screens/MainScreen/QuizScreen'

const ROOT_PATH = '/'

const { Header, Footer, Sider, Content } = Layout

const RootRouter = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        zeroWidthTriggerStyle={{ display: 'none' }}>
        <div className="logo" />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1"><Link to="/form">Form</Link></Menu.Item>
          <Menu.Item key="2"><Link to="/quiz">Quiz</Link></Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#f0f2f5' }}>Header</Header>
        <Content>
          <Switch>
            <Route path={ROOT_PATH + 'form'}>
              <Form />
            </Route>
            <Route path={ROOT_PATH + 'quiz'}>
              <Quiz />
            </Route>
            <Redirect from="/" to="/form" />
          </Switch>
        </Content>
        <Footer>Footer</Footer>
      </Layout>
    </Layout>
  )
}

export default RootRouter
