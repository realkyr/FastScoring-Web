import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Layout, Menu, Drawer, Avatar, Row, Typography } from 'antd'
import { Switch, Route, Redirect, Link, useLocation } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons'

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
  const [shouldHideDrawer, setHideDrawer] = useState(window.screen.width < 992)
  const [isDrawerOpened, setDrawer] = useState(false)

  const location = useLocation()
  console.log(location.pathname)

  useEffect(() => {
    const reportWindowSize = () => {
      console.log('resize')
      setHideDrawer(window.screen.width < 992)
    }

    window.addEventListener('resize', reportWindowSize)

    return () => {
      window.removeEventListener('resize', reportWindowSize)
    }
  })

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
      float: 'left',
      display: shouldHideDrawer ? 'block' : 'none'
    }
  }

  const changeScreenState = () => {
    if (shouldHideDrawer) setDrawer(!isDrawerOpened)
  }

  const header = () => {
    const current = HOME_ROUTE.find(route => route.path === location.pathname)
    return current ? current.name : ''
  }

  const menuNavigation = (
    <>
      <Link to={HOME_ROUTE.find(r => r.name === 'Profile').path}>
        <Row
          onClick={changeScreenState}
          style={{ padding: '10px', alignItems: 'center' }}>
          <Avatar size={50} icon={<UserOutlined />} />
          <Title style={{ padding: '0 10px', margin: 0 }} level={5}>
            Guest
          </Title>
        </Row>
      </Link>
      <Menu mode="inline" defaultSelectedKeys={[]} selectedKeys={header()}>
        {/* <Avatar size={64} icon={<UserOutlined />} /> */}
        {HOME_ROUTE.map(route => {
          if (route.name === 'Profile') return null
          return (
            <Menu.Item onClick={changeScreenState} key={route.name}>
              <Link to={route.path}>{route.name}</Link>
            </Menu.Item>
          )
        })}
      </Menu>
    </>
  )

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
          <HeaderSection>
            {/* burger button */}
            <button
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
            </button>
          </HeaderSection>
          <HeaderSection>
            {/* Screen Header */}
            <h1 style={{ lineHeight: 'normal' }}>{header()}</h1>
          </HeaderSection>
        </Header>
        <Content>
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
