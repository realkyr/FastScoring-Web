import React from 'react'
import PropTypes from 'prop-types'
import { Typography, Progress } from 'antd'

const { Title } = Typography

export default function ExamCard (props) {
  return (
    <>
      <div
        style={{
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 5px 12px 4px rgba(0,0,0,.09)',
          cursor: 'pointer',
          background: 'white',
          width: '100%',
          minHeight: '100px',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'inline-flex',
            width: '70%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Title level={3}>{props.filename}</Title>
            <Progress percent={props.progress} status="active" />
          </div>
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '30%'
          }}>
            <Title style={{ margin: 0 }} level={5}>Status</Title>
            <Title style={{ margin: 0 }} level={4}>{props.status}</Title>
          </div>
      </div>
    </>
  )
}

ExamCard.propTypes = {
  filename: PropTypes.string,
  status: PropTypes.string,
  progress: PropTypes.number
}
