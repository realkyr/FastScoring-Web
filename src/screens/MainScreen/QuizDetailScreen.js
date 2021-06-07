// import ExamCard from '../../components/quiz/ExamCard'

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Loading from '../Loading'

import {
  Collapse,
  Alert,
  Button,
  Upload,
  message,
  Row,
  Col,
  Skeleton,
  Tooltip,
  Progress,
  Statistic,
  Typography
} from 'antd'
import { InboxOutlined, EditOutlined } from '@ant-design/icons'
import ScoreCalculator from '../../components/quiz/ScoreCalculator'

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
    alignItems: 'center',
    flexDirection: 'column'
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
      exams: null,
      order: null
    }

    this.upload = this.upload.bind(this)
  }

  componentDidMount () {
    const { quizid } = this.props.match.params
    const db = firebase.firestore()
    const ref = db
      .collection('exams')
      .where('quiz', '==', db.collection('quizzes').doc(quizid))
      .orderBy('createDate', 'desc')
      .orderBy('sid')
      .orderBy('filename')
    const qref = db.collection('quizzes').doc(quizid)
    this.quiz_unsub = qref.onSnapshot(q => {
      if (q.exists) {
        this.form_unsub && this.form_unsub()
        this.form_unsub = q.data().form.onSnapshot(f => {
          this.setState({
            form_exists: f.exists
          })
        })
        this.setState({
          quiz: q.data()
        })
      } else {
        this.setState({
          quiz: undefined,
          exams: undefined
        })
      }
    })

    // add listener
    this.unsub = ref.onSnapshot(snapshot => {
      const exams = {}
      const order = []
      snapshot.forEach(s => {
        exams[s.id] = s.data()
        order.push(s.id)
      })
      console.log(exams)
      this.setState({
        exams,
        order
      })
    })
  }

  componentWillUnmount () {
    this.unsub && this.unsub()
    this.quiz_unsub && this.quiz_unsub()
    this.form_unsub && this.form_unsub()
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
      sid: 'detecting student id',
      quiz: db.collection('quizzes').doc(quizid),
      createDate: firebase.firestore.FieldValue.serverTimestamp()
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
    if (!quiz && quiz !== null) {
      return (
        <Title level={1}>404 Not Found!</Title>
      )
    }
    if (exams == null) return <Loading color="#1890ff" />
    if (quiz == null) return <Loading color="#1890ff" />

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

    const calculateMaxScore = () => {
      if (!quiz || !quiz.amount) return 'ไม่ระบุคะแนนเต็ม'
      return quiz.amount * (quiz.point_per_clause || 1)
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
          {this.state.order.map(eid => {
            return (
              <Panel
                key={eid}
                header={
                  <Row justify="space-between">
                    {/* {exams[eid].filename} */}
                    <Col span={12}>
                      <Title style={{ margin: 0 }} level={4}>
                        {
                          exams[eid].status === 'error'
                            ? 'ไม่สามารถตรวจข้อสอบได้'
                            : exams[eid].sid || 'กำลังตรวจ'
                        }
                      </Title>
                    </Col>
                    <Col
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}
                      span={4}>
                      <Statistic
                        title="Scoring"
                        value={exams[eid].score}
                        suffix={`/ ${calculateMaxScore()}`}
                      />
                    </Col>
                  </Row>
                }>
                <Row justify="space-between">
                  <Col span={12}>
                    <Title level={5}>status: {exams[eid].status}</Title>
                  </Col>
                  <Col
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}
                    span={12}>
                    <Button
                      type="primary"
                      shape="round"
                      danger
                      onClick={async () => {
                        const db = firebase.firestore()
                        await db.collection('exams').doc(eid).delete()
                        message.success('deleted exams sucess')
                      }}
                      size={50}>
                      Delete
                    </Button>
                  </Col>
                  <Col span={24}>
                    <Link to={'/quiz/exam/' + eid}>
                      <Button>See More</Button>
                    </Link>
                  </Col>
                  {
                    exams[eid].error_msg
                      ? <Col span={24}>
                          <Title level={5}>{exams[eid].error_msg}</Title>
                        </Col>
                      : null
                  }
                </Row>
              </Panel>
            )
          })}
        </Collapse>
      )
    }

    const exportJSON = () => {
      const exportName = quiz.name + '_result'
      const exportObj = {
        quiz_name: quiz.name,
        examiners: Object.keys(exams).length,
        students: {}
      }

      Object.keys(exams).forEach(id => {
        const result = {}
        Object.keys(exams[id].result).forEach(clause => {
          const ret = exams[id].result[clause]
          result[clause] = {
            user_choice: ret.user_choice.sort(),
            correct_choice: ret.correct_choice.sort()
          }
        })
        exportObj.students[id] = result
      })
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj))
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute('href', dataStr)
      downloadAnchorNode.setAttribute('download', exportName + '.json')
      document.body.appendChild(downloadAnchorNode) // required for firefox
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    }

    // calculate statistics
    let pass = 0
    let fail = 0
    const examiners = Object.keys(exams).length
    const scoredExaminers = Object.keys(exams).filter(
      e => exams[e].status === 'done'
    ).length

    Object.values(exams).forEach(e => {
      if (['done', 'error'].includes(e.status)) {
        const score = e.score || 0
        if (!quiz.amount) {
          pass += 1
          return
        }
        if (score >= (quiz.amount * (quiz.point_per_clause || 1)) / 2) pass += 1
        else fail += 1
      }
    })

    const passRate = (pass / examiners) * 100
    const failRate = (fail / examiners) * 100

    console.log({
      pass,
      fail,
      examiners,
      scoredExaminers
    })

    return (
      <div style={{ textAlign: 'left' }}>
        {
          this.state.form_exists === false
            ? <Alert
              message="Error: มีบางอย่างต้องแก้ไข"
              description="ค้นหาฟอร์มไม่เจอ ระบบจะไม่สามารถตรวจข้อสอบได้
                ฟอร์มอาจถูกลบไป กรุณาเลือกฟอร์ม
                หรือสร้างฟอร์มใหม่"
              type="error"
              showIcon
            />
            : null
        }
        <Link to={`/quiz/${quizid}/solution`}>
          <Button
            type="primary"
            shape="round"
            icon={<EditOutlined />}
            size={50}>
            Edit Solution
          </Button>
        </Link>
        {
          quiz.ranking_sheet
            ? <Button
                type="primary"
                style={{
                  float: 'right',
                  backgroundColor: '#0F9D58'
                }}
                onClick={() => { window.open(`https://docs.google.com/spreadsheets/d/${quiz.ranking_sheet}`) }}
                shape="round"
                icon={<EditOutlined />}
                size={50}>
                GOOGLE SHEETS
              </Button>
            : null
        }
        <Button
          type="primary"
          shape="round"
          danger
          onClick={async () => {
            const db = firebase.firestore()
            const buffer = Object.keys(exams).map(id => {
              return db.collection('exams').doc(id).delete()
            })
            await Promise.all(buffer)
            message.success('deleted all exams')
          }}
          size={50}>
          Delete All Exam
        </Button>
        <Button
          type="primary"
          shape="round"
          danger
          onClick={async () => {
            const db = firebase.firestore()
            const buffer = [...Object.keys(exams).map(id => {
              return db.collection('exams').doc(id).delete()
            }),
            db.collection('quizzes').doc(quizid).delete()
            ]
            await Promise.all(buffer)
            message.success('deleted quiz success')
          }}
          size={50}>
          Delete Quiz
        </Button>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            drop files to score your answer sheet
          </p>
        </Dragger>
        <Row
          style={{
            marginTop: 10,
            background: '#f7f7f7'
          }}
          gutter={[40, 20]}>
          <Col style={styles.centerAll} xs={14} lg={8}>
            <Tooltip>
              <Progress
                percent={passRate}
                format={percent => percent.toFixed(2) + '%'}
                strokeColor="#52c41a"
                trailColor="#cacaca"
              />
            </Tooltip>
            <Tooltip>
              <Progress
                percent={failRate}
                format={percent => percent.toFixed(2) + '%'}
                strokeColor="red"
                trailColor="#cacaca"
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
                percent={(scoredExaminers / examiners) * 100}
                showInfo={false}
              />
            </Tooltip>
          </Col>
          <Col style={styles.verticalCenter} xs={10} lg={4}>
            <Statistic
              title="Scoring"
              value={scoredExaminers}
              suffix={'/ ' + examiners}
            />
          </Col>
        </Row>
        <ScoreCalculator quiz={quiz} exam={this.state.exams} />
        <Button onClick={exportJSON} type="primary">Export ผลการตรวจเป็น JSON</Button>
        <Collapse>
          <Panel
            className="site-collapse-custom-collapse"
            header="See More Info">
            <Row gutter={[16, 16]}>{createExamList()}</Row>
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
