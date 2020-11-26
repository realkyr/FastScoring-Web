import React from 'react'
import Cropper from 'cropperjs'
import PropTypes from 'prop-types'
import {
  Input,
  Typography,
  Row,
  Select,
  Image,
  Upload,
  message,
  Modal,
  Col,
  Steps,
  Button
} from 'antd'
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons'
import firebase from 'firebase/app'
import 'firebase/storage'

const pdfjsLib = require('pdfjs-dist/es5/build/pdf.js')
const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry')

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const { Text } = Typography
const { Step } = Steps
const { Option } = Select

export default class AddFormModal extends React.Component {
  constructor (props) {
    super(props)
    this.initialState = {
      step: 0,
      pdfFileImg: null,
      isPDFRendered: false,
      isTasking: false,
      isLoading: false,
      cropper: null,
      answerSheetJPG: null,
      column: 1,
      amount: 20,
      stepStatus: 'process',
      ansMessage: null,
      answerResult: null,
      stuMessage: null,
      stuResult: null
    }
    this.state = this.initialState
    const db = firebase.firestore()
    this.formRef = db.collection('forms').doc()
    this._selectPDF = this._selectPDF.bind(this)
    this._stepContent = this._stepContent.bind(this)
  }

  async _selectPDF ({ file }) {
    this.setState({
      isTasking: !this.state.isTasking,
      pdfFile: file
    })
    const task = pdfjsLib.getDocument(URL.createObjectURL(file))
    const pdf = await task.promise
    const page = await pdf.getPage(1)
    const scale = 2
    const viewport = page.getViewport({ scale: scale })

    const canvas = document.getElementById('pdf')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    await page.render(renderContext).promise
    this.setState({
      isTasking: !this.state.isTasking,
      isPDFRendered: true
    })
    message.success('load PDF สำเร็จ')
  }

  _stepContent () {
    const { step } = this.state
    switch (step) {
      case 0:
        return (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Upload showUploadList={false} customRequest={this._selectPDF}>
                  <Button icon={<UploadOutlined />}>เลือกไฟล์ PDF</Button>
                </Upload>
              </Col>
              <Col
                xs={24}
                md={12}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}>
                <Text>ระบุจำนวน Column : </Text>
                <Select
                  style={{ width: '100%' }}
                  onSelect={column => this.setState({ column })}
                  defaultValue="1">
                  <Option value={1}>1</Option>
                  <Option value={2}>2</Option>
                  <Option value={3}>3</Option>
                  <Option value={4}>4</Option>
                  <Option value={5}>5</Option>
                </Select>
              </Col>
              <Col
                xs={24}
                md={12}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
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
            <canvas
              style={{
                width: '50%',
                height: 'calc(50% / 2.031)',
                display: !this.state.isPDFRendered ? 'none' : 'block'
              }}
              id="pdf"></canvas>
          </>
        )
      case 1: {
        return this.state.answerResult
          ? (
              <Image src={this.state.answerResult} />
            )
          : null
      }
      case 2: {
        return this.state.studentResult
          ? (
              <Image src={this.state.studentResult} />
            )
          : null
      }
      case 3:
        return (
          <Row gutter={[16, 16]}>
          <Text>ตั้งชื่อ Form :</Text>
            <Input
              style={{ width: '100%' }}
              onChange={e => {
                this.setState({ formName: e.target.value })
              }}
              value={this.state.formName || ''}
              placeholder="ฟอร์มมาตรฐาน"
            />
          </Row>
        )
      default:
        return null
    }
  }

  _initCropper () {
    const image = document.querySelector('#image-cropper')
    const { cropper } = this.state

    if (cropper) {
      cropper.replace(this.state.pdfFileImg)
      cropper.reset()
    } else {
      const croppertmp = new Cropper(image.firstChild, {
        scalable: false,
        zoomable: false
      })
      this.setState({
        cropper: croppertmp
      })
    }
  }

  async _stepChange (step, resend) {
    const canvas = document.getElementById('pdf')
    if (canvas) {
      this.setState({
        pdfFileImg: canvas.toDataURL('image/jpeg')
      })
    }
    const { cropper } = this.state

    const storage = firebase.storage()
    const user = firebase.auth().currentUser
    const storageRef = storage.ref(
      `/forms/${user.uid}/${this.formRef.id}_answersheet.png`
    )
    const storageStuRef = storage.ref(
      `/forms/${user.uid}/${this.formRef.id}_student.png`
    )

    switch (step) {
      case 1:
        this.setState({ step }, this._initCropper)
        break
      case 2:
        if (!resend && this.state.stepStatus === 'finish') {
          this.setState(
            {
              step,
              stepStatus: 'process'
            },
            this._initCropper
          )
          break
        }
        this.unsub && this.unsub()
        this.setState({
          answerSheetJPG: cropper.getCroppedCanvas().toDataURL()
        })
        await this.formRef.set(
          {
            answer_status: this.state.ansMessage ? 'resend' : 'pending',
            column: this.state.column,
            amount: this.state.amount,
            answer_sheet_path: `/forms/${user.uid}/${this.formRef.id}_answersheet.png`
          },
          { merge: true }
        )
        storageRef.putString(cropper.getCroppedCanvas().toDataURL(), 'data_url')
        this.unsub = this.formRef.onSnapshot(async s => {
          const info = s.data()
          switch (info.answer_status) {
            case 'pending':
            case 'resend':
            case 'analysing':
              this.setState({
                stepStatus: 'process',
                isLoading: true,
                ansMessage: info.answer_status
              })
              break
            case 'error':
              this.setState({
                stepStatus: 'error',
                isLoading: false,
                ansMessage: info.error_ans_msg
              })
              break
            case 'pass': {
              const answerResultRef = storage.ref(
                info.analysed_answersheet_path
              )
              const url = await answerResultRef.getDownloadURL()
              this.setState({
                answerResult: url,
                stepStatus: 'finish',
                isLoading: false,
                ansMessage: null
              })
              break
            }
            default:
              break
          }
        })
        break
      case 3:
        if (!resend && this.state.stepStatus === 'finish') {
          this.setState({ step, stepStatus: 'process' }, this._initCropper)
          break
        }
        this.unsub && this.unsub()
        this.setState({
          answerSheetJPG: cropper.getCroppedCanvas().toDataURL()
        })
        await this.formRef.set(
          {
            stu_column: 8,
            stu_status: this.state.stuMessage ? 'resend' : 'pending',
            student_path: `/forms/${user.uid}/${this.formRef.id}_student.png`
          },
          { merge: true }
        )
        storageStuRef.putString(
          cropper.getCroppedCanvas().toDataURL(),
          'data_url'
        )
        this.unsub = this.formRef.onSnapshot(async s => {
          const info = s.data()
          switch (info.stu_status) {
            case 'pending':
            case 'resend':
            case 'analysing':
              this.setState({
                stepStatus: 'process',
                isLoading: true,
                stuMessage: info.stu_status
              })
              break
            case 'error':
              this.setState({
                stepStatus: 'error',
                isLoading: false,
                stuMessage: info.error_stu_msg
              })
              break
            case 'pass': {
              const ResultRef = storage.ref(info.analysed_stu_path)
              const url = await ResultRef.getDownloadURL()
              this.setState({
                studentResult: url,
                stepStatus: 'finish',
                isLoading: false,
                stuMessage: null
              })
              break
            }
            default:
              break
          }
        })
        break
      case 4: {
        const { pdfFile, formName } = this.state
        const user = firebase.auth().currentUser

        this.setState({ isLoading: true })

        // create all reference
        const storageRef = {
          form: storage
            .ref(`/forms/${user.uid}/`)
            .child(`${this.formRef.id}_form.pdf`),
          answer_sheet: storage
            .ref(`/forms/${user.uid}/`)
            .child(`${this.formRef.id}_answersheet.png`),
          student: storage
            .ref(`/forms/${user.uid}/`)
            .child(`${this.formRef.id}_student.png`)
        }

        if (!pdfFile) {
          message.error('No PDF Selected')
          this.setState({ isLoading: false })
          return
        }
        if (!formName) {
          message.error('please insert form name')
          this.setState({ isLoading: false })
          return
        }
        await storageRef.form.put(pdfFile)
        const url = {
          form: await storageRef.form.getDownloadURL(),
          answer_sheet: await storageRef.answer_sheet.getDownloadURL(),
          student: await storageRef.student.getDownloadURL()
        }
        await this.formRef.set({
          name: formName,
          owner: user.uid,
          available: true,
          url
        }, { merge: true })
        message.success('Upload Form successful')
        this.props.toggleModal()
        this.setState(this.initialState)
        break
      }
      default:
        break
    }
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
          <Button key="previous">ย้อนกลับ</Button>,
          <Button
            disabled={this.state.isLoading}
            onClick={() => this._stepChange(this.state.step + 1)}
            type="primary"
            key="next">
            ตกลง
          </Button>
        ]}
        width={1000}>
        <Steps size="small" status={this.state.stepStatus} current={step}>
          <Step title="เลือก PDF" />
          <Step
            title="Crop ส่วนที่ฝนคำตอบ"
            description={this.state.ansMessage}
            icon={
              this.state.isLoading && this.state.step === 1
                ? (
                    <LoadingOutlined />
                  )
                : null
            }
          />
          <Step
            title="Crop ส่วนที่ฝนรหัสนักศึกษา"
            description={this.state.stuMessage}
            icon={
              this.state.isLoading && this.state.step === 2
                ? (
                    <LoadingOutlined />
                  )
                : null
            }
          />
          <Step title="ตั้งชื่อฟอร์ม" />
        </Steps>
        <div className="steps-content">
          {this._stepContent()}
          <div
            style={{
              display: !this.state.pdfFileImg || this.state.step === 3 ? 'none' : 'block'
            }}>
            <Image
              id="image-cropper"
              src={this.state.pdfFileImg}
              preview={false}
            />
          </div>
        </div>
      </Modal>
    )
  }
}

AddFormModal.propTypes = {
  visible: PropTypes.bool,
  toggleModal: PropTypes.func
}
