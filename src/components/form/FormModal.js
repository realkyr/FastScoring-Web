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
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

const pdfjsLib = require('pdfjs-dist/es5/build/pdf.js')
const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry')

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const { Text } = Typography
const { Step } = Steps
const { Option } = Select

export default class FormModal extends React.Component {
  constructor (props) {
    super(props)

    const url = props.edit ? props.form.url || {} : {}

    // if edit form there is form information supply for modal
    this.initialState = props.form
      ? {
          column: props.form.column,
          amount: props.form.amount,
          answerResult: url.answersheet || null,
          studentResult: url.student || null,
          ansMessage: props.form.error_ans_msg || null,
          stuMessage: props.form.error_stu_msg || null,
          formName: props.form.name || null
        }
      : {
          column: 1,
          amount: 20,
          ansMessage: null,
          answerResult: null,
          stuMessage: null,
          studentResult: null
        }
    this.initialState = {
      ...this.initialState,
      url,
      answerSheetJPG: null,
      step: 0,
      pdfFileImg: null,
      isPDFRendered: false,
      isTasking: false,
      isLoading: false,
      cropper: null,
      stepStatus: 'process'
    }
    this.state = this.initialState

    // form ref if id supply reference to exist
    const db = firebase.firestore()
    this._firstTimeMount = false
    this.formRef = !props.id
      ? db.collection('forms').doc()
      : db.collection('forms').doc(props.id)
    this._selectPDF = this._selectPDF.bind(this)
    this._stepContent = this._stepContent.bind(this)
    this._send = this._send.bind(this)
    this._uploadStorage = this._uploadStorage.bind(this)
  }

  async _convertURLtoFile (props) {
    this.setState({
      isLoading: true
    })
    // if edit form
    if (props.edit) {
      const auth = firebase.auth()
      const user = auth.currentUser
      const ref = firebase.storage().ref()
      try {
        console.log(`forms/${user.uid}/${props.id}_form.pdf`)
        const url = await ref.child(`forms/${user.uid}/${props.id}_form.pdf`).getDownloadURL()
        this._selectPDF({ file: url, upload: false })
      } catch (error) {
        message.error(error.message)
        message.error('กรุณาเลือกไฟล์ PDF ใหม่อีกครั้ง')
      }
    }
  }

  async _selectPDF ({ file, upload }) {
    // pdf file select and store in state
    this.setState({
      isLoading: true,
      pdfFile: file
    })
    if (upload) {
      // upload file only when upload is true
      await this._uploadStorage({
        type: 'form',
        tag: 'pdf',
        file: file,
        isURL: false
      })
    }

    try {
      const task = pdfjsLib.getDocument(typeof file === 'string' ? file : URL.createObjectURL(file))
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
        isLoading: false,
        isPDFRendered: true
      })
      message.success('load PDF สำเร็จ')
    } catch (error) {
      this.setState({
        isLoading: false
      })
      message.error('load PDF ไม่สำเร็จ')
    }
  }

  _stepContent () {
    const { step, column } = this.state
    switch (step) {
      case 0:
        return (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Upload
                  showUploadList={false}
                  customRequest={e => this._selectPDF({ file: e.file, upload: true })}
                >
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
                      width: '50%'
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
    this.setState({
      stepStatus: 'process',
      isLoading: true
    })
    const { cropper, step } = this.state

    const storage = firebase.storage()

    const sheet = {}
    if (step === 1) {
      sheet.type = 'answersheet'
      sheet.status = 'answer_status'
      sheet.message = 'ansMessage'
      sheet.pic = 'answerSheetJPG'
      sheet.error = 'error_ans_msg'
      sheet.result = 'answerResult'
      sheet.coords = 'answer_sheet_coords'
      sheet.analysed = 'analysed_answersheet_path'
      sheet.payload = {
        column: this.state.column,
        amount: this.state.amount
      }
    } else {
      sheet.type = 'student'
      sheet.message = 'stuMessage'
      sheet.status = 'stu_status'
      sheet.error = 'error_stu_msg'
      sheet.coords = 'student_coords'
      sheet.result = 'studentResult'
      sheet.analysed = 'analysed_stu_path'
      sheet.payload = {
        stu_column: 8
      }
    }

    // add payload which contain the same data
    sheet.payload = {
      ...sheet.payload,
      [sheet.coords]: cropper.getData(),
      [sheet.status]: this.state[sheet.message] ? 'resend' : 'pending'
    }

    this.unsub && this.unsub()
    if (sheet.type === 'answersheet') {
      await this._uploadStorage({
        type: 'form',
        tag: 'jpg',
        file: this.state.pdfFileImg,
        isURL: true
      })
    }
    console.log(this.formRef.id)
    this.setState({
      [sheet.pic]: cropper.getCroppedCanvas().toDataURL()
    })
    await this.formRef.set(
      sheet.payload,
      { merge: true }
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

  async _uploadStorage ({ type, tag, file, isURL }) {
    const storage = firebase.storage()
    const user = firebase.auth().currentUser
    const storageRef = storage
      .ref(`/forms/${user.uid}/`)
      .child(`${this.formRef.id}_${type}.${tag}`)
    if (isURL) await storageRef.putString(file, 'data_url')
    else await storageRef.put(file)
    const url = await storageRef.getDownloadURL()
    this.setState({
      url: {
        ...this.state.url,
        [type]: url
      }
    })
    await this.formRef.set({
      url: this.state.url,
      owner: user.uid
    }, { merge: true })
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
    switch (step) {
      case 0:
        this.setState({
          step
        }, () => {
          // if pdf file selected load one
          if (this.state.pdfFile) this._selectPDF({ file: this.state.pdfFile, upload: false })
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
        const { formName } = this.state
        const user = firebase.auth().currentUser

        this.setState({ isLoading: true })

        if (!formName) {
          message.error('please insert form name')
          this.setState({ isLoading: false })
          return
        }
        await this.formRef.set({
          name: formName,
          owner: user.uid
        }, { merge: true })
        message.success(this.props.modalName + ' successful')
        this._firstTimeMount = false
        this.setState({
          ...this.initialState
        }, this.props.toggleModal)
        break
      }
      default:
        break
    }
  }

  componentDidUpdate (prevProps) {
    if (
      this.props.edit &&
        this.props.visible &&
        this._firstTimeMount === false
    ) {
      if (!this._firstTimeMount) this._firstTimeMount = true
      //  if first time mount load pdf
      this._convertURLtoFile(this.props)
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
        title={this.props.modalName}
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
            disabled={
              this.state.isLoading ||
              !this.state.isPDFRendered ||
                (
                  [1, 2].includes(this.state.step) &&
                  (this.state.stepStatus !== 'finish' && !this.props.edit)
                )}
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
            <Step title="เลือก PDF" icon={
                this.state.isLoading && this.state.step === 0
                  ? (
                      <LoadingOutlined />
                    )
                  : null
              }/>
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

FormModal.propTypes = {
  visible: PropTypes.bool,
  toggleModal: PropTypes.func,
  modalName: PropTypes.string.isRequired,
  form: PropTypes.object,
  edit: PropTypes.bool,
  id: PropTypes.string
}
