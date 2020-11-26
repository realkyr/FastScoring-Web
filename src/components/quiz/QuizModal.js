import React from 'react'
import PropTypes from 'prop-types'
import {
  Input,
  Typography,
  Row,
  Select,
  Upload,
  Modal,
  Col,
  Steps,
  Button,
  Image
} from 'antd'
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import 'firebase/storage'
import Title from 'antd/lib/skeleton/Title'

const pdfjsLib = require('pdfjs-dist/es5/build/pdf.js')
const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry')

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const { Text } = Typography
const { Step } = Steps
const { Option } = Select

export default class QuizModal extends React.Component {
  constructor (props) {
    super(props)
    this.initialState = {
      step: 0,
      form: null,
      amount: 10,
      isLoading: false,
      stepStatus: 'process',
      detail: null,
      solution: null
    }
    this.state = this.initialState
    const db = firebase.firestore()
    this.quizRef = db.collection('quizzes').doc()

    this._stepContent = this._stepContent.bind(this)
    this._uploadSolution = this._uploadSolution.bind(this)
  }

  async _uploadSolution ({ file }) {
    const { selectedForm, quizName } = this.state
    this.setState({ isLoading: true })
    const user = firebase.auth().currentUser
    // set data to firestore and put file to storage
    await this.quizRef.set(
      {
        name: quizName,
        solution_status: 'process',
        detail: 'pending',
        form: firebase
          .firestore()
          .collection('forms')
          .doc(selectedForm),
        owner: user.uid,
        amount: this.state.amount
      },
      { merge: true }
    )

    const storage = firebase.storage()
    const auth = firebase.auth()
    const ref = storage.ref('/quizzes').child(`${auth.currentUser.uid}/`)

    await ref.child(`${this.quizRef.id}_solution.jpg`).put(file)

    // init listener from server
    this.quizRef.onSnapshot(async snaps => {
      if (snaps.data().solution_status === 'finish') {
        // if finish get image
        const url = await ref
          .child(`analysed_${this.quizRef.id}_solution.jpg`)
          .getDownloadURL()
        console.log(url)
        this.setState({
          solution: url
        })
      }
      this.setState({
        isLoading: snaps.data().solution_status === 'process',
        stepStatus: snaps.data().solution_status,
        detail: snaps.data().detail || null
      })
    })
  }

  _stepContent () {
    const { step } = this.state
    switch (step) {
      case 0:
        return (
          <Row gutter={[16, 16]}>
            <Col
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
              <Text>ตั้งชื่อ Quiz :</Text>
              <Input
                style={{ width: '100%' }}
                onChange={e => {
                  this.setState({ quizName: e.target.value })
                }}
                value={this.state.quizName || ''}
                placeholder="ข้อสอบคณิตศาสตร์"
              />
            </Col>
          </Row>
        )
      case 1: {
        const { forms } = this.props
        if (forms === null) return <Title level={5}>Loading Forms</Title>
        return (
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              md={12}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
              <Text>เลือกฟอร์ม : </Text>
              <Select
                style={{ width: '100%' }}
                onSelect={selectedForm => this.setState({ selectedForm })}
                placeholder="ฟอร์มโอเน็ต">
                {Object.keys(forms).map(fid => {
                  return (
                    <Option key={fid} value={fid}>
                      {forms[fid].name}
                    </Option>
                  )
                })}
              </Select>
            </Col>
            <Col
              xs={24}
              md={12}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
              <Text>ระบุจำนวนข้อ: </Text>
              <Input
                style={{ width: '100%' }}
                onChange={e => {
                  let amount = e.target.value
                  if (amount === '') amount = 0
                  if (!isNaN(amount)) {
                    amount = parseInt(amount)
                    this.setState({ amount })
                  }
                }}
                value={this.state.amount}
                placeholder="20"
              />
            </Col>
          </Row>
        )
      }
      case 2: {
        const { solution } = this.state
        return (
          <>
            {
              solution ? <Image style={{ marginBottom: 10 }} src={solution} /> : null
            }
            <Upload
              disabled={this.state.isLoading}
              showUploadList={false}
              customRequest={this._uploadSolution}>
              <Button disabled={this.state.isLoading} icon={<UploadOutlined />}>เลือกไฟล์เฉลย</Button>
            </Upload>
          </>
        )
      }
      default:
        return null
    }
  }

  async _stepChange (step, resend) {
    if (step === 3) {
      this.props.toggleModal()
      this.setState(this.initialState)
      return
    }
    this.setState({ step })
  }

  render () {
    const { visible, toggleModal } = this.props
    const { step } = this.state

    return (
      <Modal
        visible={visible}
        title="Add Form"
        // onOk={this.handleOk}
        onCancel={toggleModal}
        footer={[
          <Button
            disabled={step === 0 || this.state.isLoading}
            onClick={() => this._stepChange(step - 1)}
            key="previous">
            ย้อนกลับ
          </Button>,
          <Button
            disabled={this.state.isLoading}
            onClick={() => this._stepChange(step + 1)}
            type="primary"
            key="next">
            ตกลง
          </Button>
        ]}
        width={1000}>
        <Steps size="small" status={this.state.stepStatus} current={step}>
          <Step title="ตั้งชื่อ Quiz" />
          <Step title="เลือกฟอร์ม" />
          <Step
            title="Upload เฉลย"
            description={this.state.detail}
            icon={
              this.state.isLoading && this.state.step === 2
                ? (
                    <LoadingOutlined />
                  )
                : null
            }
          />
        </Steps>
        <div className="steps-content">{this._stepContent()}</div>
      </Modal>
    )
  }
}

QuizModal.propTypes = {
  visible: PropTypes.bool,
  toggleModal: PropTypes.func,
  forms: PropTypes.object
}
