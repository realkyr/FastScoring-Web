import React from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import { Layout, Spin } from 'antd'
import PropTypes from 'prop-types'

export default function Loading (props) {
  const loadingIcon = <LoadingOutlined style={{ marginRight: '5px', color: props.color ? props.color : 'white' }} spin />
  return (
    <Layout
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        height: '100vh'
      }}>
        <Spin indicator={loadingIcon} />
    </Layout>
  )
}

Loading.propTypes = {
  color: PropTypes.string
}
