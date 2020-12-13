import React from 'react'
import PropTypes from 'prop-types'

import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

import {
  Skeleton,
  Input,
  Row,
  Col,
  Button,
  Select,
  Upload,
  Image,
  Typography,
  message,
  Spin,
  InputNumber
} from 'antd'

import { UploadOutlined, EditOutlined } from '@ant-design/icons'

const { Option } = Select
const { Title } = Typography

export default class QuizSolutionScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      quiz: null,
      solution: null,
      forms: null,
      selectedForm: null,
      titleEdit: false,
      isLoading: false
    }
    this.quizid = props.match.params.quizid
    this._uploadSolution = this._uploadSolution.bind(this)
  }

  componentDidMount () {
    const db = firebase.firestore()
    const ref = db.collection('quizzes').doc(this.quizid)
    this.unsub = ref.onSnapshot(async snapshots => {
      const quiz = snapshots.exists ? snapshots.data() : {}
      if (snapshots.exists) {
        const formid = snapshots.data().form ? snapshots.data().form.id : undefined
        this.setState({
          selectedForm: formid
        })
        if (!this.state.solution) {
          try {
            const storage = firebase.storage()
            const sRef = storage.ref().child(snapshots.data().analysed_solution_path)
            const url = await sRef.getDownloadURL()
            this.setState({
              solution: url
            })
          } catch (error) {
            console.log(error)
            message.error('solution can not be found')
            this.setState({
              solution: ''
            })
          }
        }
      }

      this.setState({
        quiz
      })
    })
    const user = firebase.auth().currentUser
    this.unsub_form = db.collection('forms').where('owner', '==', user.uid).onSnapshot(snapshots => {
      const forms = {}
      snapshots.forEach(f => {
        forms[f.id] = f.data().name || 'ฟอร์มที่ยังไม่มีชื่อ'
      })
      this.setState({ forms })
    })
  }

  componentWillUnmount () {
    this.unsub && this.unsub()
    this.unsub_form && this.unsub_form()
    this.unsub_quiz && this.unsub_quiz()
  }

  async _uploadSolution ({ file }) {
    this.setState({ isLoading: true })
    const user = firebase.auth().currentUser
    const db = firebase.firestore()

    // set data to firestore and put file to storage
    const storage = firebase.storage()
    const ref = storage.ref('/quizzes').child(`${user.uid}/`)
    const quizRef = db.collection('quizzes').doc(this.quizid)
    const buffer = [
      quizRef.update({
        solution_status: 'pending'
      }),
      ref.child(`${this.quizid}_solution.jpg`).put(file)
    ]
    await Promise.all(buffer)

    // init listener from server
    this.unsub_quiz = quizRef.onSnapshot(async snaps => {
      if (snaps.data().solution_status === 'finish') {
        // if finish get image
        const url = await ref
          .child(`analysed_${this.quizid}_solution.jpg`)
          .getDownloadURL()
        console.log(url)
        this.setState({
          solution: url
        })
      }
      this.setState({
        isLoading: snaps.data().solution_status === 'process',
        detail: snaps.data().detail
      })
    })
  }

  render () {
    const { quiz, forms, selectedForm, solution, isLoading } = this.state
    const db = firebase.firestore()
    if (!quiz && quiz !== null) {
      return (
        <Title level={1}>404 Not Found!</Title>
      )
    }

    const editName = (text) => {
      const ref = db.collection('quizzes').doc(this.quizid)
      ref.set({ name: text }, { merge: true })
    }

    return (
      <>
        {
          quiz === null
            ? <Skeleton paragraph={false} active />
            : <Row>
                <Col style={{ flexDirection: 'row' }} xs={24} md={12}>
                  {
                    this.state.titleEdit
                      ? <Input
                          value={quiz.name || ''}
                          onChange={e => editName(e.target.value)}
                        />
                      : <Title style={{ display: 'inline-block' }}>{quiz.name || 'quiz ยังไม่มีชื่อ'}</Title>
                  }
                  <Button
                    type="primary"
                    shape="round"
                    onClick={() => this.setState({
                      titleEdit: !this.state.titleEdit
                    })}
                    icon={<EditOutlined />}
                    size={50}>
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  {
                    forms === null || selectedForm === null
                      ? <Skeleton paragraph={false} active />
                      : <Select
                          style={{ width: '100%' }}
                          value={forms[selectedForm] || 'ไม่มีฟอร์มที่เลือก'}
                          onSelect={selectedForm => {
                            this.setState({ selectedForm })
                            db.collection('quizzes').doc(this.quizid).set({
                              form: db.collection('forms').doc(selectedForm)
                            }, { merge: true })
                          }}
                          placeholder="ฟอร์มโอเน็ต">
                          {Object.keys(forms).map(fid => {
                            return (
                              <Option key={fid} value={fid}>
                                {forms[fid]}
                              </Option>
                            )
                          })}
                        </Select>
                  }
                  <InputNumber value={quiz.amount || 1} min={1} onChange={value => {
                    db.collection('quizzes').doc(this.quizid).update({
                      amount: value
                    })
                  }} />
                </Col>
                <Col xs={24}>
                  <Upload
                    disabled={this.state.isLoading}
                    showUploadList={false}
                    customRequest={this._uploadSolution}>
                    <Button disabled={this.state.isLoading} icon={<UploadOutlined />}>เลือกไฟล์เฉลย</Button>
                  </Upload>
                  {
                    quiz.solution_status === 'finish'
                      ? (null)
                      : (
                        <>
                          <Title level={4}>{quiz.solution_status || ''}</Title>
                          <Title level={4}>{quiz.detail || ''}</Title>
                        </>
                        )
                  }
                  {
                    isLoading
                      ? (
                      <>
                        <Spin />
                      </>
                        )
                      : solution === null
                        ? <Skeleton paragraph={false} active />
                        : quiz.solution_status !== 'finish'
                          ? null
                          : <Image src={solution} />
                  }
                </Col>
              </Row>
        }

      </>
    )
  }
}

QuizSolutionScreen.propTypes = {
  match: PropTypes.object
}
