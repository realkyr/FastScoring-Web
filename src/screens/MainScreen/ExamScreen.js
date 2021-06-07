import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import EditChoicesModal from '../../components/quiz/EditChoicesModal'
import {
  Skeleton,
  Input,
  Row,
  Col,
  Image,
  Typography,
  Table,
  message,
  Select,
  Button,
  Space
} from 'antd'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'
import 'firebase/auth'

const { Title } = Typography
const { Option } = Select

export default function ExamScreen () {
  const { examid } = useParams()
  const [visible, setVisible] = useState(false)
  const [exam, setExam] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [form, setForm] = useState(null)
  const [original, setOriginal] = useState(null)
  const [result, setResult] = useState(null)

  // circle mode
  const [mode, setMode] = useState(null)

  // responsive scale
  const [res, setRes] = useState({})
  const [real, setReal] = useState({})

  const logPerColumn = []

  const heightRes = res.h && real.height ? (res.h / real.height) : 1
  const widthRes = res.w && real.width ? (res.w / real.width) : 1

  const getCurrentImageSize = () => {
    const image = document.querySelector('#image-rs')
    setRes({
      w: image.children[0].clientWidth,
      h: image.children[0].clientHeight
    })
  }

  useEffect(() => {
    const db = firebase.firestore()
    const unsub = db.collection('exams')
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
        const formdoc = await qdoc.data().form.get()
        const form = formdoc.data()
        setQuiz(qdoc.data())
        setForm(form)
        setMode('form')
        const qid = qdoc.id
        const user = firebase.auth().currentUser
        if (examInfo.status === 'done') {
          const storage = firebase.storage()
          const originalReference = storage.ref(
            'exams/' +
              user.uid +
              '/' +
              qid +
              '/' +
              `${examid}_${examInfo.filename}`
          )
          const url = await originalReference.getDownloadURL()
          setOriginal(url)

          const resultRef = storage.ref(examInfo.path_result)
          const resultUrl = await resultRef.getDownloadURL()

          const sizeOf = require('image-size')
          const request = require('request')
          console.log(resultUrl)
          const options = {
            url: resultUrl,
            method: 'get',
            encoding: null
          }
          request.get(options, function (error, response, body) {
            if (error) {
              console.error('error:', error)
            } else {
              setReal(sizeOf(body))
            }
          })
          setResult(resultUrl)
        }
      })
    return () => {
      unsub && unsub()
    }
  }, [])

  useEffect(() => {
    if (result) {
      window.addEventListener('resize', getCurrentImageSize)
    }
    return () => {
      window.removeEventListener('resize', getCurrentImageSize)
    }
  }, [result])

  const exportJSON = () => {
    const exportName = exam.sid + '_result'
    const exportObj = {
      quiz_name: quiz.name,
      student_id: exam.sid,
      result: {}
    }
    Object.keys(exam.result).forEach(clause => {
      const ret = exam.result[clause]
      exportObj.result[clause] = {
        user_choice: ret.user_choice.sort(),
        correct_choice: ret.correct_choice.sort()
      }
    })
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', exportName + '.json')
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const img = () => {
    if (original == null || result == null) {
      return <Skeleton paragraph={false} />
    }

    const coords = mode === 'exam' ? exam : form
    return (
      <>
        <Row>
          <Col xs={12}>
            <Input onChange={e => {
              const db = firebase.firestore()
              db.collection('exams').doc(examid).set({
                sid: e.target.value
              }, { merge: true })
            }} value={exam.sid} placeholder="รหัสนักศึกษา" />
          </Col>
          <Col xs={12}>
            <Space>
              <EditChoicesModal calculateScore={calculateScore} exam={exam} form={form} setVisible={toggleModal} visible={visible} image={result} />
            </Space>
          </Col>
        </Row>
        <Row className="result-images">
          <Col xs={24} md={12}>
            <Title level={4}>Original Image :</Title>
            <Image src={original} alt="original" />
          </Col>
          <Col xs={24} md={12}>
            <Title level={4}>Result Image :</Title>
            <div>
              หากวงกลมแสดงผลไม่ถูกต้อง ลองเปลี่ยนโหมด ?
              <Select value={mode} onChange={mode => setMode(mode)} style={{ width: 120, marginLeft: 5 }}>
                <Option value="exam">Exam</Option>
                <Option value="form">Form</Option>
              </Select>
            </div>
            <div style={{ display: 'inline-flex' }}>
              <div style={{ position: 'relative', width: 0, height: 0 }}>
                {Object.keys(coords.coords_choices).map(c => {
                  const numChoices = form.num_choice
                  const column = form.column
                  const bubble = parseInt(c)
                  const choicesPerColumn = parseInt(form.amount / form.column)
                  const num = Math.floor(bubble / numChoices) + (bubble % numChoices ? 0 : -1)
                  const stayInColumn = num % column
                  const choice = bubble % numChoices ? bubble % numChoices : numChoices
                  if (choice === 1) {
                    logPerColumn[stayInColumn] = logPerColumn[stayInColumn] ? logPerColumn[stayInColumn] + 1 : 1
                  }
                  const clause = choicesPerColumn * stayInColumn + logPerColumn[stayInColumn]
                  const className = [
                    'choices'
                  ]
                  if (exam.result[clause]) {
                    className.push(exam.result[clause].correct && exam.result[clause].correct_choice.includes(choice) ? 'correct' : null)
                    if (!exam.result[clause].correct) {
                      if (exam.result[clause].correct_choice.includes(choice)) className.push('solution-choice')
                      if (exam.result[clause].user_choice.includes(choice)) className.push('user-choice')
                    }
                  }
                  return <>
                    <div
                      className={className.join(' ')}
                      onClick={() => {
                        message.info(`clause: ${clause}, choice: ${choice}`)
                      }}
                      style={{
                        width: 20 * widthRes,
                        height: 20 * heightRes,
                        top: coords.coords_choices[c].y * heightRes,
                        left: coords.coords_choices[c].x * widthRes
                      }}
                    />
                  </>
                })}
              </div>
              <Image onLoad={getCurrentImageSize} id="image-rs" src={result} alt="result" />
            </div>
          </Col>
        </Row>
      </>
    )
  }

  const same = (a, b) => {
    const ret = []
    a.sort()
    b.sort()
    for (let i = 0; i < a.length; i += 1) {
      if (b.indexOf(a[i]) > -1) {
        ret.push(a[i])
      }
    }
    return ret
  }

  const calculateScore = ret => {
    if (ret.correct_choice.length === 0 || ret.user_choice.length > ret.correct_choice.length) return 0
    if (quiz.multiple_choice && quiz.multiple_choice === 'minimum') {
      if (same(ret.user_choice, ret.correct_choice).length >= 1) return quiz.point_per_clause || 1
    } else if (quiz.multiple_choice && quiz.multiple_choice === 'average') {
      return parseFloat(((same(ret.user_choice, ret.correct_choice).length / ret.correct_choice.length) * (quiz.point_per_clause || 1)).toFixed(2))
    } else if (same(ret.user_choice, ret.correct_choice).length === ret.correct_choice.length) {
      return quiz.point_per_clause || 1
    }

    return 0
  }

  const dataSource = exam && quiz
    ? Object.keys(exam.result).map(clause => {
        const ret = exam.result[clause]
        return {
          key: clause,
          clause,
          user_choice: ret.user_choice.sort().join(', '),
          correct_choice: ret.correct_choice.sort().join(', '),
          correct: ret.correct
            ? (
              <CheckCircleFilled style={{ color: '#52c41a' }} />
              )
            : (
              <CloseCircleFilled style={{ color: '#ff4d4f' }} />
              ),
          score: calculateScore(ret)
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

  const toggleModal = modalState => {
    setVisible(modalState)
  }

  return (
    <div>
      {exam === null || quiz === null
        ? (
          <Skeleton paragraph={false} active />
          )
        : (
        <>
          {img()}
          <Row>
            <Col>
              <Button onClick={exportJSON} type="primary">Export ผลคำตอบเป็น JSON</Button>
            </Col>
          </Row>
          <Table
            pagination={{
              hideOnSinglePage: true
            }}
            footer={() => {
              let sum = 0
              dataSource.forEach(clause => {
                sum += parseFloat(clause.score)
              })
              return `คะแนนรวม ${sum}`
            }}
            dataSource={dataSource}
            columns={columns}
          />
        </>
          )}
    </div>
  )
}
