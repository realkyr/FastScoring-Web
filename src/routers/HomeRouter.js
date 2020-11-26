import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Layout, Menu, Drawer, Avatar, Row, Typography, message } from 'antd'
import { Switch, Route, Redirect, Link, useLocation } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons'
import Loading from '../screens/Loading'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'
import 'firebase/auth'

import { HOME_ROUTE } from './router'

const { Title } = Typography

const { Header, Footer, Sider, Content } = Layout

const HeaderSection = props => {
  return (
    <div style={{ width: 'calc(100% / 3)', height: '100%' }}>
      {props.children}
    </div>
  )
}

HeaderSection.propTypes = {
  children: PropTypes.element
}

const RootRouter = () => {
  const [isAuth, setAuth] = useState(null)
  const [shouldHideDrawer, setHideDrawer] = useState(window.innerWidth < 992)
  const [isDrawerOpened, setDrawer] = useState(false)

  // user infomation
  const [avatar, setAvatar] = useState(null)
  const [name, setName] = useState(null)
  const getAvatar = async path => {
    const storage = firebase.storage()
    try {
      const url = await storage.ref().child(path).getDownloadURL()
      setAvatar(url)
    } catch (error) {
      console.log(error)
      message.error('something is wrong with avatar')
    }
  }

  const location = useLocation()

  useEffect(() => {
    console.log(location.pathname)
    firebase.auth().onAuthStateChanged(async user => {
      if (user) {
        const db = firebase.firestore()
        try {
          const doc = await db.collection('users').doc(user.uid).get()
          if (doc.exists) {
            const info = doc.data()
            setName(`${info.fname || ''} ${info.lname || ''}`)
            if (info.picture_profile) await getAvatar(info.picture_profile)
          } else setName('Guest')
        } catch (error) {
          message.error('there is some problem with user infomation')
        }
        setAuth(true)
      } else setAuth(false)
    })

    const reportWindowSize = () => {
      console.log('resize')
      setHideDrawer(window.innerWidth < 992)
    }

    window.addEventListener('resize', reportWindowSize)

    return () => {
      window.removeEventListener('resize', reportWindowSize)
    }
  }, [])

  const styles = {
    header: {
      lineHeight: 0,
      background: '#f0f2f5',
      display: 'flex',
      padding: '16px 10px'
    },
    layout: { minHeight: '100vh' },
    defaultTrigger: { display: 'none' },
    hamburgerButton: {
      transform: 'scale(0.7)',
      padding: 0,
      float: 'right'
    }
  }

  const changeScreenState = () => {
    if (shouldHideDrawer) setDrawer(!isDrawerOpened)
  }

  const header = () => {
    const current = HOME_ROUTE.find(
      route => route.path === location.pathname.replace(/\/$/, '')
    )
    return current ? current.name : ''
  }

  const menuNavigation = (
    <>
      <Link to={HOME_ROUTE.find(r => r.name === 'Profile').path}>
        <Row
          onClick={changeScreenState}
          style={{ padding: '10px', alignItems: 'center' }}>
          <Avatar size={50} src={avatar} icon={<UserOutlined />} />
          <Title style={{ padding: '0 10px', margin: 0 }} level={5}>
            {name}
          </Title>
        </Row>
      </Link>
      <Menu mode="inline" defaultSelectedKeys={[]} selectedKeys={header()}>
        {/* <Avatar size={64} icon={<UserOutlined />} /> */}
        {HOME_ROUTE.map(route => {
          const exeptRoute = ['Exam', 'Profile', 'Form Detail', 'Quiz Detail', 'Quiz Solution']
          if (exeptRoute.indexOf(route.name) > -1) return null
          return (
            <Menu.Item onClick={changeScreenState} key={route.name}>
              <Link to={route.path}>{route.name}</Link>
            </Menu.Item>
          )
        })}
      </Menu>
    </>
  )

  if (isAuth === null) return <Loading color="#1890ff" />
  else if (isAuth === false) return <Redirect to="/login" />

  return (
    <Layout style={styles.layout}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{ background: 'white', float: 'left' }}
        zeroWidthTriggerStyle={styles.defaultTrigger}>
        {menuNavigation}
      </Sider>
      <Drawer
        placement="left"
        onClose={() => setDrawer(!isDrawerOpened)}
        closable={false}
        visible={isDrawerOpened}
        bodyStyle={{ padding: 0 }}
        key="left">
        {menuNavigation}
      </Drawer>
      <Layout>
        <Header style={styles.header}>
          <HeaderSection/>
          <HeaderSection>
            {/* Screen Header */}
            <h1 style={{ lineHeight: 'normal' }}>{header()}</h1>
          </HeaderSection>
          <HeaderSection>
            {/* burger button */}
            {
            shouldHideDrawer
              ? (<button
                  onClick={() => {
                    setDrawer(!isDrawerOpened)
                  }}
                  style={styles.hamburgerButton}
                  className={
                    'hamburger hamburger--squeeze' +
                    (isDrawerOpened ? ' is-active' : '')
                  }
                  type="button">
                  <span className="hamburger-box">
                    <span className="hamburger-inner"></span>
                  </span>
                </button>)
              : null}
          </HeaderSection>
        </Header>
        <Content style={{ paddingLeft: '10px', paddingRight: '10px' }}>
          <Switch>
            {HOME_ROUTE.map(r => (
              <Route key={r.name} path={r.path} component={r.component} />
            ))}
            <Redirect from="/" to={HOME_ROUTE[0].path} />
          </Switch>
        </Content>
        <Footer>
          {'Copyright © '} Fast Scoring {new Date().getFullYear()}
          {'.'}
        </Footer>
      </Layout>
    </Layout>
  )
}

export default RootRouter
