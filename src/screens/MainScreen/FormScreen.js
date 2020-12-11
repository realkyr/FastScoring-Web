import React from 'react'
import { Button, Row, Col, Typography, Skeleton, Image } from 'antd'
import { Link } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'

import AddFormModal from '../../components/form/FormModal'

import firebase from 'firebase/app'
import 'firebase/firestore'

const { Title, Paragraph } = Typography

export default class FormScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      modalVisible: false,
      forms: null
    }

    this.toggleModal = this.toggleModal.bind(this)
  }

  toggleModal () {
    this.setState({ modalVisible: !this.state.modalVisible })
  }

  componentDidMount () {
    const db = firebase.firestore()
    const user = firebase.auth().currentUser
    const ref = db.collection('forms')

    // listen for form update
    this.unsub = ref.where('owner', '==', user.uid).onSnapshot(snapshots => {
      console.log('listener init')
      const forms = { ...this.state.forms }
      snapshots.docChanges().forEach(change => {
        if (change.type === 'removed') {
          // if form has been delete
          delete forms[change.doc.id]
        } else {
          // if form change or form added
          forms[change.doc.id] = change.doc.data()
        }
      })
      this.setState({ forms })
    })
  }

  componentWillUnmount () {
    this.unsub && this.unsub()
  }

  _createformsList () {
    const { forms } = this.state
    console.log(forms)
    if (forms === null) {
      return (
        <Col xs={24}>
          <div
            style={{
              borderRadius: '5px',
              boxShadow: '0 5px 12px 4px rgba(0,0,0,.09)',
              cursor: 'pointer',
              background: 'white',
              width: '100%'
            }}>
            <Skeleton paragraph={false} active />
            <Skeleton paragraph={false} active />
          </div>
        </Col>
      )
    }
    return [...Object.keys(forms).map(fid => {
      const url = forms[fid].url || {}
      return (
          <Col key={fid} xs={24} md={12} lg={6}>
            <Link to={'/form/' + fid}>
              <div
                style={{
                  borderRadius: '5px',
                  boxShadow: '0 5px 12px 4px rgba(0,0,0,.09)',
                  cursor: 'pointer',
                  background: 'white',
                  width: '100%',
                  overflow: 'hidden',
                  height: 280
                }}>
                <div style={{ overflow: 'hidden', height: 200 }}>
                  <Image preview={false} src={
                    url.answersheet || require('../../assets/img/form placeholder.jpg').default
                  } />
                </div>
                <div style={{ height: 80 }}>
                  <Title level={3}>{forms[fid].name || 'กระดาษคำตอบที่ยังไม่มีชื่อ'}</Title>
                  <Paragraph ellipsis>{forms[fid].description || ''}</Paragraph>
                </div>
              </div>
            </Link>
          </Col>
      )
    }),
    <Col key="add-form-button" xs={24} md={12} lg={6}>
        <div
          onClick={this.toggleModal}
          style={{
            borderRadius: '5px',
            boxShadow: '0 5px 12px 4px rgba(0,0,0,.09)',
            cursor: 'pointer',
            background: 'white',
            width: '100%',
            overflow: 'hidden',
            height: 280,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Button
            onClick={this.toggleModal}
            size="large"
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
          />
        </div>
    </Col>
    ]
  }

  render () {
    const { modalVisible } = this.state
    return (
      <>
        <Row gutter={[16, 16]}>{this._createformsList()}</Row>
        <AddFormModal modalName="Add Form" visible={modalVisible} toggleModal={this.toggleModal} />
      </>
    )
  }
}
