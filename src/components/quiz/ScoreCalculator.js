/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { message, Radio, Space, InputNumber, Select, Typography, Modal, Button, Row, Col } from 'antd'
import { useParams } from 'react-router-dom'
import firebase from 'firebase/app'
import 'firebase/firestore'

const { Title, Text } = Typography

export default function ScoreCalculator (props) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [num, setNum] = useState(props.quiz.point_per_clause || 1)
  const [mode, setMode] = useState(props.quiz.multiple_choice || 'all')
  const { quizid } = useParams()

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        แก้ไขวิธีการคิดคะแนน
      </Button>
      <Modal
        title="แก้ไขวิธีการคิดคะแนน"
        width={1000}
        visible={visible}
        confirmLoading={loading}
        onOk={async () => {
          setLoading(true)
          console.log('ok')
          const db = firebase.firestore()
          const qref = db.collection('quizzes').doc(quizid)
          await qref.set({
            point_per_clause: num,
            multiple_choice: mode
          }, { merge: true })
          setLoading(false)
        }}
        onCancel={() => setVisible(false)}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text>ข้อละ</Text> <InputNumber min={1} value={num} onChange={(n) => setNum(n)} /><Text>คะแนน</Text>
          </Col>
          <Col span={24}>
            <Title level={5}>คำตอบหลายข้อ</Title>
            <Radio.Group onChange={(e) => setMode(e.target.value)} value={mode}>
              <Space direction="vertical">
                <Radio value={'all'}>ต้องตอบถูกต้องทุกตัวเลือก</Radio>
                <Radio value={'average'}>เฉลี่ยคะแนน</Radio>
                <Radio value={'minimum'}>ตอบถูกอย่างน้อยหนึ่งตัวเลือก</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  )
}

ScoreCalculator.propTypes = {
  exams: PropTypes.object,
  quiz: PropTypes.object
}
