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
    this._send = this._send.bind(this)
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
    const { step, column } = this.state
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
                  value={column}
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
              <Col
                xs={24}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                <Text>จำนวนตัวเลือกต่อข้อ: </Text>
                <Input
                  style={{ width: '100%' }}
                  disabled
                  value={5}
                  placeholder="20"
                />
              </Col>
            </Row>
            <Row align="center">
              <Col style={{
                display: !this.state.isPDFRendered ? 'none' : 'block'
              }} xs={24} md={12}>
                  <canvas
                    style={{
                      width: '20%'
                    }}
                    id="pdf"
                  />
              </Col>
            </Row>
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

  async _send () {
    const { cropper, step } = this.state

    const storage = firebase.storage()
    const user = firebase.auth().currentUser

    const sheet = {}
    if (step === 1) {
      sheet.type = 'answersheet'
      sheet.status = 'answer_status'
      sheet.message = 'ansMessage'
      sheet.pic = 'answerSheetJPG'
      sheet.error = 'error_ans_msg'
      sheet.result = 'answerResult'
      sheet.analysed = 'analysed_answersheet_path'
      sheet.path = 'answer_sheet_path'
      sheet.payload = {
        column: this.state.column,
        amount: this.state.amount
      }
    } else {
      sheet.type = 'student'
      sheet.message = 'stuMessage'
      sheet.status = 'stu_status'
      sheet.path = 'student_path'
      sheet.error = 'error_stu_msg'
      sheet.result = 'studentResult'
      sheet.analysed = 'analysed_stu_path'
      sheet.payload = {
        stu_column: 8
      }
    }

    // add payload which contain the same data
    sheet.payload = {
      ...sheet.payload,
      [sheet.status]: this.state[sheet.message] ? 'resend' : 'pending',
      [sheet.path]: `/forms/${user.uid}/${this.formRef.id}_${sheet.type}.png`
    }

    const storageRef = storage.ref(
      `/forms/${user.uid}/${this.formRef.id}_${sheet.type}.png`
    )
    this.unsub && this.unsub()
    this.setState({
      [sheet.pic]: cropper.getCroppedCanvas().toDataURL()
    })
    await this.formRef.set(
      sheet.payload,
      { merge: true }
    )
    storageRef.putString(
      cropper.getCroppedCanvas().toDataURL(),
      'data_url'
    )
    this.unsub = this.formRef.onSnapshot(async s => {
      const info = s.data()
      switch (info[sheet.status]) {
        case 'pending':
        case 'resend':
        case 'analysing':
          this.setState({
            stepStatus: 'process',
            isLoading: true,
            [sheet.message]: info[sheet.status]
          })
          break
        case 'error':
          this.setState({
            stepStatus: 'error',
            isLoading: false,
            [sheet.message]: info[sheet.error]
          })
          break
        case 'pass': {
          const resultRef = storage.ref(
            info[sheet.analysed]
          )
          const url = await resultRef.getDownloadURL()
          this.setState({
            [sheet.result]: url,
            stepStatus: 'finish',
            isLoading: false,
            [sheet.message]: 'Compatible'
          })
          break
        }
        default:
          break
      }
    })
  }

  componentWillUnmount () {
    this.unsub && this.unsub()
  }

  async _stepChange (step, resend) {
    const canvas = document.getElementById('pdf')
    if (canvas) {
      this.setState({
        pdfFileImg: canvas.toDataURL('image/jpeg')
      })
    }
    const storage = firebase.storage()

    switch (step) {
      case 0:
        this.setState({
          step
        }, () => {
          // if pdf file selected load one
          if (this.state.pdfFile) this._selectPDF({ file: this.state.pdfFile })
        })
        break
      case 1:
      case 2:
      case 3:
        this.setState(
          {
            step,
            stepStatus: 'process'
          },
          this._initCropper
        )
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
        let urlBuffer = [
          storageRef.form.getDownloadURL(),
          storageRef.answer_sheet.getDownloadURL(),
          storageRef.student.getDownloadURL()
        ]
        urlBuffer = await Promise.all(urlBuffer)
        console.log(urlBuffer)
        const url = {
          form: urlBuffer[0],
          answer_sheet: urlBuffer[1],
          student: urlBuffer[2]
        }
        console.log(url)
        await this.formRef.set({
          name: formName,
          owner: user.uid,
          available: true,
          url
        }, { merge: true })
        message.success('Upload Form successful')
        this.setState(this.initialState)
        this.props.toggleModal()
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
        style={{
          top: '50px'
        }}
        visible={visible}
        title="Add Form"
        // onOk={this.handleOk}
        onCancel={toggleModal}
        footer={[
          <Button
            key="previous"
            disabled={
              this.state.isLoading || this.state.step === 0
            }
            onClick={() => this._stepChange(this.state.step - 1)}
          >ย้อนกลับ</Button>,
          <Button
            key="send"
            disabled={
              this.state.isLoading || [0, 3].includes(this.state.step)
            }
            onClick={this._send}
          >ส่ง</Button>,
          <Button
            disabled={this.state.isLoading || ([1, 2].includes(this.state.step) && this.state.stepStatus !== 'finish')}
            onClick={() => this._stepChange(this.state.step + 1)}
            type="primary"
            key="next">
            ตกลง
          </Button>
        ]}
        width={1000}>
        <div style={{
          padding: '10px',
          position: 'sticky',
          zIndex: 1001,
          background: 'white',
          top: 0
        }}>
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
        </div>
        <div className="steps-content">
          {this._stepContent()}
          <div
            style={{
              display: !this.state.pdfFileImg || [0, 3].includes(this.state.step) ? 'none' : 'block'
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
