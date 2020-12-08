import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Skeleton, Row, Col, Image, Typography, Table } from 'antd'
import {
  CheckCircleFilled,
  CloseCircleFilled
} from '@ant-design/icons'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'
import 'firebase/auth'

const { Title } = Typography

export default function ExamScreen () {
  const { examid } = useParams()
  const [exam, setExam] = useState(null)
  const [original, setOriginal] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const db = firebase.firestore()
    db.collection('exams')
      .doc(examid)
      .onSnapshot(async s => {
        if (!s.exists) setExam({})
        setExam({
          id: s.id,
          ...s.data()
        })

        if (original) return

        const examInfo = s.data()
        const qdoc = await examInfo.quiz.get()
        const qid = qdoc.id
        const user = firebase.auth().currentUser
        if (examInfo.status === 'done') {
          const storage = firebase.storage()
          const originalReference = storage.ref(
            'exams/' + user.uid + '/' +
              qid +
              '/' +
              `${examid}_${examInfo.filename}`
          )
          const url = await originalReference.getDownloadURL()
          setOriginal(url)

          const resultRef = storage.ref(examInfo.path_result)
          const resultUrl = await resultRef.getDownloadURL()
          setResult(resultUrl)
        }
      })
  }, [])

  const img = () => {
    if (original == null || result == null) {
      return <Skeleton paragraph={false} />
    }
    return (
      <>
        <Row className="result-images">
          <Col xs={12}>
            <Title level={4}>Original Image :</Title>
            <Image src={original} alt="original" />
          </Col>
          <Col xs={12}>
            <Title level={4}>Result Image :</Title>
            <Image src={result} alt="result" />
          </Col>
        </Row>
      </>
    )
  }

  const dataSource = exam
    ? Object.keys(exam.result).map(clause => {
        return {
          key: clause,
          clause,
          ...exam.result[clause],
          correct: (exam.result[clause].correct
            ? <CheckCircleFilled style={{ color: '#52c41a' }}/>
            : <CloseCircleFilled style={{ color: '#ff4d4f' }}/>
          ),
          score: (exam.result[clause].correct ? 1 : 0)
        }
      })
    : []

  const columns = [
    {
      title: 'ข้อ',
      dataIndex: 'clause',
      key: 'clause'
    },
    {
      title: 'ข้อที่ตอบ',
      dataIndex: 'user_choice',
      key: 'user_choice'
    },
    {
      title: 'ข้อที่ถูก',
      dataIndex: 'correct_choice',
      key: 'correct_choice'
    },
    {
      title: 'ตรวจ',
      dataIndex: 'correct',
      key: 'correct'
    },
    {
      title: 'คะแนนที่ได้',
      dataIndex: 'score',
      key: 'score'
    }
  ]

  return <div>
    {exam === null
      ? (
        <Skeleton paragraph={false} active />
        )
      : <>
          {img()}
          <Table pagination={{
            hideOnSinglePage: true
          }} footer={() => {
            let sum = 0
            dataSource.forEach(clause => {
              sum += clause.score
            })
            return `คะแนนรวม ${sum}`
          }} dataSource={dataSource} columns={columns} />
        </>
    }
  </div>
}
