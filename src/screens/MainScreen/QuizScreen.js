import React from 'react'
import { Button, Row, Col, Typography, Skeleton, Image } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

import QuizModal from '../../components/quiz/QuizModal'

const { Title, Paragraph } = Typography

export default class Quizcreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      modalVisible: false,
      quizzes: null,
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
    const ref = {
      quizzes: db.collection('quizzes').where('owner', '==', user.uid),
      forms: db.collection('forms').where('owner', '==', user.uid)
    }

    // ----- listen for quiz update
    this.unsub = ref.quizzes.onSnapshot(snapshots => {
      const quizzes = { ...this.state.quizzes }
      snapshots.docChanges().forEach(change => {
        if (change.type === 'removed') {
          // if quiz has been delete
          delete quizzes[change.doc.id]
        } else {
          // if quiz change or quiz added
          quizzes[change.doc.id] = change.doc.data()
        }
      })
      this.setState({ quizzes })
    })

    // listen to standard
    this.unsub_std_form = db.collection('forms').doc('hl1xtxWD7QzZYpTr7yWA').onSnapshot(std => {
      const forms = { ...this.state.forms }
      forms[std.id] = std.data()
      this.setState({ forms })
    })

    // ----- listen to forms update
    this.form_unsub = ref.forms.onSnapshot(snapshots => {
      const forms = { ...this.state.forms }
      snapshots.docChanges().forEach(change => {
        if (change.type === 'removed') {
          // if quiz has been delete
          delete forms[change.doc.id]
        } else {
          // if quiz change or quiz added
          forms[change.doc.id] = change.doc.data()
        }
      })
      this.setState({ forms })
    })
  }

  componentWillUnmount () {
    this.unsub && this.unsub()
    this.form_unsub && this.form_unsub()
    this.unsub_std_form && this.unsub_std_form()
  }

  _createQuizzesList () {
    const { quizzes } = this.state
    if (quizzes == null) {
      return (
        <Col xs={24} md={12} lg={6}>
          <div
            style={{
              borderRadius: '5px',
              boxShadow: '0 5px 12px 4px rgba(0,0,0,.09)',
              cursor: 'pointer',
              background: 'white',
              width: '100%',
              height: 280
            }}>
            <div style={{ overflow: 'hidden', height: 200 }}>
              <Image width="100%" preview={false} src={require('../../assets/img/quiz placeholder.jpg').default} />
            </div>
            <Skeleton paragraph={false} active />
            <Skeleton paragraph={false} active />
          </div>
        </Col>
      )
    }
    return [
      <Col key="add-quiz-button" xs={24} md={12} lg={6}>
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
    </Col>,
      ...Object.keys(quizzes).map(qid => {
        return (
          <Col key={qid} xs={24} md={12} lg={6}>
            <Link to={'/quiz/' + qid}>
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
                  <Image width="100%" preview={false} src={require('../../assets/img/quiz placeholder.jpg').default} />
                </div>
                <div style={{ height: 80 }}>
                  <Title level={3}>{quizzes[qid].name}</Title>
                  <Paragraph ellipsis>{quizzes[qid].description || 'lorem ipsum'}</Paragraph>
                </div>
              </div>
          </Link>
          </Col>
        )
      })
    ]
  }

  render () {
    const { modalVisible, forms } = this.state
    return (
      <>
        <Row gutter={[16, 16]}>{this._createQuizzesList()}</Row>
        <QuizModal
          forms={forms}
          visible={modalVisible}
          toggleModal={this.toggleModal}
        />
      </>
    )
  }
}
