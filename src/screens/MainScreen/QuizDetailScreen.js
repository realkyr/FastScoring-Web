import ExamCard from '../../components/quiz/ExamCard'

import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

import { Button, Upload, message, Row, Col, Skeleton } from 'antd'
import { InboxOutlined, EditOutlined } from '@ant-design/icons'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'

const { Dragger } = Upload

export default function QuizDetailScreen () {
  const { quizid } = useParams()
  const [exams, setExams] = useState(null)

  const storage = firebase.storage()

  useEffect(async () => {
    console.log('hello firebase')
    const db = firebase.firestore()
    const examstmp = {}
    const ref = db.collection('exams').where('quiz', '==', db.collection('quizzes').doc(quizid))
    const docs = await ref.get()
    ref.onSnapshot(snapshot => {
      snapshot.forEach(s => {
        setExams(prevState => {
          return {
            ...prevState,
            [s.id]: {
              ...prevState[s.id],
              status: s.data().status
            }
          }
        })
      })
    })
    docs.forEach(d => {
      console.log(d.id)
      examstmp[d.id] = d.data()
    })
    setExams(examstmp)
  }, [])

  const upload = ({ file, onProgress, onSuccess, onError }) => {
    const db = firebase.firestore()
    const user = firebase.auth().currentUser
    const ref = db.collection('exams').doc()
    const eid = ref.id
    const filename = eid + '_' + file.name

    const storageRef = storage
      .ref()
      .child(`exams/${user.uid}/${quizid}/${filename}`)
    ref.set({
      filename: file.name,
      status: 'uploading',
      owner: user.uid,
      quiz: db.collection('quizzes').doc(quizid)
    })
    const uploadTask = storageRef.put(file)

    // Register three observers:
    // 1. 'state_changed' observer, called any time the state changes
    // 2. Error observer, called on failure
    // 3. Completion observer, called on successful completion
    uploadTask.on(
      'state_changed',
      snapshot => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        console.log(eid, progress)

        setExams(prevState => {
          return {
            ...prevState,
            [eid]: {
              filename: file.name,
              status: 'uploading',
              progress
            }
          }
        })
        // switch (snapshot.state) {
        //   case firebase.storage.TaskState.PAUSED: // or 'paused'
        //     console.log('Upload is paused')
        //     break
        //   case firebase.storage.TaskState.RUNNING: // or 'running'
        //     console.log('Upload is running')
        //     break
        // }
      },
      function (error) {
        // Handle unsuccessful uploads
        onError(error)
      },
      function () {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        // uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
        //   console.log('File available at', downloadURL)
        // })
        setExams(prevState => {
          return {
            ...prevState,
            [eid]: {
              ...prevState[eid],
              status: 'upload finish'
            }
          }
        })
        ref.update({
          status: 'upload finish',
          progress: 100
        })
        onSuccess('finished upload')
      }
    )
  }

  const props = {
    name: 'file',
    customRequest: upload,
    showUploadList: false,
    multiple: true,
    onChange (info) {
      const { status } = info.file
      console.log(info.file)
      if (status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`)
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
      }
    }
  }

  const createExamList = () => {
    if (exams === null) {
      return (
        <Col xs={24}>
          <Skeleton paragraph={false} active />
        </Col>
      )
    }
    return Object.keys(exams).map(eid => {
      return (
        <Col key={eid} xs={24} md={12} lg={6}>
          <Link to={'/quiz/exam/' + eid}>
            <ExamCard
              status={exams[eid].status}
              filename={exams[eid].filename}
              progress={
                exams[eid].progress
                  ? exams[eid].progress
                  : exams[eid].status === 'done'
                    ? 100
                    : 0
              }
            />
          </Link>
        </Col>
      )
    })
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <Link to={`/quiz/${quizid}/solution`}>
        <Button type="primary" shape="round" icon={<EditOutlined />} size={50}>
          Edit Solution
        </Button>
      </Link>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">drop files to score your answer sheet</p>
      </Dragger>
      <Row style={{ marginTop: '10px' }} gutter={[16, 16]}>
        {createExamList()}
      </Row>
    </div>
  )
}
