import React, { useState, useEffect } from 'react'
import { Row, Col, Typography, Skeleton } from 'antd'
import { Link } from 'react-router-dom'
import firebase from 'firebase/app'
import 'firebase/firestore'

const { Title } = Typography
const { Paragraph } = Typography

export default function QuizScreen () {
  const [quiz, setQuiz] = useState(null)

  useEffect(async () => {
    const db = firebase.firestore()
    const docs = await db.collection('quiz').get()
    const tmpquiz = {}
    docs.forEach(d => {
      tmpquiz[d.id] = d.data()
    })
    setQuiz(tmpquiz)
  }, [])

  const createQuizList = () => {
    if (quiz == null) {
      return (
        <Col xs={24}>
          <Skeleton paragraph={false} active />
        </Col>
      )
    }
    return Object.keys(quiz).map(qid => {
      return (
        <Col key={qid} xs={24} md={12} lg={6}>
          <Link to={'/quiz/' + qid}>
          <div
            style={{
              borderRadius: '5px',
              boxShadow: '0 5px 12px 4px rgba(0,0,0,.09)',
              cursor: 'pointer',
              background: 'white',
              width: '100%'
            }}>
            <Title level={3}>{quiz[qid].name}</Title>
            <Paragraph ellipsis>{quiz[qid].description}</Paragraph>
          </div>
          </Link>
        </Col>
      )
    })
  }

  return (
    <>
      <Row gutter={[16, 16]}>{createQuizList()}</Row>
    </>
  )
}
