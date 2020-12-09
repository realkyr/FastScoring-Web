// import ExamCard from '../../components/quiz/ExamCard'

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Loading from '../Loading'

import { Collapse, Button, Upload, message, Row, Col, Skeleton, Tooltip, Progress, Statistic, Typography } from 'antd'
import { InboxOutlined, EditOutlined } from '@ant-design/icons'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/storage'

const { Title } = Typography
const { Dragger } = Upload
const { Panel } = Collapse

const styles = {
  centerAll: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  verticalCenter: {
    paddingLeft: 15,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }
}

class QuizDetailScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      quiz: null,
      exams: null
    }

    this.upload = this.upload.bind(this)
  }

  async componentDidMount () {
    const { quizid } = this.props.match.params
    const db = firebase.firestore()
    const ref = db.collection('exams').where('quiz', '==', db.collection('quizzes').doc(quizid))
    const qref = db.collection('quizzes').doc(quizid)
    const qdocs = await qref.get()
    this.setState({
      quiz: qdocs.data()
    })

    // add listener
    this.unsub = ref.onSnapshot(snapshot => {
      const exams = {}
      snapshot.forEach(s => {
        exams[s.id] = s.data()
      })
      this.setState({
        exams
      })
    })
  }

  componentWillUnmount () {
    this.unsub && this.unsub()
  }

  async upload ({ file, onProgress, onSuccess, onError }) {
    const { quizid } = this.props.match.params
    const storage = firebase.storage()
    const db = firebase.firestore()
    const user = firebase.auth().currentUser
    const ref = db.collection('exams').doc()
    const eid = ref.id
    const filename = eid + '_' + file.name

    const storageRef = storage
      .ref()
      .child(`exams/${user.uid}/${quizid}/${filename}`)
    await ref.set({
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

        this.setState({
          exams: {
            ...this.state.exams,
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
        ref.update({
          status: 'upload finish',
          progress: 100
        })
        onSuccess('finished upload')
      }
    )
  }

  render () {
    const { quizid } = this.props.match.params
    const { exams, quiz } = this.state
    const props = {
      name: 'file',
      customRequest: this.upload,
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

    if (exams == null) return <Loading color="#1890ff" />

    const calculateMaxScore = () => {
      if (!quiz || !quiz.amount) return 'ไม่ระบุคะแนนเต็ม'
      return quiz.amount
    }

    // eslint-disable-next-line no-unused-vars
    const createExamList = () => {
      if (exams === null) {
        return (
          <Col xs={24}>
            <Skeleton paragraph={false} active />
          </Col>
        )
      }
      return (
        <Collapse className="exams-result">
          {
            Object.keys(exams).map(eid => {
              return (
                <Panel key={eid} header={
                  <Row justify="space-between">
                    {/* {exams[eid].filename} */}
                    <Col span={12}><Title style={{ margin: 0 }} level={4}>{exams[eid].sid || 'กำลังตรวจ'}</Title></Col>
                    <Col style={{
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }} span={4}>
                      <Statistic title="Scoring" value={exams[eid].score} suffix={`/ ${calculateMaxScore()}`} />
                    </Col>
                  </Row>
                }>
                  <Row justify="space-between">
                    <Col span={12}><Title level={5}>status: {exams[eid].status}</Title></Col>
                    <Col style={{
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }} span={12}>
                      <Link to={'/quiz/exam/' + eid}>
                        <Button>See More</Button>
                      </Link>
                    </Col>
                  </Row>
                </Panel>
              )
            })
          }
        </Collapse>
      )
    }

    // calculate statistics
    let pass = 0
    let fail = 0
    const examiners = Object.keys(exams).length
    const scoredExaminers = Object.keys(exams).filter(e => exams[e].status === 'done').length

    Object.values(exams).forEach(e => {
      if (e.status === 'done' && e.score) {
        const score = e.score
        if (!quiz.amount) {
          pass += 1
          return
        }
        if (score >= quiz.amount / 2) pass += 1
        else fail += 1
      }
    })

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
        <Row style={{
          marginTop: 10,
          background: '#f7f7f7'
        }} gutter={[40, 20]}>
          <Col style={styles.centerAll} xs={14} lg={4}>
            <Tooltip>
              <Progress
                percent={scoredExaminers / examiners * 100}
                format={(percent) => (percent.toFixed(2) + '%')}
                strokeColor="red"
                trailColor="#cacaca"
                success={{ percent: (pass / examiners) * 100 }}
                type="circle"
              />
            </Tooltip>
          </Col>
          <Col style={styles.verticalCenter} xs={10} lg={3}>
            <Row gutter={[16, 20]}>
              <Col xs={24}>
                <Statistic title="All Examiner" value={examiners} />
              </Col>
              <Col span={10}>
                <Statistic title="Pass" value={pass} />
              </Col>
              <Col span={10}>
                <Statistic title="Fail" value={fail} />
              </Col>
            </Row>
          </Col>
          <Col style={styles.centerAll} xs={14} lg={5}>
            <Tooltip>
              <Progress
                trailColor="#cacaca"
                percent={Object.keys(exams).filter(e => exams[e].status === 'done').length / examiners * 100}
                showInfo={false}
              />
            </Tooltip>
          </Col>
          <Col style={styles.verticalCenter} xs={10} lg={4}>
            <Statistic title="Scoring" value={
                Object.keys(exams).filter(e => exams[e].status === 'done').length
              }
              suffix={'/ ' + examiners}
            />
          </Col>
        </Row>

        <Collapse>
          <Panel className="site-collapse-custom-collapse" header="See More Info">
            <Row gutter={[16, 16]}>
              {createExamList()}
            </Row>
          </Panel>
        </Collapse>
      </div>
    )
  }
}

QuizDetailScreen.propTypes = {
  match: PropTypes.object
}

export default QuizDetailScreen
